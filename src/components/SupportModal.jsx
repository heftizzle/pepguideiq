import { useEffect, useState } from "react";
import { API_WORKER_URL, isApiWorkerConfigured } from "../lib/config.js";
import { getCurrentUser, getSessionAccessToken } from "../lib/supabase.js";
import { Modal } from "./Modal.jsx";

/**
 * @param {{ isOpen: boolean; onClose: () => void }} props
 */
export default function SupportModal({ isOpen, onClose }) {
  const [user, setUser] = useState(/** @type {{ id?: string | null; email?: string | null } | null} */ (null));
  const [form, setForm] = useState({ email: "", phone: "", message: "" });
  const [status, setStatus] = useState(/** @type {"idle" | "loading" | "success" | "error"} */ ("idle"));
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setStatus("idle");
    setErrorText("");
    (async () => {
      const u = await getCurrentUser().catch(() => null);
      if (!active) return;
      setUser(u);
      if (u?.email) {
        setForm((prev) => ({ ...prev, email: prev.email || String(u.email) }));
      }
    })();
    return () => {
      active = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    const email = form.email.trim();
    const message = form.message.trim();
    const phone = form.phone.trim();
    if (!email || !message) {
      setStatus("error");
      setErrorText("Email and message are required.");
      return;
    }
    if (!isApiWorkerConfigured()) {
      setStatus("error");
      setErrorText("Support service is not configured.");
      return;
    }

    setStatus("loading");
    setErrorText("");
    try {
      const token = await getSessionAccessToken();
      const res = await fetch(`${API_WORKER_URL}/support-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          email,
          phone: phone || null,
          message,
          user_id: user?.id || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body.error === "string" ? body.error : "Request failed");
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorText(err instanceof Error && err.message ? err.message : "Something went wrong. Try again.");
    }
  };

  return (
    <Modal onClose={onClose} maxWidth={560} label="Contact support">
      <h2 className="brand" style={{ marginTop: 0, marginBottom: 8, fontSize: 22 }}>
        How can pepguideIQ help you?
      </h2>
      <p style={{ marginTop: 0, marginBottom: 14, color: "var(--color-text-secondary)", fontSize: 14 }}>
        Send us a note and we will get back to you shortly.
      </p>

      <div style={{ display: "grid", gap: 10 }}>
        <input
          type="email"
          className="form-input"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
        />
        <input
          type="tel"
          className="form-input"
          placeholder="Phone (optional)"
          value={form.phone}
          onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
        />
        <textarea
          className="form-input"
          placeholder="Describe your issue or question..."
          value={form.message}
          onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
          rows={5}
          style={{ resize: "vertical" }}
        />
      </div>

      {status === "success" ? (
        <p style={{ marginTop: 10, marginBottom: 0, color: "var(--color-success, #5bd089)", fontSize: 13 }}>
          Got it! We will be in touch shortly.
        </p>
      ) : null}
      {status === "error" ? (
        <p style={{ marginTop: 10, marginBottom: 0, color: "var(--color-danger, #ff7a7a)", fontSize: 13 }}>
          {errorText || "Something went wrong. Try again."}
        </p>
      ) : null}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 }}>
        <button
          type="button"
          onClick={onClose}
          disabled={status === "loading"}
          style={{ minHeight: 40, padding: "8px 14px" }}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn-teal"
          onClick={handleSubmit}
          disabled={status === "loading" || status === "success"}
          style={{ minHeight: 40, padding: "8px 14px" }}
        >
          {status === "loading" ? "Sending..." : "Submit"}
        </button>
      </div>
    </Modal>
  );
}
