"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { StudentProfile } from "@/types/student";

interface ActionItem {
  id: string;
  type: string;
  text: string;
  time: string;
}

type OrbState = "idle" | "listening" | "thinking" | "speaking";

interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

interface HeroVoiceAssistantProps {
  student: StudentProfile;
  apiUrl?: string;
  onProfileUpdated?: () => void;
}

export const HeroVoiceAssistant: React.FC<HeroVoiceAssistantProps> = ({
  student,
  apiUrl = "http://localhost:8000",
  onProfileUpdated,
}) => {
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [wsStatus, setWsStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [assistantText, setAssistantText] = useState<string>(
    `Hello, ${student.name.split(" ")[0]}. How can I help you today?`
  );
  const [userTranscript, setUserTranscript] = useState<string>("");
  const [actionNotice, setActionNotice] = useState<ActionItem | null>(null);
  const [audioBars, setAudioBars] = useState<number[]>([4, 10, 16, 8, 12, 6, 14]);

  const wsRef = useRef<WebSocket | null>(null);
  const recognitionRef = useRef<any>(null);
  const isSpeakingRef = useRef<boolean>(false);
  const sessionActiveRef = useRef<boolean>(false);
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    sessionActiveRef.current = isSessionActive;
  }, [isSessionActive]);

  // Dynamic soundwave equalizer animation
  useEffect(() => {
    if (isSessionActive && (orbState === "speaking" || orbState === "listening")) {
      audioIntervalRef.current = setInterval(() => {
        setAudioBars([
          Math.floor(Math.random() * 12) + 4,
          Math.floor(Math.random() * 16) + 4,
          Math.floor(Math.random() * 18) + 6,
          Math.floor(Math.random() * 14) + 4,
          Math.floor(Math.random() * 18) + 6,
          Math.floor(Math.random() * 12) + 4,
          Math.floor(Math.random() * 16) + 4,
        ]);
      }, 120);
    } else {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      setAudioBars([4, 8, 12, 6, 10, 5, 8]);
    }

    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };
  }, [isSessionActive, orbState]);

  // Speech Synthesis
  const speakText = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Natural") ||
            v.name.includes("Google") ||
            v.name.includes("Samantha"))
      ) || voices.find((v) => v.lang.startsWith("en"));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      isSpeakingRef.current = true;
      setOrbState("speaking");
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };

    utterance.onend = () => {
      isSpeakingRef.current = false;
      if (sessionActiveRef.current) {
        setOrbState("listening");
        restartRecognition();
      } else {
        setOrbState("idle");
      }
    };

    utterance.onerror = () => {
      isSpeakingRef.current = false;
      if (sessionActiveRef.current) {
        setOrbState("listening");
        restartRecognition();
      } else {
        setOrbState("idle");
      }
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  // Web Speech Recognition
  const initSpeechRecognition = useCallback(() => {
    if (typeof window === "undefined") return;

    const win = window as IWindow;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRec) {
      console.warn("Web Speech Recognition API is not supported in this browser.");
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        if (!isSpeakingRef.current) {
          setOrbState("listening");
        }
      };

      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const transcript = final || interim;
        setUserTranscript(transcript);

        if (final && final.trim().length > 1) {
          handleUserUtterance(final.trim());
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === "no-speech" || event.error === "aborted") return;
        console.error("Speech recognition error:", event.error);
        if (sessionActiveRef.current && !isSpeakingRef.current) {
          setTimeout(restartRecognition, 1000);
        }
      };

      recognition.onend = () => {
        if (sessionActiveRef.current && !isSpeakingRef.current) {
          setTimeout(restartRecognition, 500);
        }
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.error("Failed to initialize speech recognition:", err);
    }
  }, []);

  const restartRecognition = () => {
    if (!recognitionRef.current || !sessionActiveRef.current || isSpeakingRef.current) return;
    try {
      recognitionRef.current.abort();
      setTimeout(() => {
        if (sessionActiveRef.current && !isSpeakingRef.current) {
          recognitionRef.current.start();
        }
      }, 200);
    } catch {
      // ignore
    }
  };

  // Connect WebSocket to Gemini Live backend
  const connectWebSocket = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    try {
      setWsStatus("connecting");
      const wsUrl = apiUrl.replace(/^http/, "ws") + "/api/ws/voice-chat";
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setWsStatus("connected");
        ws.send(
          JSON.stringify({
            type: "init",
            user: {
              name: student.name,
              email: student.email,
              cgpa: student.cgpa,
              skills: student.skills,
              projects: student.projects,
              internships: student.internships,
            },
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "ai_response") {
            setAssistantText(data.text);
            speakText(data.text);
          } else if (data.type === "action_executed") {
            setActionNotice({
              id: Date.now().toString(),
              type: data.action || "database_update",
              text: data.message || "Database updated successfully.",
              time: "Just now",
            });
            if (onProfileUpdated) onProfileUpdated();
          }
        } catch {
          // ignore
        }
      };

      ws.onclose = () => {
        setWsStatus("disconnected");
      };

      ws.onerror = () => {
        setWsStatus("disconnected");
      };

      wsRef.current = ws;
    } catch (err) {
      console.error("WebSocket connection failure:", err);
      setWsStatus("disconnected");
    }
  }, [apiUrl, onProfileUpdated, speakText, student]);

  // Handle User Message / Speech
  const handleUserUtterance = async (text: string) => {
    setOrbState("thinking");

    // Check for direct local action triggers (e.g. "add skill Python")
    const lower = text.toLowerCase();
    if (lower.startsWith("add skill") || lower.startsWith("add ")) {
      const skillName = text.replace(/^(add skill|add)/i, "").trim();
      if (skillName && !student.skills.includes(skillName.toLowerCase())) {
        try {
          await fetch(`${apiUrl}/api/student/profile/${encodeURIComponent(student.email)}/skills`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ skills: [skillName.toLowerCase()] }),
          });

          setActionNotice({
            id: Date.now().toString(),
            type: "skill_added",
            text: `Skill Added: ${skillName.toUpperCase()}`,
            time: "Just now",
          });
          const reply = `I have added ${skillName} to your verified technical skills in MongoDB Atlas!`;
          setAssistantText(reply);
          speakText(reply);
          if (onProfileUpdated) onProfileUpdated();
          return;
        } catch {
          // fallback to websocket
        }
      }
    }

    // Send through WebSocket if connected
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "user_message", text }));
    } else {
      // Local intelligent response fallback
      setTimeout(() => {
        let reply = `Based on your profile, you have strong alignment in Machine Learning and Full Stack development with a CGPA of ${student.cgpa}.`;
        if (lower.includes("project")) {
          reply = `You have ${student.projects.length} verified projects in your dossier, including ${student.projects[0]?.title || "MedBridge"}.`;
        } else if (lower.includes("skill")) {
          reply = `You have ${student.skills.length} skills listed, featuring ${student.skills.slice(0, 4).join(", ")}.`;
        }
        setAssistantText(reply);
        speakText(reply);
      }, 700);
    }
  };

  // Toggle Voice Chat Session
  const toggleVoiceSession = () => {
    if (!isSessionActive) {
      setIsSessionActive(true);
      connectWebSocket();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setOrbState("listening");
        } catch {
          // ignore
        }
      }
    } else {
      setIsSessionActive(false);
      setOrbState("idle");
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    }
  };

  // Trigger Interactive Demo
  const triggerDemo = () => {
    const demoPrompt = "How is my career alignment looking?";
    setUserTranscript(demoPrompt);
    handleUserUtterance(demoPrompt);
  };

  useEffect(() => {
    initSpeechRecognition();
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [initSpeechRecognition]);

  const firstName = student.name.split(" ")[0].toUpperCase();

  return (
    <div className="voice-hero-card">
      {/* Left Column: Greeting, Description, Actions */}
      <div className="voice-hero-left">
        <div className="voice-hero-pretag">HELLO, I&apos;M {firstName}</div>
        <h1 className="voice-hero-title">
          Your <span>AI Voice Co-Pilot</span> is Ready
        </h1>
        <p className="voice-hero-description">
          Ask me about your academics, projects, internships, portfolio or anything you want to explore. I&apos;m here to help!
        </p>

        <div className="voice-hero-actions">
          {/* Start Voice Chat Primary Button */}
          <button
            onClick={toggleVoiceSession}
            className={`voice-btn-primary ${isSessionActive ? "recording" : ""}`}
            title={isSessionActive ? "Stop voice chat" : "Start real-time voice chat"}
          >
            <span>🎙️</span>
            <span>{isSessionActive ? "End Voice Session" : "Start Voice Chat"}</span>
          </button>

          {/* Dynamic Voice Status Pill */}
          <div className="voice-status-pill">
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor:
                  orbState === "speaking"
                    ? "#38BDF8"
                    : orbState === "listening"
                    ? "#10B981"
                    : orbState === "thinking"
                    ? "#F59E0B"
                    : "#94A3B8",
              }}
            />
            <span>
              {orbState === "speaking"
                ? "Speaking..."
                : orbState === "listening"
                ? "Listening..."
                : orbState === "thinking"
                ? "Thinking..."
                : isSessionActive
                ? "Connected"
                : "Ready"}
            </span>
          </div>

          {/* View Demo / Quick Prompt Button */}
          <button onClick={triggerDemo} className="voice-btn-secondary" title="Hear a quick career status overview">
            <span>▶</span>
            <span>View Demo</span>
          </button>
        </div>

        {/* Real-time Action Badge when DB updates occur */}
        {actionNotice && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "10px",
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              color: "#065F46",
              fontSize: "0.78rem",
              fontWeight: 600,
              marginTop: "4px",
            }}
          >
            <span>✨</span>
            <span>{actionNotice.text}</span>
          </div>
        )}
      </div>

      {/* Right Column: Speech Bubble, Concentric Glowing Blue Orb, Soundwave Equalizer */}
      <div className="voice-hero-right">
        {/* Assistant Speech Bubble */}
        <div className="hero-speech-bubble">
          {userTranscript ? (
            <div>
              <div style={{ fontSize: "0.72rem", color: "#6B7280", marginBottom: "3px" }}>You said:</div>
              <div style={{ fontWeight: 600, color: "#111827", marginBottom: "6px" }}>&ldquo;{userTranscript}&rdquo;</div>
              <div style={{ fontSize: "0.72rem", color: "#0284C7", marginBottom: "3px" }}>Copilot:</div>
              <div>{assistantText}</div>
            </div>
          ) : (
            <div>{assistantText}</div>
          )}
        </div>

        {/* Circular Concentric Glowing Voice Orb */}
        <div className="hero-voice-orb-container" onClick={toggleVoiceSession} style={{ cursor: "pointer" }} title="Click orb to toggle voice">
          <div className="orb-ring-outer" />
          <div className="orb-ring-middle" />
          <div className={`orb-core ${orbState}`}>
            {orbState === "speaking" ? "🔊" : orbState === "listening" ? "🎙️" : orbState === "thinking" ? "⚡" : "✨"}
          </div>
        </div>

        {/* Soundwave Equalizer Pill */}
        <div className="hero-soundwave-pill">
          <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>🎙️</span>
          <div className="soundwave-bars-container">
            {audioBars.map((height, i) => (
              <div
                key={i}
                className="soundwave-bar"
                style={{
                  height: `${height}px`,
                  backgroundColor: orbState === "speaking" ? "#0284C7" : orbState === "listening" ? "#10B981" : "#94A3B8",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
