"use client";
import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `You are the SMS assistant for Glow Med Spa, a premium medical spa.

Business details:
- Name: Glow Med Spa
- Phone: (425) 555-0199
- Hours: Monday-Friday 9am-6pm, Saturday 10am-4pm, Closed Sunday

Services offered:
- Botox: $13/unit (most clients need 20-40 units, so roughly $260-$520). Duration: 30 min
- Lip Filler: $650-$850/syringe. Duration: 45 min
- Dermal Fillers: $650-$1,200/syringe. Duration: 60 min
- HydraFacial: $189/session. Duration: 45 min
- Chemical Peel: $150-$250/session. Duration: 30 min
- Laser Hair Removal: $150-$500/session depending on area. Duration: 30 min
- Consultation: Free. Duration: 30 min

Policies:
- 24-hour cancellation policy. Late cancellations may incur a $50 fee.
- No refunds on completed treatments. Complimentary Botox touch-ups within 2 weeks.
- No cosmetic treatments on patients under 18.
- CareCredit and Cherry financing accepted.
- Referral program: both parties get $25 off next treatment.

CURRENT AVAILABILITY:
- Wednesday 1:30 PM with Dr. Sarah Kim (MD)
- Wednesday 2:00 PM with Dr. Sarah Kim (MD)
- Thursday 9:30 AM with Jessica Chen (NP)
- Thursday 10:00 AM with Jessica Chen (NP)
- Thursday 2:00 PM with Jessica Chen (NP)
- Friday 9:00 AM with Dr. Sarah Kim (MD)
- Friday 11:00 AM with Dr. Sarah Kim (MD)
- Saturday 10:00 AM with Jessica Chen (NP)

Use this real availability data when responding. Do not make up appointment times.

Keep SMS replies concise: aim under 280 characters, never over 500. Sound like a real person, not a bot. Be warm, professional, and helpful.

BOOKING RULES:
For every booking: (1) confirm service, (2) confirm date/time, (3) offer 2-3 specific slots from the availability above, (4) confirm with provider name, (5) include prep instructions.
Prep instructions:
- Botox: no blood thinners, aspirin, or alcohol 24hrs before
- Fillers: same as Botox, bruising possible
- Chemical peels: no retinol or exfoliants 5-7 days before
- Laser: no sun 2 weeks before, shave treatment area day before

SAFETY: Never give medical advice. For emergencies direct to 911. For reactions direct to clinic phone.
MINORS: No treatments under 18. Parent must be present in person.
PRIVACY: Never share employee schedules or client data.
IDENTITY: Be honest about being an AI assistant when asked.`;

const SUGGESTED_MESSAGES = [
  "Do you have Botox available this week?",
  "How much does lip filler cost?",
  "I need to cancel my appointment",
  "I got your text about my Botox being due — what do you have?",
  "I have a wedding in 2 weeks, what should I get?",
];

export default function LevoDemo() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (started && inputRef.current) {
      inputRef.current.focus();
    }
  }, [started]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;

    const userMsg = { role: "user", content: text.trim() };
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

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: apiMessages,
        }),
      });

      const data = await response.json();
      const reply = data.content?.[0]?.text || "Sorry, something went wrong. Please try again!";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection error — please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

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
        minHeight: "100vh",
        background: "linear-gradient(145deg, #0a0a0f 0%, #0d1117 40%, #0f1923 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Phone Frame */}
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)",
          borderRadius: 44,
          padding: "12px",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 25px 80px rgba(0,0,0,0.6), 0 0 120px rgba(99,102,241,0.08)",
        }}
      >
        {/* Inner Screen */}
        <div
          style={{
            background: "#000",
            borderRadius: 34,
            overflow: "hidden",
            height: "min(75vh, 680px)",
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
            <div style={{ width: 120, height: 28, background: "#000", borderRadius: 20 }} />
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
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontWeight: 700,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              G
            </div>
            <div>
              <div style={{ color: "#fff", fontWeight: 600, fontSize: 16, letterSpacing: "-0.01em" }}>
                Glow Med Spa
              </div>
              <div style={{ color: "#6366f1", fontSize: 12, fontWeight: 500 }}>
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
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 24, padding: "20px 0" }}>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 16px",
                      fontSize: 28,
                    }}
                  >
                    ✨
                  </div>
                  <div style={{ color: "#fff", fontSize: 18, fontWeight: 600, marginBottom: 6 }}>
                    Try our AI Assistant
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, lineHeight: 1.5, maxWidth: 260, margin: "0 auto" }}>
                    This is the same AI that handles booking, pricing, and client questions for our med spa partners.
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
                  {SUGGESTED_MESSAGES.map((msg, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(msg)}
                      style={{
                        background: "rgba(99,102,241,0.08)",
                        border: "1px solid rgba(99,102,241,0.2)",
                        borderRadius: 16,
                        padding: "10px 16px",
                        color: "#a5b4fc",
                        fontSize: 13,
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.2s",
                        fontFamily: "inherit",
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = "rgba(99,102,241,0.15)";
                        e.target.style.borderColor = "rgba(99,102,241,0.4)";
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = "rgba(99,102,241,0.08)";
                        e.target.style.borderColor = "rgba(99,102,241,0.2)";
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
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  animation: "fadeIn 0.3s ease",
                }}
              >
                <div
                  style={{
                    maxWidth: "82%",
                    padding: "10px 14px",
                    borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    background:
                      msg.role === "user"
                        ? "linear-gradient(135deg, #6366f1, #7c3aed)"
                        : "rgba(255,255,255,0.08)",
                    color: msg.role === "user" ? "#fff" : "rgba(255,255,255,0.88)",
                    fontSize: 14,
                    lineHeight: 1.5,
                    letterSpacing: "-0.01em",
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
                onKeyDown={(e) => e.key === "Enter" && handleSubmit(e)}
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
                  background: input.trim() && !loading
                    ? "linear-gradient(135deg, #6366f1, #7c3aed)"
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Branding */}
      <div style={{ marginTop: 20, textAlign: "center" }}>
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, letterSpacing: "0.05em" }}>
          POWERED BY
        </div>
        <div
          style={{
            color: "#fff",
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            marginTop: 4,
          }}
        >
          Levo<span style={{ color: "#6366f1" }}>HQ</span>
        </div>
      </div>

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
