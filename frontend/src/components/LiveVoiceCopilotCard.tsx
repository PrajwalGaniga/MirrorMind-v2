"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { StudentProfile } from "@/types/student";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  isActionCard?: boolean;
  actionType?: string;
  actionData?: any;
}

type OrbState = "idle" | "listening" | "thinking" | "speaking";

interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

interface LiveVoiceCopilotCardProps {
  student: StudentProfile;
  apiUrl?: string;
}

export const LiveVoiceCopilotCard: React.FC<LiveVoiceCopilotCardProps> = ({
  student,
  apiUrl = "http://localhost:8000",
}) => {
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [wsStatus, setWsStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [voiceMuted, setVoiceMuted] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("Ready. Tap orb or 'Start Voice' to speak.");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Hi Prajwal! I am your Autonomous Career Copilot. Ask about your career probability or tell me about new skills and projects to update your database in real time!",
      timestamp: "Ready",
    },
  ]);
  const [currentSpeechText, setCurrentSpeechText] = useState<string>("");
  const [textInput, setTextInput] = useState<string>("");
  const [streamingAiText, setStreamingAiText] = useState<string>("");

  const wsRef = useRef<WebSocket | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const isSpeakingRef = useRef<boolean>(false);
  const sessionActiveRef = useRef<boolean>(false);
  const speechMutedRef = useRef<boolean>(false);

  useEffect(() => {
    sessionActiveRef.current = isSessionActive;
  }, [isSessionActive]);

  useEffect(() => {
    speechMutedRef.current = voiceMuted;
  }, [voiceMuted]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingAiText]);

  // Speech Synthesis
  const speakText = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speechMutedRef.current) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

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
      setStatusMessage("MirrorMind is speaking...");
      try {
        if (recognitionRef.current) {
          recognitionRef.current.abort();
        }
      } catch (e) {
        // ignore
      }
    };

    utterance.onend = () => {
      isSpeakingRef.current = false;
      if (sessionActiveRef.current) {
        setOrbState("listening");
        setStatusMessage("Listening... Speak now!");
        restartRecognition();
      } else {
        setOrbState("idle");
        setStatusMessage("Voice paused.");
      }
    };

    utterance.onerror = () => {
      isSpeakingRef.current = false;
      if (sessionActiveRef.current) {
        setOrbState("listening");
        restartRecognition();
      }
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const restartRecognition = () => {
    if (!sessionActiveRef.current || isSpeakingRef.current) return;
    try {
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
    } catch {}
  };

  // Web Speech Recognition
  const initSpeechRecognition = useCallback(() => {
    if (typeof window === "undefined") return null;
    const win = window as IWindow;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

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
      if (isSpeakingRef.current) return;

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
      if (event.error === "not-allowed") {
        setStatusMessage("Microphone permission denied.");
        setIsSessionActive(false);
      }
    };

    recognition.onend = () => {
      if (sessionActiveRef.current && !isSpeakingRef.current) {
        try {
          recognition.start();
        } catch {}
      }
    };

    return recognition;
  }, []);

  // Send message over WebSocket
  const sendUserMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setOrbState("thinking");
    setStatusMessage("MirrorMind AI thinking...");

    const activeEmail = student.email || "prajwal.seed@mirrormind.ai";
    const payload = {
      type: "user_message",
      text: text.trim(),
      user_id: activeEmail,
    };

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    } else {
      connectWebSocket(() => {
        wsRef.current?.send(JSON.stringify(payload));
      });
    }
  };

  // Connect WebSocket
  const connectWebSocket = useCallback((onOpenCallback?: () => void) => {
    setWsStatus("connecting");
    const host = typeof window !== "undefined" ? window.location.hostname || "localhost" : "localhost";
    const wsUrl = `ws://${host}:8000/api/ws/voice-chat`;

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

          if (data.type === "action_executed") {
            setMessages((prev) => [
              ...prev,
              {
                id: "act-" + Date.now().toString() + Math.random().toString(36).substring(2, 6),
                sender: "ai",
                text: "",
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                isActionCard: true,
                actionType: data.action,
                actionData: data.data,
              },
            ]);
          } else if (data.type === "stream_start") {
            setOrbState("thinking");
            setStreamingAiText("");
          } else if (data.type === "stream_chunk") {
            setStreamingAiText((prev) => prev + data.chunk);
          } else if (data.type === "stream_end") {
            const reply = data.full_text || "";
            setStreamingAiText("");

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

      ws.onerror = () => {
        setWsStatus("disconnected");
      };

      ws.onclose = () => {
        setWsStatus("disconnected");
      };

      wsRef.current = ws;
    } catch {
      setWsStatus("disconnected");
    }
  }, [speakText]);

  const startCommunication = () => {
    setIsSessionActive(true);
    sessionActiveRef.current = true;
    const activeEmail = student.email || "prajwal.seed@mirrormind.ai";

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      connectWebSocket(() => {
        wsRef.current?.send(JSON.stringify({ type: "start_session", user_id: activeEmail }));
      });
    } else {
      wsRef.current.send(JSON.stringify({ type: "start_session", user_id: activeEmail }));
    }

    if (!recognitionRef.current) {
      recognitionRef.current = initSpeechRecognition();
    }
    try {
      recognitionRef.current?.start();
    } catch {}

    setOrbState("listening");
    setStatusMessage("Listening... Speak now!");
  };

  const stopCommunication = () => {
    setIsSessionActive(false);
    sessionActiveRef.current = false;
    isSpeakingRef.current = false;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setOrbState("idle");
    setCurrentSpeechText("");
    setStatusMessage("Voice paused. Click to speak.");
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    const txt = textInput.trim();
    setTextInput("");
    sendUserMessage(txt);
  };

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
    }
    connectWebSocket();

    return () => {
      sessionActiveRef.current = false;
      try {
        recognitionRef.current?.stop();
      } catch {}
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      wsRef.current?.close();
    };
  }, [connectWebSocket]);

  return (
    <div
      className="glassmorphic-copilot-module"
      style={{
        background: "rgba(250, 250, 247, 0.88)",
        backdropFilter: "blur(24px)",
        borderRadius: "var(--radius-card)",
        border: "1px solid rgba(255, 255, 255, 0.75)",
        boxShadow: "0 12px 32px -8px rgba(41, 42, 41, 0.08), 0 0 0 1px rgba(216, 217, 211, 0.4)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top Copilot Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 20px",
          borderBottom: "1px solid var(--border-subtle)",
          background: "rgba(255, 255, 255, 0.4)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "1.1rem" }}>🎙️</span>
          <div>
            <h3 style={{ fontSize: "0.92rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
              Voice Copilot AI
            </h3>
            <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
              Live DB &amp; ML Terminal
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Connection Dot */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "0.72rem",
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: "999px",
              background: wsStatus === "connected" ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
              color: wsStatus === "connected" ? "#059669" : "#dc2626",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: wsStatus === "connected" ? "#10b981" : "#ef4444",
              }}
            ></span>
            {wsStatus === "connected" ? "Live WS" : "Offline"}
          </span>

          {/* Full Studio Link */}
          <Link
            href="/voice-chat"
            style={{
              fontSize: "0.74rem",
              fontWeight: 600,
              textDecoration: "none",
              color: "var(--text-primary)",
              background: "var(--surface-soft)",
              padding: "4px 10px",
              borderRadius: "var(--radius-pill)",
              border: "1px solid var(--border-subtle)",
            }}
            title="Open Dedicated Voice Studio"
          >
            Studio ↗
          </Link>
        </div>
      </div>

      {/* Voice Orb & Reactive Audio Equalizer Stage */}
      <div
        style={{
          padding: "24px 20px 16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          background: "linear-gradient(180deg, rgba(247, 212, 91, 0.08) 0%, transparent 100%)",
        }}
      >
        {/* Animated Compact Orb */}
        <div
          onClick={isSessionActive ? stopCommunication : startCommunication}
          style={{
            width: "84px",
            height: "84px",
            borderRadius: "50%",
            cursor: "pointer",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              orbState === "speaking"
                ? "radial-gradient(circle at 35% 35%, #F7D45B 0%, #292A29 80%)"
                : orbState === "listening"
                ? "radial-gradient(circle at 35% 35%, #06b6d4 0%, #292A29 80%)"
                : orbState === "thinking"
                ? "radial-gradient(circle at 35% 35%, #a855f7 0%, #292A29 80%)"
                : "radial-gradient(circle at 35% 35%, #5F605C 0%, #292A29 90%)",
            boxShadow:
              orbState === "listening"
                ? "0 0 24px rgba(6, 182, 212, 0.45)"
                : orbState === "speaking"
                ? "0 0 24px rgba(247, 212, 91, 0.55)"
                : "0 6px 18px rgba(41, 42, 41, 0.2)",
            transition: "all 0.3s ease",
          }}
          title={isSessionActive ? "Click to Pause Communication" : "Click to Start Voice Communication"}
        >
          {orbState === "speaking" ? (
            <div style={{ display: "flex", gap: "3px", alignItems: "center", height: "24px" }}>
              <span className="soundwave-bar" style={{ background: "#F7D45B" }}></span>
              <span className="soundwave-bar" style={{ background: "#F7D45B" }}></span>
              <span className="soundwave-bar" style={{ background: "#F7D45B" }}></span>
              <span className="soundwave-bar" style={{ background: "#F7D45B" }}></span>
            </div>
          ) : orbState === "listening" ? (
            <span style={{ fontSize: "1.4rem", color: "#FFFFFF" }}>🎙️</span>
          ) : orbState === "thinking" ? (
            <span style={{ fontSize: "1.4rem" }}>⚡</span>
          ) : (
            <span style={{ fontSize: "1.4rem", color: "#F7D45B" }}>▶</span>
          )}
        </div>

        {/* Status Text */}
        <p
          style={{
            fontSize: "0.82rem",
            color: "var(--text-secondary)",
            margin: "12px 0 14px",
            fontWeight: 500,
            minHeight: "22px",
          }}
        >
          {currentSpeechText ? `"${currentSpeechText}..."` : statusMessage}
        </p>

        {/* Controls Row */}
        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
          {!isSessionActive ? (
            <button
              onClick={startCommunication}
              style={{
                background: "var(--charcoal)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "var(--radius-pill)",
                padding: "8px 18px",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 4px 12px rgba(41, 42, 41, 0.2)",
              }}
            >
              <span>🎙️</span> Start Voice
            </button>
          ) : (
            <button
              onClick={stopCommunication}
              style={{
                background: "#fef2f2",
                color: "#dc2626",
                border: "1px solid #fecaca",
                borderRadius: "var(--radius-pill)",
                padding: "8px 16px",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ⏹️ Pause Voice
            </button>
          )}

          <button
            onClick={() => setVoiceMuted(!voiceMuted)}
            style={{
              background: "var(--surface)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-pill)",
              padding: "8px 12px",
              fontSize: "0.8rem",
              cursor: "pointer",
            }}
            title={voiceMuted ? "Unmute Voice" : "Mute Voice"}
          >
            {voiceMuted ? "🔇 Muted" : "🔊 Audio"}
          </button>
        </div>
      </div>

      {/* Real-Time Transcript & Animated Action Stream */}
      <div
        style={{
          flex: 1,
          maxHeight: "310px",
          minHeight: "220px",
          overflowY: "auto",
          padding: "12px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          background: "rgba(255, 255, 255, 0.45)",
          borderTop: "1px solid var(--border-subtle)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        {messages.map((msg) =>
          msg.isActionCard ? (
            <div
              key={msg.id}
              style={{
                background: "var(--surface)",
                border: "1px solid rgba(247, 212, 91, 0.6)",
                borderRadius: "14px",
                padding: "10px 14px",
                boxShadow: "0 4px 14px rgba(41, 42, 41, 0.05)",
                fontSize: "0.82rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "10px",
                    background: "var(--accent)",
                    color: "var(--charcoal)",
                  }}
                >
                  {msg.actionType === "add_project" && "🚀 Project Added"}
                  {msg.actionType === "add_skill" && "⚡ Skill Radar"}
                  {msg.actionType === "get_career_status" && "🎯 Career Status"}
                  {msg.actionType === "add_internship" && "💼 Internship"}
                  {msg.actionType === "get_student_growth_summary" && "📊 Growth Summary"}
                </span>

                <span style={{ fontSize: "0.7rem", color: "#059669", fontWeight: 600 }}>
                  ● {msg.actionType === "get_career_status" ? "Cached ML" : "MongoDB Synced"}
                </span>
              </div>

              {msg.actionType === "add_project" && (
                <div>
                  <strong style={{ color: "var(--text-primary)" }}>{msg.actionData?.title}</strong>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                    Stack: {msg.actionData?.tech_stack?.join(", ")}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "#b45309", marginTop: "4px" }}>
                    ⏳ Idle ML Debouncer: Recalculation queued
                  </div>
                </div>
              )}

              {msg.actionType === "add_skill" && (
                <div>
                  <strong style={{ color: "var(--text-primary)", textTransform: "uppercase" }}>
                    {msg.actionData?.skill}
                  </strong>
                  <span style={{ fontSize: "0.74rem", color: "var(--text-secondary)", marginLeft: "6px" }}>
                    ({msg.actionData?.proficiency})
                  </span>
                  <div style={{ fontSize: "0.7rem", color: "#b45309", marginTop: "4px" }}>
                    ⏳ Idle ML Debouncer: Recalculation queued
                  </div>
                </div>
              )}

              {msg.actionType === "get_career_status" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{msg.actionData?.role}</span>
                    <strong style={{ color: "#2563eb" }}>{msg.actionData?.confidence}% Match</strong>
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                    Rank #{msg.actionData?.rank} Career Pathway
                  </span>
                </div>
              )}

              {msg.actionType === "add_internship" && (
                <div>
                  <strong>{msg.actionData?.role}</strong> @ {msg.actionData?.company}
                </div>
              )}
            </div>
          ) : (
            <div
              key={msg.id}
              style={{
                alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                maxWidth: "85%",
                background: msg.sender === "user" ? "var(--charcoal)" : "var(--surface)",
                color: msg.sender === "user" ? "#FFFFFF" : "var(--text-primary)",
                borderRadius: "14px",
                padding: "8px 12px",
                fontSize: "0.82rem",
                lineHeight: "1.4",
                boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                border: msg.sender === "user" ? "none" : "1px solid var(--border-subtle)",
              }}
            >
              {msg.text}
            </div>
          )
        )}

        {streamingAiText && (
          <div
            style={{
              alignSelf: "flex-start",
              maxWidth: "85%",
              background: "var(--surface)",
              color: "var(--text-primary)",
              borderRadius: "14px",
              padding: "8px 12px",
              fontSize: "0.82rem",
              border: "1px dashed var(--accent)",
            }}
          >
            {streamingAiText}
            <span className="cursor-blink">|</span>
          </div>
        )}

        <div ref={transcriptEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div style={{ padding: "10px 14px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
        <button
          onClick={() => sendUserMessage("What is my current status as a backend developer?")}
          style={{
            fontSize: "0.72rem",
            padding: "4px 8px",
            borderRadius: "999px",
            background: "var(--surface)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
        >
          🎯 "Backend status?"
        </button>
        <button
          onClick={() => sendUserMessage("I want to add a project called Smart Cache built with Go and Redis")}
          style={{
            fontSize: "0.72rem",
            padding: "4px 8px",
            borderRadius: "999px",
            background: "var(--surface)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
        >
          🛠️ "Add Go/Redis project"
        </button>
        <button
          onClick={() => sendUserMessage("I learned a new skill: Kubernetes")}
          style={{
            fontSize: "0.72rem",
            padding: "4px 8px",
            borderRadius: "999px",
            background: "var(--surface)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
        >
          ⚡ "Add Kubernetes"
        </button>
      </div>

      {/* Text Input Fallback Bar */}
      <form
        onSubmit={handleTextSubmit}
        style={{
          display: "flex",
          gap: "6px",
          padding: "10px 14px 14px",
          background: "rgba(255, 255, 255, 0.4)",
        }}
      >
        <input
          type="text"
          placeholder={isSessionActive ? "Speaking... or type here..." : "Type instruction or prompt..."}
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          style={{
            flex: 1,
            background: "var(--surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-pill)",
            padding: "6px 12px",
            fontSize: "0.8rem",
            color: "var(--text-primary)",
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={!textInput.trim()}
          style={{
            background: "var(--charcoal)",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "var(--radius-pill)",
            padding: "6px 14px",
            fontSize: "0.78rem",
            fontWeight: 600,
            cursor: "pointer",
            opacity: textInput.trim() ? 1 : 0.5,
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};
