import { useId } from "react";
import { publicSocialLinksFromProfile } from "../lib/socialProfileLinks.js";

/**
 * @param {{ name: string, gradientId: string }} props
 */
function BrandIcon({ name, gradientId }) {
  const common = { width: 22, height: 22, viewBox: "0 0 24 24", "aria-hidden": true };
  switch (name) {
    case "instagram":
      return (
        <svg {...common}>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f58529" />
              <stop offset="50%" stopColor="#dd2a7b" />
              <stop offset="100%" stopColor="#8134af" />
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="20" height="20" rx="5" fill={`url(#${gradientId})`} />
          <circle cx="12" cy="12" r="4.25" fill="none" stroke="#ffffff" strokeWidth="1.35" />
          <circle cx="17.4" cy="6.6" r="1.25" fill="#ffffff" />
        </svg>
      );
    case "tiktok": {
      const td =
        "M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z";
      return (
        <svg {...common}>
          <path fill="#25F4EE" transform="translate(-0.2,-0.2)" d={td} />
          <path fill="#FE2C55" transform="translate(0.2,0.2)" d={td} />
        </svg>
      );
    }
    case "facebook":
      return (
        <svg {...common}>
          <path
            fill="#1877F2"
            d="M22 12.06C22 6.49 17.52 2 12 2S2 6.49 2 12.06C2 17.06 5.66 21.4 10.44 22v-7.07H7.9v-2.93h2.54V9.41c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.93h-2.34V22C18.34 21.4 22 17.06 22 12.06z"
          />
        </svg>
      );
    case "snapchat":
      return (
        <svg {...common}>
          <path
            fill="#FFFC00"
            stroke="#000000"
            strokeWidth="0.35"
            d="M12.02 2.2c2.35 0 4.25 1.65 4.25 3.68 0 .42.08.82.22 1.18.45 1.1 1.55 1.88 2.85 2.02.12.35.18.72.18 1.1 0 1.15-.75 2.12-1.78 2.45.05.35.08.7.08 1.06 0 2.45-2.35 4.43-5.8 4.43s-5.8-1.98-5.8-4.43c0-.36.03-.71.08-1.06-1.03-.33-1.78-1.3-1.78-2.45 0-.38.06-.75.18-1.1 1.3-.14 2.4-.92 2.85-2.02.14-.36.22-.76.22-1.18 0-2.03 1.9-3.68 4.25-3.68z"
          />
        </svg>
      );
    case "linkedin":
      return (
        <svg {...common}>
          <path
            fill="#0A66C2"
            d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.96v5.65H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.35-1.85 3.59 0 4.25 2.36 4.25 5.43v6.31zM5.34 7.43a2.06 2.06 0 112.06-2.06 2.06 2.06 0 01-2.06 2.06zM3.56 20.45h3.56V9H3.56v11.45z"
          />
        </svg>
      );
    case "x":
      return (
        <svg {...common}>
          <path
            fill="var(--color-text-primary)"
            d="M18.22 3h3.22l-7.04 8.04L22.5 21h-6.44l-5.04-6.6L5.1 21H1.86l7.53-8.6L1.5 3h6.6l4.56 6.05L18.22 3zm-1.13 16.2h1.79L7.94 4.73H6.04l11.05 14.47z"
          />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common}>
          <path
            fill="#FF0000"
            d="M23.5 7.5s-.23-1.64-.94-2.36c-.9-.94-1.9-.95-2.36-1-3.3-.24-8.2-.24-8.2-.24h-.01s-4.9 0-8.2.24c-.46.05-1.46.06-2.36 1C.73 5.86.5 7.5.5 7.5S.27 9.36.27 11.22v1.7c0 1.86.23 3.72.23 3.72s.23 1.64.94 2.36c.9.94 2.08.91 2.61 1 1.9.18 8.05.23 8.05.23s4.9-.01 8.2-.25c.46-.05 1.46-.06 2.36-1 .71-.72.94-2.36.94-2.36s.23-1.86.23-3.72v-1.7c0-1.86-.23-3.72-.23-3.72zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"
          />
        </svg>
      );
    case "rumble":
      return (
        <svg {...common}>
          <rect x="2.5" y="2.5" width="19" height="19" rx="4.5" fill="#85C742" />
          <path fill="#0f0f0f" d="M9.2 7.8h2.4l3.2 5.35V7.8H17v8.4h-2.25L11.5 10.7v5.5H9.2V7.8z" />
        </svg>
      );
    default:
      return null;
  }
}

/**
 * Clickable brand icons for public member profile.
 * @param {{ profile: Record<string, unknown> | null }} props
 */
export function MemberProfileSocialIconRow({ profile }) {
  const gid = useId().replace(/:/g, "");
  const links = profile ? publicSocialLinksFromProfile(profile) : [];
  if (links.length === 0) return null;
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 14,
        marginBottom: 20,
      }}
    >
      {links.map(({ key, url, label, icon }) => (
        <a
          key={key}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${label} (opens in new tab)`}
          title={label}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 0,
            opacity: 0.92,
            transition: "opacity 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "0.92";
          }}
        >
          <BrandIcon name={icon} gradientId={`ig-${gid}`} />
        </a>
      ))}
    </div>
  );
}
