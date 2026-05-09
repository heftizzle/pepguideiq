import { useEffect, useState } from "react";
import { isSupabaseConfigured } from "../lib/config.js";
import { fetchSharedStackByShareId } from "../lib/supabase.js";
import { getStackShareBaseUrl } from "../lib/stackShare.js";
import { normalizeStackSessions } from "./SavedStackEntryRow.jsx";
import { GlobalStyles } from "./GlobalStyles.jsx";

const SESSION_LABELS = { morning: "Morning", afternoon: "Afternoon", evening: "Evening", night: "Night" };

/**
 * Read-only marketing page for /stack/:shareId — no auth, no app chrome.
 * @param {{ shareId: string }} props
 */
export function PublicStackView({ shareId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!isSupabaseConfigured()) {
        setError("This page needs a configured Supabase project.");
        setLoading(false);
        return;
      }
      const sid = String(shareId ?? "").trim();
      if (!sid) {
        setError("Invalid link.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      const { data, error: e } = await fetchSharedStackByShareId(sid);
      if (cancelled) return;
      if (e) {
        setError(typeof e.message === "string" ? e.message : "Could not load stack.");
        setLoading(false);
        return;
      }
      if (data == null || typeof data !== "object") {
        setError("Stack not found.");
        setLoading(false);
        return;
      }
      const raw = Array.isArray(data.stack) ? data.stack : [];
      setItems(raw);
      setLoading(false);
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [shareId]);

  const appHome = `${getStackShareBaseUrl()}/`;

  return (
    <>
      <GlobalStyles />
      <div
        style={{
          minHeight: "100vh",
          background: "var(--color-bg-page)",
          "--color-text-primary": "var(--color-text-primary)",
          color: "var(--color-text-primary)",
          fontFamily: "'Outfit', sans-serif",
          padding: "32px 20px 48px",
          maxWidth: 560,
          margin: "0 auto",
        }}
      >
        <div className="brand" style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
          <span style={{ color: "var(--color-accent)" }}>Pep</span>GuideIQ
        </div>
        <div className="mono" style={{ fontSize: 12, color: "var(--color-text-secondary)", letterSpacing: "0.12em", marginBottom: 28 }}>
          SHARED STACK
        </div>

        {loading && (
          <div className="mono" style={{ fontSize: 14, color: "var(--color-text-placeholder)" }}>
            Loading…
          </div>
        )}

        {!loading && error && (
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              border: "1px solid #f59e0b55",
              background: "#1a0f00",
              color: "var(--color-warning)",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <h1 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 20px", lineHeight: 1.3 }}>My Stack</h1>
            {items.length === 0 ? (
              <div className="mono" style={{ fontSize: 14, color: "var(--color-text-placeholder)" }}>
                No compounds in this stack.
              </div>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 14 }}>
                {items.map((row, i) => {
                  const name = row && typeof row.name === "string" ? row.name : "Compound";
                  const dose = row?.stackDose ?? row?.startDose ?? "";
                  const freq = row?.stackFrequency ? String(row.stackFrequency) : "";
                  const sessions = normalizeStackSessions(row?.sessions).map((s) => SESSION_LABELS[s] ?? s);
                  const doseLine = [dose, freq].filter(Boolean).join(" · ");
                  return (
                    <li
                      key={row?.id ?? row?.stackRowKey ?? i}
                      style={{
                        padding: 14,
                        borderRadius: 12,
                        border: "1px solid var(--color-border-default)",
                        background: "var(--color-bg-sunken)",
                      }}
                    >
                      <div className="brand" style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
                        {name}
                      </div>
                      {doseLine && (
                        <div className="mono" style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 6 }}>
                          {doseLine}
                        </div>
                      )}
                      {sessions.length > 0 && (
                        <div className="mono" style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                          Sessions: {sessions.join(", ")}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <a
              href={appHome}
              style={{
                display: "inline-block",
                marginTop: 28,
                padding: "12px 20px",
                borderRadius: 12,
                background: "var(--color-accent-nav-fill)",
                border: "1px solid var(--color-bell-border-unread)",
                color: "var(--color-accent)",
                fontWeight: 600,
                fontSize: 14,
                textDecoration: "none",
                fontFamily: "JetBrains Mono, monospace",
              }}
            >
              View on pepguideIQ
            </a>

            <p style={{ marginTop: 24, fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
              Research compounds only. Not medical advice. Consult a qualified professional.
            </p>
          </>
        )}
      </div>
    </>
  );
}
