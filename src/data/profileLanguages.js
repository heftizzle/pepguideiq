/** BCP 47 tags stored in member_profiles.language (worker-validated subset). */
export const PROFILE_LANGUAGE_OPTIONS = [
  { tag: "en", english: "English", native: "English" },
  { tag: "es", english: "Spanish", native: "Español" },
  { tag: "pt-BR", english: "Portuguese", native: "Português" },
  { tag: "fr", english: "French", native: "Français" },
  { tag: "de", english: "German", native: "Deutsch" },
  { tag: "ja", english: "Japanese", native: "日本語" },
  { tag: "zh-Hans", english: "Mandarin", native: "简体中文" },
];

export function formatLanguageOptionLabel(opt) {
  if (!opt) return "";
  if (opt.tag === "en" || opt.english === opt.native) return opt.english;
  return `${opt.english} / ${opt.native}`;
}
