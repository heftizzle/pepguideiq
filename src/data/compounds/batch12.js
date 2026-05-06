/** Batch 12 — Insulin (5 types).
 *
 *  Entries: Insulin Lispro · Insulin Aspart · Regular Insulin · Insulin Glargine · NPH Insulin
 *
 *  Framing principles (locked with founder, Apr 2026):
 *    1. Diabetic clinical context PRIMARY — these are critical medications
 *       millions of people live on. The catalog should help them.
 *    2. Performance-community education SECONDARY and harm-reduction-focused.
 *       We do NOT provide bodybuilder dosing protocols. We DO discuss why
 *       performance use has a poor risk-reward ratio (mortality, obligate fat
 *       gain, insulin resistance).
 *    3. "How to take LESS insulin" is the central frame across all 5 entries.
 *       For T2D — GLP-1 agonists, low-carb dietary patterns, weight loss,
 *       resistance training. For T1D — CGM-driven tight control + low-carb
 *       patterns reduce total daily insulin 20–50% in many users.
 *    4. Hypoglycemia recognition + rescue protocol is standard diabetes
 *       education and belongs in every insulin tile — not abuse enabling,
 *       genuine medical safety.
 *
 *  Schema matches BATCH7-11. Average ≥800w/entry. Brand names in aliases
 *  (Humalog, Novolog, Lantus etc.) — same FDA-approved-drug-naming policy
 *  as BATCH11 (regulated drugs are searched by brand).
 */
