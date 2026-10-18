import json
import pytest
from fastapi.testclient import TestClient
from main import app
from app.core.database import get_students_collection

client = TestClient(app)

def test_agent_voice_copilot_actions_and_guardrails():
    """
    End-to-End Test Suite for Autonomous Agentic Voice Copilot:
    1. Connects to /api/ws/voice-chat.
    2. Queries career status for 'backend developer' -> Receives cached status action.
    3. Adds a new technical skill 'kubernetes' -> Verifies MongoDB persistence.
    4. Adds a project 'Distributed Cache' -> Verifies MongoDB persistence.
    5. Tests student growth guardrail with off-topic question -> Verifies polite rejection & redirection.
    """
    col = get_students_collection()
    test_email = "prajwal.seed@mirrormind.ai"

    with client.websocket_connect("/api/ws/voice-chat") as ws:
        # Step 1: Connect Handshake
        data = ws.receive_json()
        assert data.get("type") == "connected"
        assert data.get("ready") is True
        print("\n[PASS] Step 1: Voice WebSocket connected successfully.")

        # Step 2: Query career status as a backend developer
        print("\n[TEST] Step 2: Querying 'What is my current status as a backend developer?'...")
        ws.send_json({
            "type": "user_message",
            "text": "What is my current status as a backend developer?",
            "user_id": test_email
        })

        action_received = None
        streamed_chunks = []
        full_text = ""

        while True:
            msg = ws.receive_json()
            mtype = msg.get("type")
            if mtype == "action_executed":
                action_received = msg
                print(f"       -> Action Executed Event: {msg.get('action')} | Details: {msg.get('data')}")
            elif mtype == "stream_chunk":
                streamed_chunks.append(msg.get("chunk", ""))
            elif mtype == "stream_end":
                full_text = msg.get("full_text", "")
                break

        assert action_received is not None, "Expected action_executed event for get_career_status"
        assert action_received.get("action") == "get_career_status"
        assert "Backend" in action_received.get("data", {}).get("role", "")
        print(f"[PASS] Step 2: Received status ({action_received['data']['confidence']}%)! Spoken: '{full_text}'")

        # Step 3: Add new technical skill 'kubernetes'
        print("\n[TEST] Step 3: Adding skill 'I learned a new skill: Kubernetes'...")
        ws.send_json({
            "type": "user_message",
            "text": "I learned a new skill: Kubernetes",
            "user_id": test_email
        })

        skill_action = None
        while True:
            msg = ws.receive_json()
            mtype = msg.get("type")
            if mtype == "action_executed":
                skill_action = msg
                print(f"       -> Action Executed Event: {msg.get('action')} | Details: {msg.get('data')}")
            elif mtype == "stream_end":
                break

        assert skill_action is not None, "Expected action_executed event for add_skill"
        assert skill_action.get("action") == "add_skill"
        assert skill_action.get("data", {}).get("skill") == "kubernetes"

        # Verify MongoDB has 'kubernetes' in student's skills
        student_doc = col.find_one({"email": test_email})
        assert student_doc is not None
        assert "kubernetes" in [s.lower() for s in student_doc.get("skills", [])]
        print(f"[PASS] Step 3: Verified 'kubernetes' persisted to MongoDB Atlas skills collection!")

        # Step 4: Add project
        print("\n[TEST] Step 4: Adding project 'I want to add a project called Distributed Cache built with Go and Redis'...")
        ws.send_json({
            "type": "user_message",
            "text": "I want to add a project called Distributed Cache built with Go and Redis, a high throughput cache layer.",
            "user_id": test_email
        })

        project_action = None
        while True:
            msg = ws.receive_json()
            mtype = msg.get("type")
            if mtype == "action_executed":
                project_action = msg
                print(f"       -> Action Executed Event: {msg.get('action')} | Details: {msg.get('data')}")
            elif mtype == "stream_end":
                break

        assert project_action is not None, "Expected action_executed event for add_project"
        assert project_action.get("action") == "add_project"
        assert "Distributed Cache" in project_action.get("data", {}).get("title", "")

        # Verify MongoDB has the new project
        student_doc_updated = col.find_one({"email": test_email})
        titles = [p.get("title") for p in student_doc_updated.get("projects", [])]
        assert any("Distributed Cache" in t for t in titles)
        print(f"[PASS] Step 4: Verified 'Distributed Cache' persisted to MongoDB Atlas projects!")

        # Step 5: Test Student Growth Guardrail against off-topic / useless questions
        print("\n[TEST] Step 5: Testing off-topic query 'Who won the soccer world cup in 2022?'...")
        ws.send_json({
            "type": "user_message",
            "text": "Who won the soccer world cup in 2022?",
            "user_id": test_email
        })

        guardrail_text = ""
        while True:
            msg = ws.receive_json()
            if msg.get("type") == "stream_end":
                guardrail_text = msg.get("full_text", "")
                break

        print(f"       -> Spoken Response: '{guardrail_text}'")
        # Check that it redirected back to career/growth/engineering
        lower_resp = guardrail_text.lower()
        assert any(term in lower_resp for term in ["career", "engineering", "growth", "portfolio", "skills", "placement", "mirrormind", "focus"])
        print("[PASS] Step 5: Off-topic inquiry successfully deflected to student career growth!")

if __name__ == "__main__":
    test_agent_voice_copilot_actions_and_guardrails()
