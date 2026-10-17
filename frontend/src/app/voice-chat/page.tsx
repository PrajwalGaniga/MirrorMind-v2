"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

// Interface for Transcript Messages
interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

type OrbState = "idle" | "listening" | "thinking" | "speaking";

// Extended window interface for Web Speech API
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export default function VoiceChatPage() {
  const { user } = useAuth();

  // Connection & Session State
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [wsStatus, setWsStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [voiceMuted, setVoiceMuted] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("Ready to communicate. Click 'Start Communication' below.");

  // Transcript & Input State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Hi there! I am your MirrorMind Voice Companion. Click 'Start Communication' to start our real-time voice chat!",
      timestamp: "Ready",
    },
  ]);

  const [currentSpeechText, setCurrentSpeechText] = useState<string>("");
  const [textInput, setTextInput] = useState<string>("");
  const [streamingAiText, setStreamingAiText] = useState<string>("");

  // Refs for WebSocket, Speech Recognition, and Speech Synthesis
  const wsRef = useRef<WebSocket | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const isSpeakingRef = useRef<boolean>(false);
  const sessionActiveRef = useRef<boolean>(false);
  const speechMutedRef = useRef<boolean>(false);

  // Keep refs in sync
  useEffect(() => {
    sessionActiveRef.current = isSessionActive;
  }, [isSessionActive]);

  useEffect(() => {
    speechMutedRef.current = voiceMuted;
  }, [voiceMuted]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingAiText]);

  // Speech Synthesis: Speak text out loud
  const speakText = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speechMutedRef.current) return;

    window.speechSynthesis.cancel(); // Stop any pending speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05; // Slightly faster for natural, brisk cadence
    utterance.pitch = 1.0;

    // Pick best available English voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        v.lang.startsWith("en") &&
        (v.name.includes("Natural") ||
          v.name.includes("Google") ||
          v.name.includes("Samantha") ||
          v.name.includes("Daniel"))
    ) || voices.find((v) => v.lang.startsWith("en"));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      isSpeakingRef.current = true;
      setOrbState("speaking");
      setStatusMessage("MirrorMind Voice Companion is speaking...");

      // Temporarily pause recognition to avoid picking up the speaker output
      try {
        if (recognitionRef.current) {
          recognitionRef.current.abort();
        }
      } catch (e) {
        // Ignore abort errors
      }
    };

    utterance.onend = () => {
      isSpeakingRef.current = false;
      if (sessionActiveRef.current) {
        setOrbState("listening");
        setStatusMessage("Listening to you... Speak now!");
        // Resume speech recognition
        restartRecognition();
      } else {
        setOrbState("idle");
        setStatusMessage("Communication paused.");
      }
    };

    utterance.onerror = (e) => {
      console.warn("Speech synthesis error:", e);
      isSpeakingRef.current = false;
      if (sessionActiveRef.current) {
        setOrbState("listening");
        restartRecognition();
      }
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  // Restart speech recognition safely
  const restartRecognition = () => {
    if (!sessionActiveRef.current || isSpeakingRef.current) return;
    try {
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
    } catch {
      // Recognition may already be running, safe to ignore
    }
  };

  // Initialize Web Speech Recognition
  const initSpeechRecognition = useCallback(() => {
    if (typeof window === "undefined") return null;

    const win = window as IWindow;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Web Speech API is not supported in this browser.");
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      if (!isSpeakingRef.current) {
        setOrbState("listening");
        setStatusMessage("Listening to you... Speak naturally!");
      }
    };

    recognition.onresult = (event: any) => {
      if (isSpeakingRef.current) return; // Ignore audio loopback

      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (interim) {
        setCurrentSpeechText(interim);
      }

      if (final.trim()) {
        const spoken = final.trim();
        setCurrentSpeechText("");
        sendUserMessage(spoken);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        setStatusMessage("Microphone access denied. Please allow microphone permissions.");
        setIsSessionActive(false);
      }
    };

    recognition.onend = () => {
      // Auto-restart if communication session is still active and AI isn't speaking
      if (sessionActiveRef.current && !isSpeakingRef.current) {
        try {
          recognition.start();
        } catch {
          // Ignore restart error
        }
      }
    };

    return recognition;
  }, []);

  // Send message over WebSocket
  const sendUserMessage = (text: string) => {
    if (!text.trim()) return;

    // Add user message to UI immediately
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setOrbState("thinking");
    setStatusMessage("MirrorMind is thinking...");

    // Send to WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "user_message",
          text: text.trim(),
        })
      );
    } else {
      console.warn("WebSocket not open. Reconnecting...");
      connectWebSocket(() => {
        wsRef.current?.send(
          JSON.stringify({
            type: "user_message",
            text: text.trim(),
          })
        );
      });
    }
  };

  // Connect to FastAPI WebSocket
  const connectWebSocket = useCallback((onOpenCallback?: () => void) => {
    setWsStatus("connecting");

    const host = window.location.hostname || "localhost";
    const port = "8000";
    const wsUrl = `ws://${host}:${port}/api/ws/voice-chat`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setWsStatus("connected");
        wsRef.current = ws;
        if (onOpenCallback) onOpenCallback();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "stream_start") {
            setOrbState("thinking");
            setStreamingAiText("");
          } else if (data.type === "stream_chunk") {
            setStreamingAiText((prev) => prev + data.chunk);
          } else if (data.type === "stream_end") {
            const reply = data.full_text || "";
            setStreamingAiText("");

            // Add final AI message to transcript
            if (reply.trim()) {
              setMessages((prev) => [
                ...prev,
                {
                  id: Date.now().toString(),
                  sender: "ai",
                  text: reply.trim(),
                  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                },
              ]);

              // Speak response using voice synthesis!
              speakText(reply.trim());
            }
          } else if (data.type === "error") {
            setStatusMessage(`Error: ${data.message}`);
            setOrbState("idle");
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket connection error:", err);
        setWsStatus("disconnected");
        setStatusMessage("Connection error with voice server.");
      };

      ws.onclose = () => {
        setWsStatus("disconnected");
        if (sessionActiveRef.current) {
          setStatusMessage("Voice connection disconnected. Reconnecting...");
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error("Failed to establish WebSocket:", err);
      setWsStatus("disconnected");
    }
  }, [speakText]);

  // Start Communication Session
  const startCommunication = () => {
    setIsSessionActive(true);
    sessionActiveRef.current = true;

    // Connect WebSocket if not connected
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      connectWebSocket(() => {
        // Send session start packet to prompt instant initial greeting
        wsRef.current?.send(JSON.stringify({ type: "start_session" }));
      });
    } else {
      wsRef.current.send(JSON.stringify({ type: "start_session" }));
    }

    // Initialize & start speech recognition
    if (!recognitionRef.current) {
      recognitionRef.current = initSpeechRecognition();
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
    } catch {
      // Ignore start error if already running
    }

    setOrbState("listening");
    setStatusMessage("Listening to you... Speak now!");
  };

  // Stop Communication Session
  const stopCommunication = () => {
    setIsSessionActive(false);
    sessionActiveRef.current = false;
    isSpeakingRef.current = false;

    // Stop recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
    }

    // Stop voice synthesis
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setOrbState("idle");
    setCurrentSpeechText("");
    setStatusMessage("Voice communication paused. Click 'Start Communication' to resume.");
  };

  // Handle Text Submission
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    const txt = textInput.trim();
    setTextInput("");
    sendUserMessage(txt);
  };

  // Handle Quick Chip Click
  const handleQuickChip = (promptText: string) => {
    sendUserMessage(promptText);
  };

  // Cleanup on unmount
  useEffect(() => {
    // Load speech synthesis voices eagerly
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
    }

    // Connect WebSocket on page load
    connectWebSocket();

    return () => {
      sessionActiveRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  return (
    <div className="voice-page-wrapper">
      <div className="voice-chat-container">
        {/* Navigation & Header */}
        <header className="voice-header">
          <div className="brand">
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
              <div className="brand-icon">M</div>
              <div className="brand-text">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h1 style={{ fontSize: "1.25rem", margin: 0, color: "var(--text-main)" }}>MirrorMind Voice AI</h1>
                  <span className="version-pill" style={{ background: "rgba(6, 182, 212, 0.2)", color: "#06b6d4" }}>
                    Gemini Live WS
                  </span>
                </div>
                <p style={{ fontSize: "0.78rem", margin: 0, color: "var(--text-muted)" }}>
                  Zero-Latency Natural Voice Dialogue &amp; Career Mentorship
                </p>
              </div>
            </Link>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* WebSocket Status Indicator */}
            <div
              className={`status-badge ${wsStatus === "connected" ? "connected" : wsStatus === "connecting" ? "connecting" : "error"}`}
            >
              <span className="pulse-dot"></span>
              <span>{wsStatus === "connected" ? "WebSocket: Live" : wsStatus === "connecting" ? "Connecting WS..." : "WS: Offline"}</span>
            </div>

            {/* Back to Dashboard Link */}
            <Link
              href="/"
              className="secondary-button"
              style={{
                textDecoration: "none",
                padding: "8px 16px",
                fontSize: "0.82rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              📊 Back to Dashboard
            </Link>
          </div>
        </header>

        {/* Main Voice Interactive Stage */}
        <div className="voice-stage-grid">
          {/* Left Column: Animated Voice Orb & Controls */}
          <div className="voice-orb-card">
            {/* Active Status Header */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 16px",
                borderRadius: "30px",
                background:
                  orbState === "listening"
                    ? "rgba(6, 182, 212, 0.15)"
                    : orbState === "speaking"
                    ? "rgba(168, 85, 247, 0.2)"
                    : orbState === "thinking"
                    ? "rgba(245, 158, 11, 0.15)"
                    : "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                fontSize: "0.85rem",
                fontWeight: 500,
                color:
                  orbState === "listening"
                    ? "#38bdf8"
                    : orbState === "speaking"
                    ? "#c084fc"
                    : orbState === "thinking"
                    ? "#fbbf24"
                    : "var(--text-muted)",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background:
                    orbState === "listening"
                      ? "#38bdf8"
                      : orbState === "speaking"
                      ? "#c084fc"
                      : orbState === "thinking"
                      ? "#fbbf24"
                      : "var(--text-subtle)",
                }}
              ></span>
              {orbState === "listening" && "🎙️ Listening to you..."}
              {orbState === "thinking" && "⚡ MirrorMind Thinking..."}
              {orbState === "speaking" && "🔊 Speaking aloud..."}
              {orbState === "idle" && (isSessionActive ? "🟢 Session Active" : "⏸️ Session Paused")}
            </div>

            {/* Glowing Voice Orb */}
            <div className={`orb-stage ${orbState === "listening" ? "orb-listening" : ""}`}>
              <div className="orb-ring ring-1"></div>
              <div className="orb-ring ring-2"></div>
              <div className="orb-ring ring-3"></div>

              <div
                className={`voice-orb ${
                  orbState === "listening"
                    ? "orb-listening"
                    : orbState === "speaking"
                    ? "orb-speaking"
                    : orbState === "thinking"
                    ? "orb-thinking"
                    : "orb-idle"
                }`}
                onClick={isSessionActive ? stopCommunication : startCommunication}
                title={isSessionActive ? "Click to Pause" : "Click to Start"}
              >
                <div className="orb-core">
                  {orbState === "speaking" ? (
                    <div className="soundwave-bars">
                      <div className="soundwave-bar"></div>
                      <div className="soundwave-bar"></div>
                      <div className="soundwave-bar"></div>
                      <div className="soundwave-bar"></div>
                      <div className="soundwave-bar"></div>
                    </div>
                  ) : orbState === "listening" ? (
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                      <line x1="12" y1="19" x2="12" y2="23"></line>
                      <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                  ) : orbState === "thinking" ? (
                    <span style={{ fontSize: "1.8rem" }}>⚡</span>
                  ) : (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                  )}
                </div>
              </div>
            </div>

            {/* Dynamic Status Text */}
            <p
              style={{
                fontSize: "0.92rem",
                color: "var(--text-main)",
                maxWidth: "340px",
                margin: "0 auto 20px",
                minHeight: "44px",
                lineHeight: "1.5",
              }}
            >
              {currentSpeechText ? `"${currentSpeechText}..."` : statusMessage}
            </p>

            {/* Main Action Buttons */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center", width: "100%" }}>
              {!isSessionActive ? (
                <button
                  onClick={startCommunication}
                  className="primary-button"
                  style={{
                    padding: "12px 28px",
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    borderRadius: "14px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "10px",
                    boxShadow: "0 8px 24px rgba(99, 102, 241, 0.4)",
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                  Start Communication
                </button>
              ) : (
                <button
                  onClick={stopCommunication}
                  className="secondary-button"
                  style={{
                    padding: "12px 26px",
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    borderRadius: "14px",
                    background: "rgba(239, 68, 68, 0.15)",
                    borderColor: "rgba(239, 68, 68, 0.4)",
                    color: "#f87171",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                  </svg>
                  End Communication
                </button>
              )}

              {/* Mute / Unmute Voice Audio Toggle */}
              <button
                onClick={() => setVoiceMuted(!voiceMuted)}
                className="secondary-button"
                style={{
                  padding: "12px 18px",
                  borderRadius: "14px",
                  fontSize: "0.9rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
                title={voiceMuted ? "Unmute AI Voice" : "Mute AI Voice"}
              >
                {voiceMuted ? "🔇 Unmute Voice" : "🔊 Audio On"}
              </button>
            </div>

            {/* Quick Testing Scenario Chips */}
            <div style={{ marginTop: "24px", width: "100%", textAlign: "left" }}>
              <div style={{ fontSize: "0.78rem", color: "var(--text-subtle)", marginBottom: "8px", fontWeight: 600, textTransform: "uppercase" }}>
                Suggested Voice Prompts
              </div>
              <div className="prompt-chips-container">
                <button
                  onClick={() => handleQuickChip("Hi")}
                  className="prompt-chip"
                >
                  👋 "Hi"
                </button>
                <button
                  onClick={() => handleQuickChip("I wanted to know whatever the features we have added in the project")}
                  className="prompt-chip"
                >
                  🚀 "I wanted to know whatever the features we have added in the project"
                </button>
                <button
                  onClick={() => handleQuickChip("How does the PyTorch CareerMLP prediction model work?")}
                  className="prompt-chip"
                >
                  🧠 "How does the PyTorch model work?"
                </button>
                <button
                  onClick={() => handleQuickChip("What are the 5 skill radar pillars in MirrorMind?")}
                  className="prompt-chip"
                >
                  📊 "What are the 5 skill radar pillars?"
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Conversation Transcript */}
          <div className="voice-transcript-card">
            <div className="transcript-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "1.1rem" }}>💬</span>
                <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-main)" }}>Live Spoken Transcript</span>
              </div>
              <button
                onClick={() =>
                  setMessages([
                    {
                      id: "welcome",
                      sender: "ai",
                      text: "Transcript cleared. Speak or type to start a new conversation!",
                      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    },
                  ])
                }
                className="secondary-button"
                style={{ padding: "4px 10px", fontSize: "0.75rem" }}
              >
                Clear Log
              </button>
            </div>

            {/* Transcript Messages Body */}
            <div className="transcript-body">
              {messages.map((msg) => (
                <div key={msg.id} className={`transcript-message ${msg.sender}`}>
                  <div className="transcript-sender">
                    <span>{msg.sender === "user" ? (user?.displayName || "You") : "MirrorMind Voice"}</span>
                    <span>• {msg.timestamp}</span>
                  </div>
                  <div className="message-bubble">{msg.text}</div>
                </div>
              ))}

              {/* Streaming AI Chunk Box */}
              {streamingAiText && (
                <div className="transcript-message ai">
                  <div className="transcript-sender">
                    <span>MirrorMind Voice (Streaming...)</span>
                  </div>
                  <div className="message-bubble" style={{ borderStyle: "dashed", borderColor: "rgba(6, 182, 212, 0.4)" }}>
                    {streamingAiText}
                    <span className="cursor-blink">|</span>
                  </div>
                </div>
              )}

              <div ref={transcriptEndRef} />
            </div>

            {/* Fallback Text Input & Microphone Bar */}
            <form
              onSubmit={handleTextSubmit}
              style={{
                display: "flex",
                gap: "8px",
                padding: "14px 16px",
                background: "rgba(18, 24, 38, 0.7)",
                borderTop: "1px solid var(--border-color)",
              }}
            >
              <input
                type="text"
                placeholder={isSessionActive ? "Speaking... or type your message here..." : "Type your message or click 'Start Communication'..."}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                style={{
                  flex: 1,
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  color: "#fff",
                  fontSize: "0.88rem",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                disabled={!textInput.trim()}
                className="primary-button"
                style={{
                  padding: "10px 18px",
                  fontSize: "0.85rem",
                  borderRadius: "10px",
                  opacity: textInput.trim() ? 1 : 0.5,
                }}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
