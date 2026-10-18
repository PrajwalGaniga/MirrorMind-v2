import asyncio
import json
import logging
import google.generativeai as genai
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.config import settings
from app.services.agent_tools import StudentAgentTools

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Voice Chat WebSocket"])

VOICE_MENTOR_SYSTEM_INSTRUCTION = """You are MirrorMind Voice Copilot, an expert, enthusiastic voice AI mentor dedicated strictly to engineering student career growth, technical skill mastery, and placement preparation.
You are having an instant, natural voice conversation with the student.

CRITICAL FOCUS & STRICT STUDENT GROWTH GUARDRAILS:
1. You MUST ONLY discuss the student's engineering growth, career status, technical skills, coursework, portfolio projects, certifications, internships, interview preparation, and the MirrorMind platform.
2. DO NOT answer any useless, off-topic, or non-career inquiries (such as casual chit-chat, entertainment, movies, video games, sports, politics, philosophy, or random trivia).
3. If the user asks ANY useless or off-topic question:
   Politely and immediately decline to answer and steer them back to their career development:
   "I am strictly focused on your engineering career growth, portfolio, and placement goals. Let's redirect our focus to your technical skills, projects, or career direction. How can I help boost your engineering profile today?"

SPOKEN CONVERSATION STYLE:
- Talk like an inspiring senior tech mentor having a real-time spoken conversation.
- Keep your answers concise, direct, and conversational (1 to 2 natural sentences per response) so they sound crisp and engaging when spoken aloud.
- NEVER use markdown asterisks (*, **), bullet points, or code blocks in your spoken responses. Speak in clean, plain conversational English.
- If the user says 'Hi' or 'Hello': Greet them warmly: "Hi! Great to connect with you. How can I help level up your engineering career today?"

LIVE DATABASE & PORTFOLIO TOOLS:
You are equipped with live tools directly connected to the student's profile and database:
1. `get_career_status(career_role)`: Call whenever the user asks for their status, probability, or score for any role (e.g. "What is my current status as a backend developer?"). It reads from instant cached ML predictions without running heavy calculations.
2. `add_project(title, description, tech_stack, github_url)`: Call when the student adds a project.
   - If the user says "I want to add a project" without details, converse naturally to ask for the project title, what it does, and what tech stack they used.
   - Once they provide the details, call `add_project`.
3. `add_skill(skill_name, proficiency)`: Call when the user says they learned or want to add a technical skill (e.g. "I learned a new skill: Kubernetes").
4. `add_internship(role, company, description, duration)`: Call when the user shares an internship or work experience.
5. `get_student_growth_summary()`: Call when the user wants an overview of their overall progress, skills count, or skill radar.

Always confirm database updates enthusiastically in 1-2 spoken sentences!
"""

@router.websocket("/ws/voice-chat")
async def voice_chat_websocket(websocket: WebSocket):
    """
    Real-Time WebSocket for Autonomous Agentic Voice Copilot:
    - Maintains bidirectional streaming conversation.
    - Connects live tools for MongoDB mutations and cached ML querying.
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

        # Configure Gemini model with session agent tools
        model = genai.GenerativeModel(
            settings.GEMINI_MODEL_NAME,
            tools=[
                tools_instance.get_career_status,
                tools_instance.add_project,
                tools_instance.add_skill,
                tools_instance.add_internship,
                tools_instance.get_student_growth_summary,
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

            if msg_type == "start_session":
                greeting = "Hi there! I am your MirrorMind voice copilot. How can I help level up your engineering career today?"
                await websocket.send_json({"type": "stream_start"})
                await websocket.send_json({"type": "stream_chunk", "chunk": greeting})
                await websocket.send_json({"type": "stream_end", "full_text": greeting})
                continue

            user_text = data.get("text", "").strip()
            user_id = data.get("user_id", "").strip()
            if user_id:
                current_user_id = user_id
                tools_instance.user_id = current_user_id

            if not user_text:
                continue

            logger.info(f"Voice Chat User Input: '{user_text}' (user: {current_user_id})")

            # Check for Grounded RAG document context
            rag_context = ""
            try:
                from app.services.rag_service import rag_service
                chunks = rag_service.search_vector_chunks(user_id=current_user_id, query_text=user_text, top_k=2)
                if chunks and chunks[0].get("score", 0) > 0.45:
                    rag_context = "\n[VERIFIED DOCUMENT EVIDENCE FOUND IN STUDENT'S VAULT:\n" + "\n".join(
                        [f"- From {c['filename']} (Page {c['page_start']}): {c['text'][:250]}..." for c in chunks]
                    ) + "\nCite this naturally if relevant to the question!]\n"
            except Exception as rag_err:
                logger.debug(f"Voice RAG retrieval note: {rag_err}")

            prompt_to_send = f"{rag_context}User says: {user_text}" if rag_context else user_text

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

