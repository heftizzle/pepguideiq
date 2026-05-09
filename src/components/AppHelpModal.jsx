import React, { useState, useEffect, useRef } from "react";
import { API_WORKER_URL } from "../lib/config.js";
import { getSessionAccessToken } from "../lib/supabase.js";
import { Z } from "../lib/zIndex.js";

const DAILY_LIMIT = 10; // keep in sync with APP_HELP_DAILY_LIMIT in api-proxy.js

const SUGGESTED_PROMPTS = [
  "Where is KPV?",
  "How do I log a dose?",
  "What is BAC water?",
  "How do I add to my stack?",
  "What's the difference between tiers?",
  "Where is AI Atlas?",
];

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: "12px",
      gap: "8px",
      alignItems: "flex-end",
    }}>
      {!isUser && (
        <div style={{
          width: "28px", height: "28px", borderRadius: "50%",
          background: "var(--color-bg-sunken)",
          border: "1px solid var(--color-border-default)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "14px", flexShrink: 0,
        }}>
          💬
        </div>
      )}
      <div style={{
        maxWidth: "80%",
        padding: "10px 14px",
        borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        background: isUser ? "var(--color-accent)" : "var(--color-bg-sunken)",
        color: isUser ? "var(--color-text-inverse)" : "var(--color-text-primary)",
        fontSize: "14px",
        lineHeight: 1.55,
        border: isUser
          ? "1px solid var(--color-accent)"
          : "1px solid var(--color-border-default)",
        whiteSpace: "pre-wrap",
      }}>
        {message.content}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", marginBottom: "12px" }}>
      <div style={{
        width: "28px", height: "28px", borderRadius: "50%",
        background: "var(--color-bg-sunken)",
        border: "1px solid var(--color-border-default)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px",
      }}>
        💬
      </div>
      <div style={{
        padding: "12px 16px", borderRadius: "16px 16px 16px 4px",
        background: "var(--color-bg-sunken)", border: "1px solid var(--color-border-default)",
        display: "flex", gap: "4px", alignItems: "center",
      }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            width: "6px", height: "6px", borderRadius: "50%",
            background: "var(--color-text-muted)",
            animation: "pepv-bounce 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>
    </div>
  );
}

/**
 * @param {{ isOpen: boolean, onClose: () => void }} props
 */
