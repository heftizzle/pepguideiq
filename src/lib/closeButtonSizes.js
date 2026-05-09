/**
 * pepguideIQ — unified ✕ dismiss control sizes
 *
 * All close/dismiss buttons reference these constants.
 * To resize a family app-wide, change the value here only.
 *
 * modal     — CloseButton variant="modal-accent" (Modal.jsx chrome)
 * takeover  — .guide-takeover-close (AI Atlas, PeopleSearch,
 *              PublicMemberProfile) — CSS only, cannot import JS;
 *              keep in sync manually when changing this value.
 * danger    — BuildTab compound remove (btn-red family, red border)
 * glyphOnly — font-size for className-only raw glyph controls
 *              (HamburgerMenu pepv-hamburger-drawer__close)
 *
 * Note: VialTracker dose-delete ✕ buttons are intentionally excluded —
 * they are compact inline chips, not dismiss controls.
 */
export const CLOSE_SIZES = {
  modal:     28,
  takeover:  32,
  danger:    28,
  glyphOnly: 16,
};
