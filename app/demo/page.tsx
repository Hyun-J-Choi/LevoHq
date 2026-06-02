"use client";
import {
  useState,
  useRef,
  useEffect,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import Link from "next/link";
import EmailCapture from "@/components/landing/EmailCapture";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

type DemoChatApiResponse = {
  text?: string;
  error?: string;
};

// Brand palette (matches the marketing site / globals).
const GOLD = "#D4A853";
const GOLD_DEEP = "#b8923f";
const INK = "#0A0A0A";

const SUGGESTED_MESSAGES = [
  "Do you have Botox available this week?",
  "How much does lip filler cost?",
  "I need to cancel my appointment",
  "I got your text about my Botox being due — what do you have?",
  "I have a wedding in 2 weeks, what should I get?",
];

export default function LevoDemo() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (started && inputRef.current) {
      inputRef.current.focus();
    }
  }, [started]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setStarted(true);

    try {
      const apiMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/demo-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = (await response.json()) as DemoChatApiResponse;
      const reply =
        data.text ??
        data.error ??
        "Sorry, something went wrong. Please try again!";
      setMessages((prev) => [
        ...prev,
        { role: "assistant" as const, content: reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant" as const,
          content: "Connection error — please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  function handleSubmit(
    e: KeyboardEvent<HTMLInputElement> | MouseEvent<HTMLButtonElement>
  ) {
    e.preventDefault();
    sendMessage(input);
  }

  const formatTime = () => {
    const now = new Date();
    let h = now.getHours();
    const m = now.getMinutes().toString().padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  };

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        background:
          "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(212,168,83,0.08), transparent), #0A0A0A",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "72px 20px 40px",
        fontFamily:
          "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Top bar — keeps the demo tied to the brand and gives a way back */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
        }}
      >
        <Link
          href="/"
          style={{
            color: "#F5F2E8",
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            textDecoration: "none",
          }}
        >
          Levo<span style={{ color: GOLD }}>HQ</span>
        </Link>
        <Link
          href="/#pricing"
          style={{
            color: "rgba(245,242,232,0.6)",
            fontSize: 13,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Pricing
        </Link>
      </div>

      {/* Phone Frame */}
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "linear-gradient(180deg, #1c1c1c 0%, #121212 100%)",
          borderRadius: 44,
          padding: "12px",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.06), 0 25px 80px rgba(0,0,0,0.6), 0 0 120px rgba(212,168,83,0.10)",
        }}
      >
        {/* Inner Screen */}
        <div
          style={{
            background: "#000",
            borderRadius: 34,
            overflow: "hidden",
            height: "min(72vh, 660px)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Status Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 24px 0",
              fontSize: 13,
              fontWeight: 600,
              color: "#fff",
            }}
          >
            <span>{formatTime()}</span>
            <div
              style={{ width: 120, height: 28, background: "#000", borderRadius: 20 }}
            />
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <svg width="16" height="12" viewBox="0 0 16 12" fill="white">
                <rect x="0" y="7" width="3" height="5" rx="0.5" opacity="0.4" />
                <rect x="4.5" y="5" width="3" height="7" rx="0.5" opacity="0.6" />
                <rect x="9" y="2" width="3" height="10" rx="0.5" opacity="0.8" />
                <rect x="13" y="0" width="3" height="12" rx="0.5" />
              </svg>
              <svg width="22" height="12" viewBox="0 0 22 12" fill="white">
                <rect x="0" y="0" width="20" height="12" rx="2" stroke="white" strokeWidth="1" fill="none" opacity="0.4" />
                <rect x="2" y="2" width="14" height="8" rx="1" fill="white" />
                <rect x="21" y="3.5" width="1.5" height="5" rx="0.5" fill="white" opacity="0.4" />
              </svg>
            </div>
          </div>

          {/* Header */}
          <div
            style={{
              padding: "16px 20px 12px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DEEP})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontWeight: 700,
                color: INK,
                flexShrink: 0,
              }}
            >
              G
            </div>
            <div>
              <div
                style={{
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 16,
                  letterSpacing: "-0.01em",
                }}
              >
                Glow Med Spa
              </div>
              <div style={{ color: GOLD, fontSize: 12, fontWeight: 500 }}>
                {loading ? "typing..." : "AI Assistant • Online"}
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {!started && (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 24,
                  padding: "20px 0",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DEEP})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 16px",
                      fontSize: 28,
                    }}
                  >
                    ✨
                  </div>
                  <div
                    style={{
                      color: "#fff",
                      fontSize: 18,
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    Talk to it like your client would
                  </div>
                  <div
                    style={{
                      color: "rgba(255,255,255,0.45)",
                      fontSize: 13,
                      lineHeight: 1.5,
                      maxWidth: 260,
                      margin: "0 auto",
                    }}
                  >
                    This is the exact AI that handles booking, pricing, and client
                    questions for LevoHQ med spa partners. Try it.
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    width: "100%",
                  }}
                >
                  {SUGGESTED_MESSAGES.map((msg, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(msg)}
                      style={{
                        background: "rgba(212,168,83,0.08)",
                        border: "1px solid rgba(212,168,83,0.22)",
                        borderRadius: 16,
                        padding: "10px 16px",
                        color: "#e0bc6a",
                        fontSize: 13,
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.2s",
                        fontFamily: "inherit",
                      }}
                      onMouseOver={(e: MouseEvent<HTMLButtonElement>) => {
                        e.currentTarget.style.background =
                          "rgba(212,168,83,0.16)";
                        e.currentTarget.style.borderColor =
                          "rgba(212,168,83,0.45)";
                      }}
                      onMouseOut={(e: MouseEvent<HTMLButtonElement>) => {
                        e.currentTarget.style.background =
                          "rgba(212,168,83,0.08)";
                        e.currentTarget.style.borderColor =
                          "rgba(212,168,83,0.22)";
                      }}
                    >
                      {msg}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent:
                    msg.role === "user" ? "flex-end" : "flex-start",
                  animation: "fadeIn 0.3s ease",
                }}
              >
                <div
                  style={{
                    maxWidth: "82%",
                    padding: "10px 14px",
                    borderRadius:
                      msg.role === "user"
                        ? "18px 18px 4px 18px"
                        : "18px 18px 18px 4px",
                    background:
                      msg.role === "user"
                        ? `linear-gradient(135deg, ${GOLD}, ${GOLD_DEEP})`
                        : "rgba(255,255,255,0.08)",
                    color: msg.role === "user" ? INK : "rgba(255,255,255,0.88)",
                    fontSize: 14,
                    lineHeight: 1.5,
                    letterSpacing: "-0.01em",
                    fontWeight: msg.role === "user" ? 500 : 400,
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    padding: "12px 18px",
                    borderRadius: "18px 18px 18px 4px",
                    background: "rgba(255,255,255,0.08)",
                    display: "flex",
                    gap: 5,
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.35)",
                        animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: "10px 12px 28px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(255,255,255,0.06)",
                borderRadius: 24,
                padding: "4px 4px 4px 16px",
              }}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter") handleSubmit(e);
                }}
                placeholder="Text message..."
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  outline: "none",
                  color: "#fff",
                  fontSize: 15,
                  fontFamily: "inherit",
                }}
              />
              <button
                onClick={handleSubmit}
                disabled={!input.trim() || loading}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  background:
                    input.trim() && !loading
                      ? `linear-gradient(135deg, ${GOLD}, ${GOLD_DEEP})`
                      : "rgba(255,255,255,0.08)",
                  border: "none",
                  cursor: input.trim() && !loading ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                  flexShrink: 0,
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={input.trim() && !loading ? INK : "white"}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conversion step — appears once the prospect has actually engaged.
          Catches them at peak interest instead of dead-ending the demo. */}
      {started ? (
        <div
          style={{
            marginTop: 24,
            width: "100%",
            maxWidth: 420,
            borderRadius: 16,
            border: "1px solid rgba(212,168,83,0.25)",
            background: "rgba(212,168,83,0.04)",
            padding: "20px",
            animation: "fadeIn 0.4s ease",
          }}
        >
          <p
            style={{
              color: "#F5F2E8",
              fontSize: 15,
              fontWeight: 600,
              lineHeight: 1.4,
              marginBottom: 4,
            }}
          >
            That&apos;s what every one of your clients would get.
          </p>
          <p
            style={{
              color: "rgba(245,242,232,0.55)",
              fontSize: 13,
              lineHeight: 1.5,
              marginBottom: 14,
            }}
          >
            Booking, reminders, follow-ups, win-backs — automatic. Leave your
            email and we&apos;ll set it up for your clinic.
          </p>
          <EmailCapture source="demo-interactive" buttonLabel="Get early access →" />
        </div>
      ) : (
        <div style={{ marginTop: 20, textAlign: "center" }}>
          <div
            style={{
              color: "rgba(245,242,232,0.3)",
              fontSize: 12,
              letterSpacing: "0.05em",
            }}
          >
            POWERED BY
          </div>
          <div
            style={{
              color: "#F5F2E8",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              marginTop: 4,
            }}
          >
            Levo<span style={{ color: GOLD }}>HQ</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-8px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        ::-webkit-scrollbar { width: 0; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>
    </div>
  );
}
