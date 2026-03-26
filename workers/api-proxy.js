/**
 * Cloudflare Worker: proxies Anthropic Messages API so the API key never ships to the browser.
 *
 * Secret: wrangler secret put ANTHROPIC_API_KEY
 * Route: POST /v1/chat — body JSON { system?, messages, model?, max_tokens? }
 * Response: JSON { text } (plain assistant string) on success.
 */

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function normalizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages.map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content:
      typeof m.content === "string"
        ? m.content
        : Array.isArray(m.content)
          ? m.content
          : String(m.content ?? ""),
  }));
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }

    const url = new URL(request.url);
    if (url.pathname !== "/v1/chat" || request.method !== "POST") {
      return new Response("Not found", { status: 404, headers: CORS });
    }

    const key = env.ANTHROPIC_API_KEY;
    if (!key) {
      return jsonResponse({ error: "ANTHROPIC_API_KEY is not set on the Worker" }, 500);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const payload = {
      model: body.model || "claude-sonnet-4-20250514",
      max_tokens: body.max_tokens ?? 1024,
      messages: normalizeMessages(body.messages),
    };
    if (body.system && typeof body.system === "string") {
      payload.system = body.system;
    }

    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return jsonResponse(
        { error: data.error?.message || data.error || `Anthropic error (${res.status})` },
        res.status >= 400 && res.status < 600 ? res.status : 502
      );
    }

    const block = Array.isArray(data.content)
      ? data.content.find((c) => c.type === "text")
      : null;
    const text = block?.text ?? "";

    return jsonResponse({ text, id: data.id, role: "assistant" });
  },
};
