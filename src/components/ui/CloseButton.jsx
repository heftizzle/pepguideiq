/**
 * CloseButton — unified dismiss affordance for pepguideIQ
 *
 * Variants
 *   modal-accent  Default dialog chrome — compact bordered control for modal headers
 *   ghost         Transparent / minimal (peptide detail sheet, UpgradePlan)
 *   toolbar       ~44×44 tap target (LibraryMobileSearch chip, TutorialChrome dismiss)
 *   floating      Lightbox circle; caller may pass additional style for isDark edge cases
 *
 * Takeover layers (AI Atlas, PeopleSearch, PublicMemberProfile) — NO variant.
 * Pass className="guide-takeover-close" directly so GlobalStyles stay untouched:
 *   <CloseButton onClose={onClose} className="guide-takeover-close" style={{ zIndex: 72 }} />
 *
 * Excluded from scope: destructive ✕ (SavedStackEntryRow, VialTracker, BuildTab delete,
 * HandleSetup status glyph) — those are semantic actions, not dismiss controls.
 */

import React from "react";
import { CLOSE_SIZES } from "../../lib/closeButtonSizes.js";

const BASE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  border: "none",
  background: "none",
  padding: 0,
  lineHeight: 1,
  flexShrink: 0,
  transition: "background 0.15s ease, color 0.15s ease, opacity 0.15s ease",
};

const VARIANTS = {
  /** Bordered header control for modal chrome */
  "modal-accent": {
    width: CLOSE_SIZES.modal,
    height: CLOSE_SIZES.modal,
    padding: 8,
    boxSizing: "border-box",
    minWidth: CLOSE_SIZES.modal,
    minHeight: CLOSE_SIZES.modal,
    borderRadius: 8,
    border: "1px solid color-mix(in srgb, var(--color-text-secondary) 35%, transparent)",
    background: "color-mix(in srgb, var(--color-text-secondary) 8%, transparent)",
    color: "var(--color-text-secondary)",
    fontSize: 12,
    "--hover-bg": "color-mix(in srgb, var(--color-text-secondary) 16%, transparent)",
    "--hover-color": "var(--color-text-primary)",
  },

  /** Transparent / minimal — peptide detail sheet, UpgradePlan ghost */
  ghost: {
    width: 32,
    height: 32,
    minWidth: 32,
    minHeight: 32,
    borderRadius: 8,
    border: "none",
    background: "transparent",
    color: "var(--color-text-secondary)",
    fontSize: 15,
    opacity: 0.7,
    "--hover-bg": "transparent",
    "--hover-color": "var(--color-text-primary)",
    "--hover-opacity": 1,
  },

  /** Large tap target for row / bar controls */
  toolbar: {
    width: 44,
    height: 44,
    minWidth: 44,
    minHeight: 44,
    borderRadius: 8,
    border: "none",
    background: "transparent",
    color: "var(--color-text-secondary)",
    fontSize: 17,
    "--hover-bg": "var(--color-bg-hover)",
    "--hover-color": "var(--color-text-primary)",
  },

  /**
   * Lightbox circle — dark or light surface.
   * Caller may pass additional style props (e.g. border color) for isDark branching.
   */
  floating: {
    width: 40,
    height: 40,
    minWidth: 40,
    minHeight: 40,
    borderRadius: "50%",
    border: "1.5px solid var(--color-border-default)",
    background: "var(--color-bg-card)",
    color: "var(--color-text-primary)",
    fontSize: 16,
    boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
    "--hover-bg": "var(--color-bg-hover)",
    "--hover-color": "var(--color-text-primary)",
  },
};

/**
 * @param {object}   props
 * @param {function} props.onClose               Required — called on click
 * @param {string}  [props.ariaLabel]            Default "Close"
 * @param {string}  [props.variant]             "modal-accent" | "ghost" | "toolbar" | "floating"
 * @param {object}  [props.style]               Merged last — caller wins on conflicts
 * @param {string}  [props.className]           Pass "guide-takeover-close" for takeover layers
 * @param {boolean} [props.stopPropagationOnClick] When true, call stopPropagation before onClose (e.g. takeover root backdrop)
 */
export function CloseButton({
  onClose,
  ariaLabel = "Close",
  variant = "modal-accent",
  style,
  className,
  stopPropagationOnClick = false,
}) {
  const [hovered, setHovered] = React.useState(false);

  /** When className is set (e.g. guide-takeover-close), omit BASE so GlobalStyles aren't overridden */
  const variantStyle = className ? {} : (VARIANTS[variant] ?? VARIANTS["modal-accent"]);

  const {
    "--hover-bg": hoverBg,
    "--hover-color": hoverColor,
    "--hover-opacity": hoverOpacity,
    ...domVariantStyle
  } = variantStyle;

  const hoverOverride = hovered
    ? {
        ...(hoverBg !== undefined && { background: hoverBg }),
        ...(hoverColor !== undefined && { color: hoverColor }),
        ...(hoverOpacity !== undefined && { opacity: Number(hoverOpacity) }),
      }
    : {};

  const composedStyle = {
    ...(className ? {} : BASE),
    ...domVariantStyle,
    ...hoverOverride,
    ...style,
  };

  const handleClick = (e) => {
    if (stopPropagationOnClick) e.stopPropagation();
    onClose();
  };

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={className}
      style={composedStyle}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      ✕
    </button>
  );
}

export default CloseButton;
