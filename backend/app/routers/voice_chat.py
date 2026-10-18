import asyncio
import json
import logging
import google.generativeai as genai
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.config import settings
from app.services.agent_tools import StudentAgentTools

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Voice Chat WebSocket"])

VOICE_MENTOR_SYSTEM_INSTRUCTION = """You are MirrorMind Voice Copilot, an expert, inspiring, and authentic voice AI mentor dedicated strictly to engineering student career growth, technical skill mastery, and placement preparation.
You are having an instant, natural voice conversation with the student.

CRITICAL FOCUS & STRICT STUDENT GROWTH GUARDRAILS:
1. You MUST discuss the student's engineering growth, academic credentials (CGPA, college/university, branch, semester), technical skills, coursework, portfolio projects, certifications, internships, uploaded resumes, research papers, and placement preparation.
2. DO NOT answer any useless, off-topic, or non-career inquiries (such as casual chit-chat, entertainment, movies, video games, sports, politics, philosophy, or random trivia).
3. If the user asks ANY off-topic question:
   Politely and immediately decline to answer and steer them back to their career development:
   "I am strictly focused on your engineering career growth, portfolio, and placement goals. Let's redirect our focus to your technical skills, projects, or career direction. How can I help boost your engineering profile today?"

ACADEMIC & DATABASE CREDENTIALS:
- You have verified real-time access to the student's database profile and Knowledge Vault.
- When the student asks about their CGPA, marks, university, college, or current semester: Answer directly using their verified profile data or call `get_academic_info()`.
- When the student tells you to update their CGPA, college/university name, or semester: Call `update_academics(cgpa=..., college_name=..., ...)` to update the database.
- When the student asks if they have uploaded their resume or what documents are on file: Call `check_uploaded_documents()`.
- When the student asks about published papers, research, or specific document content: Call `query_knowledge_vault(query=...)` to retrieve the exact verified text excerpts.

SPOKEN CONVERSATION STYLE:
- Talk like an inspiring senior tech mentor having a real-time spoken conversation.
- Keep your answers concise, direct, and conversational (1 to 2 natural sentences per response) so they sound crisp and engaging when spoken aloud.
- NEVER use markdown asterisks (*, **), bullet points, or code blocks in your spoken responses. Speak in clean, plain conversational English.
- If the user says 'Hi' or 'Hello': Greet them warmly: "Hi! Great to connect with you. How can I help level up your engineering career today?"

LIVE DATABASE & PORTFOLIO TOOLS:
1. `get_academic_info()`: Call to read CGPA, university, branch, semester.
2. `update_academics(cgpa, college_name, branch, semester)`: Call to update CGPA or college/university.
3. `get_career_status(career_role)`: Call to check predicted probability or rank for a career track.
4. `add_project(title, description, tech_stack, github_url)`: Call to save a project to their portfolio.
5. `add_skill(skill_name, proficiency)`: Call to save a technical skill.
6. `add_internship(role, company, description, duration)`: Call to save work experience.
7. `get_student_growth_summary()`: Call to get overall stats.
8. `check_uploaded_documents()`: Call to check resume or documents in the Knowledge Vault.
9. `query_knowledge_vault(query)`: Call to search text inside their uploaded documents or papers.
"""