export default function AppHelpModal({ isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [queriesUsed, setQueriesUsed] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const remaining = DAILY_LIMIT - queriesUsed;
  const isExhausted = remaining <= 0;

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 320);
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || isLoading || isExhausted) return;

    setInput("");
    const userMsg = { role: "user", content: userText };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setIsLoading(true);

    try {
      const token = await getSessionAccessToken();
      const resp = await fetch(`${API_WORKER_URL}/v1/app-help`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (resp.status === 429) {
        const errData = await resp.json().catch(() => ({}));
        setQueriesUsed(DAILY_LIMIT);
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: errData?.usage
            ? `You've used all ${errData.usage.queries_limit} App Help questions today. Resets at midnight 🌙`
            : "You've hit today's App Help limit. Resets at midnight 🌙",
        }]);
        return;
      }

      if (!resp.ok) throw new Error(`Worker error ${resp.status}`);

      const data = await resp.json();
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: data.text ?? "Something went wrong. Please try again!",
      }]);
      if (data.usage) setQueriesUsed(data.usage.queries_today);

    } catch (err) {
      console.error("[AppHelp]", err);
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Something went wrong. Please try again in a moment.",
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  const showSuggested = messages.length === 0 && !isLoading;
  const sendDisabled = !input.trim() || isLoading || isExhausted;

  return (
    <>
      <style>{`
        @keyframes pepv-bounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-6px);opacity:1}}
        @keyframes pepv-slide-up{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
      `}</style>

      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: Z.appHelpSheetBackdrop,
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="App Help"
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          height: "72dvh",
          background: "var(--color-bg-card)",
          borderRadius: "20px 20px 0 0",
          border: "1px solid var(--color-border-default)",
          borderBottom: "none",
          zIndex: Z.appHelpSheet,
          display: "flex", flexDirection: "column", overflow: "hidden",
          animation: "pepv-slide-up 0.28s cubic-bezier(0.32,0.72,0,1)",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 16px 12px",
          borderBottom: "1px solid var(--color-border-hairline)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "20px" }}>💬</span>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "15px", color: "var(--color-text-primary)" }}>
                App Help
              </p>
              <p style={{ margin: 0, fontSize: "11px", color: "var(--color-text-muted)" }}>
                {isExhausted
                  ? "Daily limit reached — resets at midnight"
                  : `${remaining} of ${DAILY_LIMIT} questions remaining today`}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => { setMessages([]); setInput(""); }}
                style={{
                  border: "none", background: "none",
                  color: "var(--color-text-muted)", fontSize: "13px",
                  cursor: "pointer", padding: "4px 8px", borderRadius: "8px",
                }}
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close App Help"
              style={{
                width: "32px", height: "32px", borderRadius: "50%",
                border: "1px solid var(--color-border-default)",
                background: "var(--color-bg-sunken)",
                color: "var(--color-text-secondary)",
                cursor: "pointer", fontSize: "16px",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px", display: "flex", flexDirection: "column" }}>
          {messages.length === 0 && (
            <div style={{
              textAlign: "center", padding: "24px 16px 16px",
              color: "var(--color-text-muted)", fontSize: "14px", lineHeight: 1.6,
            }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>💬</div>
              <p style={{ margin: 0 }}>
                Ask me anything about navigating pepguideIQ —<br />
                finding compounds, logging doses, tiers, and more.
              </p>
            </div>
          )}

          {messages.map((msg, i) => <MessageBubble key={i} message={msg} />)}
          {isLoading && <TypingIndicator />}

          {isExhausted && messages.length > 0 && (
            <div style={{
              margin: "8px 0", padding: "12px 16px", borderRadius: "12px",
              background: "rgba(255,180,0,0.08)",
              border: "1px solid var(--color-warning)",
              color: "var(--color-warning)", fontSize: "13px", textAlign: "center",
            }}>
              Daily App Help limit reached. Resets at midnight 🌙
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested prompts */}
        {showSuggested && (
          <div style={{ padding: "0 16px 12px", flexShrink: 0 }}>
            <p style={{
              fontSize: "11px", color: "var(--color-text-muted)", margin: "0 0 8px",
              textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600,
            }}>
              Common questions
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => sendMessage(p)}
                  style={{
                    padding: "6px 12px", borderRadius: "20px",
                    border: "1px solid var(--color-border-default)",
                    background: "var(--color-bg-sunken)",
                    color: "var(--color-text-secondary)",
                    fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div style={{
          padding: "8px 12px 20px",
          borderTop: "1px solid var(--color-border-hairline)",
          display: "flex", gap: "8px", alignItems: "flex-end",
          background: "var(--color-bg-card)", flexShrink: 0,
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || isExhausted}
            placeholder={isExhausted ? "Limit reached — resets at midnight" : "Ask how to use the app..."}
            rows={1}
            style={{
              flex: 1, resize: "none",
              border: "1px solid var(--color-border-default)",
              borderRadius: "20px", padding: "10px 16px",
              fontSize: "14px",
              background: "var(--color-bg-sunken)",
              color: "var(--color-text-primary)",
              outline: "none", lineHeight: 1.5,
              maxHeight: "100px", overflowY: "auto",
              fontFamily: "inherit",
              opacity: isExhausted ? 0.5 : 1,
            }}
          />
          <button
            type="button"
            onClick={() => sendMessage()}
            disabled={sendDisabled}
            aria-label="Send"
            style={{
              width: "40px", height: "40px", borderRadius: "50%",
              border: "none",
              background: sendDisabled ? "var(--color-bg-sunken)" : "var(--color-accent)",
              color: sendDisabled ? "var(--color-text-muted)" : "var(--color-text-inverse)",
              cursor: sendDisabled ? "not-allowed" : "pointer",
              fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "background 0.15s",
              opacity: sendDisabled ? 0.5 : 1,
            }}
          >
            ↑
          </button>
        </div>
      </div>
    </>
  );
}
