/**
 * pepguideIQ z-index scale
 *
 * Reference map — named layers for all global stacking contexts.
 * When adding a new overlay, pick the nearest named layer and go +1
 * rather than guessing a new magic number.
 *
 * Three existing named constants live in their own files and are
 * not duplicated here:
 *   NOTIFICATIONS_DROPDOWN_Z_INDEX  — NotificationsBell.jsx
 *   Z_INDEX                         — DeleteUndoToast.jsx
 *   OVERLAY_Z                       — TutorialSpotlight.jsx, GuideSpotlight.jsx
 *
 * Local stacking (1–4 inside a single component) is intentionally
 * excluded — those are not global concerns.
 */
export const Z = {
  appHeader:          10,         // App.jsx top header strip (.grid-bg)
  legalNav:           20,         // LegalPage sticky section nav
  tutorialBar:        39,         // TutorialChrome bar + backdrop
  appContent:         40,         // App.jsx main content layer
  profileSwitcher:    45,         // ProfileSwitcher dropdown
  tutorialHighlight:  50,         // TutorialChrome top highlight strip
  takeover:           70,         // App.jsx fullscreen takeover base
  takeoverClose:      72,         // guide-takeover-close buttons (App, PeopleSearch, PublicMemberProfile)
  navTooltip:         100,        // NavTooltips, App.jsx nav
  fab:                199,        // DoseLogFAB floating action button
  modalBackdrop:      200,        // Modal.jsx backdrop
  networkSheet:       205,        // PostDoseNetworkSheet
  protocolDropdown:   210,        // ProtocolTab compound dropdown
  postComposerSheet:  220,        // PostItComposer sheet layer
  librarySearch:      221,        // LibraryMobileSearch overlay
  postComposerTop:    230,        // PostItComposer top chrome
  tutorialModal:      1000,       // PostTutorialProfileModal
  imageViewer:        5000,       // ProfileTab full-screen image viewer
  lightbox:           9000,       // PublicProfilePhotoGrid lightbox backdrop
  lightboxContent:    9001,       // PublicProfilePhotoGrid lightbox content
  contextMenu:        9200,       // CommentMenuButton, PostMenuButton context menus
  ageGate:            2147483000, // AgeGate — must render above everything on Android Chrome
};
