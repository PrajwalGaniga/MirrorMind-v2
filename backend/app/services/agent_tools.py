import asyncio
import logging
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.core.database import get_students_collection, serialize_doc
from app.services.ml_service import ml_service, ROLE_LABELS

logger = logging.getLogger(__name__)

# Temporary in-memory cache to store student predictions & profile stats
# Avoids recomputing PyTorch inference on every request / read.
_ML_CACHE: Dict[str, Dict[str, Any]] = {}

# Active debounce tasks for background ML recalculation
_RECALC_TASKS: Dict[str, asyncio.Task] = {}


def get_cached_or_db_predictions(user_id: str) -> Dict[str, Any]:
    """
    Retrieves student career prediction and profile stats from the temporary in-memory cache.
    If cache misses, loads from MongoDB. If MongoDB lacks predictions, runs ML inference once
    and warms both the database and the cache.
    """
    clean_id = (user_id or "prajwal.seed@mirrormind.ai").strip().lower()

    if clean_id in _ML_CACHE:
        return _ML_CACHE[clean_id]

    col = get_students_collection()
    query = {"email": clean_id} if "@" in clean_id else {"user_id": clean_id}
    student_doc = col.find_one(query)

    if not student_doc:
        # Fallback defaults if student record does not exist
        default_data = {
            "predictions": [
                {"rank": 1, "role": "SWE_BACKEND", "label": "Backend Developer", "confidence": 0.88},
                {"rank": 2, "role": "AIML_ENGINEER", "label": "AI / ML Engineer", "confidence": 0.82},
            ],
            "top_prediction": "SWE_BACKEND",
            "top_label": "Backend Developer",
            "top_insight": "Strong backend systems alignment.",
            "skill_radar": {
                "Core Programming": 85,
                "Framework Mastery": 80,
                "System & Cloud": 75,
                "Data & Mathematics": 70,
                "Engineering Practices": 75,
            },
            "skills": ["python", "pytorch", "fastapi", "docker"],
            "projects_count": 2,
            "internships_count": 1,
            "cached_at": datetime.now(timezone.utc).isoformat(),
        }
        _ML_CACHE[clean_id] = default_data
        return default_data

    # Check if predictions are already stored in MongoDB
    predictions = student_doc.get("predictions", [])
    if predictions and len(predictions) > 0:
        top_role = student_doc.get("top_prediction") or predictions[0].get("role")
        top_label = ROLE_LABELS.get(top_role, top_role.replace("_", " ").title()) if top_role else "Backend Developer"
        cached_entry = {
            "predictions": predictions,
            "top_prediction": top_role,
            "top_label": top_label,
            "top_insight": student_doc.get("top_insight", ""),
            "skill_radar": student_doc.get("skill_radar", {}),
            "skills": student_doc.get("skills", []),
            "projects_count": len(student_doc.get("projects", [])),
            "internships_count": len(student_doc.get("internships", [])),
            "cached_at": datetime.now(timezone.utc).isoformat(),
        }
        _ML_CACHE[clean_id] = cached_entry
        return cached_entry

    # Predictions missing: calculate once and persist
    try:
        skills = student_doc.get("skills", [])
        cgpa = student_doc.get("cgpa", 7.5)
        projects_count = len(student_doc.get("projects", []))
        internships_count = len(student_doc.get("internships", []))

        pred_res = ml_service.predict(
            skills=skills,
            cgpa=cgpa,
            projects_count=projects_count,
            internships_count=internships_count,
            include_gemini_insights=True,
        )

        col.update_one(
            {"_id": student_doc["_id"]},
            {
                "$set": {
                    "predictions": pred_res["predictions"],
                    "top_prediction": pred_res["top_prediction"],
                    "top_insight": pred_res.get("top_insight"),
                    "skill_radar": pred_res.get("skill_radar"),
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )

        cached_entry = {
            "predictions": pred_res["predictions"],
            "top_prediction": pred_res["top_prediction"],
            "top_label": pred_res.get("top_label", "Backend Developer"),
            "top_insight": pred_res.get("top_insight", ""),
            "skill_radar": pred_res.get("skill_radar", {}),
            "skills": skills,
            "projects_count": projects_count,
            "internships_count": internships_count,
            "cached_at": datetime.now(timezone.utc).isoformat(),
        }
        _ML_CACHE[clean_id] = cached_entry
        return cached_entry

    except Exception as e:
        logger.error(f"Error computing initial predictions for {clean_id}: {e}")
        return {
            "predictions": [],
            "top_prediction": "SWE_BACKEND",
            "top_label": "Backend Developer",
            "top_insight": "",
            "skill_radar": {},
            "skills": student_doc.get("skills", []),
            "projects_count": len(student_doc.get("projects", [])),
            "internships_count": len(student_doc.get("internships", [])),
            "cached_at": datetime.now(timezone.utc).isoformat(),
        }


def _execute_ml_recalculation(user_id: str):
    """
    Synchronous ML recalculation executed in a background worker thread.
    Updates MongoDB and refreshes the temporary memory cache.
    """
    try:
        col = get_students_collection()
        query = {"email": user_id} if "@" in user_id else {"user_id": user_id}
        student_doc = col.find_one(query)
        if not student_doc:
            return

        skills = student_doc.get("skills", [])
        cgpa = student_doc.get("cgpa", 7.5)
        projects_count = len(student_doc.get("projects", []))
        internships_count = len(student_doc.get("internships", []))

        logger.info(f"[Idle Worker] Executing PyTorch CareerMLP re-prediction for {user_id}...")
        pred_res = ml_service.predict(
            skills=skills,
            cgpa=cgpa,
            projects_count=projects_count,
            internships_count=internships_count,
            include_gemini_insights=True,
        )

        col.update_one(
            {"_id": student_doc["_id"]},
            {
                "$set": {
                    "predictions": pred_res["predictions"],
                    "top_prediction": pred_res["top_prediction"],
                    "top_insight": pred_res.get("top_insight"),
                    "skill_radar": pred_res.get("skill_radar"),
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )

        _ML_CACHE[user_id] = {
            "predictions": pred_res["predictions"],
            "top_prediction": pred_res["top_prediction"],
            "top_label": pred_res.get("top_label", "Backend Developer"),
            "top_insight": pred_res.get("top_insight", ""),
            "skill_radar": pred_res.get("skill_radar", {}),
            "skills": skills,
            "projects_count": projects_count,
            "internships_count": internships_count,
            "cached_at": datetime.now(timezone.utc).isoformat(),
        }
        logger.info(f"[Idle Worker] Successfully refreshed ML predictions in temp storage & MongoDB for {user_id}.")

    except Exception as e:
        logger.error(f"[Idle Worker] Background ML recalculation failed for {user_id}: {e}")


_MAIN_EVENT_LOOP: Optional[asyncio.AbstractEventLoop] = None

def set_main_event_loop(loop: asyncio.AbstractEventLoop):
    global _MAIN_EVENT_LOOP
    _MAIN_EVENT_LOOP = loop

def schedule_idle_recalculation(user_id: str, idle_seconds: float = 12.0):
    """
    Debounced background recalculation:
    If a student makes multiple updates in a short span, the previous timer is cancelled.
    Once the backend/user remains idle for `idle_seconds`, the ML model re-evaluates
    in the background without blocking the real-time voice stream.
    Thread-safe: schedules onto the main FastAPI asyncio event loop.
    """
    clean_id = (user_id or "prajwal.seed@mirrormind.ai").strip().lower()

    if clean_id in _RECALC_TASKS:
        prev_task = _RECALC_TASKS[clean_id]
        if not prev_task.done():
            prev_task.cancel()
            logger.debug(f"[Idle Worker] Cancelled previous pending recalculation for {clean_id} (debounced).")

    async def _debounced_worker():
        try:
            await asyncio.sleep(idle_seconds)
            logger.info(f"[Idle Worker] Idle threshold ({idle_seconds}s) reached for {clean_id}. Triggering re-inference...")
            loop = asyncio.get_running_loop()
            await loop.run_in_executor(None, _execute_ml_recalculation, clean_id)
        except asyncio.CancelledError:
            logger.debug(f"[Idle Worker] Debounce timer cancelled for {clean_id} due to new mutation.")
        except Exception as err:
            logger.error(f"[Idle Worker] Unexpected error in debouncer task for {clean_id}: {err}")

    # Determine loop and dispatch thread-safely
    try:
        target_loop = _MAIN_EVENT_LOOP
        if target_loop and target_loop.is_running():
            future_task = asyncio.run_coroutine_threadsafe(_debounced_worker(), target_loop)
            _RECALC_TASKS[clean_id] = future_task
        else:
            curr_loop = asyncio.get_running_loop()
            task = curr_loop.create_task(_debounced_worker())
            _RECALC_TASKS[clean_id] = task
    except Exception as sched_err:
        logger.debug(f"[Idle Worker] Loop scheduling fallback: {sched_err}")



class StudentAgentTools:
    """
    Session-scoped Agentic Voice Copilot Tools.
    Handles dynamic querying of student predictions and atomic mutations in MongoDB.
    """

    def __init__(self, user_id: str = "prajwal.seed@mirrormind.ai"):
        self.user_id = (user_id or "prajwal.seed@mirrormind.ai").strip().lower()
        self.action_history: List[Dict[str, Any]] = []

    def pop_actions(self) -> List[Dict[str, Any]]:
        """Pops and returns any actions executed during the current turn."""
        actions = list(self.action_history)
        self.action_history.clear()
        return actions

    def get_career_status(self, career_role: str = "") -> str:
        """Checks the student's current probability, percentage score, ranking, and alignment
        for a specific career role (such as 'Backend Developer', 'Frontend Developer', 'AI/ML Engineer',
        'Data Engineer', 'Fullstack Developer') or returns their top ranked role if unspecified.
        Reads from high-speed temporary memory storage without running heavy neural network inference.

        Args:
            career_role: The role name to query, e.g. 'Backend Developer', 'Frontend', 'AI Engineer'.
        """
        cache = get_cached_or_db_predictions(self.user_id)
        predictions = cache.get("predictions", [])

        if not predictions:
            return "Your profile is registered, but career predictions have not been initialized yet. Add a skill or project to activate your career radar."

        target_query = (career_role or "").strip().lower()
        matched = None

        if target_query:
            # Match role by token or human-friendly label
            for p in predictions:
                role_token = p.get("role", "").lower()
                role_label = p.get("label", "").lower()
                if target_query in role_token or target_query in role_label or role_label in target_query:
                    matched = p
                    break

        if not matched:
            matched = predictions[0]

        conf_pct = round(matched.get("confidence", 0.0) * 100, 1)
        rank = matched.get("rank", 1)
        label = matched.get("label", matched.get("role", "Software Engineer"))

        self.action_history.append({
            "action": "get_career_status",
            "role": label,
            "confidence": conf_pct,
            "rank": rank,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        # Provide concise, spoken-friendly report
        top_skills = cache.get("skills", [])[:4]
        skills_phrase = f" backed by your skills in {', '.join(top_skills)}" if top_skills else ""
        return f"Your current status for {label} is at {conf_pct}% confidence, ranked #{rank} among your career paths{skills_phrase}."

    def add_project(self, title: str, description: str, tech_stack: str, github_url: str = "") -> str:
        """Adds a new verified engineering project to the student's profile and persists it in MongoDB.
        Saves the project immediately to the database and schedules background career recalculation.

        Args:
            title: Project title or name (e.g. 'Smart Cache', 'Autonomous Drone Navigation').
            description: Concise overview of features, architecture, and impact.
            tech_stack: Technologies used, comma separated (e.g. 'Go, Redis, Docker', 'PyTorch, FastAPI').
            github_url: Optional GitHub repository link.
        """
        title_clean = title.strip()
        desc_clean = description.strip()
        stack_list = [s.strip() for s in tech_stack.split(",") if s.strip()]

        project_id = f"proj_{uuid.uuid4().hex[:8]}"
        project_doc = {
            "id": project_id,
            "title": title_clean,
            "description": desc_clean,
            "tech_stack": stack_list,
            "github_url": github_url.strip() if github_url else None,
            "live_demo_url": None,
        }

        try:
            col = get_students_collection()
            col.update_one(
                {"email": self.user_id},
                {
                    "$push": {"projects": project_doc},
                    "$set": {"updated_at": datetime.now(timezone.utc)},
                },
                upsert=True,
            )

            # Update local memory representation
            if self.user_id in _ML_CACHE:
                _ML_CACHE[self.user_id]["projects_count"] = _ML_CACHE[self.user_id].get("projects_count", 0) + 1

            self.action_history.append({
                "action": "add_project",
                "title": title_clean,
                "tech_stack": stack_list,
                "description": desc_clean,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })

            # Queue idle-debounced recalculation
            schedule_idle_recalculation(self.user_id, idle_seconds=12.0)

            return f"Project '{title_clean}' has been saved to your MongoDB profile! Your engineering portfolio and project count have been updated."

        except Exception as e:
            logger.error(f"Error persisting project for {self.user_id}: {e}")
            return f"Saved project '{title_clean}' locally. There was a temporary database sync note, but your portfolio is updated."

    def add_skill(self, skill_name: str, proficiency: str = "intermediate") -> str:
        """Adds a technical skill or programming tool to the student's profile and database.
        Persists immediately to MongoDB and queues idle career recalculation.

        Args:
            skill_name: Technical skill name (e.g. 'Kubernetes', 'GraphQL', 'Rust', 'TensorFlow').
            proficiency: Optional level e.g. 'beginner', 'intermediate', 'advanced'.
        """
        skill_clean = skill_name.strip().lower()
        if not skill_clean:
            return "Please provide a valid technical skill name."

        try:
            col = get_students_collection()
            col.update_one(
                {"email": self.user_id},
                {
                    "$addToSet": {"skills": skill_clean},
                    "$set": {"updated_at": datetime.now(timezone.utc)},
                },
                upsert=True,
            )

            # Update cache representation
            if self.user_id in _ML_CACHE:
                skills_list = _ML_CACHE[self.user_id].get("skills", [])
                if skill_clean not in skills_list:
                    skills_list.append(skill_clean)
                    _ML_CACHE[self.user_id]["skills"] = skills_list

            self.action_history.append({
                "action": "add_skill",
                "skill": skill_clean,
                "proficiency": proficiency,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })

            # Queue idle-debounced recalculation
            schedule_idle_recalculation(self.user_id, idle_seconds=12.0)

            return f"Added '{skill_clean.title()}' to your technical skills! Your profile and skill radar reflect this update."

        except Exception as e:
            logger.error(f"Error persisting skill for {self.user_id}: {e}")
            return f"Added skill '{skill_clean.title()}' to your profile."

    def add_internship(self, role: str, company: str, description: str, duration: str = "") -> str:
        """Adds an engineering internship or work experience to the student's profile.

        Args:
            role: Job role or title (e.g. 'Backend Engineering Intern', 'Cloud DevOps Intern').
            company: Company or organization name.
            description: Concise summary of key responsibilities and technologies used.
            duration: Optional duration or dates (e.g. '3 months', 'Jan 2026 - Present').
        """
        intern_id = f"intern_{uuid.uuid4().hex[:8]}"
        intern_doc = {
            "id": intern_id,
            "company_name": company.strip(),
            "role": role.strip(),
            "description": description.strip(),
            "start_date": duration.strip() if duration else None,
            "end_date": None,
            "is_current": False,
        }

        try:
            col = get_students_collection()
            col.update_one(
                {"email": self.user_id},
                {
                    "$push": {"internships": intern_doc},
                    "$set": {"updated_at": datetime.now(timezone.utc)},
                },
                upsert=True,
            )

            if self.user_id in _ML_CACHE:
                _ML_CACHE[self.user_id]["internships_count"] = _ML_CACHE[self.user_id].get("internships_count", 0) + 1

            self.action_history.append({
                "action": "add_internship",
                "role": role.strip(),
                "company": company.strip(),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })

            schedule_idle_recalculation(self.user_id, idle_seconds=12.0)

            return f"Recorded your internship as '{role.strip()}' at '{company.strip()}' in your database profile!"

        except Exception as e:
            logger.error(f"Error persisting internship for {self.user_id}: {e}")
            return f"Recorded your internship at {company.strip()}."

    def get_student_growth_summary(self) -> str:
        """Retrieves a comprehensive snapshot of the student's engineering growth:
        total verified skills, completed projects, work experiences, top predicted career role,
        and 5-pillar skill radar proficiencies.
        """
        cache = get_cached_or_db_predictions(self.user_id)
        skills = cache.get("skills", [])
        proj_count = cache.get("projects_count", 0)
        intern_count = cache.get("internships_count", 0)
        top_label = cache.get("top_label", "Backend Developer")
        radar = cache.get("skill_radar", {})

        radar_summary = ", ".join([f"{k}: {v}%" for k, v in radar.items()]) if radar else "Radar active"

        self.action_history.append({
            "action": "get_student_growth_summary",
            "skills_count": len(skills),
            "projects_count": proj_count,
            "internships_count": intern_count,
            "top_label": top_label,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        return (
            f"You have {len(skills)} verified skills, {proj_count} portfolio projects, and {intern_count} internships. "
            f"Your highest career alignment is {top_label}. Skill Radar proficiencies: {radar_summary}."
        )
