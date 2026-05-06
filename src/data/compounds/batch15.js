/** Batch 15 — Foundational supplements (5) + missing SARMs/research compounds (3).
 *
 *  Foundational supplements:
 *    Caffeine · Nicotine · Creatine · Trigonelline · Pentadeca Arginate (PDA)
 *
 *  Missing SARMs / research compounds:
 *    Ostarine (MK-2866) · Ligandrol (LGD-4033) · SR-9009 (Stenabolic — NOT a SARM,
 *    Rev-Erb agonist; commonly miscategorized in performance discussions, treated
 *    here in the SARM-adjacent framing it gets in the community)
 *
 *  Framing principles:
 *    - Caffeine, Creatine, Trigonelline: standard supplement framing, evidence-based
 *      benefits + honest evidence assessment.
 *    - Nicotine: smokeless cognitive-tool framing (pouches, gum) — explicitly NOT
 *      smoking; different harm profile entirely. Addiction potential acknowledged.
 *    - PDA: newer compound with limited evidence; positioned honestly relative to
 *      its more-established BPC-157 inspiration.
 *    - SARMs / SR-9009: AAS-style harm-reduction framing — lab monitoring framework,
 *      no performance-dosing recipes, "research chemical" sourcing reality, HPG
 *      suppression and lipid disruption acknowledged honestly. Same policy as
 *      AAS-medical entries: catalog provides factual information + harm-reduction
 *      framework, does not endorse non-medical use, does not provide performance
 *      protocols.
 *
 *  Schema matches BATCH7-14. Average ≥800w/entry.
 */