@router.websocket("/ws/voice-chat")
async def voice_chat_websocket(websocket: WebSocket):
    """
    Real-Time WebSocket for Autonomous Agentic Voice Copilot:
    - Maintains bidirectional streaming conversation.
    - Connects live tools for MongoDB mutations, academic updates, and cached ML querying.
    - Enforces strict student growth guardrails.
    - Emits action_executed events when database mutations occur.
    """
    await websocket.accept()
    logger.info("Voice chat WebSocket connection established.")

    try:
        from app.services.agent_tools import set_main_event_loop
        set_main_event_loop(asyncio.get_running_loop())

        # Default user identity for this connection
        current_user_id = "prajwal.seed@mirrormind.ai"
        tools_instance = StudentAgentTools(user_id=current_user_id)

        # Configure Gemini model with complete agent tools
        model = genai.GenerativeModel(
            settings.GEMINI_MODEL_NAME,
            tools=[
                tools_instance.get_career_status,
                tools_instance.get_academic_info,
                tools_instance.update_academics,
                tools_instance.add_project,
                tools_instance.add_skill,
                tools_instance.add_internship,
                tools_instance.get_student_growth_summary,
                tools_instance.check_uploaded_documents,
                tools_instance.query_knowledge_vault,
            ],
            system_instruction=VOICE_MENTOR_SYSTEM_INSTRUCTION
        )
        chat = model.start_chat(enable_automatic_function_calling=True)

        # Send ready packet
        await websocket.send_json({
            "type": "connected",
            "message": "Connected to MirrorMind Autonomous Voice AI WebSocket",
            "ready": True
        })

        while True:
            data_text = await websocket.receive_text()
            data = json.loads(data_text)
            msg_type = data.get("type", "user_message")

            if msg_type == "ping":
                await websocket.send_json({"type": "pong"})
                continue

            user_id = data.get("user_id", "").strip()
            if user_id:
                current_user_id = user_id
                tools_instance.user_id = current_user_id

            if msg_type == "start_session":
                greeting = "Hi there! I am your MirrorMind voice copilot. How can I help level up your engineering career today?"
                await websocket.send_json({"type": "stream_start"})
                await websocket.send_json({"type": "stream_chunk", "chunk": greeting})
                await websocket.send_json({"type": "stream_end", "full_text": greeting})
                continue

            user_text = data.get("text", "").strip()
            if not user_text:
                continue

            logger.info(f"Voice Chat User Input: '{user_text}' (user: {current_user_id})")

            # Load active student profile context from MongoDB
            profile_context = ""
            try:
                from app.core.database import get_students_collection
                col = get_students_collection()
                s_doc = col.find_one({"email": current_user_id}) or col.find_one({"user_id": current_user_id})
                if s_doc:
                    s_name = s_doc.get("name", "Student")
                    s_cgpa = s_doc.get("cgpa", 0.0)
                    s_college = s_doc.get("college_name") or "Visvesvaraya Technological University"
                    s_branch = s_doc.get("branch") or "Bachelor of Computer Science and Design Engineering"
                    s_sem = s_doc.get("semester", 7)
                    s_skills = ", ".join(s_doc.get("skills", [])[:8])
                    profile_context = (
                        f"[VERIFIED DATABASE PROFILE: Student: {s_name}, Current CGPA: {s_cgpa:.2f}, "
                        f"University: {s_college}, Branch: {s_branch}, Semester: {s_sem}, "
                        f"Skills: {s_skills}]\n"
                    )
            except Exception as prof_err:
                logger.debug(f"Profile fetch note: {prof_err}")

            # Check for Grounded RAG document context in Knowledge Vault
            rag_context = ""
            try:
                from app.services.rag_service import rag_service
                chunks = rag_service.search_vector_chunks(user_id=current_user_id, query_text=user_text, top_k=3)
                if chunks and chunks[0].get("score", 0) > 0.32:
                    rag_context = "[VERIFIED DOCUMENT EVIDENCE IN KNOWLEDGE VAULT:\n" + "\n".join(
                        [f"- From {c.get('filename') or 'Uploaded Document'} (Page {c.get('page_start', 1)}): {c['text'][:350]}..." for c in chunks]
                    ) + "]\n"
            except Exception as rag_err:
                logger.debug(f"Voice RAG retrieval note: {rag_err}")

            prompt_to_send = f"{profile_context}{rag_context}User says: {user_text}"

            try:
                # Execute agentic turn with Gemini tool calling enabled
                loop = asyncio.get_running_loop()
                response = await loop.run_in_executor(None, chat.send_message, prompt_to_send)
                full_response = response.text.strip() if hasattr(response, "text") and response.text else "I have updated your profile."

                # Check if any tools were executed during this turn
                actions = tools_instance.pop_actions()
                for action in actions:
                    logger.info(f"Emitting action_executed: {action.get('action')}")
                    await websocket.send_json({
                        "type": "action_executed",
                        "action": action.get("action"),
                        "data": action
                    })

                # Stream response tokens to the client for natural speech cadence
                await websocket.send_json({"type": "stream_start"})

                # Split full_response into conversational word chunks with micro-delays
                words = full_response.split(" ")
                chunk_size = 3
                for i in range(0, len(words), chunk_size):
                    chunk_text = " ".join(words[i:i + chunk_size]) + " "
                    await websocket.send_json({
                        "type": "stream_chunk",
                        "chunk": chunk_text
                    })
                    await asyncio.sleep(0.035)

                await websocket.send_json({
                    "type": "stream_end",
                    "full_text": full_response
                })
                logger.info(f"Voice Chat Stream Complete ({len(full_response)} chars, {len(actions)} actions executed)")

            except Exception as stream_err:
                logger.error(f"Error during Gemini agentic turn: {stream_err}")
                await websocket.send_json({
                    "type": "error",
                    "message": f"AI generation error: {str(stream_err)}"
                })

    except WebSocketDisconnect:
        logger.info("Voice chat WebSocket disconnected.")
    except Exception as e:
        logger.error(f"WebSocket connection error: {e}")

