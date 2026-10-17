import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.gemini_service import get_gemini_model

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Voice Chat WebSocket"])

VOICE_MENTOR_SYSTEM_INSTRUCTION = """You are MirrorMind Voice Companion, an enthusiastic, friendly, and deeply knowledgeable voice AI mentor for the MirrorMind v2 engineering career platform.
You are having an instant, natural voice conversation with the user.

Key Spoken Conversation Style:
- Talk like a friendly senior software engineer or tech mentor having a natural, face-to-face conversation.
- Keep your answers concise, direct, and conversational (1 to 3 natural sentences per response) so they sound crisp and engaging when spoken aloud.
- Do NOT use markdown code blocks, asterisks, bullet points, or complex symbols unless the user explicitly requests raw code. Speak naturally in plain conversational English.

Your In-Depth Knowledge of MirrorMind v2:
- What the platform is: MirrorMind v2 is an AI-powered placement and career guidance platform for engineering students.
- All Features Built:
  1. Universal Authentication: Integrated Google 1-Click Sign-In and Email/Password with account linking and password reset capabilities, automatically synced with MongoDB Atlas.
  2. Resume-First Auto-Extraction: Students can drag-and-drop PDF/DOCX resumes. Cloudinary stores the file, PyPDF extracts text, and Gemini 3.8 Flash extracts candidate details, technical skills, CGPA, projects, and internships to pre-fill the form automatically.
  3. PyTorch Deep Neural Network Career Predictor: The student's skills, CGPA, projects, and internships are converted into a deterministic narrative string. It is embedded into a 384-dimensional dense vector using all-MiniLM-L6-v2, then passed through a 4-layer PyTorch neural network (CareerMLP: 384 -> 512 -> 256 -> 128 -> 10) to predict the Top 5 ranked career roles with percentage confidences.
  4. 5-Pillar Skill Radar: Evaluates Core Programming, Framework Mastery, System & Cloud, Data & Mathematics, and Engineering Practices with SVG radar charts.
  5. 6-Stage Interactive ML Visualizer: An educational dashboard showing the raw text serialization, 384-D vector heatmap, PyTorch forward pass with GELU and BatchNorm, Softmax distribution, radar chart, and Gemini mentor advice.
  6. Cloudinary CDN & MongoDB Atlas: Secure storage for avatars and resumes, and persistent student records.
  7. Cross-Platform Flutter Mobile App: A native Flutter mobile app with identical dark glassmorphism and ML visualizer capabilities.
  8. Real-Time WebSocket Voice Assistant: The current real-time voice chat feature powered by Gemini and FastAPI WebSockets.

Specific Guidelines:
- If the user says 'Hi' or 'Hello': Greet them warmly and naturally: 'Hi! Great to connect with you. How can I help you today?'
- If the user asks what features are added in the project: Give a concise, friendly overview highlighting the resume auto-fill, the PyTorch 384-D career prediction engine, the 5-pillar skill radar, the interactive ML visualizer, and the Flutter mobile app.
- Answer any technical, career, or architecture question naturally and accurately.
"""

@router.websocket("/ws/voice-chat")
async def voice_chat_websocket(websocket: WebSocket):
    """
    Real-Time WebSocket for Voice AI Chat:
    - Maintains bidirectional streaming conversation.
    - Contextualized with MirrorMind v2 architecture.
    - Low-latency token streaming for natural spoken dialogue.
    """
    await websocket.accept()
    logger.info("Voice chat WebSocket connection established.")

    try:
        # Initialize Gemini session for this connection
        model = get_gemini_model()
        chat = model.start_chat(history=[
            {
                "role": "user",
                "parts": [VOICE_MENTOR_SYSTEM_INSTRUCTION + "\n\nPlease confirm you understand your persona and instructions."]
            },
            {
                "role": "model",
                "parts": ["Understood! I am MirrorMind Voice Companion, ready for a natural, friendly spoken conversation."]
            }
        ])

        # Send ready packet
        await websocket.send_json({
            "type": "connected",
            "message": "Connected to MirrorMind Voice AI WebSocket",
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
                greeting = "Hi there! I am your MirrorMind voice mentor. How can I help you today?"
                await websocket.send_json({
                    "type": "stream_start"
                })
                await websocket.send_json({
                    "type": "stream_chunk",
                    "chunk": greeting,
                })
                await websocket.send_json({
                    "type": "stream_end",
                    "full_text": greeting,
                })
                continue

            user_text = data.get("text", "").strip()
            if not user_text:
                continue

            logger.info(f"Voice Chat User Input: '{user_text}'")

            # Notify client that AI response stream has started
            await websocket.send_json({"type": "stream_start"})

            full_chunks = []
            try:
                # Streaming response from Gemini
                response_stream = chat.send_message(user_text, stream=True)
                for chunk in response_stream:
                    if chunk.text:
                        full_chunks.append(chunk.text)
                        await websocket.send_json({
                            "type": "stream_chunk",
                            "chunk": chunk.text
                        })

                full_response = "".join(full_chunks).strip()
                await websocket.send_json({
                    "type": "stream_end",
                    "full_text": full_response
                })
                logger.info(f"Voice Chat Stream Complete ({len(full_response)} chars)")

            except Exception as stream_err:
                logger.error(f"Error during Gemini streaming: {stream_err}")
                await websocket.send_json({
                    "type": "error",
                    "message": f"AI generation error: {str(stream_err)}"
                })

    except WebSocketDisconnect:
        logger.info("Voice chat WebSocket disconnected.")
    except Exception as e:
        logger.error(f"WebSocket connection error: {e}")