export const BATCH15 = [
  // ============================================================================
  // SECTION 1 — Foundational Supplements (5)
  // ============================================================================

  {
    id: "caffeine",
    name: "Caffeine",
    aliases: ["1,3,7-trimethylxanthine", "Coffee", "Caffeine anhydrous", "Caffeine citrate"],
    category: ["Nootropic", "Stimulant", "Performance"],
    categories: ["Nootropic", "Stimulant", "Performance"],
    route: ["oral"],
    mechanism:
      "Methylxanthine alkaloid. Primary mechanism: competitive antagonism at adenosine A1 and A2A receptors throughout the CNS. Adenosine accumulates during waking hours and binds these receptors to produce sleep pressure / fatigue signaling — caffeine's blockade prevents that signaling, producing alertness and reduced perceived fatigue. Secondary mechanisms: indirect dopamine release in nucleus accumbens (mild reinforcing effect, basis for the dependence pattern), norepinephrine elevation, mild adenosine-mediated glucose metabolism shifts. Effects on cognitive performance: well-documented improvements in alertness, vigilance, reaction time, and sustained attention; modest effects on working memory; minimal effects on creative or insight-based cognition. Effects on athletic performance: ergogenic effects most robust for endurance (5–8% improvements in time-to-exhaustion in trained athletes), modest for strength (~3–5%), variable for sprint/explosive work. CYP1A2 metabolism produces substantial inter-individual variation: fast metabolizers (C/C variant) clear caffeine 2–4× faster than slow metabolizers (A/A variant); fast metabolizers tolerate larger doses with fewer side effects, slow metabolizers experience prolonged effects and higher CV impact at given dose. Half-life range 2–9 hours depending on genetics, smoking status (induces CYP1A2, faster clearance), pregnancy (substantially slower clearance), and oral contraceptive use (slower clearance). Dependence reality: regular daily use produces tolerance and physical dependence within 1–3 weeks; abrupt cessation produces withdrawal (headache, fatigue, irritability) within 12–48 hours, peaking at 24–36 hours, resolving over 2–9 days. The withdrawal pattern is the practical limit on caffeine cycling for most users.",
    halfLife: "Plasma half-life 2–9 hours (highly individual; genetic + lifestyle factors)",
    reconstitution: { solvent: "N/A — oral (capsule, tablet, beverage)", typicalVialMg: null, typicalVolumeMl: null },
    dosingRange: { low: "50–100mg (single coffee, mild dose)", medium: "200mg (standard pre-workout dose, ~2 cups coffee)", high: "300–400mg (athletic performance ceiling for most users; FDA general-population safety cap is 400mg/day)", frequency: "1–3× daily, last dose ≥8–10 hours before sleep" },
    typicalDose: "100–200mg per dose; total daily intake 200–400mg for most users",
    startDose: "50–100mg to assess sensitivity; slow metabolizers (CYP1A2 A/A) may need to stay under 100mg per dose to avoid sleep disruption",
    titrationNote: "Tolerance develops with regular use — chronic high-dose users often require 300mg+ for the same alertness effect they originally got from 100mg. Cycling (1-week breaks every 4–8 weeks) maintains lower effective dose.",
    cycle: "Continuous use common; periodic breaks (1–2 weeks every 1–3 months) reset tolerance and limit dependence development. Not strictly required.",
    storage: "Room temperature, dry",
    benefits: [
      "Most-validated cognitive enhancer with global use",
      "Improves alertness, vigilance, reaction time, sustained attention",
      "Endurance performance: 5–8% time-to-exhaustion improvement in trained athletes (well-documented)",
      "Modest strength performance benefit (~3–5%)",
      "Reduced perceived exertion during exercise",
      "Mood elevation in moderate doses",
      "Mortality data: moderate coffee consumption (3–5 cups/day) associated with reduced all-cause mortality in large cohort studies",
      "Cognitive aging: regular coffee consumption associated with reduced dementia risk in observational data",
      "Inexpensive, widely available",
    ],
    sideEffects: [
      "Sleep disruption — the dose-limiting issue for most users. Caffeine 8 hours before bed still suppresses deep sleep architecture; 10+ hour pre-sleep buffer is the conservative recommendation.",
      "Anxiety, jitteriness — particularly in slow metabolizers (CYP1A2 A/A) or anxious-baseline users",
      "Mild BP elevation (modest, transient — not a clinically significant CV risk in healthy users at moderate doses)",
      "Heart palpitations / arrhythmia in sensitive users",
      "Dependence + withdrawal — physical dependence develops in 1–3 weeks; withdrawal headache + fatigue + irritability lasts 2–9 days",
      "GI: increases gastric acid, can worsen GERD; mild laxative effect",
      "Diuretic effect (mild; hydration concerns are overstated for habitual users — tolerance develops to the diuretic effect)",
      "Calcium excretion: increased urinary calcium — modest effect, relevant for users with low dietary calcium or osteoporosis risk",
      "Anxiety amplification in users with panic disorder",
    ],
    stacksWith: ["l-theanine", "creatine", "tyrosine"],
    warnings: [
      "Pregnancy — limit to 200mg/day per ACOG guidance; higher doses associated with miscarriage and low birth weight",
      "Lactation — caffeine passes into breast milk; moderate intake (≤200mg/day) generally tolerated",
      "Untreated arrhythmia (atrial fibrillation, ventricular arrhythmias) — caution",
      "Severe hypertension — caution; modest BP elevation may be clinically meaningful at high baseline",
      "Anxiety disorders, panic disorder — often poorly tolerated; reduce or eliminate",
      "Insomnia or sleep disorders — strict afternoon cutoff or eliminate",
      "Children and adolescents — AAP limits 100mg/day for adolescents, none for children under 12",
      "Concurrent stimulant medications (ADHD treatments, phentermine, MDMA, etc.) — additive cardiovascular effects",
      "Concurrent MAOI — caution",
      "Caffeine anhydrous powder — DEATHS reported from accidental overdose (1 tsp ≈ 5g, lethal dose); never use unmeasured powder, prefer pre-portioned tablets",
    ],
    sourcingNotes:
      "Globally available. Beverage forms (coffee, tea, energy drinks) provide variable doses with food-matrix interactions. Tablets / capsules provide precise dosing — Vivarin / NoDoz 200mg tablets are standard; ProLab 200mg also reliable. Caffeine anhydrous powder is dangerous (lethal at 5–10g; difficult to measure accurately) and should be avoided by consumers — pre-portioned tablets are safer.",
    notes:
      "## Beginner Protocol\n100mg morning, ideally 90–120 minutes after waking (Huberman recommendation: caffeine immediately upon waking blocks adenosine clearance the body is ready to do; delayed caffeine maintains the natural cortisol rhythm and reduces afternoon crash). Track sleep quality, anxiety, GI tolerance over 1 week. If well-tolerated, can extend to 200mg or add second dose (early afternoon, before 2pm).\n\n## Advanced Protocol\nFor athletic performance: 200–300mg 30–60 minutes pre-workout — peak ergogenic effects 60–120 minutes post-ingestion. Pair with creatine 5g + L-citrulline 6g + beta-alanine 3g for comprehensive pre-workout. For cognitive performance: 100mg + L-theanine 200mg combination (the smooth-focus stack) — the L-theanine reduces caffeine jitter and the cognitive enhancement is additive. Time the morning dose 90+ minutes after waking; do not exceed 300mg before noon if afternoon dose planned; absolute cutoff 8–10 hours before bed.\n\n## CYP1A2 Genotype Considerations\nIf you've done 23andMe or similar testing, check CYP1A2 status. Fast metabolizers (C/C) tolerate higher doses with less CV impact and shorter sleep disruption window. Slow metabolizers (A/A) need to stay under 200mg/day total and finish caffeine by noon. Heterozygotes (A/C) intermediate. Genotype testing isn't necessary — empirical sensitivity (do you sleep poorly with caffeine after noon? do you feel jittery on standard doses?) is reasonable proxy.\n\n## Reconstitution + Administration\nN/A — oral. Pre-portioned tablets recommended over powder for safety.\n\n## Synergies\n**L-theanine:** smooths caffeine's cognitive profile — reduces jitter, improves focus quality. Standard ratio 2:1 theanine:caffeine (e.g., 200mg + 100mg). **Creatine:** common pre-workout pairing; no direct interaction but complementary mechanisms. **Tyrosine:** for users wanting additional dopaminergic / focus support, particularly under sleep deprivation or stress.\n\n## Evidence Quality\nExtensive RCT and real-world evidence base across cognitive, athletic, and population-health domains. One of the most-studied compounds in human pharmacology.\n\n## Research vs Anecdote\nResearch: well-established efficacy and safety profile in moderate doses; CYP1A2 polymorphism produces real inter-individual variation; tolerance and dependence patterns well-characterized. Anecdote: cycling and dose-management strategies have substantial community wisdom; the morning-cortisol-window concept (delayed caffeine intake post-wake) is plausible and gaining adoption but not robustly studied. Decision frame: most users benefit from moderate use timed appropriately; afternoon cutoff matters more than total dose for sleep quality; pre-workout use is well-supported for endurance.",
    tags: ["caffeine", "stimulant", "nootropic", "adenosine antagonist", "CYP1A2", "performance", "endurance", "cognitive enhancement"],
    tier: "entry",
  },

  {
    id: "nicotine",
    name: "Nicotine",
    aliases: ["Nicotine pouches", "Zyn", "ON!", "Velo", "Nicorette", "Nicotine gum", "Nicotine lozenge", "Smokeless nicotine"],
    category: ["Nootropic", "Stimulant"],
    categories: ["Nootropic", "Stimulant"],
    route: ["oral (pouch / gum / lozenge)", "transdermal (patch)"],
    mechanism:
      "Nicotinic acetylcholine receptor agonist — binds primarily to α4β2, α7, and α3β4 receptor subtypes throughout the CNS and peripheral nervous system. CNS effects relevant to cognitive use: prefrontal cortex acetylcholine release (attention, working memory enhancement), nucleus accumbens dopamine release (mild reinforcing effect — basis for addiction potential), modulation of GABA-glutamate balance. Cognitive effects in non-smokers and abstinent smokers at low doses: well-documented improvements in attention, working memory, reaction time, and motor task performance. Effects are dose-dependent — low doses (1–4mg via pouch or gum) produce the cognitive benefits without significant cardiovascular impact in most users; higher doses produce nausea, vomiting, anxiety. **Critical framing for this catalog entry: nicotine in smokeless forms (pouches, gum, lozenges, patches) has a fundamentally different harm profile from cigarette smoking. The carcinogens, tar, and combustion byproducts that drive smoking-related lung cancer, COPD, and most cardiovascular smoking-mortality are absent from smokeless nicotine.** Smokeless nicotine carries real but limited harms — addiction potential, modest cardiovascular effects, oral health concerns with prolonged pouch use — but the harm magnitude is orders of magnitude lower than smoking. The catalog includes nicotine for its cognitive enhancement use case in the context of pouches and gum specifically, NOT as an endorsement of smoking. Half-life ~2 hours; effects from a single pouch last 30–60 minutes; tolerance develops with regular use; dependence develops within weeks of regular use.",
    halfLife: "Plasma half-life ~2 hours; cognitive effects 30–60 minutes per dose",
    reconstitution: { solvent: "N/A — oral pouch, gum, lozenge, or transdermal patch", typicalVialMg: null, typicalVolumeMl: null },
    dosingRange: { low: "2mg pouch (Zyn 3mg, Nicorette 2mg gum)", medium: "4mg pouch (Zyn 6mg, Nicorette 4mg gum)", high: "8mg pouch (less common; for established tolerant users)", frequency: "1–4× daily as cognitive tool; cycle off periodically to avoid dependence" },
    typicalDose: "2–4mg via pouch (placed between gum and lip, held 30–60 minutes) or 2–4mg gum (chew-and-park technique). 1–3 doses per day for cognitive use.",
    startDose: "2mg single pouch or piece of gum, with food in stomach to reduce nausea risk for first-time users. Have something to spit into — first-time use commonly produces nausea or hiccups.",
    titrationNote: "First-time users should test tolerance carefully. Nausea on first use is common and not a sign to push through — it indicates the dose is at the upper edge of acute tolerability.",
    cycle: "**On/off cycling matters substantially for nicotine.** Continuous daily use produces dependence and tolerance within 2–4 weeks. Cycling protocol: use during high-cognitive-demand periods (deep work blocks, exam prep, deadline weeks); abstain during low-demand periods. 'Take it on, take it off' — not a daily-forever supplement.",
    storage: "Room temperature, sealed",
    benefits: [
      "Documented cognitive enhancement in non-smokers and abstinent smokers — attention, working memory, reaction time, motor performance",
      "Useful for sustained attention tasks (deep work, exam prep, complex problem-solving)",
      "Smokeless forms have substantially lower harm profile than cigarette smoking — orders of magnitude difference in cancer risk, lung function, CV mortality",
      "FDA-approved as smoking cessation aid (Nicorette, Habitrol, Nicoderm CQ patches) — substantial efficacy data in that context",
      "Dose-controlled delivery (pouches, gum, lozenges, patches) — predictable pharmacology",
      "Inexpensive — pouches ~$5/can of 15, gum similar",
    ],
    sideEffects: [
      "Mild cardiovascular effects: HR elevation 5–15 bpm, modest BP elevation",
      "Nausea — common in first-time use or higher doses",
      "Hiccups — common with pouches",
      "Anxiety in sensitive users at higher doses",
      "Sleep disruption if used too close to bed (cutoff ~4–6 hours pre-sleep is conservative)",
      "Oral health concerns with chronic pouch use — gum recession, oral leukoplakia (rare), dental staining",
      "Mild constipation or GI changes",
      "Dependence — develops within weeks of regular use; addictive potential is real",
      "Withdrawal: irritability, difficulty concentrating, reduced mood, food cravings — peaks 1–3 days after cessation, resolves within 2–4 weeks",
    ],
    stacksWith: ["caffeine", "l-theanine"],
    warnings: [
      "Pregnancy — CONTRAINDICATED. Nicotine is a teratogen; use during pregnancy associated with low birth weight, preterm delivery, neurodevelopmental issues. Smokeless forms are NOT safer than smoking in pregnancy.",
      "Lactation — present in breast milk; not recommended",
      "Active or recent MI / stroke / unstable angina — contraindicated",
      "Severe peripheral vascular disease — caution",
      "Uncontrolled hypertension — caution",
      "Adolescents — nicotine exposure during brain development associated with reduced executive function and increased addiction susceptibility; AAP advises against any nicotine use in adolescents",
      "History of substance abuse — addiction potential warrants extra caution",
      "Concurrent stimulant medications — additive cardiovascular effects",
      "Active cancer treatment, especially for users with oral / head/neck cancer history — coordinate with oncologist; the smoking-cancer evidence does not necessarily extend to smokeless nicotine but caution warranted",
      "Type 1 / Type 2 diabetes — nicotine modestly impairs glucose handling; monitor",
      "Smoking cessation context: smokeless nicotine is a legitimate cessation aid; the harm reduction case here is well-established. Switching from cigarettes to pouches/gum is a meaningful health improvement.",
    ],
    sourcingNotes:
      "Smokeless nicotine products (Zyn, ON!, Velo pouches; Nicorette, Habitrol gum) are widely available — convenience stores, pharmacies, online. No prescription required in US for smokeless products. Patches are OTC. Various flavors available (mint, citrus, coffee, etc.). Strength options 2mg, 3mg, 4mg, 6mg, 8mg per dose unit. Underground / international products less reliable for dose accuracy; established US/EU brands recommended.",
    notes:
      "## Cognitive Use Protocol (Non-Smoker Context)\nFor cognitive enhancement only — not as a smoking substitute, not as a recreational stimulant. Use case: deep work blocks, sustained-attention tasks, exam prep, complex problem-solving. Standard cognitive dose: 2–4mg pouch (Zyn 3mg or Zyn 6mg) placed between gum and lip, held 30–60 minutes, then disposed. Cognitive effect onset 5–15 minutes, peak 20–40 minutes, declining over the next 30–60 minutes. Most users find 1–3 pouches per workday sufficient; absolute cutoff 4–6 hours before bed.\n\n## On/Off Cycling Discipline\nThe single most important practical point about non-smoker nicotine use: cycle aggressively. Continuous daily use produces dependence within 2–4 weeks, at which point you've added a daily addictive substance to your life rather than acquired a cognitive tool. Effective pattern: use during high-demand periods (project deadlines, exam weeks, intensive cognitive work blocks), abstain during low-demand periods (weekends, vacation, light-work weeks). Andrew Huberman has discussed this 'take it on, take it off' framing publicly. The withdrawal from a 2-week on cycle is mild (mood, focus dip for 2–5 days) and quickly resolves. The withdrawal from chronic 6-month daily use is substantial.\n\n## Smoking Cessation Context\nFor users transitioning off cigarettes: smokeless nicotine (gum, pouches, patches) is FDA-approved cessation aid and substantially reduces health harms vs continued smoking. The cessation-aid use case is different from cognitive use — typically higher doses for longer durations during the transition phase, gradual taper over 6–12 weeks. This catalog's framing is the cognitive-use context; cessation should involve a structured program (Nicorette gum protocols, Habitrol patches, primary-care or specialty smoking-cessation support).\n\n## Reconstitution + Administration\n**Pouches:** place between upper or lower lip and gum, hold 30–60 minutes. Tingling sensation is normal first 10–15 minutes. Rotate placement to reduce gum irritation.\n\n**Gum (Nicorette):** chew-and-park technique. Chew 3–5 times until tingling, park gum between cheek and gum 1–2 minutes, repeat over 30 minutes, then dispose. Do NOT chew continuously — that releases too much nicotine too fast and produces nausea.\n\n**Lozenges:** dissolve slowly in mouth over 20–30 minutes. Do not chew or swallow whole.\n\n**Patches:** apply to clean dry skin, rotate sites, 16-hour or 24-hour wear options.\n\n## Synergies\n**Caffeine:** common cognitive-stack pairing — caffeine for arousal/vigilance, nicotine for attention/focus. Stack with caution given additive CV effects. **L-theanine:** smooths nicotine's anxiogenic potential at higher doses; useful for anxious-baseline users.\n\n## Evidence Quality\nCognitive enhancement: substantial RCT evidence base in non-smokers and abstinent smokers. Smoking cessation: extensive RCT evidence for FDA-approved smokeless products. Long-term smokeless nicotine safety in non-smokers: less robust evidence base — most long-term safety data come from smokers (where smoking effects dominate) or from snus users (Swedish population; data suggests substantially reduced harm vs cigarettes but not zero harm).\n\n## Research vs Anecdote\nResearch: cognitive effects in non-smokers well-characterized at low doses; smoking cessation efficacy strong; long-term non-smoker use less studied. Anecdote: knowledge-worker community has substantial recent uptake of pouches as cognitive tool; reports overwhelmingly positive on focus benefits when on/off cycling is observed; reports negative when continuous use establishes dependence. Decision frame: useful cognitive tool with real addiction potential — the cycling discipline is the critical factor distinguishing 'tool' from 'habit.' Smokeless harm profile is genuinely much lower than smoking, but not zero.",
    tags: ["nicotine", "nootropic", "cognitive enhancement", "smokeless", "pouches", "Zyn", "gum", "Nicorette", "smoking cessation", "addictive"],
    tier: "entry",
  },

  {
    id: "creatine",
    name: "Creatine",
    aliases: ["Creatine monohydrate", "Creatine HCl", "Creapure", "Creatine ethyl ester", "Buffered creatine"],
    category: ["Nootropic", "Longevity"],
    categories: ["Nootropic", "Longevity"],
    route: ["oral"],
    mechanism:
      "Naturally occurring nitrogenous organic compound found in muscle tissue (~95%) and brain (~5%). Endogenously synthesized from glycine, arginine, and methionine in liver and kidneys; dietary intake from red meat and fish (~1g/day in omnivores). Mechanism: creatine is phosphorylated in muscle and brain to phosphocreatine (PCr), which serves as a rapidly-mobilizable phosphate donor for ATP regeneration during high-intensity work. The PCr/creatine system handles ATP demand during the first ~10 seconds of maximal exercise (sprint, jump, lift). Supplementation increases muscle creatine stores 10–40% above baseline (response varies by baseline diet and individual transporter expression — vegetarians and vegans see largest absolute increase due to lower baseline). Effects on athletic performance: well-documented improvements in high-intensity exercise capacity (5–15% increases in repeated sprint, max lift, or repetitions-to-failure), modest body composition improvements (increased lean mass via cellular hydration + training capacity), most-validated performance supplement available. Effects on cognitive performance (newer research): improvements in memory and cognitive function under sleep deprivation, in vegetarians (low baseline brain creatine), in older adults; effects in young, well-fed, well-rested users are smaller. Effects on bone health (newer): emerging evidence of bone density preservation in postmenopausal women on creatine + resistance training. Effects on age-related sarcopenia: modest preservation of muscle mass in older adults. Creatine is the supplement with the highest evidence-to-cost ratio in the entire performance/wellness landscape.",
    halfLife: "Plasma half-life ~3 hours; tissue saturation reaches steady state in 7–28 days depending on protocol",
    reconstitution: { solvent: "Mix with water, juice, or any beverage", typicalVialMg: 5000, typicalVolumeMl: null },
    dosingRange: { low: "3g/day (smaller athletes, maintenance)", medium: "5g/day (standard adult dose)", high: "5g/day (no benefit to higher doses; excess excreted)", frequency: "Once daily, any time of day; consistency matters more than timing" },
    typicalDose: "5g daily, single dose at any time. Loading phase optional (20g/day split into 4 doses × 5–7 days, then 5g/day maintenance) — accelerates muscle saturation but produces same end state as 5g/day alone over 28 days.",
    startDose: "5g/day from day 1 — no titration needed",
    titrationNote: "No titration required. Loading phase is optional and produces faster saturation but no different end-state benefit.",
    cycle: "Continuous indefinite use. No cycling required or benefit. Some users cycle off periodically out of caution but evidence does not support need.",
    storage: "Room temperature, dry. Powder is stable indefinitely; reconstituted in liquid stable 24–48 hours refrigerated.",
    benefits: [
      "Most-validated performance supplement — substantial RCT evidence base across multiple sports, populations, and outcomes",
      "5–15% improvements in high-intensity exercise capacity (sprint, max lift, repeated efforts)",
      "Increased lean mass via cellular hydration + improved training capacity",
      "Cognitive enhancement under sleep deprivation, in vegetarians, in older adults",
      "Bone density preservation in postmenopausal women on creatine + resistance training (emerging evidence)",
      "Sarcopenia mitigation in older adults",
      "Brain creatine elevation: relevant for traumatic brain injury recovery, depression (emerging research), neurodegenerative conditions (early research)",
      "Inexpensive — generic creatine monohydrate ~$15–30/month for 5g/day",
      "Extremely safe profile — most-studied supplement with most-extensive safety data",
      "Vegetarians and vegans see largest absolute benefit (lowest baseline)",
    ],
    sideEffects: [
      "Modest water retention — INTRACELLULAR (inside muscle cells), which is functionally beneficial. NOT subcutaneous bloat. The 1–2 kg weight gain in first 2–4 weeks is muscle hydration, not fat or extracellular fluid.",
      "GI upset rare — typically only with very high doses (>10g/day single dose); resolves with split dosing",
      "Muscle cramping (rare; older claim largely debunked in modern trials)",
      "Acne increase reported by some users (mechanism unclear, weak evidence)",
      "Hair loss concern (the 'creatine raises DHT' study from 2009): single underpowered study showing modest DHT increase, not replicated; meta-analysis evidence does not support clinically meaningful hair loss from creatine. Users with strong genetic male-pattern baldness may want to be aware of the theoretical concern.",
    ],
    stacksWith: ["caffeine", "beta-alanine", "l-citrulline", "whey-protein"],
    warnings: [
      "Severe renal impairment — creatine is excreted renally and produces elevated serum creatinine that doesn't reflect actual kidney function (artifactually elevates eGFR calculations). In healthy users this is benign. In users with pre-existing renal disease, coordinate with nephrologist — creatine isn't proven harmful but the creatinine confounding makes monitoring harder.",
      "Pre-existing dehydration risk (heat-stress athletes, wrestlers cutting weight) — creatine's intracellular water retention is generally beneficial but in extreme cutting contexts the cellular hydration shift requires consideration",
      "Pregnancy — no specific safety data; generally not recommended due to absence of pregnancy-specific research, not due to known harm",
      "Lactation — no specific data",
      "Underage athletes — creatine is safe and effective in adolescent populations per multiple RCTs; AAP and major sports medicine bodies have acknowledged this. The cultural reluctance to give 'supplements' to teens has more to do with general principle than creatine-specific evidence.",
      "Concurrent diuretics — modest interaction; coordinate hydration",
      "G6PD deficiency — no specific concern with creatine",
    ],
    sourcingNotes:
      "Creatine monohydrate is the gold standard — most evidence, lowest cost. Creapure (the German-manufactured version) is the highest-purity branded product, ~$25–35/month. Generic creatine monohydrate from reputable brands (NOW Foods, BulkSupplements, Optimum Nutrition) is equivalent at lower cost ($15–20/month). Other forms (HCl, ethyl ester, buffered, liquid) have weaker evidence and higher cost — no clear advantage over monohydrate. Avoid 'proprietary blends' that hide creatine dose; verify 5g actual creatine per serving on the label.",
    notes:
      "## Beginner Protocol\n5g daily, mixed with water or any beverage, taken at any time of day. Skip the loading phase — it accelerates saturation but produces the same end-state outcome as continuous 5g/day over 28 days, and loading produces more GI side effects. Initial 1–2 kg weight gain over first 2–4 weeks is intracellular water (good); does not return when discontinued. Consistency matters more than timing — set a routine that ensures daily intake.\n\n## Advanced Protocol\nFor athletes optimizing performance: 5g daily continuous, paired with creatine-loading phases pre-competition (20g/day × 5–7 days) for maximum saturation timing. Stack with: caffeine (pre-workout), beta-alanine 3–5g/day continuous (intramuscular carnosine for buffering during high-intensity work), L-citrulline 6–8g pre-workout (NO precursor), whey or casein protein 1.6–2.2g protein/kg total daily. The creatine + caffeine + beta-alanine + citrulline combination is the most evidence-supported pre-workout / training-support stack available.\n\nFor cognitive use: 5g/day; effects in already-well-fed users are modest but consistent. Vegetarians and vegans see largest cognitive benefit due to low dietary baseline. Older adults benefit cognitively. Sleep-deprived periods (deadline weeks, new parents, shift workers) is where creatine's cognitive benefit is most apparent.\n\n## Reconstitution + Administration\nN/A — oral. Mix 5g (one rounded teaspoon) into water, juice, coffee, smoothie, or any beverage. Slightly gritty texture; doesn't fully dissolve in cold liquid (this is fine — drink the suspension). Pre-mixed liquid creatine products generally have shorter shelf life and higher cost; powder is the standard.\n\n## Synergies\n**Caffeine:** common pre-workout pairing — older studies suggested caffeine might blunt creatine's effect, modern meta-analyses do not support that concern. **Beta-alanine:** complementary mechanism (muscle carnosine for H+ buffering); standard ratio 3–5g/day continuous use. **L-citrulline:** NO precursor for vasodilation / muscle pump; pre-workout dose 6–8g. **Whey protein:** dietary protein adequacy is the foundation; creatine works alongside, not instead of, adequate protein intake.\n\n## Evidence Quality\nMost-evidence-supported performance supplement available. Hundreds of RCTs across multiple sports, populations, ages, and outcomes. Safety profile extensively characterized. Cognitive and bone-health applications are newer research areas with growing positive evidence.\n\n## Research vs Anecdote\nResearch: extensively validated performance benefit; growing cognitive and bone-health evidence; safety profile excellent. Anecdote: near-universal positive reports across sport, fitness, and increasingly cognitive-enhancement communities; the few users reporting GI issues typically resolve with dose splitting or food-coadministration. Decision frame: creatine should be considered foundational for any user training resistance + performance — the evidence-to-cost ratio is the best in the supplement landscape.",
    tags: ["creatine", "creatine monohydrate", "performance", "strength", "hypertrophy", "cognitive", "foundational supplement", "vegetarian", "evidence-based"],
    tier: "entry",
  },

  {
    id: "trigonelline",
    name: "Trigonelline",
    aliases: ["N-methylnicotinic acid", "Trig", "TRIG", "Trigonelline HCl", "Coffee alkaloid trigonelline"],
    category: ["Longevity", "NAD Pathway"],
    categories: ["Longevity", "NAD Pathway"],
    route: ["oral"],
    mechanism:
      "Pyridine alkaloid naturally found in coffee beans (~1% by weight in green coffee), fenugreek seeds, oats, and various legumes. Recently characterized as an NAD+ precursor — a 2023 ETH Zurich research group identified trigonelline as a previously unrecognized member of the NAD-precursor family alongside niacin (NA), nicotinamide (NAM), nicotinamide mononucleotide (NMN), and nicotinamide riboside (NR). The mechanism: trigonelline is converted to nicotinamide via demethylation, then enters the standard NAD biosynthesis salvage pathway. Animal data shows trigonelline supplementation increases muscle NAD+ levels, enhances mitochondrial biogenesis (PGC-1α activation), improves muscle function in aged mice, and extends healthspan markers. The compound is positioned in the longevity-supplement landscape as an emerging alternative to NMN and NR — potentially with better oral bioavailability than NMN (which has well-known pharmacokinetic limitations: rapid liver clearance and conversion to nicotinamide before reaching peripheral tissues). Trigonelline's evidence base is substantially smaller than NMN/NR — fewer clinical trials, less long-term safety data, less established consumer market — but the mechanistic case is similar and the early data is encouraging. Sirtuin pathway activation downstream of NAD+ elevation overlaps mechanistically with caloric restriction and other validated longevity interventions.",
    halfLife: "Plasma half-life ~5 hours; tissue NAD+ effects extend beyond plasma residence",
    reconstitution: { solvent: "N/A — oral capsule or powder", typicalVialMg: 100, typicalVolumeMl: null },
    dosingRange: { low: "50mg/day (entry dose, pairing with other NAD precursors)", medium: "100mg/day (typical longevity dose based on early research)", high: "200mg/day (upper end of practical use)", frequency: "Once daily, AM typical" },
    typicalDose: "100mg orally once daily AM",
    startDose: "50mg/day × 2 weeks to assess tolerance, then 100mg/day",
    titrationNote: "Modest titration. Most users settle at 100mg/day. Limited evidence base means dose-finding is empirical.",
    cycle: "Continuous use — no formal cycling. Some users alternate with NMN or NR weekly to cover different facets of NAD biology, though rationale for this rotation is more theoretical than evidence-based.",
    storage: "Room temperature, dry, away from light",
    benefits: [
      "NAD+ precursor — supports cellular NAD+ pool maintenance, particularly in aging contexts where NAD+ declines",
      "Sirtuin pathway activation downstream of NAD+ elevation",
      "Mitochondrial biogenesis support (PGC-1α activation in animal data)",
      "Potentially better oral bioavailability than NMN (NMN has known PK limitations)",
      "Naturally occurring (coffee, fenugreek) — long human dietary exposure history",
      "Substantially less expensive than NMN ($20–40/month vs $50–150/month)",
      "Newer compound: emerging evidence for muscle aging and sarcopenia mitigation",
    ],
    sideEffects: [
      "Mild GI upset uncommon",
      "Headache rare",
      "Effects on glucose handling: trigonelline modestly improves glucose homeostasis in some studies — relevant for diabetic users (potentially favorable) but worth monitoring for hypoglycemia in users on diabetic medications",
      "Limited long-term safety data — newer compound in supplement landscape",
    ],
    stacksWith: ["nmn", "nicotinamide-riboside", "resveratrol", "spermidine"],
    warnings: [
      "Pregnancy — no specific safety data",
      "Lactation — no specific safety data",
      "Diabetes / on diabetic medications — modest glucose-lowering effects; monitor",
      "Pediatric — no use case established",
      "Limited long-term human safety data — early adopter context, decisions should account for evidence-base immaturity",
      "Concurrent NAD-pathway compounds (NMN, NR, niacin): no documented interactions but combined dosing not extensively studied",
    ],
    sourcingNotes:
      "Available as standalone supplement from emerging brands (Tru Niagen for NR + trigonelline combinations, ProHealth, Quicksilver, several others). Generic trigonelline HCl powder available. Quality control varies — newer compound with less-established supply chain. Cost: ~$20–40/month at typical 100mg/day dosing.",
    notes:
      "## Beginner Protocol\n100mg once daily AM × 8–12 weeks. Bracket with: comprehensive metabolic panel, fasting insulin, hsCRP at baseline. NAD+ levels measurement is available but expensive and not necessary for most users. Track subjective energy, recovery, sleep quality. The compound's effects are subtle — like other NAD precursors, the value frame is cellular maintenance over years rather than acute response.\n\n## Advanced Protocol\nLayer with NMN 250–500mg/day or NR 300mg/day for combined NAD-precursor coverage targeting different facets of NAD biology. Pair with: resveratrol 250mg/day (sirtuin activation), spermidine 1mg/day (autophagy upregulation, complementary mechanism), CoQ10 / Ubiquinol 200mg/day (mitochondrial cofactor), structured exercise (the most evidence-supported NAD+ maintenance intervention). Some users include rapamycin pulse-dosing (5mg weekly) for the comprehensive longevity-stack approach.\n\n## Trigonelline vs NMN vs NR — Decision Frame\n**NMN:** most data (controversial 2022 FDA ruling on supplement classification still working through), most expensive, PK limitations (rapid liver clearance limits peripheral tissue delivery in some users)\n\n**NR (Niagen):** most established commercial product, FDA-cleared GRAS status, second-most data, mid-range cost\n\n**Trigonelline:** emerging evidence base, lower cost, potentially better oral bioavailability, less long-term human safety data\n\n**Niacin / Nicotinamide:** the original NAD precursors — substantial evidence, very inexpensive, but high doses cause flushing (niacin) or modest concern about excess (nicotinamide). Often skipped in modern longevity protocols in favor of NMN/NR despite cost advantage.\n\nFor cost-conscious users, trigonelline offers reasonable value. For users wanting most-established pathway, NR or NMN. For users running comprehensive longevity stacks, combinations are common (no clear evidence on optimal combination).\n\n## Reconstitution + Administration\nN/A — oral capsule or powder. Take with morning meal for consistency.\n\n## Synergies\nNMN, NR, niacin: same NAD pathway — combinations are common in longevity stacks though optimal combinations are not well-established. Resveratrol: sirtuin activation downstream. Spermidine: autophagy via different mechanism. Exercise: most evidence-supported NAD+ maintenance intervention.\n\n## Evidence Quality\nEarly. The 2023 ETH Zurich characterization established trigonelline as NAD precursor with mechanistic plausibility and animal evidence. Human clinical trials are emerging but limited. Long-term safety profile relies on natural dietary exposure (coffee drinkers consume substantial trigonelline daily) rather than formal supplementation studies.\n\n## Research vs Anecdote\nResearch: emerging mechanistic and animal evidence; limited human clinical trial data. Anecdote: early adopter community in longevity-stack space; subjective reports modest (typical of NAD precursors generally — the value frame is long-term cellular maintenance, not acute response). Decision frame: reasonable addition to a longevity stack for users wanting NAD-precursor coverage at lower cost than NMN; not a primary intervention but a supporting cast member.",
    tags: ["trigonelline", "NAD precursor", "longevity", "sirtuin", "mitochondrial biogenesis", "coffee alkaloid", "NMN alternative", "newer compound"],
    tier: "entry",
  },

  {
    id: "pentadeca-arginate",
    name: "Pentadeca Arginate",
    aliases: ["PDA", "Pentadeca", "PDA peptide", "BPC-157 arginate variant"],
    category: ["Healing / Recovery"],
    categories: ["Healing / Recovery"],
    route: ["subcutaneous injection", "oral (claims)"],
    mechanism:
      "Synthetic 15-amino-acid peptide derived from a fragment of the BPC-157 (Body Protection Compound 157) backbone, with an arginate salt formulation intended to improve stability and bioavailability over the parent compound. Emerged as a novel research peptide in 2023–2024 in performance/biohacker markets. The proposed mechanism mirrors BPC-157's: angiogenesis promotion, growth factor expression upregulation (VEGFR2, FGF), nitric oxide pathway modulation, and tissue repair via stimulation of fibroblast and tendon cell migration. Marketing claims position PDA as a 'BPC-157 evolution' with three claimed advantages: (1) greater molecular stability (longer shelf-life, less degradation in bacteriostatic water), (2) improved oral bioavailability (some vendors claim oral PDA delivers systemic effects, where BPC-157 oral has mixed evidence), (3) modestly different binding profile potentially producing additional or different therapeutic effects. **Honest evidence assessment: PDA's evidence base is substantially smaller than BPC-157's, which is itself limited largely to animal data and clinical anecdotes rather than RCT-grade human evidence.** The marketing claims are largely vendor-driven without independent verification. PDA may genuinely deliver on some of these claims, but the catalog cannot confirm them at this stage. For users running BPC-157 successfully, the case for switching to PDA is weak. For users curious about newer compounds, PDA is one of several emerging tissue-repair peptides; the field is evolving rapidly with limited rigorous evidence on any of them.",
    halfLife: "Limited PK data publicly available; estimated similar to BPC-157 (~hours for active fragment, longer tissue effects)",
    reconstitution: { solvent: "Bacteriostatic water; pharmaceutical-grade saline acceptable", typicalVialMg: 5, typicalVolumeMl: 2 },
    dosingRange: { low: "100mcg subQ daily", medium: "250–500mcg subQ daily", high: "500mcg subQ twice daily", frequency: "Daily; injectable subQ standard, oral claimed but unverified" },
    typicalDose: "250–500mcg subQ daily for 4–8 week courses targeting specific injuries or recovery contexts",
    startDose: "100–250mcg subQ daily × 1 week to assess tolerance",
    titrationNote: "Limited evidence base means dose-finding is empirical and largely vendor-driven. Most users mirror BPC-157 dosing patterns.",
    cycle: "Course-based: typical 4–8 weeks targeting specific injury/recovery. Some users run continuous low-dose (100–250mcg daily) for chronic joint or tendon contexts.",
    storage: "Refrigerate after reconstitution. Stability claims of improved shelf life vs BPC-157 are vendor-marketed; treat with skepticism.",
    benefits: [
      "Tissue repair / healing potential (mechanism shared with BPC-157)",
      "Subjectively reported faster recovery from soft-tissue injury (anecdotal)",
      "Marketed advantages over BPC-157: claimed stability, claimed oral bioavailability — neither rigorously verified independently",
      "May be useful for users where BPC-157 has been ineffective or poorly tolerated",
    ],
    sideEffects: [
      "Limited safety data — newer compound, less characterization than BPC-157",
      "Injection site reactions (similar to BPC-157)",
      "Mild local soreness post-injection",
      "Theoretical concerns: any compound promoting angiogenesis warrants caution in users with active or history of malignancy (the same concern that applies to BPC-157, KPV, TB-500, and similar repair peptides)",
    ],
    stacksWith: ["bpc-157", "tb-500", "ipamorelin", "cjc-1295"],
    warnings: [
      "Active or recent malignancy — angiogenic compounds warrant prescriber coordination",
      "Pregnancy and lactation — no safety data",
      "Pediatric — no safety data",
      "Active infection — defer use until resolution",
      "Honest framing: this is an emerging compound with limited evidence base. The marketing claims of BPC-157 superiority are largely vendor-driven. Users with specific BPC-157 failure or intolerance may find PDA useful; users without those contexts should consider whether they're paying premium for marketing rather than mechanism.",
      "Sourcing reality: research-peptide market with variable quality control; counterfeit and underdosed product common",
    ],
    sourcingNotes:
      "Research peptide market only. Not FDA-approved for any indication. Available via research-peptide vendors (legal in most jurisdictions for 'research use only'). Quality control variable; reputable vendors that third-party test for purity preferred. Cost: ~$80–150 per 5mg vial. Compounding pharmacies in some jurisdictions offer prescription-style PDA via wellness-clinic referrals; quality typically higher than research-peptide channels.",
    notes:
      "## Beginner Protocol\nFor users targeting specific injury or recovery context (joint, tendon, soft-tissue): 250mcg subQ daily × 4–6 weeks. Reconstitute 5mg vial with 2.5mL bacteriostatic water = 2mg/mL = 0.125mL per 250mcg dose. Apply subQ to abdomen. Track recovery markers, pain levels, range of motion, training capacity weekly.\n\n## Advanced Protocol\nLayer with BPC-157 250mcg subQ daily (the parent compound — mechanistic synergy or redundancy debated), TB-500 2mg subQ weekly (peptide-class repair), CJC-1295/Ipamorelin GH peptide blend 100mcg/100mcg subQ pre-bed (GH-axis recovery support), comprehensive nutrient base (collagen 10–20g/day, vitamin C 1g/day for collagen synthesis, omega-3 2g/day for anti-inflammatory support).\n\n## PDA vs BPC-157 — Decision Frame\nFor users running BPC-157 successfully: continue with BPC-157. The evidence base is larger, the cost is similar, the mechanistic framework is shared. PDA does not offer clearly superior outcomes that justify switching.\n\nFor users for whom BPC-157 has been ineffective or poorly tolerated: PDA is a reasonable alternative trial — slightly different binding profile may produce different individual response.\n\nFor users new to tissue-repair peptides: BPC-157 is the more-established choice with larger anecdotal and animal evidence base. PDA is the newer entrant with vendor marketing claims that haven't been rigorously verified.\n\n## Reconstitution + Administration\nReconstitute 5mg vial with 2–2.5mL bacteriostatic water. Refrigerate post-reconstitution. 27–29 gauge insulin syringe, subQ to abdomen or thigh. Aspirate before injection. Site rotation.\n\n## Synergies\n**BPC-157:** parent compound — shared mechanism, sometimes stacked. **TB-500:** different repair-peptide mechanism, common pairing. **GH peptides (CJC-1295, Ipamorelin, Tesamorelin):** GH-axis recovery support. **Collagen + Vitamin C + glycine:** dietary substrate support for collagen synthesis.\n\n## Evidence Quality\nLow. PDA is a newer compound with limited published research. The mechanistic case is reasonable (shared backbone with BPC-157) but the specific claims of superiority over BPC-157 are vendor-driven without independent verification. The catalog includes PDA because users will encounter it in performance/recovery communities — not because the evidence base supports preferential use.\n\n## Research vs Anecdote\nResearch: minimal — vendor-published claims and limited animal work. Anecdote: emerging in performance/recovery communities; subjective reports mixed (some users report distinct benefit, others find equivalent to BPC-157 or no clear effect). Honest assessment: this is an early-adopter compound with marketing-driven hype. The mechanistic case is reasonable, the evidence base is too small to draw strong conclusions, and the cost/benefit currently favors established alternatives (BPC-157) for most users. Decision frame: experimental addition for users curious about emerging compounds; not a foundational recommendation.",
    tags: ["PDA", "pentadeca arginate", "BPC-157 derivative", "healing", "tissue repair", "recovery", "emerging compound", "research peptide"],
    tier: "entry",
  },

  // ============================================================================
  // SECTION 2 — SARMs / Research Compounds (3)
  // ============================================================================

  {
    id: "ostarine",
    name: "Ostarine (MK-2866)",
    aliases: ["MK-2866", "Enobosarm", "GTx-024", "S-22", "Ostarine"],
    category: ["SARMs", "Longevity"],
    categories: ["SARMs", "Longevity"],
    route: ["oral"],
    mechanism:
      "Selective androgen receptor modulator (SARM). Originally developed by GTx Inc. (now Veru) as a tissue-selective alternative to anabolic-androgenic steroids — designed to produce anabolic effects in muscle and bone while sparing prostate, skin, and other androgen-receptor-expressing tissues that drive AAS adverse effects. Mechanism: partial agonist at the androgen receptor with tissue-selective conformational changes that produce different downstream gene expression patterns in different tissues. In muscle and bone, ostarine binding produces full anabolic activation. In prostate, scalp, and sebaceous glands, the binding produces less androgenic activation than testosterone or DHT. Pharmacology: oral bioavailability (no first-pass alkylation required, unlike oral AAS — distinct mechanism), half-life ~24 hours allowing once-daily dosing, no significant aromatization to estradiol. Clinical development history: Phase III trials for cancer cachexia (POWER 1 and 2 trials) and stress urinary incontinence (ASTRID). Failed to meet primary endpoints in cancer cachexia trials despite showing lean mass increases — the failure was on functional outcomes (stair-climb power) rather than body composition, ending the FDA-approval pathway. Never received FDA approval for any indication. Currently sold globally as 'research chemical' for non-medical use; banned by WADA, NCAA, military testing programs, and most professional sports. Performance use: substantially expanded since ~2015 in bodybuilding, strength, and physique communities as the 'SARMs revolution' alternative to traditional AAS. Despite lower androgenic profile, real adverse effects accumulate at performance doses.",
    halfLife: "Plasma half-life ~24 hours; once daily dosing typical",
    reconstitution: { solvent: "N/A — oral capsule or oral liquid suspension (research chemical formats)", typicalVialMg: null, typicalVolumeMl: null },
    dosingRange: { low: "5–10mg/day (community-reported low)", medium: "12.5–25mg/day (common community-reported range)", high: "Performance protocols extend higher; this catalog does not provide performance-dosing recipes", frequency: "Once daily, oral" },
    typicalDose: "Catalog does not provide performance-use dosing protocols. The compound has no FDA-approved medical indication, so 'typical medical dose' is not applicable. For users engaging in non-medical use, community-reported ranges are 12.5–25mg/day.",
    startDose: "N/A — no medical indication",
    titrationNote: "N/A — no medical indication",
    cycle: "Performance-use cycles typically 8–12 weeks per community reports. Catalog framing: lab-monitoring framework is non-negotiable for any user (see notes); cycle length affects degree of HPG axis suppression and recovery.",
    storage: "Room temperature, dry. Research-chemical product quality variable.",
    benefits: [
      "Tissue-selective profile produces less prostate, scalp, and sebaceous gland impact than traditional AAS — a real pharmacological distinction",
      "Originally developed for legitimate medical indications (cancer cachexia, sarcopenia, osteoporosis, stress urinary incontinence)",
      "No 17α-alkylation — distinct hepatic risk profile from oral AAS, though hepatotoxicity at performance doses is documented",
      "No aromatization to estradiol — avoids estrogen-related side effects",
      "Demonstrated lean mass and bone density increases in clinical trials",
      "Note: catalog inclusion is for accuracy — these compounds exist, users encounter them. The 'benefits' framing acknowledges the pharmacology without endorsing non-medical use.",
    ],
    sideEffects: [
      "HPG axis suppression — testosterone production decreases on cycle, recovery typically 4–8 weeks post-cycle. Less severe than testosterone-based AAS but real and dose-dependent.",
      "Lipid panel disruption — HDL drops moderately (less severe than oral AAS or stanozolol but real)",
      "Liver enzyme elevations — modest at low doses, more significant at higher doses; not a 17α-alkylated compound but hepatic effects observed in clinical trials",
      "Potential tendon issues — some reports of tendon changes, mechanism unclear",
      "Subjective reports of fatigue, lethargy on cycle in some users (mechanism unclear)",
      "Visual side effects (yellow-tint vision, night vision changes) — rare, reversible, similar to some other SARMs",
      "Long-term safety: unknown — never approved, no long-term post-marketing surveillance data",
    ],
    stacksWith: ["hcg", "cardio-iq-panel"],
    warnings: [
      "NOT FDA-APPROVED for any indication. Not legal for human consumption in the US per FDA — sold as 'research chemicals' not for human use, a regulatory framing the bodybuilding/SARMs community largely ignores.",
      "Banned by WADA, NCAA, military testing — competitive athletes will fail drug tests; ostarine has been responsible for multiple high-profile athletic suspensions",
      "Quality control: research-chemical market has documented variability — independent testing has found ostarine products that are underdosed, overdosed, contaminated with other SARMs or AAS, or contain no active compound at all. The 'reputable third-party tested vendor' framing is the community's harm-reduction approach.",
      "Long-term safety unknown",
      "Pregnancy — Category X equivalent, absolute avoidance",
      "Lactation — not for use",
      "Active malignancy — coordinate with oncologist; SARMs developed for cancer cachexia have complex tumor-effect profile",
      "Pediatric / adolescent use — particularly concerning given developmental androgen receptor signaling roles",
      "Severe hepatic impairment — caution",
      "Active or recent CV disease — caution; HDL impact",
      "Concurrent AAS — additive HPG suppression",
      "PERFORMANCE USE: this catalog does not provide bodybuilding-protocol dosing. The same lab-monitoring framework that applies to AAS applies here — lipids, liver enzymes, CBC with hematocrit, BP, HPG axis labs (testosterone, LH, FSH), estradiol. The 'mild' SARM framing has driven naive community use; the actual side effect profile, while gentler than AAS, is not benign.",
    ],
    sourcingNotes:
      "Research-chemical market only. Not legally sold for human consumption in the US. Available from international research-chemical vendors and underground sourcing channels. Quality variable; third-party testing services (Janoshik, Anabolic Lab) help verify product but are imperfect. Costs: $50–100/month at typical community-reported dosing — cheaper than AAS, contributing to community uptake.",
    notes:
      "## Catalog Framing\nOstarine is included in the catalog because users encounter it widely in performance communities. The catalog provides accurate pharmacology + harm-reduction framework, not protocols. Same policy as AAS-medical entries: factual information, lab-monitoring framework, no performance-dosing recipes, honest discussion of risks and unknowns.\n\n## Lab Monitoring Framework (Required for Any SARM Use)\nBaseline + every 8–12 weeks during use + post-cycle: lipid panel (HDL primary concern), liver enzymes (ALT, AST, GGT, bilirubin), CBC with hematocrit, basic metabolic panel, BP at every visit, total testosterone + free testosterone + LH + FSH (HPG axis), estradiol, PSA in men >40. Post-cycle recovery monitoring: HPG axis labs at 4 weeks and 8–12 weeks post-cycle to confirm recovery. The HDL drop and HPG suppression are the most clinically meaningful signals.\n\n## Performance Use Discussion (Harm-Reduction Frame, Not Endorsement)\nOstarine is widely used in bodybuilding, physique, and recreational performance communities as the 'mildest SARM' or 'beginner SARM.' The catalog does NOT provide bodybuilding-protocol dosing. For users engaging in non-medical use against medical advice: (1) lab monitoring framework above is non-negotiable; (2) physician supervision (TRT clinic familiar with SARMs, or sports medicine physician) is genuinely safer than forum-guided use; (3) post-cycle therapy (PCT) with clomiphene, tamoxifen, or HCG supports HPG axis recovery; (4) third-party tested products from reputable vendors reduce (don't eliminate) the quality-control risk; (5) 'mild' SARM framing has driven naive long-cycle and high-dose use that produces more substantial adverse effects than the marketing suggests; (6) competitive athletes will test positive — ostarine is one of the most-tested-for SARMs in WADA, NCAA, and military programs.\n\nEvidence-based alternatives for cosmetic muscle gain remain testosterone replacement therapy (with documented hypogonadism), GH peptides (CJC-1295/Ipamorelin), creatine, dietary protein optimization, structured resistance training. None match ostarine's acute effects, but none carry the same HPG suppression, lipid disruption, or quality-control risks.\n\n## Reconstitution + Administration\nN/A — oral capsule or oral liquid suspension (research-chemical formats). Once daily dosing.\n\n## Synergies (Medical Context Only)\nNo medical synergies — there are no FDA-approved medical indications for ostarine. In performance contexts, HCG is sometimes used to maintain testicular function during cycles; cardio-IQ inflammation panels monitor metabolic risk markers.\n\n## Evidence Quality\nClinical trial evidence: Phase III trials (POWER 1, POWER 2 for cancer cachexia; ASTRID for stress urinary incontinence) demonstrated lean mass and bone density effects but failed to meet primary functional endpoints. Did not receive FDA approval. Performance-use evidence: observational community reports, no RCT data on performance dosing. Long-term safety: unknown, no post-marketing surveillance.\n\n## Research vs Anecdote\nResearch: well-characterized pharmacology from Phase III trials; tissue-selective profile is real; HPG suppression and lipid effects are documented; long-term safety is unknown. Anecdote: extensive performance-community use generates substantial dosing and side-effect data, consistent with the documented adverse effect profile from clinical trials. Decision frame: a real pharmacological distinction from AAS exists (tissue selectivity), but 'mild' is relative — the side effect profile is not benign and the quality-control reality of research-chemical sourcing introduces additional risk. The catalog provides this framing because users will encounter ostarine and deserve accurate information; the catalog does not endorse non-medical use.",
    tags: ["SARM", "ostarine", "MK-2866", "enobosarm", "research chemical", "WADA banned", "selective androgen receptor modulator", "cancer cachexia (Phase III)", "non-FDA-approved"],
    tier: "entry",
  },

  {
    id: "ligandrol",
    name: "Ligandrol (LGD-4033)",
    aliases: ["LGD-4033", "VK5211", "Anabolicum", "Ligandrol"],
    category: ["SARMs", "Longevity"],
    categories: ["SARMs", "Longevity"],
    route: ["oral"],
    mechanism:
      "Selective androgen receptor modulator (SARM). Originally developed by Ligand Pharmaceuticals; subsequently developed by Viking Therapeutics as VK5211 for hip fracture rehabilitation. More potent than ostarine — reaches similar anabolic effects at lower doses (5–10mg vs ostarine's 12.5–25mg community-reported ranges). Mechanism shared with ostarine: tissue-selective androgen receptor partial agonism with full anabolic activation in muscle and bone, less androgenic activation in prostate/scalp/sebaceous tissue. Compared to ostarine: greater potency means more anabolic effect per mg, but also greater HPG suppression per mg, more substantial lipid disruption, and more pronounced hepatic effects. Phase II trials demonstrated lean mass increases in healthy older men and in hip-fracture rehabilitation contexts (modestly improved outcomes vs placebo). Phase III development for hip fracture rehabilitation continues but FDA approval has not been achieved. WADA banned 2013. Performance use: positioned in community as the 'next step up' from ostarine — more potent, more androgenic-seeming muscle effects, but more substantial side effect profile. Multiple high-profile athletic suspensions for ligandrol use have shaped sport regulatory enforcement.",
    halfLife: "Plasma half-life ~24–36 hours; once daily dosing typical",
    reconstitution: { solvent: "N/A — oral capsule or oral liquid suspension (research chemical formats)", typicalVialMg: null, typicalVolumeMl: null },
    dosingRange: { low: "2.5–5mg/day (community low end)", medium: "5–10mg/day (community typical)", high: "Performance protocols extend higher; catalog does not provide performance-dosing recipes", frequency: "Once daily, oral" },
    typicalDose: "Catalog does not provide performance-use dosing protocols. No FDA-approved medical indication.",
    startDose: "N/A — no medical indication",
    titrationNote: "N/A",
    cycle: "Community-reported cycles 6–10 weeks. Same lab-monitoring framework as ostarine.",
    storage: "Room temperature. Research-chemical quality variable.",
    benefits: [
      "More potent than ostarine — greater anabolic effect per mg",
      "Tissue-selective profile (less prostate/scalp/skin impact than traditional AAS)",
      "No aromatization to estradiol",
      "Phase II trials demonstrated lean mass increases in older men",
      "Catalog inclusion for accuracy: this compound is widely encountered in performance communities",
    ],
    sideEffects: [
      "HPG axis suppression — substantial; testosterone often dramatically suppressed at performance doses; recovery typically 6–12 weeks post-cycle",
      "Lipid panel disruption — HDL drops more substantially than ostarine; LDL elevation moderate",
      "Liver enzyme elevations — more pronounced than ostarine; rare cases of significant hepatic injury reported in performance-use case reports",
      "Subjective fatigue, lethargy on cycle (mechanism unclear)",
      "Long-term safety unknown",
      "Quality-control concerns same as ostarine — research-chemical market variability",
    ],
    stacksWith: ["hcg", "cardio-iq-panel"],
    warnings: [
      "NOT FDA-APPROVED for any indication",
      "Banned by WADA, NCAA, professional sports — multiple high-profile athletic suspensions for ligandrol",
      "More potent HPG suppression than ostarine — recovery period longer; PCT (post-cycle therapy) considerations more substantial",
      "More liver impact than ostarine — monitor closely",
      "Pregnancy — Category X equivalent, absolute avoidance",
      "Lactation — not for use",
      "Active malignancy — coordinate with oncologist",
      "Pediatric / adolescent use — particularly concerning",
      "Severe hepatic impairment — caution",
      "Active or recent CV disease — caution; HDL impact more pronounced than ostarine",
      "Concurrent AAS — additive HPG suppression dangerous",
      "PERFORMANCE USE: catalog does not provide bodybuilding-protocol dosing. Same lab-monitoring framework as ostarine — even more critical given ligandrol's greater potency and more substantial side effect profile.",
    ],
    sourcingNotes:
      "Research-chemical market only. Not legally sold for human consumption. Same quality-control concerns as ostarine. Costs similar ($50–100/month at community-reported dosing). Third-party testing services help verify but are imperfect.",
    notes:
      "## Catalog Framing\nSame as ostarine: included for accuracy, not endorsement. Lab-monitoring framework is the safety floor for any non-medical use. Catalog does not provide performance-dosing recipes.\n\n## Lab Monitoring Framework (Required)\nIdentical to ostarine but with greater intensity given ligandrol's greater potency: baseline + every 6–8 weeks during use + post-cycle. Lipid panel (HDL crash more substantial than ostarine), liver enzymes (more impact than ostarine), CBC with hematocrit, BP, HPG axis labs (substantially suppressed on cycle, recovery 6–12 weeks post), estradiol, PSA in men >40.\n\n## Ligandrol vs Ostarine — Decision Frame\n**Ostarine:** milder, less HPG suppression, less hepatic impact, less HDL crash. The 'beginner SARM' positioning is partially accurate.\n\n**Ligandrol:** more potent, more substantial side effect profile, more concerning hepatic signal, more dramatic HPG suppression. The 'next step up' positioning corresponds to a real escalation in side effect risk, not just a dose-response on the same risk.\n\nFor users who would consider any SARM use, the 'start with the milder one' framing is not unreasonable harm reduction — though the catalog's primary framing remains that non-medical SARM use is not endorsed and evidence-based alternatives exist.\n\n## Performance Use Discussion (Harm-Reduction Frame)\nIdentical framing to ostarine: catalog does not provide protocols; lab monitoring is non-negotiable; physician supervision genuinely safer than forum-guided use; PCT with clomiphene/tamoxifen supports HPG recovery; quality-control risks are real; competitive athletes will test positive. Evidence-based alternatives same as ostarine — TRT for documented hypogonadism, GH peptides, creatine, training, dietary protein.\n\n## Reconstitution + Administration\nN/A — oral capsule or liquid suspension. Once daily.\n\n## Synergies\nNo medical synergies (no FDA-approved indication). Performance-context HCG and cardio-IQ panels same as ostarine.\n\n## Evidence Quality\nPhase II trial evidence in older men and hip-fracture rehabilitation contexts demonstrated lean mass effects. No FDA approval. Performance-use evidence is observational community reports.\n\n## Research vs Anecdote\nResearch: pharmacology characterized; HPG suppression and hepatic effects more pronounced than ostarine; long-term safety unknown. Anecdote: substantial community use; reports of more pronounced 'wet' look (some water retention) and stronger anabolic effect per mg vs ostarine; reports of more difficult recovery post-cycle. Decision frame: more potent SARM with more substantial side effect profile; mild SARM framing applies less to ligandrol than to ostarine. Catalog provides factual information; does not endorse non-medical use.",
    tags: ["SARM", "ligandrol", "LGD-4033", "VK5211", "Anabolicum", "research chemical", "WADA banned", "non-FDA-approved", "more potent than ostarine"],
    tier: "entry",
  },

  {
    id: "sr-9009",
    name: "SR-9009 (Stenabolic)",
    aliases: ["SR9009", "Stenabolic", "Stena", "Rev-Erb agonist"],
    category: ["Longevity", "Mitochondrial"],
    categories: ["Longevity", "Mitochondrial"],
    route: ["oral (limited bioavailability)", "subcutaneous injection"],
    mechanism:
      "**SR-9009 is NOT a SARM** — despite frequent miscategorization in performance communities. It is a synthetic agonist of REV-ERBα (and REV-ERBβ to a lesser extent), nuclear receptors that regulate circadian rhythm, lipid metabolism, glucose handling, and mitochondrial biogenesis. Mechanism: REV-ERB activation suppresses BMAL1 expression (a core circadian clock gene), shifts cellular metabolism toward enhanced fatty acid oxidation, increases mitochondrial biogenesis, and modulates inflammation. Animal data is impressive: Scripps Research Institute studies (Burris lab) showed substantial increases in exercise capacity (~50% increase in time-to-exhaustion in mice), enhanced fat oxidation, improved glucose handling, and metabolic 'exercise mimetic' effects. The compound generated significant biohacker community excitement in the mid-2010s. **The critical reality check that breaks the hype: SR-9009 has very poor oral bioavailability — likely <5% based on PK studies.** This means oral SR-9009 (the form most commonly sold in research-chemical markets) likely produces minimal systemic effect at any reasonable dose. Subcutaneous injection improves bioavailability but the compound has not been developed as an injectable for human use. Combined with widespread counterfeit and underdosed product in the research-chemical market, SR-9009 is among the most-likely-to-disappoint compounds in the performance-supplement landscape. Honest framing: the mechanism is genuinely interesting, the animal data is compelling, but the human translation is bottlenecked by pharmacokinetics that the supplement market largely ignores.",
    halfLife: "Plasma half-life ~3–4 hours when bioavailable; oral PK limited by extensive first-pass metabolism",
    reconstitution: { solvent: "N/A — research-chemical formats vary (oral powder, oral liquid suspension; injectable formats from some sources but quality variable)", typicalVialMg: null, typicalVolumeMl: null },
    dosingRange: { low: "10–20mg/day (community low; likely subtherapeutic given oral PK)", medium: "30–40mg/day split (community typical)", high: "Performance protocols extend higher; oral bioavailability limits effectiveness regardless", frequency: "Multiple times daily oral due to short half-life; injectable rare and quality-suspect" },
    typicalDose: "Catalog does not provide performance-use dosing protocols. The honest framing: oral SR-9009 likely doesn't deliver enough systemic compound at any realistic dose to produce meaningful effects.",
    startDose: "N/A",
    titrationNote: "N/A",
    cycle: "Community-reported cycles 4–8 weeks. Subjective effects often subtle, consistent with the bioavailability limitation.",
    storage: "Room temperature. Research-chemical quality variable.",
    benefits: [
      "Mechanism is genuinely novel and interesting (REV-ERB pathway activation)",
      "Animal data shows impressive effects on exercise capacity, fat oxidation, mitochondrial biogenesis",
      "If bioavailability problem could be solved, the mechanistic case for performance/longevity benefit is strong",
      "Catalog includes for accuracy: users encounter SR-9009 in performance communities, deserve accurate information including the bioavailability reality",
    ],
    sideEffects: [
      "Most common reported side effect: nothing — consistent with poor oral bioavailability",
      "When effects are reported (likely from higher-quality injectable product or unusually responsive users): mild fatigue, sleep disruption (the compound's circadian-modulating mechanism), modest GI changes",
      "Long-term safety: unknown",
      "Theoretical concerns: REV-ERB modulation affects circadian rhythm, cellular metabolism, and inflammation — long-term effects of pharmacological modulation of these pathways are not characterized in humans",
    ],
    stacksWith: ["cardarine"],
    warnings: [
      "NOT FDA-APPROVED for any indication. No human clinical trials. All evidence is animal-model based.",
      "Banned by WADA",
      "Pregnancy — no safety data",
      "Lactation — no safety data",
      "Pediatric — no use case, no safety data",
      "Active malignancy — REV-ERB pathway has complex tumor-modulating effects in animal models; coordinate with oncologist",
      "Sleep disorders — circadian-modulating mechanism may affect sleep quality",
      "Quality control: research-chemical market with poor oral bioavailability creates a uniquely bad situation — most product is likely underdosed AND most users wouldn't notice the difference because the compound doesn't work orally anyway",
      "PERFORMANCE USE: catalog does not provide protocols. Honest assessment: SR-9009 is among the highest-disappointment-risk compounds in performance supplementation due to bioavailability limitations.",
    ],
    sourcingNotes:
      "Research-chemical market only. Oral formats predominant despite poor oral bioavailability — a longstanding mismatch between commercial supply and pharmacology. Injectable formats from some research-chemical vendors; quality highly variable. Cost: ~$50–80/month for oral; injectable typically more expensive. The catalog's honest framing: the cost/benefit equation for SR-9009 is poor for most users due to PK limitations.",
    notes:
      "## Catalog Framing\nIncluded for accuracy because users encounter SR-9009 in performance communities, frequently miscategorized as a SARM. The catalog provides accurate mechanism (Rev-Erb agonist, NOT SARM) plus the critical bioavailability reality check that the marketing largely omits.\n\n## The Bioavailability Reality\nSR-9009's poor oral bioavailability is the dominant practical factor. Animal studies that drive the impressive performance claims used either intraperitoneal injection (mice) or formulations not commercially available to humans. The compound's molecular structure (high lipophilicity, extensive first-pass metabolism) explains the PK limitations. Until a bioavailability solution emerges (prodrug, injectable formulation, novel delivery system), oral SR-9009 in research-chemical formats is unlikely to reproduce the animal effects in humans at any realistic dose.\n\n## What Actually Works for the Effects SR-9009 Promises\nFor users seeking mitochondrial biogenesis + enhanced fat oxidation + exercise capacity improvements, evidence-based alternatives include: structured aerobic + resistance training (the actual most-effective intervention), creatine, beta-alanine, caffeine, GLP-1 agonists for metabolic effects, rapamycin pulse-dosing for mTOR-pathway longevity benefit, NAD precursors (NMN, NR, trigonelline) for mitochondrial support. None reproduce SR-9009's specific REV-ERB mechanism, but the downstream effects users want are achievable through validated interventions.\n\n## Reconstitution + Administration\nN/A — oral or injectable depending on source. Catalog framing: oral product is likely subtherapeutic.\n\n## Synergies\nCardarine (GW-501516): commonly stacked with SR-9009 in performance communities for combined PPAR-δ + REV-Erb mechanism. Cardarine has its own significant safety concerns (terminated cancer-mortality animal data led to discontinued clinical development); not endorsed by catalog.\n\n## Evidence Quality\nAnimal data: impressive, multiple studies. Human data: essentially zero. Bioavailability data: poor, consistent with limited oral effectiveness. The translation from animal evidence to human use is bottlenecked by PK rather than pharmacology — a critical distinction the marketing obscures.\n\n## Research vs Anecdote\nResearch: animal mechanism well-characterized; PK limitations well-characterized; human translation absent. Anecdote: community reports consistently underwhelm vs the marketing-driven expectations — consistent with the bioavailability limitation. Decision frame: SR-9009 is among the most-overhyped, least-likely-to-deliver compounds in current performance supplementation. The mechanism is genuinely interesting, but the practical reality for users is that oral SR-9009 in research-chemical formats likely doesn't work. Cost/benefit favors abstention.",
    tags: ["SR-9009", "Stenabolic", "Rev-Erb agonist", "NOT a SARM", "research chemical", "poor oral bioavailability", "WADA banned", "exercise mimetic (animal data)"],
    tier: "entry",
  },
];