import { openPublicMemberProfile } from "../lib/openPublicProfile.js";

/**
 * Segment text into plain, `#tag`, and `@handle` tokens in a single regex pass.
 *
 * Both token types require the first character to be a letter.
 * Handles allow letters, digits, underscores, and hyphens (max 50 chars).
 * Hashtags allow letters and digits only (max 50 chars).
 *
 * @param {string} text
 * @returns {{ type: 'text' | 'tag' | 'mention'; value: string }[]}
 */
export function segmentText(text) {
  const s = typeof text === "string" ? text : "";
  if (!s) return [];
  const re = /(?:#([a-zA-Z][a-zA-Z0-9_]{0,49}))|(?:@([a-zA-Z][a-zA-Z0-9_-]{0,49}))/g;
  const out = [];
  let last = 0;
  let m;
  while ((m = re.exec(s)) !== null) {
    const start = m.index;
    if (start > last) out.push({ type: "text", value: s.slice(last, start) });
    if (m[1] !== undefined) {
      out.push({ type: "tag", value: m[1] });
    } else {
      out.push({ type: "mention", value: m[2] });
    }
    last = start + m[0].length;
  }
  if (last < s.length) out.push({ type: "text", value: s.slice(last) });
  return out;
}

/** @deprecated Use `segmentText` — kept for backward compatibility with existing imports. */
export const segmentTextWithHashtags = segmentText;

/**
 * Renders comment/caption text with tappable `#hashtag` and `@handle` tokens.
 *
 * Hashtags: `var(--color-text-info, #38bdf8)` per DESIGN.md.
 * Mentions: `var(--color-accent)` per DESIGN.md.
 *
 * Mention default navigation calls `openPublicMemberProfile()` (SPA overlay,
 * `/profile/{handle}`). Pass `onMentionNavigate` to override.
 * Hashtag default navigation is `window.location.assign('/explore/hashtag/...')`.
 * Pass `onHashtagNavigate` to override.
 *
 * @param {{
 *   text: string;
 *   onHashtagNavigate?: (tag: string) => void;
 *   onMentionNavigate?: (handle: string) => void;
 * }} props
 */
export function HashtagText({ text, onHashtagNavigate, onMentionNavigate }) {
  const segments = segmentText(text);
  if (segments.length === 0) {
    return text ? <span>{text}</span> : null;
  }

  const goTag = (tag) => {
    const t = String(tag ?? "").trim().toLowerCase();
    if (!t) return;
    if (typeof onHashtagNavigate === "function") {
      try {
        onHashtagNavigate(t);
        return;
      } catch {
        /* fall through */
      }
    }
    try {
      window.location.assign(`/explore/hashtag/${encodeURIComponent(t)}`);
    } catch {
      /* ignore */
    }
  };

  const goMention = (handle) => {
    const h = String(handle ?? "").trim().toLowerCase();
    if (!h) return;
    if (typeof onMentionNavigate === "function") {
      try {
        onMentionNavigate(h);
        return;
      } catch {
        /* fall through */
      }
    }
    openPublicMemberProfile(h);
  };

  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === "text") {
          return <span key={`t-${i}`}>{seg.value}</span>;
        }

        if (seg.type === "tag") {
          const lower = seg.value.toLowerCase();
          return (
            <span
              key={`h-${i}-${lower}`}
              role="link"
              tabIndex={0}
              onClick={() => goTag(lower)}
              onKeyDown={(e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                goTag(lower);
              }}
              style={{
                color: "var(--color-text-info, #38bdf8)",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              #{seg.value}
            </span>
          );
        }

        const lower = seg.value.toLowerCase();
        return (
          <span
            key={`m-${i}-${lower}`}
            role="link"
            tabIndex={0}
            onClick={() => goMention(lower)}
            onKeyDown={(e) => {
              if (e.key !== "Enter" && e.key !== " ") return;
              e.preventDefault();
              goMention(lower);
            }}
            style={{
              color: "var(--color-accent)",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            @{seg.value}
          </span>
        );
      })}
    </>
  );
}
