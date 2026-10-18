import json
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_websocket_voice_chat():
    """
    Test real-time WebSocket connection to /api/ws/voice-chat:
    1. Connect and receive connection confirmation.
    2. Start session and receive initial friendly greeting.
    3. Send 'Hi' user message and receive streamed response.
    4. Send 'I wanted to know whatever the features we have added in the project' query and receive feature summary.
    """
    with client.websocket_connect("/api/ws/voice-chat") as websocket:
        # 1. Connected packet
        data = websocket.receive_json()
        assert data.get("type") == "connected"
        assert data.get("ready") is True
        print("\n[WS Test] Step 1 passed: Connection established.")

        # 2. Session start
        websocket.send_json({"type": "start_session"})
        msg_start = websocket.receive_json()
        assert msg_start.get("type") == "stream_start"

        chunk = websocket.receive_json()
        assert chunk.get("type") == "stream_chunk"
        assert "MirrorMind" in chunk.get("chunk", "") or "mentor" in chunk.get("chunk", "")

        end = websocket.receive_json()
        assert end.get("type") == "stream_end"
        print(f"[WS Test] Step 2 passed: Received session greeting -> '{end.get('full_text')}'")

        # 3. Test user prompt: 'Hi'
        websocket.send_json({"type": "user_message", "text": "Hi"})
        resp_start = websocket.receive_json()
        assert resp_start.get("type") == "stream_start"

        hi_chunks = []
        while True:
            msg = websocket.receive_json()
            if msg.get("type") == "stream_chunk":
                hi_chunks.append(msg.get("chunk", ""))
            elif msg.get("type") == "stream_end":
                full_hi = msg.get("full_text", "")
                break

        full_hi_text = "".join(hi_chunks)
        print(f"[WS Test] Step 3 passed: User 'Hi' -> Response: '{full_hi_text}'")
        assert len(full_hi_text) > 0

        # 4. Test user prompt: features inquiry
        features_query = "I wanted to know whatever the features we have added in the project"
        websocket.send_json({"type": "user_message", "text": features_query})

        feature_chunks = []
        action_found = None
        while True:
            msg = websocket.receive_json()
            mtype = msg.get("type")
            if mtype == "action_executed":
                action_found = msg
            elif mtype == "stream_chunk":
                feature_chunks.append(msg.get("chunk", ""))
            elif mtype == "stream_end":
                break

        full_features_text = "".join(feature_chunks)
        print(f"[WS Test] Step 4 passed: Project Features inquiry response length = {len(full_features_text)} chars")
        print(f"[WS Test] Snippet: {full_features_text[:200]}...")
        assert len(full_features_text) > 20

if __name__ == "__main__":
    test_websocket_voice_chat()
