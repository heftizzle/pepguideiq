/**
 * Split caption text into plain segments and `#tags` (letters/digits/underscore after `#`).
 * @param {string} text
 * @returns {{ type: 'text' | 'tag'; value: string }[]}
 */
export function segmentTextWithHashtags(text) {
  const s = typeof text === "string" ? text : "";
  if (!s) return [];
  const re = /#([a-zA-Z][a-zA-Z0-9_]{0,49})/g;
  const out = [];
  let last = 0;
  let m;
  while ((m = re.exec(s)) !== null) {
    const start = m.index;
    if (start > last) {
      out.push({ type: "text", value: s.slice(last, start) });
    }
    out.push({ type: "tag", value: m[1] });
    last = start + m[0].length;
  }
  if (last < s.length) {
    out.push({ type: "text", value: s.slice(last) });
  }
  return out;
}

/**
 * @param {{
 *   text: string;
 *   onHashtagNavigate?: (tag: string) => void;
 * }} props
 */
export function HashtagText({ text, onHashtagNavigate }) {
  const segments = segmentTextWithHashtags(text);
  if (segments.length === 0) {
    return text ? <span>{text}</span> : null;
  }

  const go = (tag) => {
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

  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === "text") {
          return <span key={`t-${i}`}>{seg.value}</span>;
        }
        const lower = seg.value.toLowerCase();
        return (
          <span
            key={`h-${i}-${lower}`}
            role="link"
            tabIndex={0}
            onClick={() => go(lower)}
            onKeyDown={(e) => {
              if (e.key !== "Enter" && e.key !== " ") return;
              e.preventDefault();
              go(lower);
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
      })}
    </>
  );
}
