/** Batch 13 — Insulin landscape completion (2 entries).
 *
 *  Entries: Insulin Detemir · Insulin Degludec
 *
 *  Detemir framing: Levemir was discontinued in the US December 31, 2024
 *  (Novo Nordisk, citing global manufacturing constraints + formulary
 *  losses). No biosimilar exists. UK supplies expected depleted by
 *  December 2026. This entry is primarily reference / historical with
 *  transition guidance to Glargine or Degludec — but it belongs in the
 *  catalog because users with stockpiled supply, international access,
 *  or post-transition reference needs still encounter Levemir.
 *
 *  Degludec framing: ultra-long peakless basal, lowest nocturnal hypo
 *  rate of the basal class, flexible dosing window. Pricier than
 *  Glargine but with clinical advantages.
 *
 *  Same framing principles as BATCH12: diabetic clinical primary,
 *  performance-use harm-reduction secondary (minimal for both — peakless
 *  basals aren't used for performance), "how to take less" central,
 *  hypoglycemia rescue protocol baked in.
 *
 *  Schema matches BATCH7-12. Average ≥800w/entry.
 */
export const BATCH13 = [
  {
    id: "insulin-detemir",
    name: "Insulin Detemir",
    aliases: ["Levemir", "Detemir", "Levemir FlexTouch", "Long-acting insulin analog (myristic-acid-bound)"],
    category: ["Diabetes Management", "Hormone Replacement", "Discontinued (US)"],
    categories: ["Diabetes Management", "Hormone Replacement", "Discontinued (US)"],
    route: ["subcutaneous injection"],
    mechanism:
      "Long-acting insulin analog. Engineered via two modifications: threonine at position B30 removed, plus myristic acid (a 14-carbon saturated fatty acid) attached to lysine at B29 via a gamma-glutamic acid spacer. The fatty acid produces albumin binding both in the subcutaneous depot AND in plasma — a two-stage albumin tethering that slows distribution and extends action duration. Onset 1–2 hours, mild peak at 6–8 hours (less pronounced than NPH but more present than Glargine — Detemir is NOT truly peakless), duration 12–24 hours that is heavily DOSE-DEPENDENT. At typical T2D doses (~20–40 units), action often only lasts 12–16 hours requiring BID administration. At higher doses, action extends toward 24 hours enabling once-daily dosing. This dose-dependent duration is the major operational difference from Glargine (consistently 24h-once-daily across dose ranges) and was a persistent clinical disadvantage. **CRITICAL STATUS UPDATE:** Novo Nordisk announced US discontinuation of Levemir in November 2023, citing global manufacturing constraints, formulary losses, and the availability of alternative options. FlexPens were discontinued April 2024; vials fully discontinued December 31, 2024. No biosimilar exists or is in development. Limited international supply remains in some markets but Canadian and UK supplies are expected depleted by end of 2026. This entry is included for reference, transition guidance, and users with stockpiled supply or international access — it is no longer an actively prescribable insulin in the US.",
    halfLife: "Plasma half-life ~5–7 hours; clinical action 12–24 hours (dose-dependent)",
    reconstitution: { solvent: "Pre-formulated, no reconstitution. Clear solution.", typicalVialMg: null, typicalVolumeMl: 10 },
    dosingRange: { low: "10–20 units once daily (low T2D)", medium: "20–40 units BID (typical adult requiring twice-daily coverage)", high: ">60 units once daily or split BID", frequency: "Once daily at higher doses; BID typical at lower doses (the dose-dependent duration limitation)" },
    typicalDose: "Highly individualized. Most users required BID dosing (AM + PM) due to incomplete 24-hour coverage at typical doses.",
    startDose: "T2D historical initiation: 0.1–0.2 units/kg PM × 3 days, titrate based on fasting BG",
    titrationNote: "Titration was fasting-BG-driven for AM dose, pre-bedtime BG-driven for PM dose if running BID. With discontinuation, the relevant clinical task is now TRANSITION rather than titration — see notes below.",
    cycle: "N/A — discontinued in US. Users with remaining supply are advised to coordinate transition with prescriber before supply runs out.",
    storage: "Unopened: refrigerate 2–8°C until expiration. In-use pen/vial: room temperature up to 42 days. Do not freeze. Stockpiled supply: monitor expiration carefully — quality degrades past expiration even with proper storage.",
    benefits: [
      "Historical: only long-acting analog with extensive pregnancy data and pregnancy approval — was the preferred long-acting basal for diabetic pregnancy management for many years",
      "Slightly less weight gain than Glargine in some head-to-head studies (~0.5–1 kg difference)",
      "Lower nocturnal hypoglycemia rate vs. NPH",
      "Albumin-binding mechanism produces hepatic-selective insulin action (relative liver vs peripheral preference) — proposed as the mechanism behind reduced weight gain",
      "All benefits now framed in past tense given US discontinuation — entry exists for reference and transition guidance",
    ],
    sideEffects: [
      "HYPOGLYCEMIA — same central insulin risk. Same rescue protocol (15g fast carbs, recheck 15 min, glucagon for severe).",
      "Mild peak at 6–8 hours produced moderate nocturnal hypoglycemia rate in patients dosed at bedtime",
      "Weight gain — modest, less than Glargine in some studies",
      "Injection site lipohypertrophy",
      "Local injection reactions",
      "Dose-dependent duration limitation — many users required BID dosing for 24h coverage, increasing injection burden",
    ],
    stacksWith: ["insulin-lispro", "insulin-aspart", "metformin", "semaglutide", "tirzepatide"],
    warnings: [
      "DISCONTINUED IN US AS OF DECEMBER 31, 2024 — coordinate transition to Glargine or Degludec with prescriber if you have remaining supply",
      "No biosimilar exists or is in development",
      "Stockpiled supply: monitor expiration dates carefully; do not extend use past expiration even with proper storage",
      "Active hypoglycemia — hold dose, treat hypo first",
      "Severe renal/hepatic impairment — dose adjustment historically required (now moot for new prescriptions)",
      "Pregnancy: Detemir was historically the long-acting analog with the strongest pregnancy data; with discontinuation, pregnancy management requires endocrine + OB coordination on alternative basal — Glargine has accumulated meaningful pregnancy data and is the typical replacement",
      "DO NOT mix in same syringe with other insulins",
      "International users with continued access (limited Canadian and UK supply through 2026): same standard insulin warnings apply",
    ],
    sourcingNotes:
      "DISCONTINUED IN US. As of April 2026, Levemir is essentially unavailable through US retail pharmacies. Some US patients with stockpiled supply remain on therapy through expiration. Limited Canadian supply was available through 2025 via personal-import prescription referral services — supplies expected depleted late 2026. UK supplies similar timeline. No generic, no biosimilar, no alternative manufacturer. Users currently on Detemir should work with prescriber NOW to plan transition — see transition guidance in notes.",
    notes:
      "## Transition Guidance (Primary Use Case for This Entry)\nFor users currently on Detemir transitioning to alternative basal:\n\n**Detemir → Glargine (Lantus, Basaglar, Semglee — most common transition):** Total daily dose typically reduced 20% on first transition day to avoid hypoglycemia. If was on BID Detemir, switch to once-daily Glargine PM at 80% of total daily Detemir dose. Recheck fasting BG daily for 7–10 days, titrate as needed. Most users transition smoothly within 1–2 weeks.\n\n**Detemir → Degludec (Tresiba):** Total daily dose typically transitioned at 1:1 ratio for once-daily users; BID Detemir users start Degludec at 80% of total daily dose once daily. Steady-state on Degludec takes 3–4 days — do not adjust dose more frequently than every 3–4 days during transition. CGM data is critical for safe titration given Degludec's slower onset to steady state.\n\n**Detemir → NPH (cost-driven downgrade only):** Typically 80% of total daily Detemir dose split BID. Expect higher nocturnal hypoglycemia rate; consider dinner timing adjustment. NPH is not pharmacologically equivalent — this transition is access/cost driven.\n\n**Pregnancy-specific transition:** If pregnant or planning pregnancy on Detemir, coordinate with endocrinologist + maternal-fetal medicine specialist. Glargine has accumulated meaningful pregnancy data over 20+ years and is now the typical replacement; Degludec has limited but growing pregnancy data. NPH retains its long pregnancy track record and is still used in some pregnancy protocols.\n\n## How to Take Less Insulin (Universal Frame, Still Applies)\nSame as other basal insulins: GLP-1 agonist therapy reduces or eliminates basal insulin needs in T2D; low-carb dietary patterns reduce total daily insulin requirement; weight loss + resistance training improve insulin sensitivity. Users transitioning OFF Detemir to a replacement basal can use the transition window as an opportunity to reassess whether basal insulin is still clinically required — many T2D users on Detemir for years have since become candidates for full discontinuation via GLP-1 + lifestyle.\n\n## Beginner Protocol\nN/A — Detemir is no longer being initiated as new therapy in the US. New basal insulin starts go to Glargine, Degludec, or (cost-driven) NPH.\n\n## Performance Use Discussion\nN/A — peakless basal insulins have minimal performance-community use, and discontinuation status makes this discussion academic.\n\n## Reconstitution + Administration\nPre-formulated clear solution. SubQ — abdomen, thigh, upper arm, buttock. Site rotation. Stockpiled supply: visual inspection before each dose (cloudy, discolored, or particulate solution = discard).\n\n## Synergies\nHistorically paired with Lispro/Aspart for basal/bolus regimens. Metformin for insulin sensitization. GLP-1 agonists for substantial T2D dose reduction. Same synergy framework as other basal insulins.\n\n## Evidence Quality\nFDA-approved 2005. Substantial RCT and real-world evidence base accumulated through ~20 years of clinical use. Pregnancy evidence base was particularly strong relative to other long-acting analogs.\n\n## Research vs Anecdote\nResearch: well-established clinical efficacy and safety, with the dose-dependent duration as the documented limitation. Anecdote: many long-term users genuinely preferred Detemir's mechanism (especially pregnancy users and weight-conscious T2D patients) — the discontinuation has produced documented patient frustration. The clinical reality is that Glargine and Degludec cover the same use cases adequately for nearly all users, with Degludec offering meaningful advantages (peakless, flexible timing, lower nocturnal hypoglycemia) over Detemir for users who can access it. The Detemir discontinuation is a manufacturer-driven supply decision, not a clinical inferiority decision.",
    tags: ["insulin", "Detemir", "Levemir", "long-acting", "basal", "discontinued", "T1D", "T2D", "diabetes", "transition guidance", "pregnancy"],
    tier: "entry",
  },

  {
    id: "insulin-degludec",
    name: "Insulin Degludec",
    aliases: ["Tresiba", "Degludec", "Tresiba FlexTouch", "Tresiba U-100", "Tresiba U-200", "Ultra-long-acting basal insulin"],
    category: ["Diabetes Management", "Hormone Replacement"],
    categories: ["Diabetes Management", "Hormone Replacement"],
    route: ["subcutaneous injection"],
    mechanism:
      "Ultra-long-acting insulin analog. Engineered via removal of threonine at position B30 plus attachment of hexadecanedioic acid (a 16-carbon dicarboxylic fatty acid) to lysine at B29 through a gamma-glutamic acid spacer. The unique pharmacokinetic property emerges from supramolecular self-assembly in the subcutaneous depot: in the presence of zinc and phenol (formulation excipients), Degludec monomers form dihexamers, which then assemble end-to-end into long multi-hexamer chains. Slow dissociation of monomers from chain ends produces ultra-long, truly peakless absorption — the flattest pharmacokinetic profile of any approved insulin. Onset 1–2 hours, NO peak (genuinely peakless, distinct from Glargine which has a very subtle peak), duration ~42 hours. The long half-life (~25 hours) means steady-state requires 3–4 days of consistent dosing — important titration consideration. Two concentrations available: U-100 (Tresiba 100 U/mL, standard) and U-200 (Tresiba 200 U/mL, for high-dose users — same syringe markings, smaller injection volume). The flexible-timing approval is a unique feature: Degludec can be dosed at variable times day-to-day within an 8–40 hour interval between doses, an allowance designed for shift workers, frequent travelers, and missed-dose recovery scenarios. Approved US 2015, EU 2013 — newest of the basal analogs. Position in the basal insulin landscape (post-Detemir-discontinuation): Glargine remains the workhorse first-line basal due to cost and accumulated track record; Degludec is positioned as the upgrade for users with hypoglycemia concerns, irregular schedules, or who fail Glargine due to nocturnal lows or breakthrough hyperglycemia.",
    halfLife: "Plasma half-life ~25 hours; clinical action ~42 hours; steady-state achieved at 3–4 days",
    reconstitution: { solvent: "Pre-formulated, no reconstitution. Clear solution.", typicalVialMg: null, typicalVolumeMl: 3 },
    dosingRange: { low: "10–20 units once daily (T2D starting)", medium: "20–60 units once daily (typical adult T2D maintenance)", high: ">60 units once daily; high-dose users move to U-200 formulation for smaller injection volume", frequency: "Once daily, with flexibility for variable dosing time (8–40 hour interval allowed between doses)" },
    typicalDose: "T2D starting: 0.1–0.2 units/kg once daily (10–20 units typical). Titrated based on fasting BG. T1D: ~50% of total daily insulin requirement as basal.",
    startDose: "T2D: 10 units once daily × 3 days at consistent time, then titrate +2 units every 3–4 days until fasting BG 80–130 mg/dL. T1D: per endocrinologist initiation protocol.",
    titrationNote: "**Critical: do NOT adjust dose more frequently than every 3–4 days.** Steady-state on Degludec takes 3–4 days due to long half-life — premature dose adjustments produce overshoot and erratic glycemic control. Patience is the titration discipline.",
    cycle: "Continuous lifetime therapy for T1D. T2D users frequently reduce or discontinue with weight loss + GLP-1 + lifestyle interventions.",
    storage: "Unopened pen/vial: refrigerate 2–8°C until expiration. In-use pen: room temperature up to 56 days (longest in-use stability of any basal insulin). Do not refrigerate in-use Degludec.",
    benefits: [
      "Truly peakless PK profile — flattest of any approved insulin",
      "Lowest nocturnal hypoglycemia rate in the basal class — head-to-head trials (SWITCH 1, SWITCH 2, BEGIN) demonstrated meaningful reduction vs Glargine",
      "Cardiovascular outcomes non-inferior to Glargine in T2D with high CV risk (DEVOTE trial); secondary endpoint of severe hypoglycemia favored Degludec",
      "Flexible dosing timing — 8–40 hour interval between doses is approved, allowing day-to-day variation for shift workers, travelers, and missed-dose recovery",
      "Once-daily dosing across the full dose range (no BID requirement at low doses, unlike Detemir)",
      "Longest in-use room-temperature stability (56 days) of any insulin",
      "U-200 formulation for high-dose users reduces injection volume",
      "Strong choice for users with frequent nocturnal hypoglycemia on Glargine",
      "Clean transition target from discontinued Detemir for users who valued the lower-hypoglycemia profile",
    ],
    sideEffects: [
      "HYPOGLYCEMIA — same central insulin risk, but rates lower than Glargine in head-to-head studies. Same rescue protocol (15g fast carbs, recheck 15 min, glucagon for severe).",
      "Weight gain (typical of insulin therapy)",
      "Injection site lipohypertrophy (rotate sites)",
      "Local injection reactions",
      "Slow titration response — the 3–4 day steady-state means dose changes don't manifest immediately, requiring prescriber/user patience",
      "Insulin resistance with chronic high-dose use",
    ],
    stacksWith: ["insulin-lispro", "insulin-aspart", "metformin", "semaglutide", "tirzepatide", "retatrutide"],
    warnings: [
      "Active hypoglycemia — hold dose, treat hypo first",
      "Severe renal/hepatic impairment — dose adjustment required",
      "Untrained user / no glucose monitoring — do not initiate without diabetes education",
      "Pregnancy — Category C historically; growing real-world pregnancy use post-Levemir discontinuation. Coordinate with endocrinology + maternal-fetal medicine.",
      "DO NOT mix in same syringe with other insulins",
      "Switching FROM Glargine to Degludec: typically 1:1 unit conversion; some users see modest dose reduction over time as the lower nocturnal hypoglycemia profile is established",
      "Switching FROM NPH or Detemir to Degludec: typically 80% of total daily dose to avoid hypoglycemia during transition",
      "U-100 vs U-200 confusion: same syringe marking, different volume per unit — verify formulation matches prescription before each dose",
    ],
    sourcingNotes:
      "Prescription required. Available via primary care, endocrinology, diabetes specialists. Formulary access varies — some commercial plans require Glargine failure documentation before authorizing Tresiba (cost-driven step therapy). Manufacturer assistance program: NovoCare for cost-eligible patients. 2024 US insulin pricing reforms ($35/month commercial copay caps) apply to Tresiba in most plans. Cash pricing higher than Glargine biosimilars (Basaglar, Semglee) but the gap has narrowed significantly post-2024.",
    notes:
      "## How to Take LESS Degludec (Central Frame)\nSame frame as Glargine: GLP-1 agonist therapy (semaglutide, tirzepatide, retatrutide) reduces or eliminates basal insulin needs in T2D — many T2D users on Degludec + GLP-1 combination eventually discontinue Degludec entirely. Low-carb / ketogenic dietary patterns reduce total daily insulin requirement (often 30–50% in T1D, often complete discontinuation in T2D). Weight loss of 10%+ produces meaningful insulin sensitivity improvement. Resistance training increases insulin-independent glucose uptake. Bariatric surgery in eligible T2D users frequently produces complete remission. The slow-titration character of Degludec applies to deprescribing too — don't reduce doses faster than every 3–4 days during taper.\n\n## Beginner Protocol (Diabetic Clinical)\nT2D initiation: 10 units once daily at consistent time × 3–4 days to reach steady state, then +2 units every 3–4 days based on fasting BG until target 80–130 mg/dL. Most T2D users settle 20–60 units. T1D initiation: ~50% of total daily insulin requirement as basal Degludec, paired with rapid analog (Lispro/Aspart) for prandial coverage. CGM is critical for safe titration — the slow steady-state means daily fasting BG alone gives incomplete picture early in titration.\n\n## Advanced Protocol\nFor T1D users on basal/bolus: Degludec PM (or AM — flexible) + Lispro/Aspart per meal. The flexibility window (8–40 hour interval) is genuinely useful for shift workers and travelers — exploit it without guilt. For T2D users initiating insulin: start Degludec + metformin + GLP-1 agonist combination. The GLP-1 will frequently allow dose-stable or dose-reducing Degludec over months. Avoid initiating prandial insulin in T2D until basal optimization is complete — many T2D users do not need prandial insulin at all if basal + GLP-1 + lifestyle are optimized.\n\n## Switching Between Basals — Practical Guide\n**Glargine → Degludec:** 1:1 unit conversion, same daily timing or take advantage of flexibility window. Expect modest dose reduction over 2–3 months as lower nocturnal hypoglycemia profile establishes.\n**Detemir → Degludec (post-discontinuation transition):** 80% of total daily Detemir dose, once daily. Steady-state at 3–4 days; CGM data critical.\n**NPH → Degludec:** 80% of total daily NPH dose, once daily. Significant simplification — eliminates BID dosing burden and the cloudy-suspension mixing requirement.\n\n## Performance Use Discussion\nMinimal — peakless ultra-long basal insulins are not used in performance-bodybuilding contexts because the absence of post-injection spike defeats the nutrient-driving framework that performance protocols target. Degludec specifically is rarely encountered in performance discussions. Catalog notes this for completeness only.\n\n## Reconstitution + Administration\nPre-formulated clear solution. SubQ injection — abdomen, thigh, upper arm, buttock. Site rotation. Once daily, flexible timing within 8–40 hour interval. U-100 or U-200 — verify formulation matches prescription. Pen needles 4–8mm.\n\n## Synergies\nLispro/Aspart: paired basal/bolus regimens for T1D. Metformin: insulin sensitization, often allows lower Degludec dose. GLP-1 agonists (semaglutide, tirzepatide, retatrutide): substantial basal insulin reduction in T2D, often complete discontinuation possible.\n\n## Evidence Quality\nFDA-approved 2015. Substantial RCT and real-world evidence base. DEVOTE (CV outcomes), SWITCH 1 + SWITCH 2 (hypoglycemia outcomes), BEGIN program (efficacy across T1D and T2D populations). Standard of care basal option — sometimes second-line behind Glargine due to cost, sometimes first-line for users with hypoglycemia concerns or irregular schedules.\n\n## Research vs Anecdote\nResearch: best-characterized basal insulin in the post-2015 era. Lower nocturnal hypoglycemia rate vs Glargine is robustly demonstrated. CV safety equivalent. Anecdote: T1D community experience overwhelmingly positive, particularly for users with prior nocturnal hypoglycemia issues on Glargine or NPH. The flexibility window is genuinely valuable for irregular-schedule users (shift workers, frequent travelers). Cost gap vs Glargine has narrowed post-2024 pricing reforms but Glargine biosimilars remain the cheapest basal option. Decision frame: Glargine first-line for cost-sensitive users; Degludec first-line for users with hypoglycemia concerns or irregular schedules; Degludec is also the cleanest transition target from discontinued Detemir for users who valued the lower-hypoglycemia profile.",
    tags: ["insulin", "Degludec", "Tresiba", "ultra-long-acting", "basal", "peakless", "flexible dosing", "T1D", "T2D", "diabetes", "DEVOTE", "low nocturnal hypoglycemia"],
    tier: "entry",
  },
];