export const BATCH12 = [
  {
    id: "insulin-lispro",
    name: "Insulin Lispro",
    aliases: ["Humalog", "Lyumjev", "Admelog", "Lispro", "Rapid-acting insulin analog"],
    category: ["GLP / Metabolic", "Anabolics / HRT", "Diabetes Management"],
    categories: ["GLP / Metabolic", "Anabolics / HRT", "Diabetes Management"],
    route: ["subcutaneous injection", "IV (clinical only)", "insulin pump"],
    mechanism:
      "Rapid-acting recombinant insulin analog. Engineered by reversing the proline-lysine sequence at positions B28-B29 of the human insulin B-chain, destabilizing hexamer formation in the subcutaneous depot — accelerating monomer dissociation and systemic absorption. Onset 5–15 minutes, peak 30–90 minutes, duration 3–5 hours. Mimics the natural prandial insulin spike substantially better than older Regular insulin. Insulin in general activates insulin receptor tyrosine kinase, triggering GLUT4 translocation in muscle and adipose tissue (driving glucose uptake), suppressing hepatic gluconeogenesis, activating lipogenesis in adipose tissue, and stimulating protein synthesis. The activity-everywhere-insulin-binds quality matters for performance-use discussion: insulin's lipogenic effect is NOT selective for muscle — it activates fat storage simultaneously with muscle glucose uptake, which is the mechanism behind the obligate fat-gain side effect of bodybuilding insulin protocols. Lispro is the most-prescribed prandial insulin analog in the US. Lyumjev is an ultra-rapid Lispro formulation (faster onset via excipient changes — niacinamide and treprostinil). Admelog is the FDA-approved biosimilar.",
    halfLife: "Plasma ~1 hour; clinical action 3–5 hours",
    reconstitution: { solvent: "Pre-formulated, no reconstitution", typicalVialMg: null, typicalVolumeMl: 10 },
    dosingRange: { low: "Highly individual — see notes", medium: "Highly individual — see notes", high: "Highly individual — see notes", frequency: "Pre-meal (10–15 min before) plus correction doses for hyperglycemia" },
    typicalDose: "Diabetic dosing is fully individualized. Framework: insulin-to-carb ratio (I:C) typically 1:5 to 1:15 (1 unit per 5–15g carbs); insulin sensitivity factor (ISF) typically 1:30 to 1:100 (1 unit drops BG 30–100 mg/dL). Both ratios are determined empirically with CGM data and adjusted with endocrinologist or CDE.",
    startDose: "Initial dosing must be set by prescriber. T1D users typically start with conservative I:C 1:15 + ISF 1:50 and titrate based on CGM data over 2–4 weeks.",
    titrationNote: "Titration is CGM-driven and ratio-based, not dose-based. Adjustments to I:C and ISF should be done with prescriber/CDE oversight, especially in the first 6 months of therapy.",
    cycle: "Continuous lifetime therapy for T1D. T2D users on insulin may reduce or discontinue with successful weight loss + GLP-1 agonist therapy + dietary intervention — see 'how to take less' below.",
    storage: "Unopened vials/pens: refrigerate 2–8°C until expiration. In-use vial/pen: room temperature up to 28 days (Humalog) — discard after that even if remaining.",
    benefits: [
      "Substantially better postprandial glucose control than Regular insulin in T1D and T2D",
      "Faster onset allows pre-meal injection 10–15 minutes before eating (vs 30+ for Regular)",
      "Standard component of insulin pump therapy",
      "Critical tool for tight glycemic control — reduces long-term diabetic complication risk (retinopathy, nephropathy, neuropathy, cardiovascular events)",
      "Lower hypoglycemia rate than Regular insulin in most clinical comparisons",
    ],
    sideEffects: [
      "HYPOGLYCEMIA — the central, life-threatening risk. Symptoms: shakiness, sweating, confusion, dizziness, hunger, palpitations, anxiety, irritability. Severe hypo: seizures, coma, death.",
      "Hypoglycemia rescue protocol: 15g fast-acting carbs (4oz juice, glucose tabs, 4oz regular soda — NOT diet), recheck BG in 15 min, repeat if still <70 mg/dL. Severe hypo with altered consciousness: glucagon (nasal Baqsimi or injectable Gvoke/Zegalogue), call 911.",
      "Weight gain — common, related to anabolic effect + correction of glucosuria-driven calorie loss",
      "Injection site lipohypertrophy (rotate sites)",
      "Local injection reactions (mild)",
      "Hypokalemia (severe insulin doses can shift potassium intracellularly — relevant in DKA management and very high doses)",
      "Insulin resistance with chronic high-dose use",
    ],
    stacksWith: ["insulin-glargine", "metformin", "semaglutide", "tirzepatide", "retatrutide"],
    warnings: [
      "Active hypoglycemia — hold dose, treat hypo first",
      "Severe renal impairment — insulin clearance reduced, dose reduction often needed (though insulin-dependent diabetics still need insulin; the dose ratios shift)",
      "Severe hepatic impairment — gluconeogenesis impaired, hypoglycemia risk increases",
      "Untrained user / no CGM / no diabetes education — DO NOT initiate insulin therapy without diabetes education program (CDE/CDCES involvement) and CGM access",
      "Pregnancy — Category B, used widely in pregnancy with endocrine coordination",
      "Driving with active insulin on board and hypoglycemia symptoms — pull over, treat, do NOT continue driving until BG >90 mg/dL and symptoms cleared",
      "PERFORMANCE / BODYBUILDING USE: documented mortality from hypoglycemia in competitive bodybuilders. Risk-reward ratio is genuinely poor (see Research vs Anecdote section). This catalog does not provide performance-use dosing protocols.",
    ],
    sourcingNotes:
      "Prescription required in all US states. Available via primary care, endocrinology, diabetes specialist clinics. US insulin pricing has improved substantially as of 2024 — most commercial plans cap insulin at $35/month copay; manufacturer assistance programs (Lilly Insulin Value Program, Novo Nordisk MyInsulinRx) provide low-cost or free insulin to qualifying users. Generic / biosimilar versions (Admelog) reduce cash-pay cost. CGM (Dexcom G7, Libre 3) coverage is improving; for any insulin user, CGM access dramatically improves safety and outcomes — push for it through prescriber.",
    notes:
      "## How to Take LESS Lispro (Central Frame)\nFor T2D users on prandial Lispro: aggressive lifestyle intervention can dramatically reduce or eliminate prandial insulin needs. Pathways: (1) GLP-1 agonist therapy (semaglutide 1–2.4mg weekly, tirzepatide 5–15mg weekly, retatrutide 4–12mg weekly in trials) reduces postprandial glucose excursions and improves beta-cell function, often eliminating need for prandial insulin; (2) low-carb / ketogenic dietary patterns reduce postprandial glucose load — many T2D users on Lispro can discontinue entirely with sustained low-carb (under 50g carbs/day); (3) weight loss of 10–15% body weight produces substantial insulin sensitivity improvement; (4) resistance training increases muscle GLUT4 expression and insulin-independent glucose uptake. Coordinate dose reductions with prescriber — CGM data is essential for safe deprescribing. For T1D users: insulin is required (autoimmune destruction of beta cells means endogenous insulin production is absent), but total daily insulin can be reduced 20–50% via low-carb dietary patterns. The Bernstein protocol, while controversial, has produced documented HbA1c improvements with reduced total insulin in highly motivated T1D users. CGM-driven tight control + minimized dietary glucose load is the path.\n\n## Beginner Protocol (Diabetic Clinical)\nFor new T1D diagnoses: hospital initiation with endocrinologist + diabetes educator. Initial daily insulin: 0.5–0.7 units/kg total, split ~50% basal (Glargine) + 50% prandial (Lispro). Carb counting education (CDE/CDCES). CGM placement before discharge if possible. Hypoglycemia recognition + glucagon training for patient + family. Outpatient follow-up at 1 week, 1 month, 3 months for ratio adjustments.\n\n## Performance Use Discussion (Educational, Not Prescriptive)\nBodybuilding insulin protocols typically use 5–15 IU Lispro post-workout to drive nutrients into muscle. The mechanism does function — insulin drives glucose and amino acid uptake into muscle cells. The reasons this is a bad bet: (1) hypoglycemia mortality is real — multiple deaths documented in competitive bodybuilding, including IFBB pros; (2) insulin's lipogenic action is NOT muscle-selective — fat storage activates simultaneously with muscle glucose uptake, creating obligate fat gain; (3) chronic exogenous insulin produces insulin resistance, paradoxically worsening body composition long-term; (4) modern alternatives (proper protein/carb timing, creatine, GH peptides like CJC-1295/Ipamorelin, MK-677) deliver comparable muscle outcomes without hypoglycemia mortality risk or obligate fat gain. The catalog provides this framing because the topic exists in the community — not because we endorse it. Risk-aware users running insulin for performance, against this advice, should at minimum: never run insulin without CGM, never run insulin alone (training partner / spouse aware of hypoglycemia rescue protocol), never run insulin while driving / operating machinery, always have fast carbs and glucagon on hand, never combine with alcohol.\n\n## Reconstitution + Administration\nPre-formulated, no reconstitution. SubQ injection 10–15 min before meal: abdomen (fastest absorption), thigh, upper arm, buttock. Rotate sites. Pen needles 4–8mm. CGM-driven dosing.\n\n## Synergies\nGlargine: paired basal/bolus regimen. Metformin: insulin sensitization, often allows lower total insulin doses. GLP-1 agonists (semaglutide, tirzepatide, retatrutide): substantially reduce or eliminate prandial insulin needs in T2D.\n\n## Evidence Quality\nFDA-approved 1996. Foundational diabetes management drug. Substantial RCT and real-world evidence base. Standard of care for T1D and insulin-requiring T2D.\n\n## Research vs Anecdote\nResearch: well-established efficacy, well-characterized PK/PD, well-known side effect profile. Anecdote: T1D community experience varies widely — some users achieve excellent control with Lispro, others find Aspart or Lyumjev (ultra-rapid Lispro) better tolerated. Trial-and-error within prandial analogs is reasonable. Performance-use anecdote includes documented mortality — treat it as the safety signal it is.",
    tags: ["insulin", "Lispro", "Humalog", "rapid-acting", "T1D", "T2D", "diabetes", "prandial", "prescription"],
    tier: "entry",
  },

  {
    id: "insulin-aspart",
    name: "Insulin Aspart",
    aliases: ["Novolog", "NovoRapid", "Fiasp", "Aspart", "Rapid-acting insulin analog (alt)"],
    category: ["GLP / Metabolic", "Anabolics / HRT", "Diabetes Management"],
    categories: ["GLP / Metabolic", "Anabolics / HRT", "Diabetes Management"],
    route: ["subcutaneous injection", "IV (clinical only)", "insulin pump"],
    mechanism:
      "Rapid-acting recombinant insulin analog. Engineered by substituting aspartic acid for proline at position B28 of the human insulin B-chain — destabilizes hexamer formation in the subcutaneous depot, accelerating monomer dissociation and systemic absorption. Onset 10–20 minutes, peak 1–3 hours, duration 3–5 hours. Pharmacokinetically and clinically near-identical to Insulin Lispro — a few users tolerate one better than the other but at the population level they are interchangeable for prandial coverage. Fiasp (faster aspart) is an ultra-rapid Aspart formulation incorporating niacinamide as an absorption accelerator, achieving onset within 4 minutes of injection and approaching the speed of native pancreatic insulin response. Mechanism of insulin action at the receptor (insulin receptor tyrosine kinase activation, GLUT4 translocation, lipogenesis activation, hepatic gluconeogenesis suppression) is identical to Lispro and Regular. Used interchangeably with Lispro in T1D and T2D management.",
    halfLife: "Plasma ~1 hour; clinical action 3–5 hours (Fiasp slightly shorter)",
    reconstitution: { solvent: "Pre-formulated, no reconstitution", typicalVialMg: null, typicalVolumeMl: 10 },
    dosingRange: { low: "Highly individual", medium: "Highly individual", high: "Highly individual", frequency: "Pre-meal (10–15 min before, or with-meal for Fiasp) plus correction doses" },
    typicalDose: "Same framework as Lispro: I:C ratio 1:5 to 1:15, ISF 1:30 to 1:100, individualized via CGM data and prescriber/CDE oversight.",
    startDose: "Initial dosing set by prescriber. Conservative starting ratios titrated over 2–4 weeks.",
    titrationNote: "CGM-driven, ratio-based titration with prescriber oversight.",
    cycle: "Continuous lifetime therapy for T1D. T2D users may reduce or discontinue with lifestyle + GLP-1 + dietary intervention.",
    storage: "Unopened: refrigerate 2–8°C. In-use pen/vial: room temperature up to 28 days (Novolog) or 56 days (Fiasp pens).",
    benefits: [
      "Equivalent to Lispro for prandial coverage in T1D and T2D",
      "Some users tolerate Aspart better than Lispro (or vice versa) — switching is a reasonable trial when one isn't working well",
      "Fiasp's ultra-rapid onset (~4 minutes) allows with-meal or post-meal dosing — useful for unpredictable eaters, kids, gastroparesis",
      "Standard pump therapy option",
      "Lower hypoglycemia rate than Regular insulin",
    ],
    sideEffects: [
      "HYPOGLYCEMIA — same central life-threatening risk as all insulins. Same rescue protocol (15g fast carbs, recheck 15 min, glucagon for severe).",
      "Weight gain",
      "Injection site lipohypertrophy (rotate sites)",
      "Local injection reactions",
      "Fiasp specifically: higher rate of injection-site reactions vs. standard Aspart (the niacinamide excipient irritates some users)",
      "Same insulin-resistance risk with chronic high-dose use",
    ],
    stacksWith: ["insulin-glargine", "metformin", "semaglutide", "tirzepatide", "retatrutide"],
    warnings: [
      "Active hypoglycemia — hold dose, treat hypo first",
      "Severe renal/hepatic impairment — dose adjustment needed",
      "Untrained user / no CGM / no diabetes education — do not initiate without diabetes education program",
      "Pregnancy — Category B, widely used with endocrine coordination",
      "Niacinamide allergy — use standard Aspart not Fiasp",
      "PERFORMANCE / BODYBUILDING USE: same mortality risk as Lispro. Same poor risk-reward ratio. Catalog does not provide performance-use dosing.",
    ],
    sourcingNotes:
      "Prescription required. Available via primary care, endocrinology, diabetes clinics. Pricing parity with Lispro post-2024 pricing reforms; manufacturer assistance programs (Novo Nordisk MyInsulinRx) provide low-cost or free insulin to qualifying users. CGM access is critical — push for it through prescriber.",
    notes:
      "## How to Take LESS Aspart (Central Frame)\nIdentical to Lispro: GLP-1 agonist therapy (semaglutide, tirzepatide, retatrutide) reduces or eliminates prandial insulin needs in T2D; low-carb / ketogenic dietary patterns reduce postprandial glucose load and total daily insulin requirement (often 20–50% reduction in T1D, often complete discontinuation in T2D); weight loss 10–15% body weight produces meaningful insulin sensitivity improvement; resistance training increases insulin-independent glucose uptake. Dose reductions coordinated with prescriber and CGM data.\n\n## Beginner Protocol (Diabetic Clinical)\nSame as Lispro: 0.5–0.7 units/kg total daily for new T1D, split ~50% basal + 50% prandial. CDE/CDCES education + CGM placement + glucagon training. Many users start on Lispro and switch to Aspart (or vice versa) based on individual tolerance — this is normal and reasonable.\n\n## Lispro vs Aspart Decision Frame\nClinically near-identical. Switching from one to the other is reasonable when: (1) injection site reactions to one (often resolves with the other), (2) inconsistent control with one (sometimes resolves with the other), (3) insurance formulary considerations. Fiasp (ultra-rapid Aspart) specifically is preferred for: unpredictable eaters who can't pre-bolus, pediatric patients, gastroparesis (insulin onset matched to delayed gastric emptying). For most adult T1D users, standard Aspart and Lispro are functionally equivalent.\n\n## Performance Use Discussion\nIdentical framing to Lispro: documented mortality in bodybuilding, obligate fat gain via lipogenesis activation, insulin resistance development with chronic use, alternatives (proper protein/carb timing, creatine, GH peptides) deliver comparable muscle outcomes without hypoglycemia mortality risk. Catalog does not provide performance dosing.\n\n## Reconstitution + Administration\nPre-formulated. Standard Aspart: SubQ 10–15 min pre-meal. Fiasp: SubQ at meal start or within 20 min of meal start. Site rotation. Pen needles 4–8mm.\n\n## Synergies\nSame as Lispro: paired with Glargine for basal/bolus regimens, Metformin for insulin sensitization, GLP-1 agonists for substantial T2D dose reduction.\n\n## Evidence Quality\nFDA-approved 2000 (Novolog), 2017 (Fiasp). Equivalent evidence base to Lispro. Standard of care prandial insulin option.\n\n## Research vs Anecdote\nResearch: well-established efficacy, equivalent to Lispro at population level. Anecdote: individual tolerance varies — some users do meaningfully better on one or the other for reasons that aren't always pharmacologically clear (excipients, pen mechanics, injection-site response). Trial-and-error within the rapid-acting analog class is reasonable when one isn't working well.",
    tags: ["insulin", "Aspart", "Novolog", "Fiasp", "rapid-acting", "T1D", "T2D", "diabetes", "prandial", "prescription"],
    tier: "entry",
  },

  {
    id: "regular-insulin",
    name: "Regular Insulin",
    aliases: ["Humulin R", "Novolin R", "ReliOn R", "Regular human insulin", "Short-acting insulin", "R insulin"],
    category: ["GLP / Metabolic", "Anabolics / HRT", "Diabetes Management"],
    categories: ["GLP / Metabolic", "Anabolics / HRT", "Diabetes Management"],
    route: ["subcutaneous injection", "IV (clinical, DKA)", "IM (clinical, rare)"],
    mechanism:
      "Recombinant human insulin (identical amino acid sequence to native human insulin — not an analog). Stable hexameric form in subcutaneous depot dissociates more slowly than Lispro/Aspart analogs, producing slower onset and longer duration: onset 30 minutes, peak 2–4 hours, duration 5–8 hours. Older (1980s) than the rapid-acting analogs. Used in: hospital DKA management (IV), gastroparesis with delayed gastric emptying (the slower onset matches delayed nutrient absorption better than analogs), some T2D protocols, and historically in T1D before analogs became standard. Critically: Regular insulin is OTC (no prescription required) in 49 of 50 US states under the brand names ReliOn, Humulin R, Novolin R — the only one is in Indiana (which historically required prescription). This OTC status is the reason the performance-bodybuilding community has preferentially used Regular insulin specifically: access without prescriber relationship. The OTC framing also matters for low-income diabetic users who lose insurance and need emergency insulin access — Walmart sells Novolin R for ~$25/vial. The clinical case: Regular insulin is older, slower-acting, less precise for tight glycemic control than analogs — but it works, it's inexpensive, and OTC access is a genuine medical safety net.",
    halfLife: "Plasma ~1.5 hours; clinical action 5–8 hours",
    reconstitution: { solvent: "Pre-formulated, no reconstitution", typicalVialMg: null, typicalVolumeMl: 10 },
    dosingRange: { low: "Highly individual", medium: "Highly individual", high: "Highly individual", frequency: "30 minutes pre-meal" },
    typicalDose: "Same framework as Lispro/Aspart but with 30-minute pre-meal timing instead of 10–15 minutes. I:C ratios are similar; the duration is longer so 'stacking' (doses overlapping) is more of a hypoglycemia risk.",
    startDose: "Initial dosing set by prescriber. CGM-driven titration recommended even on Regular.",
    titrationNote: "Longer duration of action means timing matters more than with rapid analogs — pre-meal injection at 30 minutes, no late-meal correction without checking 'insulin on board.'",
    cycle: "Continuous lifetime therapy for T1D. T2D users may reduce or discontinue with lifestyle + GLP-1 + dietary intervention.",
    storage: "Unopened: refrigerate 2–8°C until expiration. In-use vial: room temperature up to 31 days.",
    benefits: [
      "OTC ACCESS — meaningful for low-income/uninsured T1D and T2D users who need emergency insulin without prescriber visit. Walmart Novolin R ~$25/vial. This is genuine medical safety net.",
      "Inexpensive — substantial cost advantage over analogs",
      "Slower onset/longer duration matches gastroparesis delayed gastric emptying better than rapid analogs",
      "Standard for IV use in DKA management (clinical setting only)",
      "Familiar mechanism, decades of clinical experience",
    ],
    sideEffects: [
      "HYPOGLYCEMIA — same central risk. Higher hypoglycemia rate than rapid analogs in most clinical comparisons because of the longer tail of action (action duration outlasts most meal absorption windows).",
      "Same hypoglycemia rescue: 15g fast carbs, recheck 15 min, glucagon for severe.",
      "Weight gain",
      "Injection site lipohypertrophy",
      "Local injection reactions (less common with modern Regular insulin formulations vs older animal-source insulins)",
      "Dose-stacking risk if correction doses given before previous dose has cleared (5–8 hour duration is long)",
    ],
    stacksWith: ["nph-insulin", "metformin", "semaglutide", "tirzepatide", "retatrutide"],
    warnings: [
      "Active hypoglycemia — hold dose, treat hypo first",
      "Severe renal/hepatic impairment — dose adjustment",
      "Untrained user — initiating insulin without diabetes education is dangerous regardless of OTC status. The OTC access is meant as a safety net for patients with prior prescriber relationship who lost access, NOT as a green light for untrained self-initiation.",
      "Pregnancy — Category B, used widely with endocrine coordination",
      "PERFORMANCE / BODYBUILDING USE: the longer duration of Regular insulin makes hypoglycemia risk WORSE than rapid analogs — action continues 5–8 hours after dose, requiring sustained carbohydrate availability and BG monitoring. Documented mortality in performance use is real. Catalog does not provide performance dosing.",
      "OTC purchase + no diabetes education + no CGM = highest-risk combination. If you're using Regular insulin without prescriber oversight, you need at minimum: glucometer, fast carbs on hand, training partner / family aware of hypoglycemia rescue, glucagon available (Baqsimi nasal is OTC in some states).",
    ],
    sourcingNotes:
      "OTC in 49 of 50 US states (Humulin R, Novolin R, ReliOn). Indiana requires prescription historically. Walmart, CVS, Walgreens stock Novolin R/ReliOn ~$25/vial. This OTC status is the access mechanism for uninsured / low-income / lapsed-prescriber diabetic users — it is genuine medical safety net access. The same OTC status enables performance-community access without prescriber gatekeeping; this is a known framework, not a feature we endorse.",
    notes:
      "## How to Take LESS Regular Insulin (Central Frame)\nSame as analogs: GLP-1 agonist therapy reduces or eliminates prandial insulin needs in T2D; low-carb dietary patterns reduce total insulin requirement; weight loss + resistance training improve insulin sensitivity. The cost advantage of Regular insulin is real (vs. analogs) but that advantage applies to LESS insulin equally — reducing total dose via lifestyle saves more money than switching insulin types.\n\n## When Regular Insulin Specifically Makes Sense\nClinical contexts where Regular > rapid analogs: (1) gastroparesis with delayed gastric emptying — the slower onset matches the delayed glucose appearance from a delayed-emptying meal; (2) hospital DKA management — Regular insulin IV drip is the standard; (3) emergency / safety net access for users without prescriber relationship; (4) cost-sensitive users who genuinely cannot access analog programs (Lilly Insulin Value Program, Novo Nordisk MyInsulinRx provide free or low-cost analogs to qualifying users — explore these first).\n\n## Beginner Protocol (Diabetic Clinical)\nFor users transitioning from analog to Regular insulin (cost or access reasons): the 30-minute pre-meal timing is the major adjustment. Set alarms. Bracket with CGM if at all possible. Hypoglycemia risk is higher with Regular due to longer duration; correction doses must account for insulin-on-board calculations. For users initiating insulin without prior education: this is dangerous regardless of OTC status — get diabetes education even if you're paying out of pocket.\n\n## Performance Use Discussion\nThe OTC status of Regular insulin has historically made it the performance community's preferred insulin — access without prescriber relationship. The risk profile is WORSE than rapid analogs for performance use because the longer action duration (5–8 hours) requires sustained carbohydrate availability and BG monitoring well after the workout window. Hypoglycemia mortality in performance use is documented and the cases that make headlines are the tip — most non-fatal severe hypos don't get reported. The catalog provides this framing to inform the conversation, not enable abuse.\n\n## Reconstitution + Administration\nPre-formulated. Clear solution (Regular is the only insulin that should look completely clear; cloudy Regular insulin = discard). SubQ 30 min pre-meal. Site rotation. Pen needles 4–8mm or syringes for vial-based dosing.\n\n## Synergies\nNPH (intermediate-acting human insulin): some users on R+NPH regimens for cost reasons (both OTC, both inexpensive). Metformin, GLP-1 agonists: same insulin-sparing role as with analogs.\n\n## Evidence Quality\nDecades of clinical use. Older than rapid analogs. Foundational diabetes drug. Equivalence trials show analogs produce slightly tighter glucose control and slightly lower hypoglycemia rates, but Regular insulin is clinically effective for T1D and T2D management.\n\n## Research vs Anecdote\nResearch: equivalent diabetic outcomes to analogs in many real-world studies, with somewhat higher hypoglycemia rates. The cost differential and OTC access are the major clinical advantages. Anecdote: T1D community generally prefers analogs when accessible; Regular use is often a cost-driven or access-driven choice. Performance-community use of Regular for OTC access is the documented pattern; the catalog does not endorse this use but acknowledges it exists.",
    tags: ["insulin", "Regular", "Humulin R", "Novolin R", "OTC insulin", "short-acting", "human insulin", "T1D", "T2D", "diabetes"],
    tier: "entry",
  },

  {
    id: "insulin-glargine",
    name: "Insulin Glargine",
    aliases: ["Lantus", "Basaglar", "Toujeo", "Semglee", "Glargine", "Long-acting basal insulin"],
    category: ["GLP / Metabolic", "Anabolics / HRT", "Diabetes Management"],
    categories: ["GLP / Metabolic", "Anabolics / HRT", "Diabetes Management"],
    route: ["subcutaneous injection"],
    mechanism:
      "Long-acting recombinant insulin analog. Engineered with two amino acid modifications (asparagine → glycine at A21, plus addition of two arginines at the B-chain C-terminus) shifting the isoelectric point from 5.4 (native insulin) to 6.7. At the physiological subcutaneous pH of ~7.4, glargine forms microprecipitates that slowly redissolve and release insulin over ~24 hours — producing a peakless, flat pharmacokinetic profile that mimics endogenous basal insulin secretion. Onset 1–2 hours, no significant peak, duration ~24 hours (Toujeo U-300 formulation extends to ~36 hours). Provides background insulin coverage for the fasting state — between meals and overnight — handling hepatic gluconeogenesis suppression and basal tissue glucose uptake. Distinct clinical role from prandial insulins (Lispro/Aspart/Regular): glargine is NOT a mealtime insulin; it provides the steady background insulin level that beta-cells normally secrete continuously. T1D users typically run basal/bolus regimens — glargine 1–2× daily for basal + Lispro/Aspart per meal for prandial. T2D users on insulin often start with basal-only (glargine + oral agents) and add prandial only if HbA1c remains uncontrolled. Performance-community use of glargine is uncommon — the peakless profile doesn't produce the post-workout glucose-uptake spike that bodybuilding insulin protocols target. This makes glargine the insulin where 'how to take less' has the most leverage — basal insulin doses in T2D are often very reducible via lifestyle.",
    halfLife: "Plasma ~12 hours; clinical action ~24 hours (Lantus, Basaglar, Semglee) or ~36 hours (Toujeo U-300)",
    reconstitution: { solvent: "Pre-formulated, no reconstitution", typicalVialMg: null, typicalVolumeMl: 10 },
    dosingRange: { low: "10–20 units once daily (T2D starting)", medium: "20–60 units once daily (typical adult T2D maintenance)", high: ">60 units once daily or split BID (high-insulin-resistance T2D)", frequency: "Once daily typically (PM dosing common); some users split BID for smoother coverage; Toujeo U-300 is once daily with extended duration" },
    typicalDose: "T2D starting: 0.1–0.2 units/kg once daily PM (10–20 units for most adults). Titrated based on fasting morning BG. T1D: ~50% of total daily insulin requirement, given as basal.",
    startDose: "T2D: 10 units PM × 3 days, then titrate +2 units every 3 days until fasting BG 80–130 mg/dL.",
    titrationNote: "Glargine titration is fasting-BG-driven. Increase if fasting BG consistently >130; decrease if any morning hypos or fasting <70. Titration is slower than prandial insulin titration because glargine effects build over 3–5 days.",
    cycle: "Continuous lifetime for T1D. T2D users frequently reduce or discontinue with weight loss + GLP-1 + lifestyle.",
    storage: "Unopened: refrigerate 2–8°C. In-use pen/vial: room temperature up to 28 days (Lantus) or 56 days (Toujeo). Do not refrigerate in-use product.",
    benefits: [
      "Once-daily dosing for most users — major adherence win vs. NPH (the older basal insulin requiring BID)",
      "Peakless profile substantially reduces nocturnal hypoglycemia risk vs. NPH",
      "Mimics endogenous basal insulin secretion better than older basal insulins",
      "Standard component of basal/bolus T1D regimens",
      "Often the first injectable in T2D progression (after orals + GLP-1 fail)",
      "Toujeo U-300 (concentrated formulation) reduces injection volume in high-dose users",
    ],
    sideEffects: [
      "HYPOGLYCEMIA — same central risk. Glargine hypoglycemia tends to manifest as overnight or fasting-state hypoglycemia (different presentation from prandial-insulin hypoglycemia). Same rescue protocol.",
      "Weight gain",
      "Injection site lipohypertrophy (rotate sites — important for any insulin)",
      "Local injection reactions",
      "Stinging at injection site (acidic formulation pH 4 — Lantus is more acidic than other insulins)",
      "Insulin resistance with chronic high-dose use",
    ],
    stacksWith: ["insulin-lispro", "insulin-aspart", "metformin", "semaglutide", "tirzepatide", "retatrutide"],
    warnings: [
      "Active hypoglycemia — hold dose, treat hypo first",
      "Severe renal/hepatic impairment — dose adjustment",
      "Untrained user / no glucose monitoring — do not initiate without diabetes education",
      "Pregnancy — Category B, used in pregnancy with endocrine coordination",
      "DO NOT mix glargine in same syringe with other insulins — the acidic pH will inactivate other insulins",
      "If switching from NPH to glargine, total basal dose reduction of ~20% is often appropriate to avoid hypoglycemia (NPH peaks; glargine doesn't, so total daily basal need is often lower)",
    ],
    sourcingNotes:
      "Prescription required. Available via primary care, endocrinology, diabetes specialists. Multiple branded options (Lantus original, Toujeo U-300, Basaglar biosimilar, Semglee biosimilar) — biosimilars are clinically equivalent at lower cost. 2024 US insulin pricing reforms cap commercial-plan copays at $35/month for many users; manufacturer assistance programs (Sanofi, Lilly Basaglar) provide free or low-cost glargine to qualifying users.",
    notes:
      "## How to Take LESS Glargine (Central Frame — Most Leverage Here)\nBasal insulin in T2D is often the most reducible insulin dose with lifestyle intervention — frequently entirely discontinuable. Pathways: (1) GLP-1 agonist therapy (semaglutide 1–2.4mg weekly, tirzepatide 5–15mg weekly, retatrutide in trials) — substantial reductions in basal insulin requirement; many T2D users on GLP-1 + glargine combination eventually discontinue glargine entirely. (2) Weight loss of 10%+ produces meaningful insulin sensitivity improvement; basal insulin requirement often drops 30–50% with sustained weight loss. (3) Low-carb / ketogenic dietary patterns reduce hepatic glucose output; basal insulin dose reductions of 30–50% common with sustained adherence. (4) Resistance training improves insulin sensitivity; total daily insulin requirement (basal + prandial) commonly reduced 20–30%. (5) Bariatric surgery in eligible T2D users frequently produces complete remission, eliminating insulin entirely.\n\nFor T1D users: glargine cannot be eliminated (autoimmune destruction of beta-cells means no endogenous basal insulin), but total daily basal dose can be reduced 20–40% with low-carb dietary patterns and consistent activity. The Bernstein protocol approach focuses heavily on reduced glargine via reduced glucose load.\n\nDose-reduction must be coordinated with prescriber and CGM data. Hypoglycemia risk during deprescribing is real if doses are reduced too fast.\n\n## Beginner Protocol (Diabetic Clinical)\nT2D initiation: 10 units PM × 3 days, then +2 units every 3 days until fasting BG 80–130 mg/dL. Most T2D users settle 20–60 units. T1D initiation (newly diagnosed): ~50% of estimated total daily insulin (0.5–0.7 units/kg total). Once-daily PM dosing is the default; BID split (PM + AM) for users with overnight hypoglycemia or daytime hyperglycemia patterns. CGM is critical for safe titration.\n\n## Advanced Protocol\nFor T1D users on basal/bolus: glargine PM + Lispro/Aspart per meal. Adjust glargine first based on fasting BG; adjust prandial ratios based on postprandial CGM data. For T2D users initiating insulin therapy: start with glargine + metformin + GLP-1 agonist combination — the GLP-1 will often allow dose-stable or dose-reducing glargine over months. Avoid initiating prandial insulin in T2D until basal optimization is complete.\n\n## Performance Use Discussion\nGlargine is not commonly used in performance-bodybuilding contexts because the peakless profile doesn't produce the post-workout nutrient-driving spike that prandial insulins target. The performance community gravitates toward Regular and Lispro for that reason. Catalog mentions this for completeness.\n\n## Reconstitution + Administration\nPre-formulated. Clear solution. SubQ injection — abdomen, thigh, upper arm, buttock. Site rotation. Once daily, consistent timing (PM most common). Toujeo U-300 specifically: 3× concentrated, smaller injection volume but same dose-unit basis.\n\n## Synergies\nLispro/Aspart: paired basal/bolus regimens for T1D. Metformin: insulin sensitization, often allows lower glargine dose. GLP-1 agonists: substantial basal insulin reduction in T2D, often complete discontinuation possible.\n\n## Evidence Quality\nFDA-approved 2000 (Lantus). Substantial RCT and real-world evidence base. Standard of care basal insulin globally. Biosimilars (Basaglar 2016, Semglee 2020) clinically equivalent at lower cost.\n\n## Research vs Anecdote\nResearch: well-established efficacy, peakless PK profile reduces nocturnal hypoglycemia vs older NPH basal. Anecdote: T1D and T2D community experience strongly positive — once-daily dosing simplicity is the major win vs. older basal insulins. The 'how to take less' frame applies most powerfully here: basal insulin in T2D is often very reducible with lifestyle + GLP-1 + weight loss, sometimes fully discontinuable. For T1D users, the catalog's value is helping users understand they're not stuck at their current dose — sustained low-carb + activity can reduce total daily insulin substantially even when glargine remains required.",
    tags: ["insulin", "Glargine", "Lantus", "Toujeo", "Basaglar", "Semglee", "long-acting", "basal", "T1D", "T2D", "diabetes", "prescription"],
    tier: "entry",
  },

  {
    id: "nph-insulin",
    name: "NPH Insulin",
    aliases: ["Humulin N", "Novolin N", "ReliOn N", "NPH", "Neutral Protamine Hagedorn", "Intermediate-acting insulin"],
    category: ["GLP / Metabolic", "Anabolics / HRT", "Diabetes Management"],
    categories: ["GLP / Metabolic", "Anabolics / HRT", "Diabetes Management"],
    route: ["subcutaneous injection"],
    mechanism:
      "Neutral Protamine Hagedorn (NPH) insulin — created in 1946 by Hans Christian Hagedorn in Denmark — was the first widely deployed intermediate-acting insulin formulation, named for its developer. It complexes crystallized human insulin (today recombinant; historically bovine/porcine) with protamine, a basic protein originally extracted from salmon or trout sperm (modern industrial processes often use recombinant protamine equivalents). Protamine binds insulin and slows subcutaneous absorption from the depot: insulin precipitates as particulate suspension and gradually redissolves into free insulin that enters systemic circulation over hours.\n\nThe distinguishing physical feature is that NPH is a cloudy suspension — it remains the only cloudy insulin in routine outpatient use among standard human insulins (modern basal analogs such as Glargine are clear solutions). Users MUST gently roll the vial or pen 10–20 times before each dose to uniformly resuspend crystals; vigorous shaking can damage protein structure and produce foamy suspension that doses inconsistently. Failure to mix completely before drawing up or dialing the dose is the single most common NPH dosing error and yields erratically low or high absorption — clinically seen as unexplained fasting highs or unexplained nocturnal lows despite stable routines.\n\nPharmacokinetics: onset ~1–2 hours after injection, peak ~4–8 hours, duration ~12–18 hours — intermediate rather than truly basal-flat. Unlike peakless basal analogs (Glargine, insulin detemir, insulin degludec), NPH has a defined peak. That peak is the primary pharmacologic reason NPH carries a higher nocturnal hypoglycemia rate than Glargine when given at bedtime: peak insulin action can coincide with the overnight physiologic glucose nadir (typically 2–6 AM), amplifying hypoglycemia risk relative to a peakless profile.\n\nCompared head-to-head with Glargine in modern trials and real-world datasets: Glargine generally achieves comparable or slightly better overall glycemic control with fewer overnight hypoglycemic events for many patients; NPH typically requires twice-daily dosing for basal coverage whereas once-daily Glargine suffices for many adults. Where NPH still wins clinically is access economics: in the United States it remains OTC (no prescription) in most states under Humulin N, Novolin N, and ReliOn N branding at roughly ~$25/vial — parallel to Regular insulin OTC availability — creating a genuine medical safety net when insurance lapses or cash-pay analog pricing is prohibitive. Some long-stable T2D patients remain on NPH for decades with acceptable control and resist switching when analog access is uncertain — that conservative stance can be clinically defensible when CGM monitoring is present and hypoglycemia burden is low.",
    halfLife: "Plasma ~4–6 hours; clinical action 12–18 hours with defined peak at 4–8 hours",
    reconstitution: {
      solvent:
        "Pre-formulated cloudy suspension — RESUSPEND by gently rolling vial/pen before each dose until uniformly cloudy (do not shake vigorously)",
      typicalVialMg: null,
      typicalVolumeMl: 10,
    },
    dosingRange: {
      low: "Framework T2D start ~10 units BID (individualized)",
      medium: "Typical adult maintenance often 20–50 units/day total basal split BID",
      high: ">60 units/day split BID in severe insulin resistance (individualized)",
      frequency: "Typically twice daily (morning + evening); occasionally split across three injections in specialized protocols under prescriber",
    },
    typicalDose:
      "Highly individualized split dosing — commonly twice daily to match NPH peak profile; exact units determined empirically with fasting BG and CGM trends under diabetes-education oversight.",
    startDose:
      "Prescriber-directed initiation — pragmatic outpatient frameworks sometimes begin ~10 units BID for insulin-naïve T2D users with careful fasting BG monitoring; T1D basal fraction often approximates ~40–50% of total daily insulin split BID — never copy doses without prescriber confirmation.",
    titrationNote:
      "Titration separates into fasting-driven adjustments (morning dose influences overnight/fasting pattern depending on timing) and pre-dinner/post-prandial patterns for the evening dose — distinct from prandial Lispro/Aspart ratios. CGM-driven titration strongly preferred; adjustments accumulate over several days because NPH effects overlap.",
    cycle:
      "Continuous lifetime basal requirement for T1D (unless advanced therapies alter physiology). T2D users on NPH are frequently candidates to reduce total basal insulin or transition to Glargine + GLP-1 agonist combinations — sometimes eliminating basal insulin entirely with sustained weight loss and metabolic improvement.",
    storage:
      "Unopened: refrigerate 2–8°C until expiration. In-use vial/pen: room temperature up to 31 days (Humulin N) or 42 days (Novolin N) — verify manufacturer leaflet for your exact pen/vial.",
    benefits: [
      "OTC access in most US states — meaningful emergency safety net pricing (~$25/vial) when uninsured or between insurance coverage",
      "Decades-long clinical track record including pregnancy experience when managed by specialists",
      "Pairs naturally with Regular insulin for classic split-mixed regimens and fixed-ratio NPH+Regular 70/30 premix options for predictable meal-pattern users",
      "Intermediate peak can occasionally match delayed nutrient absorption patterns better than ultra-rapid analogs in selected gastroparesis contexts — prescriber judgment",
      "Transition pathway exists to peakless basal analogs when access improves — dose translation requires coaching (~20% basal reduction rule of thumb NPH→Glargine — individualized)",
    ],
    sideEffects: [
      "HYPOGLYCEMIA — central risk; overnight hypoglycemia rate higher vs Glargine at equivalent A1c in many comparisons because of defined peak overlapping circadian glucose nadir.",
      "Hypoglycemia rescue protocol: 15g fast carbs (juice or glucose tabs), recheck BG in 15 minutes, repeat if still <70 mg/dL; severe altered consciousness — glucagon + emergency services.",
      "Weight gain — common with insulin therapy broadly",
      "Injection-site lipohypertrophy — rotate sites diligently",
      "Erratic absorption if inadequately mixed — disguised as unexplained variability",
      "Local injection discomfort — intermediate vs analog formulations",
    ],
    stacksWith: ["regular-insulin", "insulin-glargine", "metformin", "semaglutide", "tirzepatide", "retatrutide"],
    warnings: [
      "Active hypoglycemia — treat before dosing",
      "MUST resuspend cloudy suspension fully before every injection — partial mixing causes unpredictable peaks",
      "Higher overnight hypo burden vs peakless basal analogs — prioritize CGM if available",
      "Severe renal/hepatic impairment — insulin clearance kinetics shift; coordinate dosing",
      "Untrained initiation without diabetes education + glucose monitoring is dangerous despite OTC status",
      "Indiana historically imposed prescription requirements on certain OTC insulin products — verify current pharmacy rules if purchasing across state lines",
      "Longer duration vs Regular insulin alone — insulin-on-board stacking mistakes more consequential than with rapid analogs",
      "Pregnancy — used historically with specialist coordination; modern protocols often prefer analog basals — individualized",
      "PERFORMANCE / BODYBUILDING USE: uncommon — defined peak + long duration make timing less predictable than Regular or rapid analogs; catalog does not provide performance dosing protocols",
    ],
    sourcingNotes:
      "OTC at major chains (Walmart, CVS, Walgreens) for Humulin N, Novolin N, ReliOn N — typically ~$25/vial cash-pay analog of Regular insulin OTC availability. Fixed-ratio NPH+Regular 70/30 premixes (Humulin 70/30, Novolin 70/30) are commonly stocked for patients preferring single-vial simplicity when meal timing is predictable — distinct concept from Lispro/NPL 75/25 premixes (Humalog Mix 75/25), which suspend protamine-complexed Lispro rather than NPH itself.",
    notes:
      "## How to Take LESS NPH (Central Frame)\nMost NPH users in 2026 remain candidates for modernization when access permits: transition pathways include peakless basal insulin (Glargine biosimilars, Toujeo U-300, etc.) plus GLP-1 agonists (semaglutide, tirzepatide; retatrutide in trials) that reduce postprandial excursions and frequently lower basal insulin requirements in T2D — sometimes eliminating basal insulin entirely after sustained weight loss. US insulin pricing reforms (including manufacturer assistance and capped copays on many commercial plans as of 2024) have expanded analog access relative to prior decades — explore assistance before assuming NPH is the only viable option long-term. Lifestyle levers mirror every insulin class: structured low-carbohydrate dietary patterns, resistance training, ≥7–9% weight loss where appropriate, and CGM-informed dose reductions coordinated with your prescribing clinician.\n\n## When NPH Specifically Makes Sense\nCost-sensitive uninsured or between-coverage T2D patients where cash-pay analog pricing is prohibitive and OTC human insulin is the realistic bridge. Long-term stable patients already comfortable on NPH with excellent CGM profiles may reasonably defer switching when subjective hypo burden is minimal and access friction is high. Pregnancy-capable patients sometimes remain on human insulin protocols per maternal-fetal medicine/endocrine coordination — individualized. Classic fixed-ratio NPH+Regular 70/30 premix suits predictable meal cadence when SMBG/CGM confirms coverage.\n\n## Beginner Protocol (Diabetic Clinical)\nDo not self-initiate basal insulin without structured diabetes self-management education (CDE/CDCES) when avoidable. Outpatient initiation frameworks sometimes begin modest split BID dosing with fasting glucose targets — specifics belong to your clinician. Establish SMBG or CGM pattern reviews within first weeks; teach hypoglycemia recognition and glucagon options for household contacts.\n\n## Advanced Protocol\nSwitching NPH → Glargine: empirical ~20% reduction in total daily basal dose is a common starting heuristic because Glargine is peakless — overshooting converts overnight hypo risk from peak-timing into pure basal oversupply. Switching Glargine → NPH for catastrophic cost reasons: split daily basal across BID injections; expect higher overnight hypo incidence initially — tighten CGM alarms and revisit dinner timing and snack strategies. Adding GLP-1 agonists to insulin regimens in T2D typically lowers basal requirements — monitor fasting trends weekly.\n\n## Performance Use Discussion\nPerformance-focused insulin misuse historically favored Regular insulin due to OTC access and pharmacokinetic targets — not NPH. The intermediate peak and long tail increase unpredictability versus rapid analogs and amplify overnight hypo windows versus peakless basal designs. This row documents reality for completeness; it is not prescriptive for non-medical use.\n\n## Reconstitution + Administration\nRoll gently until uniformly cloudy — never skip mixing. Inject within about one minute of mixing per conventional nursing teaching (verify institutional protocol). Rotate anatomical sites systematically; document lipohypertrophy checks quarterly.\n\n## Synergies\nRegular insulin pairing (classic split-mixed therapy or 70/30 premix convenience). Glargine when transitioning basals under supervision. Metformin + GLP-1 agonists as insulin-sparing adjuncts in T2D.\n\n## Evidence Quality\nIntermediate human insulin predates modern RCT-era approvals but rests on massive longitudinal utilization evidence. Head-to-head data vs Glargine generally favors fewer nocturnal hypoglycemic events with peakless basal analogs at comparable A1c — individual variance remains substantial.\n\n## Research vs Anecdote\nResearch: PK peak drives differential overnight hypo risk vs analog basals — robust population-level finding. Anecdote: many stable long-duration T2D patients tolerate NPH indefinitely when monitored; T1D pediatric practice has largely migrated to analog basals for tighter/predictable profiles — resource-limited global contexts still rely heavily on NPH.",
    tags: [
      "insulin",
      "NPH",
      "Humulin N",
      "Novolin N",
      "OTC insulin",
      "intermediate-acting",
      "human insulin",
      "T1D",
      "T2D",
      "diabetes",
      "cost-sensitive",
    ],
    tier: "entry",
  },
];