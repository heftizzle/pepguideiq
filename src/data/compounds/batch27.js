/** Batch 27 — GH Peptides Migration Cluster (6 entries, 6 migrations).
 *
 *  Six PEPTIDES_CORE migrations rewritten at full long-form depth.
 *  Largest single migration cluster shipped to date (vs prior max of 5
 *  in BATCH26). Clears 6 contiguous PEPTIDES_CORE entries (lines 100-105
 *  per user verification) representing the entire GH-axis peptide cluster.
 *
 *    CJC-1295 DAC — MIGRATED. GHRH analog with Drug Affinity Complex
 *      extending half-life to ~1 week; sustained GH/IGF-1 elevation
 *      pattern; weekly dosing.
 *    CJC-1295 no-DAC (Modified GRF 1-29) — MIGRATED. GHRH analog without
 *      DAC; ~30 minute half-life; pulsatile GH release matching natural
 *      rhythm; multi-daily dosing; classical pairing with Ipamorelin.
 *    Ipamorelin — MIGRATED. Selective GHRP without cortisol/prolactin
 *      elevation; cleanest profile of GHRP class; companion to CJC-1295
 *      no-DAC in classical pulsatile GH stack.
 *    Sermorelin — MIGRATED. GHRH 1-29 fragment; foundational GHRH analog;
 *      FDA approval history for pediatric GH deficiency (commercially
 *      withdrawn 2008 but compounded forms persist).
 *    Hexarelin — MIGRATED. Older-generation GHRP with substantial
 *      cortisol/prolactin elevation; largely superseded by Ipamorelin's
 *      cleaner profile; honest framing on why most users now skip it.
 *    Tesamorelin — MIGRATED. FDA-approved Egrifta for HIV-associated
 *      lipodystrophy; common off-label visceral fat reduction and
 *      longevity use; pharmaceutical-grade GHRH analog.
 *
 *  Theme: comprehensive GH-axis peptide coverage. The cluster represents
 *  the two major mechanistic classes — GHRH analogs (CJC-1295, Sermorelin,
 *  Tesamorelin) and GHRPs / ghrelin agonists (Ipamorelin, Hexarelin) — that
 *  produce synergistic GH release when combined.
 *
 *  HGH 191AA (exogenous recombinant growth hormone) is mechanistically
 *  distinct from the GH peptide class and deserves its own tile in a
 *  future TRT/HRT-pharmacy batch. Cross-referenced in CJC-1295 tiles
 *  for users navigating the HGH-vs-GH-peptides decision.
 *
 *  Migration accounting:
 *    PEPTIDES_CORE: 42 → 36 (−6)
 *    ALL_COMPOUNDS: 266 → 272 (+6)
 *    Total catalog: 308 → 308 (no net new ids; 6 migrated)
 *
 *  Schema matches BATCH7-26.
 */
export const BATCH27 = [
  {
    id: "cjc-1295-dac",
    name: "CJC-1295 DAC",
    aliases: ["CJC-1295 with DAC", "CJC-1295 with Drug Affinity Complex", "Modified GRF 1-29 with DAC", "DAC:GRF"],
    category: ["GH Peptides", "Longevity"],
    categories: ["GH Peptides", "Longevity"],
    route: ["subcutaneous"],
    mechanism:
      "GHRH (growth hormone-releasing hormone) analog based on the GRF 1-29 fragment with **Drug Affinity Complex (DAC) modification** — a maleimidopropionic acid linker attached to the peptide that covalently binds to circulating serum albumin in vivo. The DAC modification dramatically extends plasma half-life from minutes (native GHRH) to **~6-8 days (CJC-1295 DAC)** by protecting the peptide from peptidase degradation and providing a circulating depot via albumin binding. Original development by ConjuChem (Canadian biopharmaceutical company) in early 2000s as a long-acting GHRH analog for pediatric GH deficiency and adult growth hormone deficiency contexts; pharmaceutical development was discontinued but the molecule entered the research peptide community where it became a foundational long-acting GHRH option. **Mechanism — sustained GHRH receptor activation (the central distinguishing effect)**: while native GHRH and short-acting GHRH analogs (Sermorelin, CJC-1295 no-DAC) produce pulsatile GH release matching natural diurnal rhythm, CJC-1295 DAC produces **sustained GHRH receptor stimulation over days** — the albumin-bound depot continuously activates pituitary somatotrophs. This produces **elevated baseline GH/IGF-1 levels** (a 'flatlined' rather than pulsatile pattern). The pharmacokinetic and pharmacodynamic differences vs short-acting analogs have substantive implications for choice: DAC's sustained elevation is more analogous to exogenous HGH replacement in elevation pattern; pulsatile short-acting analogs more closely mimic natural physiology. **Mechanism — somatotroph hyperplasia concern (the central long-term safety question)**: sustained GHRH receptor stimulation produces somatotroph (pituitary GH-producing cell) hyperplasia in animal models. The clinical significance for human long-term safety is debated — pituitary hyperplasia could theoretically progress to adenoma formation with sustained chronic exposure. The natural pulsatile GH pattern includes low-GHRH troughs that allow somatotroph recovery; sustained DAC elevation eliminates these recovery periods. This consideration argues for cycling DAC use rather than indefinite continuous administration. **Mechanism — IGF-1 elevation**: sustained GH elevation produces sustained IGF-1 elevation. Elevated IGF-1 has complex aging effects — high IGF-1 is associated with reduced lifespan in many model organisms (mTOR activation, accelerated cellular aging) but provides anabolic benefits relevant for body composition and recovery. The longevity-vs-anabolic trade-off is real and worth honest framing. **Mechanism — synergy with GHRPs**: when paired with GHRPs (Ipamorelin, GHRP-2, GHRP-6), CJC-1295 DAC's sustained GHRH receptor activation amplifies the GHRP-driven GH pulses; the combination produces substantially higher GH release than either alone. The classical 'GH stack' approach uses this synergy. **Pharmacokinetics**: subcutaneous administration; plasma half-life ~6-8 days via albumin binding; biological effects sustained ~7-10 days per dose; weekly dosing typical (some protocols use 2× weekly).",
    halfLife: "Plasma half-life ~6-8 days via DAC-mediated albumin binding; biological effects sustained 7-10 days per dose",
    reconstitution: { solvent: "Bacteriostatic Water", typicalVialMg: 2, typicalVolumeMl: 2 },
    dosingRange: { low: "1mg per week (entry)", medium: "2mg per week (typical research/protocol use)", high: "2mg twice weekly (high-end use; some protocols)", frequency: "Weekly subcutaneous; 2× weekly some protocols" },
    typicalDose: "2mg subcutaneous once weekly",
    startDose: "1mg subcutaneous × first dose to assess tolerance; then 2mg weekly",
    titrationNote: "Effects on IGF-1 measurable within 1-2 weeks via lab work; subjective effects (improved sleep, body composition trends, recovery) often perceptible within weeks. The sustained elevation pattern produces steady-state effects rather than pulsatile subjective experience.",
    cycle: "**Cycling recommended** due to somatotroph hyperplasia concerns with sustained chronic stimulation. Standard protocols: 8-12 weeks on / 4-8 weeks off; or 16 weeks on / 8 weeks off. Continuous indefinite use is mechanistically questionable from long-term safety perspective even if subjective tolerability is good.",
    storage: "Lyophilized: refrigerate (2–8°C). Reconstituted: refrigerate; use within 28-30 days.",
    benefits: [
      "Sustained GHRH receptor activation — elevated baseline GH/IGF-1 levels over days per dose",
      "Weekly dosing convenience — substantially less frequent than no-DAC alternatives",
      "Body composition support — increased lean mass, reduced visceral fat trends in users with sustained protocols",
      "Recovery enhancement — improved soft tissue recovery, sleep architecture",
      "Sleep quality improvement — particularly deep sleep / GH-pulse-associated sleep architecture",
      "IGF-1 elevation — anabolic effects relevant for body composition and tissue repair",
      "Synergy with GHRPs (Ipamorelin) for amplified GH release",
      "Pairs naturally with comprehensive longevity / body composition stacks",
      "Pharmaceutical-development heritage (ConjuChem) — established mechanism characterization",
    ],
    sideEffects: [
      "Injection site reactions — most common; usually mild",
      "Water retention / edema — particularly early in protocol",
      "Joint pain / arthralgias — common with elevated GH/IGF-1",
      "Carpal tunnel symptoms — fluid retention impact on median nerve",
      "Insulin resistance / glucose elevation — GH antagonizes insulin; chronic use may worsen glucose tolerance; monitor fasting glucose / HbA1c if running sustained protocols",
      "Headache uncommon",
      "Mild fatigue / malaise during early titration",
      "**Somatotroph hyperplasia risk** — animal model concern with chronic sustained stimulation; clinical significance for humans debated",
      "Long-term safety with sustained continuous use unclear",
    ],
    stacksWith: ["ipamorelin", "cjc-1295-no-dac", "sermorelin", "tesamorelin"],
    warnings: [
      "**Cycling required for safety** — somatotroph hyperplasia concerns with chronic sustained stimulation",
      "Pregnancy — no safety data; contraindicated",
      "Lactation — no safety data; contraindicated",
      "Pediatric — pediatric GH replacement is a clinical use; coordinate with pediatric endocrinologist; off-label use without indication contraindicated",
      "Active malignancy — GH/IGF-1 elevation has complex tumor-effect profile (some cancers driven by IGF-1 signaling); coordinate with oncologist; relative contraindication",
      "Family history of cancer driven by IGF-1 signaling (some breast, prostate, colorectal) — additional caution; coordinate with prescriber",
      "Diabetes / insulin resistance — GH antagonizes insulin; coordinate with prescriber; monitor glucose",
      "Active retinopathy — GH/IGF-1 may worsen proliferative retinopathy",
      "Concurrent corticosteroids — antagonistic effects on GH/IGF-1",
      "Concurrent insulin or hypoglycemic agents — coordinate with prescriber for diabetes management",
      "Active acromegaly or pituitary adenoma — contraindicated",
      "Sleep apnea — GH may worsen obstructive sleep apnea",
      "Quality control — research peptide quality varies; verify DAC modification specifically (vendors sometimes substitute no-DAC product when labeled DAC); COA verification important",
      "Athletes subject to drug testing — GH-releasing peptides on WADA Prohibited List under Category S2 peptide hormones; banned in competition",
      "**Cross-reference: HGH 191AA (recombinant exogenous growth hormone) is mechanistically distinct from GH peptides; users navigating HGH-vs-GH-peptides decision should evaluate both options separately**",
    ],
    sourcingNotes:
      "Research peptide; not FDA-approved (ConjuChem development discontinued). Reputable research peptide vendors. Verify DAC modification on COA — vendors sometimes mislabel no-DAC product as DAC. Cost: ~$80-120 per 2mg vial (4-8 weeks supply at typical dose). Pharmaceutical-grade compounded versions available with prescription via some integrative endocrinologists.",
    notes:
      "## CJC-1295 DAC vs CJC-1295 no-DAC — The Decision That Matters Most\n\nThe two CJC-1295 forms are mechanistically distinct enough to warrant separate tiles in this catalog rather than form-selection within a single tile. The choice has substantive implications:\n\n**CJC-1295 DAC (this entry):**\n- Half-life ~6-8 days via albumin binding\n- Weekly dosing convenience\n- **Sustained 'flatlined' GH/IGF-1 elevation pattern**\n- More analogous to exogenous HGH replacement in elevation pattern\n- **Somatotroph hyperplasia concern with chronic continuous stimulation**\n- Cycling required for long-term safety\n- Better choice for users prioritizing dosing convenience and steady-state IGF-1 elevation\n\n**CJC-1295 no-DAC / Modified GRF 1-29 (separate tile):**\n- Half-life ~30 minutes\n- Multi-daily dosing required (typically 2-3× daily)\n- **Pulsatile GH release matching natural diurnal rhythm**\n- Closer to physiological GH pattern\n- No sustained somatotroph stimulation concern\n- Better choice for users prioritizing physiological mimicry and long-term safety profile\n\n**Decision frame:**\n- **For convenience + steady-state IGF-1 elevation:** CJC-1295 DAC\n- **For physiological mimicry + long-term safety:** CJC-1295 no-DAC\n- **For maximum GH release in cycled protocols:** Either, paired with Ipamorelin\n- **For users running long-term continuous protocols:** Strong preference for no-DAC or short cycles of DAC with breaks\n\n## HGH 191AA Cross-Reference\n\nUsers comparing GH peptides to recombinant human growth hormone (HGH 191AA) should understand the distinction:\n\n**HGH 191AA (recombinant exogenous GH):**\n- Direct exogenous GH replacement (the hormone itself)\n- Pharmaceutical-grade FDA regulation (Genotropin, Norditropin, Humatrope, etc.)\n- Most potent GH/IGF-1 elevation\n- Direct supraphysiological elevation potential\n- Higher cost\n- More potential side effects at sustained supraphysiological levels\n- Covered as separate tile in future TRT/HRT-pharmacy batch\n\n**GH Peptides (this batch):**\n- Stimulate endogenous GH production via pituitary\n- Less potent absolute GH elevation\n- Pulsatile (no-DAC) or sustained (DAC) release patterns\n- Research peptide regulatory status\n- Lower cost\n- Generally milder side effect profile at typical doses\n\nNeither approach is universally 'better' — the choice depends on user priorities, regulatory comfort, cost considerations, and long-term safety preferences. Many users explore both approaches at different life stages or for different applications.\n\n## Beginner Protocol\n1mg subcutaneous × first dose to assess tolerance; then 2mg/week × 8 weeks. Track IGF-1 at baseline, 4 weeks, 8 weeks. Track subjective: sleep quality, recovery, body composition trends, joint pain, glucose if relevant.\n\n## Advanced Protocol\n**Comprehensive GH stack:** CJC-1295 DAC 2mg/week + Ipamorelin 200-300mcg subQ 2-3× daily (the synergistic GHRP pulses on top of DAC's sustained GHRH stimulation). Cycle 8-12 weeks on / 4-8 weeks off. Track IGF-1 + body composition + glucose.\n\n**Body composition / longevity stack:** GH peptide stack + comprehensive longevity foundation (NAD precursors, mitochondrial pillar, foundational supplements) + structured exercise and nutrition foundation. The GH peptide layer provides anabolic and recovery support; the longevity foundation addresses other aging mechanisms.\n\n## Reconstitution + Administration\nLyophilized 2mg vial; reconstitute with 2mL bacteriostatic water → 1mg/mL working concentration. Subcutaneous injection (insulin syringe), abdominal or thigh sites, rotate. Refrigerate reconstituted; use within 28-30 days.\n\n## Synergies\n**Ipamorelin:** complementary GHRP for synergistic GH release; the classical pairing. **CJC-1295 no-DAC:** alternative form for users wanting pulsatile pattern. **Sermorelin:** alternative GHRH analog; rarely combined with DAC. **Tesamorelin:** pharmaceutical-grade GHRH analog with FDA approval for specific indication.\n\n## Clinical Trial Citations Worth Knowing\nConjuChem clinical development pipeline (Phase II for GH deficiency, ~2002-2008) before discontinuation. Teichman 2006 (foundational pharmacokinetics paper). Animal model evidence for somatotroph hyperplasia with chronic stimulation. Limited modern Western RCT evidence for off-label use cases.\n\n## Evidence Quality\nMechanism well-characterized. Pharmaceutical development heritage establishes pharmacokinetic and basic safety profile. Long-term human safety with sustained continuous use less characterized. The somatotroph hyperplasia concern is animal-model based; clinical translation to humans debated.\n\n## Research vs Anecdote\nResearch: solid mechanism characterization; pharmaceutical development heritage; long-term continuous-use safety questions. Anecdote: extensive research peptide community use; subjective effects on sleep / recovery / body composition often perceptible; the convenience advantage (weekly dosing) drives DAC selection over no-DAC for many users despite the somatotroph hyperplasia consideration. Decision frame: convenience-prioritized GHRH analog; cycling required for safety; pairs with Ipamorelin for synergistic GH release; the DAC vs no-DAC choice is mechanistically substantial; users running long-term protocols should consider no-DAC or short-cycle DAC patterns.",
    tags: ["CJC-1295", "CJC-1295 DAC", "Drug Affinity Complex", "GHRH analog", "GRF 1-29", "growth hormone releasing hormone", "long-acting", "weekly dosing", "GH peptide", "IGF-1", "somatotroph hyperplasia"],
    tier: "entry",
  },

  {
    id: "cjc-1295-no-dac",
    name: "CJC-1295 no-DAC",
    aliases: ["CJC-1295 without DAC", "Modified GRF 1-29", "ModGRF(1-29)", "Mod GRF 1-29", "MGRF"],
    category: ["GH Peptides", "Longevity"],
    categories: ["GH Peptides", "Longevity"],
    route: ["subcutaneous"],
    mechanism:
      "GHRH (growth hormone-releasing hormone) analog based on the **GRF 1-29 fragment** with four amino acid substitutions to enhance enzymatic stability vs native GHRH (D-Ala²-, Gln⁸-, Ala¹⁵-, Leu²⁷-GRF 1-29) — but **without** the Drug Affinity Complex modification. The compound is also commonly called **Modified GRF 1-29** or **ModGRF(1-29)** — these names are interchangeable with 'CJC-1295 no-DAC' in research peptide community use, though technically Modified GRF 1-29 is the more accurate technical name (CJC-1295 properly refers only to the DAC-modified form developed by ConjuChem). The amino acid modifications protect the molecule from enzymatic degradation enough to be biologically active (vs native GHRH's near-instant breakdown) while preserving the **short half-life and pulsatile GH release pattern** characteristic of physiological GHRH function. **Mechanism — pulsatile GH release matching natural rhythm (the central distinguishing feature)**: native GHRH from hypothalamus produces brief GH pulses; pituitary somatotrophs respond with bursts of GH secretion. Between pulses, GHRH levels drop and somatotrophs recover. This pulsatile pattern is fundamental to physiological GH biology — sustained continuous GHRH stimulation (as occurs with CJC-1295 DAC) eliminates these recovery troughs. Modified GRF 1-29's ~30-minute half-life produces brief GH pulses similar to natural rhythm — particularly valuable when timed to pre-sleep dosing (matching the natural GH-pulse-associated deep sleep phase) and pre/post exercise dosing (amplifying training-stimulated GH release). **Mechanism — no somatotroph hyperplasia concern**: the pulsatile mechanism includes GHRH troughs that allow somatotroph recovery; chronic sustained stimulation (the DAC concern) is absent. Long-term safety profile is more favorable for sustained continuous use than CJC-1295 DAC. **Mechanism — synergy with GHRPs (the classical CJC + Ipamorelin pairing)**: GHRH analogs and GHRPs work via different receptors (GHRH receptor vs ghrelin receptor / GHS-R) and produce synergistic GH release when combined. The classical pairing — **CJC-1295 no-DAC + Ipamorelin** — produces substantially higher GH pulses than either compound alone. The combination is the most-used GH peptide protocol in research peptide community use. **Pharmacokinetics**: subcutaneous administration; plasma half-life ~30 minutes; biological effects (GH pulse) sustained ~1-2 hours; multi-daily dosing required for sustained protocol effect.",
    halfLife: "Plasma half-life ~30 minutes; biological effects sustained ~1-2 hours per dose; multi-daily dosing for sustained protocol",
    reconstitution: { solvent: "Bacteriostatic Water", typicalVialMg: 2, typicalVolumeMl: 2 },
    dosingRange: { low: "100mcg per dose (entry)", medium: "100-200mcg per dose 2-3× daily (typical research/protocol use)", high: "300mcg per dose 3× daily (high-end use)", frequency: "2-3× daily subcutaneous; pre-sleep dose typical (matching natural GH-pulse-associated deep sleep); pre/post exercise additional doses common" },
    typicalDose: "100-200mcg subcutaneous 2-3× daily; pre-sleep dose mandatory for protocol benefit",
    startDose: "100mcg pre-sleep × 1 week to assess tolerance, then 2-3× daily protocol",
    titrationNote: "Effects on sleep architecture often noticeable within first week (improved deep sleep quality is the most subjectively perceptible immediate effect). IGF-1 elevation measurable on lab work within 2-4 weeks. Body composition / recovery effects accumulate over months.",
    cycle: "**Continuous use is mechanistically reasonable** vs DAC's cycling requirement — the pulsatile mechanism doesn't produce the somatotroph hyperplasia concern. Some users still cycle 12-16 weeks on / 4-8 weeks off as conservative practice. No formal cycling requirement based on current evidence.",
    storage: "Lyophilized: refrigerate. Reconstituted: refrigerate; use within 28-30 days.",
    benefits: [
      "**Pulsatile GH release matching natural diurnal rhythm** — closer to physiological GH pattern than DAC sustained elevation",
      "Pre-sleep dosing amplifies natural deep-sleep-associated GH pulse — substantially improved sleep architecture",
      "No somatotroph hyperplasia concern — long-term safety profile more favorable for sustained use vs DAC",
      "Body composition support via cycled GH/IGF-1 elevation",
      "Recovery enhancement — improved soft tissue recovery, sleep quality",
      "**Synergy with GHRPs (Ipamorelin) — the classical pairing produces substantially higher GH release than either alone**",
      "Lower somatotroph desensitization risk vs DAC's chronic stimulation",
      "Suitable for long-term continuous protocols in users prioritizing physiological mimicry",
      "Pre-exercise dosing amplifies training-stimulated GH release",
      "Pairs naturally with Ipamorelin (the central use case), comprehensive body composition / longevity stacks",
    ],
    sideEffects: [
      "Injection site reactions — most common; usually mild",
      "Mild flushing post-injection — common; transient",
      "Mild fatigue or sleepiness post-injection — particularly with pre-sleep dose; usually desired",
      "Vivid dreams — common; consistent with deep sleep enhancement",
      "Mild headache uncommon",
      "Mild glucose elevation in some users — less pronounced than DAC due to pulsatile pattern",
      "Joint pain / water retention — less common than DAC; pulsatile mechanism produces less sustained effects",
      "Carpal tunnel symptoms uncommon at standard doses",
      "Hypoglycemia post-injection in some users — particularly if dosed away from meals",
    ],
    stacksWith: ["ipamorelin", "cjc-1295-dac", "sermorelin", "tesamorelin"],
    warnings: [
      "Pregnancy — no safety data; avoid",
      "Lactation — no safety data; avoid",
      "Pediatric — pediatric GH replacement is a clinical use case; coordinate with pediatric endocrinologist",
      "Active malignancy — GH/IGF-1 elevation has complex tumor-effect profile; coordinate with oncologist; relative contraindication",
      "Family history of IGF-1-driven cancers (some breast, prostate, colorectal) — additional caution",
      "Diabetes / insulin resistance — GH antagonizes insulin; coordinate with prescriber; monitor glucose; less concern than DAC due to pulsatile pattern",
      "Active retinopathy — GH/IGF-1 may worsen proliferative retinopathy",
      "Concurrent corticosteroids — antagonistic effects on GH/IGF-1",
      "Concurrent insulin or hypoglycemic agents — coordinate for diabetes management",
      "Active acromegaly or pituitary adenoma — contraindicated",
      "Sleep apnea — GH may worsen obstructive sleep apnea",
      "Quality control — research peptide quality varies; verify Modified GRF 1-29 / no-DAC specifically (vendors sometimes substitute DAC product); COA verification important",
      "Athletes subject to drug testing — GH-releasing peptides on WADA Prohibited List under Category S2 peptide hormones; banned in competition",
    ],
    sourcingNotes:
      "Research peptide; not FDA-approved. Reputable research peptide vendors. Cost: ~$60-100 per 2mg vial (10-15 days supply at 2-3× daily dosing). Pharmaceutical-grade compounded versions available with prescription via some integrative endocrinologists. **More cost-efficient at protocol scale** than DAC due to lower per-mg cost despite higher dosing frequency.",
    notes:
      "## The Classical CJC-1295 no-DAC + Ipamorelin Pairing\n\nThis combination is the most-used GH peptide protocol in research peptide community use, for good mechanistic reasons:\n\n**Why pair them:**\n- CJC-1295 no-DAC activates GHRH receptors (one signaling pathway)\n- Ipamorelin activates ghrelin receptors (different signaling pathway)\n- Both pathways converge on somatotroph GH release but via independent mechanisms\n- The combination produces **synergistic** GH release — substantially higher than additive effects of either alone\n- Both have short half-lives matching pulsatile rhythm\n- Both have favorable safety profiles vs alternatives in their classes\n\n**Standard combined protocol:**\n- CJC-1295 no-DAC 100-200mcg + Ipamorelin 200-300mcg, mixed in same syringe, subcutaneous\n- Pre-sleep dose mandatory (the central protocol benefit — amplified deep sleep GH pulse)\n- Optional pre-workout / post-workout doses for training-stimulated GH amplification\n- Optional morning dose for daytime IGF-1 baseline\n\n**Why not combine CJC-1295 DAC + Ipamorelin instead:**\n- Works mechanistically but produces sustained elevation pattern that defeats Ipamorelin's pulsatile contribution\n- Loses the natural-rhythm-mimicking benefit of pulsatile dosing\n- The somatotroph hyperplasia concern remains with DAC component\n- Most experienced users prefer no-DAC + Ipamorelin specifically\n\n## Beginner Protocol\n100mcg pre-sleep × 1 week (tolerance assessment), then 100mcg pre-sleep + 100mcg AM + optional 100mcg pre-workout. Pair with Ipamorelin 200mcg matching doses (mixed in same syringe). Track sleep quality (the most subjectively perceptible immediate effect), IGF-1 at baseline and 4-8 weeks, body composition, recovery.\n\n## Advanced Protocol\n**Standard pulsatile GH stack (the central use case):**\n- CJC-1295 no-DAC 200mcg + Ipamorelin 300mcg pre-sleep (mixed)\n- CJC-1295 no-DAC 200mcg + Ipamorelin 300mcg AM fasted (mixed)\n- Optional: CJC-1295 no-DAC 200mcg + Ipamorelin 300mcg pre-workout (mixed)\n- Continuous protocol acceptable; some users cycle 12-16 weeks on / 4-8 weeks off\n\n**Body composition / longevity stack:** GH peptide stack + comprehensive longevity foundation (NAD precursors, mitochondrial pillar, foundational supplements) + structured exercise and nutrition foundation.\n\n**Athletic recovery / training context:** GH peptide stack timed pre/post-workout for training-stimulated GH amplification; pairs with TRT (covered separately) and comprehensive recovery foundation (BPC-157, TB-500, etc.).\n\n## Reconstitution + Administration\nLyophilized 2mg vial; reconstitute with 2mL bacteriostatic water → 1mg/mL working concentration (0.1mL = 100mcg; 0.2mL = 200mcg). Insulin syringe required for accurate small-volume dosing. **Mix with Ipamorelin in same syringe** for combined protocol — both compounds compatible at standard concentrations. Subcutaneous injection, abdominal or thigh sites, rotate. Refrigerate reconstituted; use within 28-30 days.\n\n## Synergies\n**Ipamorelin:** the classical pairing — substantially synergistic GH release. **CJC-1295 DAC:** alternative form for users wanting weekly dosing convenience. **Sermorelin:** alternative GHRH analog. **Tesamorelin:** pharmaceutical-grade GHRH analog. **Mitochondrial pillar:** complementary energy / recovery foundation. **Comprehensive longevity stack:** complementary mechanisms.\n\n## Clinical Trial Citations Worth Knowing\nLimited direct RCT evidence for off-label use cases. Mechanism characterized via pituitary GH release studies. The classical CJC-1295 no-DAC + Ipamorelin pairing has been validated through extensive research peptide community use rather than formal clinical trials.\n\n## Evidence Quality\nMechanism well-characterized — GHRH analog activity, pulsatile release pattern, GHRP synergy. Pharmaceutical heritage via GHRH research establishes pharmacokinetic and basic safety profile. Long-term safety with continuous use favorable vs DAC due to lack of somatotroph hyperplasia concern.\n\n## Research vs Anecdote\nResearch: solid mechanism characterization; pulsatile pattern matches physiological rhythm; favorable long-term safety profile vs DAC. Anecdote: extensive research peptide community use; the no-DAC + Ipamorelin pairing is the most-used GH peptide protocol; subjective effects on sleep often perceptible within first week; pairs with comprehensive longevity / body composition stacks. Decision frame: physiology-mimicking GHRH analog with favorable long-term safety profile; pairs with Ipamorelin for synergistic pulsatile GH release; pre-sleep dosing is central protocol element; multi-daily dosing requirement is the trade-off vs DAC's weekly convenience.",
    tags: ["CJC-1295 no-DAC", "Modified GRF 1-29", "ModGRF(1-29)", "GHRH analog", "GRF 1-29", "pulsatile GH", "short-acting", "physiological GH pattern", "Ipamorelin pairing", "GH peptide"],
    tier: "entry",
  },

  {
    id: "ipamorelin",
    name: "Ipamorelin",
    aliases: ["NNC-26-0161", "Selective GHRP", "Pentapeptide GHRP"],
    category: ["GH Peptides", "Longevity"],
    categories: ["GH Peptides", "Longevity"],
    route: ["subcutaneous"],
    mechanism:
      "Synthetic pentapeptide (Aib-His-D-2-Nal-D-Phe-Lys-NH2) classified as a **GHRP (growth hormone releasing peptide)** / ghrelin receptor agonist. Developed by Novo Nordisk as part of the GHRP research program; entered clinical development for GH deficiency contexts before discontinuation, with the molecule subsequently entering the research peptide community where it became the dominant GHRP due to its substantially cleaner side effect profile vs alternatives in the class. **Mechanism — selective ghrelin receptor agonism (the central distinguishing feature)**: Ipamorelin activates the ghrelin receptor (GHS-R / growth hormone secretagogue receptor) on pituitary somatotrophs, triggering GH release via a different pathway from GHRH analogs. **Critically, Ipamorelin does NOT substantially elevate cortisol, prolactin, or aldosterone** — distinguishing it from older GHRPs (GHRP-2, GHRP-6, Hexarelin) which produce off-target HPA axis activation. The clean profile is the central reason Ipamorelin has supplanted older GHRPs for most research peptide community use. **Mechanism — GH release amplification when paired with GHRH analogs**: ghrelin receptor and GHRH receptor activate complementary pathways converging on somatotroph GH release; combined activation produces substantially greater GH release than either alone. **The classical CJC-1295 no-DAC + Ipamorelin pairing** is the central use case — Ipamorelin's clean profile + CJC-1295 no-DAC's GHRH activation = synergistic GH release without the off-target effects of older GHRPs. **Mechanism — minimal hunger effects vs older GHRPs**: GHRP-6 in particular produces substantial hunger increase via central ghrelin signaling (a 'side effect' that can be useful for users wanting appetite enhancement). Ipamorelin's modified structure produces minimal central appetite effects — clean GH release without unwanted hunger. **Mechanism — sleep architecture support**: Ipamorelin pre-sleep dosing amplifies the natural deep-sleep-associated GH pulse; users typically report improved sleep quality and recovery. **Mechanism — minimal somatotroph desensitization**: Ipamorelin's pulsatile mechanism allows somatotroph recovery between doses; long-term continuous use produces minimal desensitization vs sustained-stimulation alternatives. **Pharmacokinetics**: subcutaneous administration; plasma half-life ~2 hours; biological effects (GH pulse) sustained ~1-2 hours; multi-daily dosing for sustained protocol.",
    halfLife: "Plasma half-life ~2 hours; biological effects sustained ~1-2 hours per dose",
    reconstitution: { solvent: "Bacteriostatic Water", typicalVialMg: 5, typicalVolumeMl: 2 },
    dosingRange: { low: "100mcg per dose (entry)", medium: "200-300mcg per dose 2-3× daily (typical research/protocol use; the standard CJC pairing dose)", high: "500mcg per dose 3× daily (high-end use)", frequency: "2-3× daily subcutaneous; pre-sleep dose typical; pre/post exercise additional doses common" },
    typicalDose: "200-300mcg subcutaneous 2-3× daily; pre-sleep dose mandatory for protocol benefit; typically mixed with CJC-1295 no-DAC",
    startDose: "100-200mcg pre-sleep × 1 week, then 2-3× daily protocol",
    titrationNote: "Effects on sleep architecture often noticeable within first week. IGF-1 elevation measurable within 2-4 weeks. Body composition / recovery effects accumulate over months.",
    cycle: "Continuous use is mechanistically reasonable due to clean profile and pulsatile mechanism. Some users cycle 12-16 weeks on / 4-8 weeks off as conservative practice. No formal cycling requirement based on current evidence.",
    storage: "Lyophilized: refrigerate. Reconstituted: refrigerate; use within 28-30 days.",
    benefits: [
      "**Selective ghrelin receptor agonism — clean GHRP profile without cortisol/prolactin/aldosterone elevation**",
      "Substantially superior side effect profile vs older GHRPs (GHRP-2, GHRP-6, Hexarelin)",
      "Pulsatile GH release matching natural rhythm",
      "**Synergistic GH release when paired with GHRH analogs (CJC-1295 no-DAC) — the classical pairing**",
      "Pre-sleep dosing amplifies natural deep-sleep-associated GH pulse",
      "Minimal hunger / appetite effects vs GHRP-6",
      "Body composition support via cycled GH/IGF-1 elevation",
      "Recovery enhancement — soft tissue recovery, sleep quality",
      "Minimal somatotroph desensitization with continuous use",
      "Suitable for long-term protocols in users prioritizing safety profile",
      "Pairs naturally with CJC-1295 no-DAC (the central use case), CJC-1295 DAC, comprehensive body composition / longevity stacks",
      "Novo Nordisk pharmaceutical heritage — pharmaceutical-grade mechanism characterization",
    ],
    sideEffects: [
      "Generally exceptionally well tolerated for the GHRP class",
      "Injection site reactions — most common; usually mild",
      "Mild fatigue or sleepiness post-injection — particularly with pre-sleep dose; usually desired",
      "Mild flushing post-injection",
      "Vivid dreams — common; consistent with deep sleep enhancement",
      "Mild headache uncommon",
      "Minimal cortisol elevation (vs substantial elevation with GHRP-6, Hexarelin)",
      "Minimal prolactin elevation (vs substantial elevation with older GHRPs)",
      "Mild hunger increase in some users — substantially less than GHRP-6",
      "Mild glucose elevation possible — less than GHRH analogs",
    ],
    stacksWith: ["cjc-1295-no-dac", "cjc-1295-dac", "sermorelin", "tesamorelin"],
    warnings: [
      "Pregnancy — no safety data; avoid",
      "Lactation — no safety data; avoid",
      "Pediatric — pediatric GH replacement is a clinical use case; coordinate with pediatric endocrinologist",
      "Active malignancy — GH/IGF-1 elevation has complex tumor-effect profile; coordinate with oncologist; relative contraindication",
      "Family history of IGF-1-driven cancers — additional caution",
      "Diabetes — GH antagonizes insulin; coordinate with prescriber; monitor glucose; less concern than GHRH analogs due to selective profile",
      "Active retinopathy — relative caution",
      "Concurrent corticosteroids — antagonistic effects on GH/IGF-1",
      "Active acromegaly or pituitary adenoma — contraindicated",
      "Sleep apnea — GH may worsen obstructive sleep apnea",
      "Quality control — research peptide quality varies; verify product purity via vendor COA",
      "Athletes subject to drug testing — GH-releasing peptides on WADA Prohibited List under Category S2 peptide hormones; banned in competition",
    ],
    sourcingNotes:
      "Research peptide; not FDA-approved (Novo Nordisk development discontinued). Reputable research peptide vendors. Cost: ~$60-100 per 5mg vial. Pharmaceutical-grade compounded versions available with prescription via some integrative endocrinologists.",
    notes:
      "## Why Ipamorelin Supplanted Older GHRPs\n\nIpamorelin emerged as the dominant GHRP in research peptide community use because of its substantially superior side effect profile vs alternatives:\n\n**Ipamorelin (this entry):**\n- Selective ghrelin receptor agonism\n- Minimal cortisol elevation\n- Minimal prolactin elevation\n- Minimal aldosterone effects\n- Minimal hunger increase\n- Clean GH release without HPA axis disruption\n\n**GHRP-6 (older generation, not in catalog as separate tile):**\n- Substantial hunger increase (sometimes desired effect)\n- Modest cortisol elevation\n- Modest prolactin elevation\n- More side effects per unit GH release\n\n**GHRP-2 (older generation, not in catalog):**\n- Higher GH-stimulating potency than Ipamorelin\n- Substantial cortisol and prolactin elevation\n- Less favorable for sustained use\n\n**Hexarelin (covered separately in this batch):**\n- Highest GH-stimulating potency of the GHRP class\n- Substantial cortisol and prolactin elevation (problematic with sustained use)\n- Largely superseded by Ipamorelin for most use cases\n\nThe clean profile makes Ipamorelin suitable for long-term protocols where older GHRPs' off-target effects compound over time. For users encountering 'GHRP' as a class, Ipamorelin is the appropriate default choice.\n\n## Beginner Protocol\n200mcg subcutaneous pre-sleep × 1 week (tolerance), then 200-300mcg 2-3× daily. Mix with CJC-1295 no-DAC 200mcg same syringe for the classical pairing. Track sleep quality, IGF-1 at baseline and 4-8 weeks, body composition.\n\n## Advanced Protocol\n**Classical pulsatile GH stack (the central use case):**\n- Ipamorelin 300mcg + CJC-1295 no-DAC 200mcg pre-sleep (mixed)\n- Ipamorelin 300mcg + CJC-1295 no-DAC 200mcg AM fasted (mixed)\n- Optional: same combination pre-workout\n- Continuous protocol acceptable\n\n**Body composition / longevity stack:** GH peptide stack + comprehensive longevity foundation + structured exercise/nutrition.\n\n**Conservative longer-cycle approach:** Some users cycle 12-16 weeks on / 4-8 weeks off as conservative practice; the clean profile makes continuous use mechanistically reasonable but cycling is defensible.\n\n## Reconstitution + Administration\nLyophilized 5mg vial; reconstitute with 2mL bacteriostatic water → 2.5mg/mL working concentration (0.1mL = 250mcg). Insulin syringe required. **Mix with CJC-1295 no-DAC same syringe** for combined protocol. Subcutaneous injection, abdominal or thigh sites, rotate. Refrigerate reconstituted; use within 28-30 days.\n\n## Synergies\n**CJC-1295 no-DAC:** the classical pairing — substantially synergistic GH release. **CJC-1295 DAC:** alternative GHRH for users wanting weekly dosing convenience. **Sermorelin:** alternative GHRH analog. **Tesamorelin:** pharmaceutical-grade GHRH analog. **Mitochondrial pillar:** complementary recovery foundation.\n\n## Clinical Trial Citations Worth Knowing\nNovo Nordisk clinical development (Phase II for GH deficiency; ~2000s) before discontinuation. Selective ghrelin receptor agonism mechanism well-characterized. Long-term research peptide community use establishes general safety profile.\n\n## Evidence Quality\nMechanism well-characterized — selective ghrelin receptor agonism, clean profile, pulsatile GH release, GHRH analog synergy. Novo Nordisk pharmaceutical heritage establishes pharmacokinetic and basic safety profile. Long-term continuous-use safety appears favorable based on extensive research peptide community use.\n\n## Research vs Anecdote\nResearch: solid mechanism characterization; selective ghrelin receptor agonism; favorable side effect profile vs alternatives in class. Anecdote: dominant GHRP in research peptide community use; the clean profile is the central reason for selection over alternatives; pairs with CJC-1295 no-DAC in classical protocol. Decision frame: clean-profile GHRP for synergistic GH release with GHRH analogs; the central GHRP in modern research peptide protocols; pre-sleep dosing is central protocol element; pairs with CJC-1295 no-DAC as the standard combination.",
    tags: ["Ipamorelin", "GHRP", "ghrelin receptor agonist", "selective GHRP", "pentapeptide", "Novo Nordisk", "GH peptide", "clean profile", "CJC pairing", "deep sleep"],
    tier: "entry",
  },

  {
    id: "sermorelin",
    name: "Sermorelin",
    aliases: ["GHRH 1-29", "GRF(1-29)", "Geref", "Sermorelin acetate"],
    category: ["GH Peptides", "Longevity"],
    categories: ["GH Peptides", "Longevity"],
    route: ["subcutaneous"],
    mechanism:
      "Synthetic 29-amino-acid peptide corresponding to the **biologically active fragment of native human GHRH (growth hormone-releasing hormone)** — the first 29 amino acids of the 44-amino-acid native hormone, which retains essentially all of the biological activity of full-length GHRH. Sermorelin is the **foundational GHRH analog** — the original synthetic GHRH used in clinical practice. **Sermorelin was FDA-approved in 1990 as Geref** (Serono pharmaceutical) for diagnosis and treatment of pediatric growth hormone deficiency. **Geref was withdrawn from the US commercial market in 2008** — not for safety reasons but for commercial reasons (Serono discontinued production; pediatric GH deficiency market shifted to recombinant HGH 191AA which provides more potent and predictable elevation). Sermorelin remains available via **compounding pharmacies with prescription** in the US, and as research peptide via various vendors. **Mechanism — GHRH receptor activation**: Sermorelin binds GHRH receptors on pituitary somatotrophs, triggering GH release via cAMP signaling cascade — the same mechanism as native GHRH and the modern GHRH analogs (CJC-1295 forms). The pulsatile pattern matches natural physiology. **Mechanism — short half-life / pulsatile pattern**: Sermorelin's plasma half-life is ~10-20 minutes — substantially shorter than even Modified GRF 1-29's ~30 minutes. This produces very brief GH pulses approximating native GHRH function. The short half-life requires multi-daily dosing for sustained protocol effect. **Mechanism — somatotroph preservation**: pulsatile mechanism preserves somatotroph function long-term; no chronic stimulation concerns. **Mechanism — clinical pharmaceutical heritage (the distinguishing feature)**: Sermorelin's FDA approval and decades of pediatric clinical use establish a safety and efficacy profile that newer-generation GHRH analogs (CJC-1295 forms, Tesamorelin) inherited but don't have to the same depth. The pharmaceutical heritage matters for users prioritizing clinical-evidence-base over modern convenience. **Sermorelin vs Modified GRF 1-29 (CJC-1295 no-DAC)**: both are short-acting GHRH analogs with similar mechanisms; the practical differences are: (1) Sermorelin's slightly shorter half-life produces marginally more pulsatile pattern; (2) CJC-1295 no-DAC's amino acid modifications provide slightly enhanced potency per mg; (3) Sermorelin has clinical pharmaceutical heritage; (4) CJC-1295 no-DAC is more commonly available and lower cost in current research peptide market. Most users encountering both make functionally similar choices. **Pharmacokinetics**: subcutaneous administration; plasma half-life ~10-20 minutes; biological effects (GH pulse) sustained ~1-2 hours; multi-daily dosing for sustained protocol.",
    halfLife: "Plasma half-life ~10-20 minutes (the shortest among GH peptides in this batch); biological effects ~1-2 hours per dose",
    reconstitution: { solvent: "Bacteriostatic Water", typicalVialMg: 3, typicalVolumeMl: 2 },
    dosingRange: { low: "100mcg per dose (entry)", medium: "200-300mcg per dose 1-3× daily (typical research/protocol use)", high: "500mcg per dose 3× daily (high-end use)", frequency: "1-3× daily subcutaneous; pre-sleep dose typical" },
    typicalDose: "200-300mcg subcutaneous pre-sleep; additional 1-2 daily doses for sustained protocol",
    startDose: "100mcg pre-sleep × 1 week, then standard dosing",
    titrationNote: "Effects on sleep architecture often noticeable within first week. IGF-1 elevation measurable within 2-4 weeks.",
    cycle: "Continuous use is mechanistically reasonable due to pulsatile mechanism. Pediatric clinical use was continuous; some adult longevity protocols cycle 12-16 weeks on / 4-8 weeks off as conservative practice.",
    storage: "Lyophilized: refrigerate. Reconstituted: refrigerate; use within 28-30 days. Generally less stable than CJC-1295 no-DAC due to shorter peptide modifications.",
    benefits: [
      "Foundational GHRH analog — original synthetic GHRH with FDA pharmaceutical heritage (Geref, 1990)",
      "Pulsatile GH release matching native GHRH function — closest to physiological pattern of GH peptides",
      "No somatotroph hyperplasia concern — pulsatile mechanism preserves long-term somatotroph function",
      "Sleep architecture support — pre-sleep dosing amplifies natural deep-sleep-associated GH pulse",
      "Body composition support via cycled GH/IGF-1 elevation",
      "Recovery enhancement",
      "Synergy with GHRPs (Ipamorelin) for amplified GH release",
      "Clinical pharmaceutical heritage — substantial safety and efficacy data from pediatric clinical use",
      "Compounding pharmacy availability with prescription — pharmaceutical-grade option for users preferring prescriber-coordinated route",
      "Suitable for long-term protocols",
    ],
    sideEffects: [
      "Generally well tolerated",
      "Injection site reactions — most common; usually mild",
      "Mild flushing post-injection",
      "Mild fatigue post-injection — particularly pre-sleep dose; usually desired",
      "Vivid dreams common",
      "Mild headache uncommon",
      "Mild glucose elevation possible",
      "Pediatric clinical use established excellent long-term safety profile",
    ],
    stacksWith: ["ipamorelin", "cjc-1295-no-dac", "cjc-1295-dac", "tesamorelin"],
    warnings: [
      "Pregnancy — no safety data; avoid",
      "Lactation — no safety data; avoid",
      "Pediatric GH deficiency — Sermorelin's original FDA-approved indication; coordinate with pediatric endocrinologist",
      "Active malignancy — GH/IGF-1 elevation has complex tumor-effect profile; coordinate with oncologist; relative contraindication",
      "Family history of IGF-1-driven cancers — additional caution",
      "Diabetes — GH antagonizes insulin; coordinate with prescriber",
      "Active retinopathy — relative caution",
      "Concurrent corticosteroids — antagonistic effects on GH/IGF-1",
      "Active acromegaly or pituitary adenoma — contraindicated",
      "Sleep apnea — GH may worsen obstructive sleep apnea",
      "Quality control — research peptide quality varies; pharmaceutical compounded version provides reliable potency for users wanting prescriber-coordinated source",
      "Athletes subject to drug testing — GH-releasing peptides on WADA Prohibited List under Category S2 peptide hormones; banned in competition",
    ],
    sourcingNotes:
      "Research peptide widely available; pharmaceutical compounded version available with prescription via integrative pharmacies. Compounded version provides reliable potency for users prioritizing prescriber-coordinated source. Cost: ~$60-100 per 3mg research peptide vial; compounded pharmaceutical version typically more expensive but quality-assured.",
    notes:
      "## Sermorelin in the Modern GH Peptide Landscape\n\nSermorelin's role has evolved as newer GHRH analogs have entered research peptide use:\n\n**Sermorelin advantages:**\n- FDA pharmaceutical heritage (Geref) and pediatric clinical use safety profile\n- Compounding pharmacy availability with prescription\n- Closest to native GHRH function\n- Pediatric use established in some clinical contexts\n\n**Sermorelin disadvantages:**\n- Less stable than CJC-1295 no-DAC (no amino acid modifications)\n- Shorter half-life requires more frequent dosing\n- Higher cost in research peptide market vs CJC-1295 no-DAC\n- Less common in modern research peptide community use\n\n**Decision frame:**\n- **For prescriber-coordinated pharmaceutical-grade approach:** Sermorelin via compounding pharmacy\n- **For research peptide community standard protocols:** CJC-1295 no-DAC\n- **For pediatric GH deficiency contexts:** Sermorelin or recombinant HGH 191AA per pediatric endocrinologist\n- **For weekly dosing convenience:** CJC-1295 DAC\n\n## Beginner Protocol\n200mcg subcutaneous pre-sleep × 1 week, then 200-300mcg pre-sleep + optional AM dose. Pair with Ipamorelin 200mcg matching doses (mixed in same syringe). Track sleep, IGF-1 at baseline and 4-8 weeks.\n\n## Advanced Protocol\n**Classical Sermorelin + Ipamorelin pairing:** Sermorelin 200mcg + Ipamorelin 300mcg pre-sleep (mixed) + same combination AM fasted. Continuous protocol acceptable.\n\n**Pediatric GH deficiency context (under pediatric endocrinologist coordination):** Sermorelin per pediatric endocrinology protocol; compounding pharmacy source.\n\n## Reconstitution + Administration\nLyophilized 3mg vial; reconstitute with 2mL bacteriostatic water → 1.5mg/mL working concentration. Insulin syringe. Subcutaneous injection. **Mix with Ipamorelin same syringe** for combined protocol.\n\n## Synergies\n**Ipamorelin:** classical GHRP pairing for synergistic GH release. **CJC-1295 no-DAC:** alternative GHRH; rarely combined with Sermorelin (mechanism overlap). **CJC-1295 DAC:** rarely combined. **Tesamorelin:** alternative pharmaceutical-grade GHRH.\n\n## Clinical Trial Citations Worth Knowing\nFDA approval data for Geref (Serono, 1990) for pediatric GH deficiency. Substantial pediatric clinical use over ~18 years before commercial discontinuation. Adult off-label use less RCT-validated.\n\n## Evidence Quality\nFDA pharmaceutical heritage establishes substantial safety and efficacy data for pediatric use. Adult longevity off-label use less directly RCT-validated but mechanism extrapolates.\n\n## Research vs Anecdote\nResearch: foundational GHRH analog with FDA pharmaceutical heritage; pediatric clinical use safety profile; mechanism well-characterized. Anecdote: less common in modern research peptide community use vs CJC-1295 no-DAC; subjective effects similar to other short-acting GHRH analogs; pairs with Ipamorelin in classical protocol. Decision frame: foundational GHRH analog; useful for users wanting pharmaceutical-grade compounded option via prescriber; functionally similar to CJC-1295 no-DAC for most adult use cases; pediatric clinical heritage distinguishes from newer-generation alternatives.",
    tags: ["Sermorelin", "GHRH 1-29", "GRF(1-29)", "Geref", "Serono", "FDA-approved (withdrawn 2008)", "GH peptide", "pediatric GH deficiency", "compounding pharmacy", "foundational GHRH"],
    tier: "entry",
  },

  {
    id: "hexarelin",
    name: "Hexarelin",
    aliases: ["Examorelin", "Hexapeptide GHRP", "HEX"],
    category: ["GH Peptides"],
    categories: ["GH Peptides"],
    route: ["subcutaneous"],
    mechanism:
      "Synthetic hexapeptide (His-D-2-methyl-Trp-Ala-Trp-D-Phe-Lys-NH2) classified as a **GHRP (growth hormone releasing peptide)** / ghrelin receptor agonist. Developed in Italy in early 1990s as a more potent successor to GHRP-6, Hexarelin entered clinical development for GH deficiency contexts and produced strong pituitary GH release in trials. **Hexarelin has the highest GH-stimulating potency of the commonly available GHRPs** — substantially higher than Ipamorelin per mg dose. **Mechanism — ghrelin receptor agonism with substantial off-target effects (the central concern)**: Hexarelin activates the ghrelin receptor (GHS-R) on pituitary somatotrophs, producing strong GH release. Unlike Ipamorelin's selective profile, Hexarelin produces substantial off-target activation of the HPA axis: (1) **substantial cortisol elevation** — chronically elevated cortisol antagonizes the body composition and recovery benefits sought from GH peptide protocols; (2) **substantial prolactin elevation** — chronic elevation can produce gynecomastia in men, galactorrhea, and disrupted hormonal milieu; (3) **aldosterone effects** — fluid retention beyond what GHRH analogs alone produce; (4) **modest appetite increase**. **Mechanism — rapid tolerance development**: Hexarelin produces faster receptor desensitization than Ipamorelin or other ghrelin agonists; chronic continuous use produces diminishing GH response within weeks. The tolerance profile requires aggressive cycling that limits long-term protocol value. **Mechanism — cardiovascular effects**: Hexarelin has documented effects on cardiac function (positive inotropic effects in some studies) — initially of research interest for heart failure applications, but the cortisol/prolactin elevation profile limited clinical development. **Why Hexarelin has been largely superseded (the central honest framing)**: when Ipamorelin's selective ghrelin receptor agonism was characterized — comparable GH release without the cortisol/prolactin/aldosterone elevation — most users abandoned Hexarelin for the cleaner alternative. Hexarelin retains narrow use cases for users specifically wanting maximum GH-stimulating potency despite the off-target effect trade-offs, but **for most users, Ipamorelin is the appropriate default GHRP choice** rather than Hexarelin. **Pharmacokinetics**: subcutaneous administration; plasma half-life ~70 minutes; biological effects sustained ~2-3 hours per dose.",
    halfLife: "Plasma half-life ~70 minutes; biological effects sustained ~2-3 hours per dose",
    reconstitution: { solvent: "Bacteriostatic Water", typicalVialMg: 5, typicalVolumeMl: 2 },
    dosingRange: { low: "100mcg per dose (entry)", medium: "100-200mcg per dose 1-2× daily (modest research/protocol use)", high: "300mcg per dose 2× daily (high-end use; not recommended for most users due to side effect profile)", frequency: "1-2× daily subcutaneous; aggressive cycling required to prevent tolerance" },
    typicalDose: "100-200mcg subcutaneous 1-2× daily, cycled 4-6 weeks on / 4-6 weeks off",
    startDose: "100mcg pre-sleep × 1 week to assess tolerance and side effect profile",
    titrationNote: "**Side effects (cortisol/prolactin elevation) are the central tolerability limit**, not GH response. Effects on sleep architecture noticeable within first week. Tolerance development is rapid — efficacy declines within 3-4 weeks of continuous use.",
    cycle: "**Aggressive cycling required** — 4-6 weeks on / 4-6 weeks off typical due to rapid tolerance development. Some users use Hexarelin only for short bursts (2-3 weeks) within otherwise Ipamorelin-based protocols.",
    storage: "Lyophilized: refrigerate. Reconstituted: refrigerate; use within 28-30 days.",
    benefits: [
      "Highest GH-stimulating potency among commonly available GHRPs",
      "Rapid GH release per dose",
      "Cardiovascular research interest (positive inotropic effects)",
      "Synergy with GHRH analogs for amplified GH release",
      "Pre-sleep dosing produces strong sleep architecture effects via amplified GH pulse",
      "Italian pharmaceutical development heritage establishes basic safety profile",
    ],
    sideEffects: [
      "**Substantial cortisol elevation — the central concern; chronic elevation antagonizes GH peptide protocol benefits**",
      "**Substantial prolactin elevation — risk of gynecomastia in men, galactorrhea, hormonal disruption**",
      "Aldosterone elevation / fluid retention",
      "Modest appetite increase",
      "**Rapid tolerance development with continuous use**",
      "Injection site reactions",
      "Mild headache common",
      "Cardiovascular effects (inotropic, modest BP elevation in some users)",
      "Less favorable side effect profile than Ipamorelin overall",
    ],
    stacksWith: ["cjc-1295-no-dac", "cjc-1295-dac"],
    warnings: [
      "**For most users seeking GHRP effects, Ipamorelin is the appropriate default choice rather than Hexarelin** — the cleaner profile substantially outweighs Hexarelin's higher GH-stimulating potency for sustained use",
      "**Cortisol elevation is real and substantial** — chronic use can disrupt HPA axis function",
      "**Prolactin elevation is real and substantial** — gynecomastia risk in men with chronic use",
      "Pregnancy — no safety data; avoid",
      "Lactation — contraindicated due to prolactin effects",
      "Pediatric — no use case established",
      "Active malignancy — coordinate with oncologist",
      "Family history of prolactin-driven conditions (prolactinoma) — additional caution",
      "Diabetes — GH antagonizes insulin; cortisol elevation also worsens glucose",
      "Active mood disorders — cortisol elevation can worsen depression / anxiety",
      "Active gynecomastia or risk factors — Hexarelin can worsen via prolactin elevation",
      "Concurrent corticosteroids — additive cortisol-axis effects",
      "Active acromegaly or pituitary adenoma — contraindicated",
      "Sleep apnea — GH may worsen obstructive sleep apnea",
      "Quality control — research peptide quality varies",
      "Athletes subject to drug testing — GH-releasing peptides on WADA Prohibited List Category S2; banned",
    ],
    sourcingNotes:
      "Research peptide; not FDA-approved (Italian pharmaceutical development discontinued). Reputable research peptide vendors. Cost: ~$60-100 per 5mg vial. **Less commonly stocked by research peptide vendors** vs Ipamorelin due to declining demand.",
    notes:
      "## Why Most Users Should Choose Ipamorelin Instead\n\nHexarelin's role in modern GH peptide protocols has narrowed substantially since Ipamorelin's clean profile was characterized. The honest comparison:\n\n**Hexarelin:**\n- Higher GH-stimulating potency per mg\n- Substantial cortisol elevation\n- Substantial prolactin elevation\n- Rapid tolerance development\n- Aggressive cycling required\n- Off-target HPA axis disruption\n\n**Ipamorelin:**\n- Adequate GH-stimulating potency for typical protocols\n- Minimal cortisol elevation\n- Minimal prolactin elevation\n- Slow tolerance development\n- Continuous use feasible\n- Clean ghrelin receptor selectivity\n\n**The trade-off framing:** Hexarelin's higher potency comes at the cost of off-target effects that compound with sustained use. The cortisol and prolactin elevation antagonize many of the body composition and recovery benefits sought from GH peptide protocols — the cortisol elevation in particular promotes catabolism and visceral fat accumulation that GH protocols seek to reverse.\n\n**Narrow use cases where Hexarelin still applies:**\n- Short-burst protocols (2-3 weeks) for maximum GH stimulation in cycle context\n- Cardiovascular research applications (positive inotropic effects)\n- Users specifically wanting the higher GH potency despite trade-offs and accepting aggressive cycling\n\n**For most users:** Ipamorelin at standard doses provides adequate GH peptide effects without the off-target burden. The historical role of Hexarelin in research peptide community use has been largely supplanted.\n\n## Beginner Protocol\nIf running Hexarelin specifically: 100mcg pre-sleep × 1 week to assess tolerance and side effect profile (particularly cortisol/prolactin manifestations like fatigue, mood changes, fluid retention, breast tenderness in men). Reconsider Ipamorelin as alternative if side effects emerge.\n\n## Advanced Protocol\n**Short-burst Hexarelin protocol (the narrow appropriate use case):**\n- Hexarelin 100-200mcg pre-sleep × 2-3 weeks\n- Followed by 4-6 weeks Ipamorelin or off entirely\n- Combined with CJC-1295 no-DAC for GHRH synergy during burst phase\n- Monitor for HPA axis manifestations\n\n**Most users should use Ipamorelin instead** — see Ipamorelin tile for standard GHRP protocols.\n\n## Reconstitution + Administration\nLyophilized 5mg vial; reconstitute with 2mL bacteriostatic water → 2.5mg/mL working concentration. Insulin syringe. Subcutaneous injection.\n\n## Synergies\n**CJC-1295 no-DAC:** GHRH synergy during short-burst protocols. **CJC-1295 DAC:** less commonly combined. Hexarelin is rarely combined with Ipamorelin (mechanism overlap; defeats purpose of cleaner profile choice).\n\n## Clinical Trial Citations Worth Knowing\nItalian pharmaceutical clinical development data (Imbimbo 1994 series, Ghigo 1997 series). Cardiovascular research papers exploring inotropic effects. Discontinuation of pharmaceutical development reflects the side effect profile competition with cleaner alternatives.\n\n## Evidence Quality\nMechanism well-characterized. Italian clinical development establishes basic safety profile. Long-term continuous-use safety profile less favorable than Ipamorelin due to off-target effects.\n\n## Research vs Anecdote\nResearch: solid mechanism characterization; high GH-stimulating potency; substantial off-target HPA axis effects. Anecdote: largely supplanted by Ipamorelin in research peptide community use; remaining users typically running short-burst protocols rather than sustained use; the cleaner alternative made Hexarelin's role narrow. Decision frame: older-generation GHRP with substantial off-target effects (cortisol, prolactin, aldosterone elevation); for most users seeking GHRP effects, Ipamorelin is the appropriate default choice; Hexarelin's narrow remaining use cases are short-burst maximum-GH-stimulation contexts where users accept the trade-offs and run aggressive cycling.",
    tags: ["Hexarelin", "Examorelin", "GHRP", "ghrelin receptor agonist", "hexapeptide", "high potency GH releaser", "cortisol elevation", "prolactin elevation", "Italian pharmaceutical", "older GHRP generation"],
    tier: "entry",
  },

  {
    id: "tesamorelin",
    name: "Tesamorelin",
    aliases: ["TH9507", "Egrifta", "Egrifta SV", "Stabilized GHRH analog"],
    category: ["GH Peptides", "GLP / Metabolic", "Longevity"],
    categories: ["GH Peptides", "GLP / Metabolic", "Longevity"],
    route: ["subcutaneous"],
    mechanism:
      "Synthetic 44-amino-acid peptide based on full-length human GHRH (1-44) with a **trans-3-hexenoic acid modification at the N-terminus** — the modification protects against dipeptidyl peptidase-IV (DPP-IV) cleavage, the primary degradation route for native GHRH. The result is a stabilized GHRH analog with substantially extended biological activity vs native GHRH while preserving the pulsatile release pattern characteristic of GHRH function. **FDA approval and clinical use**: Tesamorelin is **FDA-approved as Egrifta (and Egrifta SV)** for treatment of **HIV-associated lipodystrophy** — specifically for reduction of excess visceral abdominal fat in HIV-infected patients on antiretroviral therapy who develop the characteristic 'lipodystrophy' body composition changes (visceral fat accumulation alongside peripheral fat loss). The FDA approval is for this specific indication; off-label use for general visceral fat reduction and longevity is the more common catalog-reader use case but should be framed honestly as off-label rather than approved indication. **The approved indication / off-label use distinction (parallel to Forzinity SS-31)** matters for honest framing: Egrifta is the regulated, FDA-approved product for HIV lipodystrophy; off-label use leverages the same molecule for body composition and longevity applications without the same regulatory backing. **Mechanism — full-length GHRH activity (the central distinguishing feature)**: unlike GRF 1-29 fragments (Sermorelin, CJC-1295 forms) which preserve GHRH receptor binding but truncate to a shorter sequence, Tesamorelin uses the full 1-44 GHRH sequence with stabilization modification. The full-length structure may have biological effects beyond pure GHRH receptor activation — though the practical clinical implications vs short-fragment analogs are debated. **Mechanism — visceral fat targeting (the central clinical effect)**: Tesamorelin produces substantial visceral adipose tissue reduction in clinical trials — the FDA approval is based on this effect specifically. The mechanism appears to involve GH/IGF-1 elevation driving lipolysis preferentially in visceral fat depots, which have higher lipolytic responsiveness than subcutaneous fat. The visceral fat reduction is the central reason for off-label use in non-HIV body composition contexts. **Mechanism — pulsatile vs sustained pattern**: Tesamorelin's stabilization extends half-life vs native GHRH but doesn't produce the sustained 'flatlined' elevation of CJC-1295 DAC. The pattern is closer to extended pulsatile than sustained continuous. **Mechanism — pharmaceutical-grade quality control**: Egrifta as FDA-approved product provides regulated manufacturing, purity, and potency standards. Research peptide Tesamorelin from non-pharmaceutical sources varies in quality. **Pharmacokinetics**: subcutaneous administration; plasma half-life ~25-40 minutes; biological effects sustained substantially longer via downstream GH/IGF-1 cascade; daily dosing typical.",
    halfLife: "Plasma half-life ~25-40 minutes (extended vs native GHRH via stabilization); biological effects sustained substantially longer via downstream GH/IGF-1 cascade",
    reconstitution: { solvent: "Bacteriostatic Water (research peptide); Egrifta SV provides separate diluent", typicalVialMg: 5, typicalVolumeMl: 2 },
    dosingRange: { low: "1mg/day (entry; partial Egrifta dose)", medium: "2mg/day (the FDA-approved Egrifta dose for HIV lipodystrophy)", high: "2mg/day with paired Ipamorelin (high-end use)", frequency: "Daily subcutaneous; typically pre-sleep or pre-bed" },
    typicalDose: "2mg subcutaneous daily pre-sleep (the Egrifta clinical dose)",
    startDose: "1mg/day × 2 weeks to assess tolerance, then 2mg/day",
    titrationNote: "Effects on visceral fat measurable by imaging within 12-26 weeks of consistent use (the timeline established in Egrifta clinical trials). IGF-1 elevation measurable within 2-4 weeks. Subjective effects on sleep, recovery often perceptible within first month.",
    cycle: "Egrifta clinical use is continuous daily for chronic HIV lipodystrophy management. Off-label longevity / body composition use varies — some users continuous, others cycle 12-16 weeks on / 4-8 weeks off.",
    storage: "Lyophilized: refrigerate (2–8°C). Reconstituted: refrigerate; use within 28-30 days. Egrifta SV provides specific reconstitution and storage instructions per pharmaceutical labeling.",
    benefits: [
      "**FDA-approved** as Egrifta for HIV-associated lipodystrophy — the only FDA-approved GH peptide in this batch",
      "**Substantial visceral adipose tissue reduction** — the central clinical effect with substantial RCT evidence in HIV lipodystrophy populations",
      "Pharmaceutical-grade quality control via Egrifta clinical product",
      "Full-length stabilized GHRH analog — distinct from GRF 1-29 fragments",
      "Pulsatile-extended release pattern — preserves physiological mimicry while extending duration",
      "Body composition support (off-label) — visceral fat reduction with relative preservation of lean mass",
      "Lipid profile improvements in some studies (reduced triglycerides)",
      "Cognitive effects — emerging evidence for cognitive function improvements in HIV-associated cognitive impairment",
      "Pairs with Ipamorelin for synergistic GH release (similar to other GHRH analogs)",
      "Clinical trial evidence base substantially exceeds research peptide alternatives",
    ],
    sideEffects: [
      "Injection site reactions — most common; 25-40% in Egrifta trials",
      "Joint pain / arthralgias",
      "Carpal tunnel symptoms — fluid retention impact",
      "Water retention / edema",
      "Insulin resistance / glucose elevation — monitor fasting glucose / HbA1c",
      "Headache",
      "Mild fatigue",
      "Hypersensitivity reactions — rare; can be serious",
      "Pancreatitis — rare but documented",
      "**Pancreatic effects warrant monitoring** during sustained protocols",
      "Long-term safety profile favorable based on Egrifta clinical experience over ~10+ years",
    ],
    stacksWith: ["ipamorelin", "cjc-1295-no-dac", "cjc-1295-dac", "sermorelin"],
    warnings: [
      "**FDA-approved indication is HIV-associated lipodystrophy specifically** — off-label use for general visceral fat reduction or longevity is common but should be framed honestly as off-label",
      "Pregnancy — no safety data; contraindicated",
      "Lactation — contraindicated",
      "Pediatric — no use case established",
      "Active malignancy — GH/IGF-1 elevation has complex tumor-effect profile; coordinate with oncologist; relative contraindication",
      "Active or recent (within 5 years) malignancy other than non-melanoma skin cancer — Egrifta label contraindication",
      "Hypothalamic-pituitary axis disorders — coordinate with endocrinologist",
      "Family history of IGF-1-driven cancers — additional caution",
      "Diabetes — GH antagonizes insulin; coordinate with prescriber; monitor glucose",
      "Active retinopathy — relative caution",
      "Concurrent corticosteroids — antagonistic effects",
      "Active acromegaly or pituitary adenoma — contraindicated",
      "Sleep apnea — GH may worsen obstructive sleep apnea",
      "Pancreatic disease history — coordinate with prescriber; rare pancreatitis risk noted in clinical experience",
      "Quality control — Egrifta provides pharmaceutical-grade quality assurance; research peptide Tesamorelin from non-pharmaceutical sources varies; for clinical applications (HIV lipodystrophy), pharmaceutical Egrifta is the regulated option",
      "Athletes subject to drug testing — GH-releasing peptides on WADA Prohibited List Category S2; banned",
    ],
    sourcingNotes:
      "**Pharmaceutical:** Egrifta and Egrifta SV (Theratechnologies) — FDA-approved for HIV-associated lipodystrophy; available with prescription for the approved indication; insurance coverage typically requires HIV diagnosis and lipodystrophy criteria. **Compounded pharmaceutical:** some compounding pharmacies offer Tesamorelin with prescription via integrative endocrinologists for off-label use; quality more reliable than research peptide. **Research peptide:** non-pharmaceutical Tesamorelin from research peptide vendors; quality varies; verify COA. Cost: Egrifta pharmaceutical pricing reflects rare-disease orphan drug pricing model (substantial); compounded $200-400/month; research peptide $80-150 per 5mg vial.",
    notes:
      "## The FDA-Approved Indication / Off-Label Use Distinction\n\nTesamorelin's regulatory status creates a useful framing for users navigating GH peptide options:\n\n**FDA-approved indication (Egrifta):**\n- HIV-associated lipodystrophy in patients on antiretroviral therapy\n- Reduction of excess visceral abdominal fat\n- Established RCT evidence base from approval trials\n- Pharmaceutical-grade Egrifta product with regulated manufacturing\n- Insurance coverage typically requires HIV diagnosis\n\n**Common off-label use cases:**\n- General visceral fat reduction (non-HIV)\n- Body composition optimization\n- Longevity / aging-related body composition changes\n- Comprehensive GH-axis protocols layered with Ipamorelin and other GH peptides\n\n**The honest framing:** the molecule is the same, the mechanism is the same, but the regulatory backing is for the HIV indication specifically. Off-label use is mechanistically rational but operates outside the formal evidence base. Users running off-label Tesamorelin should understand this distinction — particularly when considering pharmaceutical Egrifta vs research peptide Tesamorelin (the pharmaceutical product is regulated for the approved indication; off-label use of either form is the user's decision in coordination with prescriber).\n\n## Tesamorelin vs CJC-1295 — Decision Frame\n\nFor users choosing between GHRH analogs:\n\n**Tesamorelin advantages:**\n- FDA pharmaceutical heritage and regulated product available\n- Substantial RCT evidence for visceral fat reduction (in HIV population)\n- Full-length GHRH analog vs fragment\n- Daily dosing pattern (similar to no-DAC)\n\n**CJC-1295 no-DAC advantages:**\n- Lower cost\n- More common research peptide availability\n- Multi-daily dosing fits classical pulsatile protocols better\n- Pairs more conventionally with Ipamorelin\n\n**CJC-1295 DAC advantages:**\n- Weekly dosing convenience\n- Sustained elevation pattern\n- Lower frequency of injections\n\n**Practical:** for users with prescriber-coordinated access to compounded Tesamorelin and budget for it, the pharmaceutical heritage advantage matters. For research peptide community standard protocols, CJC-1295 no-DAC + Ipamorelin remains the common default. For visceral fat reduction priority specifically, Tesamorelin's RCT evidence base in this application gives it a defensible advantage over alternatives.\n\n## Beginner Protocol\n1mg subcutaneous pre-sleep × 2 weeks (tolerance), then 2mg/day pre-sleep (the Egrifta clinical dose). Track IGF-1 at baseline and 4-8 weeks; visceral fat measurement (DXA, MRI, or waist circumference) at baseline and 12-26 weeks for the visceral fat reduction outcome.\n\n## Advanced Protocol\n**Visceral fat reduction priority protocol:** Tesamorelin 2mg/day pre-sleep + Ipamorelin 300mcg 2-3× daily (synergistic GH release) + comprehensive body composition foundation (structured exercise, nutrition, sleep, stress management).\n\n**HIV lipodystrophy management (under HIV-specialist coordination):** Egrifta 2mg/day per FDA-approved label.\n\n**Comprehensive longevity / body composition stack:** Tesamorelin 2mg/day + Ipamorelin pulsatile pairing + comprehensive longevity foundation (NAD precursors, mitochondrial pillar, foundational supplements) + structured exercise/nutrition.\n\n## Reconstitution + Administration\n**Egrifta SV:** Per product label; specific reconstitution and storage instructions from pharmaceutical packaging. **Research peptide / compounded:** lyophilized 5mg vial; reconstitute with 2mL bacteriostatic water → 2.5mg/mL working concentration. Subcutaneous injection. Refrigerate reconstituted; use within 28-30 days.\n\n## Synergies\n**Ipamorelin:** synergistic GH release (similar to other GHRH analog + GHRP combinations). **CJC-1295 no-DAC:** alternative GHRH; rarely combined with Tesamorelin (mechanism overlap). **CJC-1295 DAC:** rarely combined. **Sermorelin:** alternative GHRH; rarely combined.\n\n## Clinical Trial Citations Worth Knowing\nFalutz 2007 (n=412 HIV lipodystrophy, 2mg/day × 26 weeks): 15.2% reduction in visceral adipose tissue vs placebo; FDA approval supporting trial. Falutz 2010 (extension trial): sustained effects with continued use. Stanley 2014 (cognitive effects in HIV-associated cognitive impairment): cognitive function improvements. Multiple subsequent trials supporting the lipodystrophy indication and exploring off-label applications.\n\n## Evidence Quality\nFDA-approved indication has substantial RCT evidence base. Mechanism well-characterized. Long-term safety profile favorable based on Egrifta clinical experience (~10+ years post-approval). Off-label applications mechanistically grounded but lack dedicated RCT evidence.\n\n## Research vs Anecdote\nResearch: FDA-approved GHRH analog with substantial RCT evidence in HIV lipodystrophy; mechanism well-characterized; pharmaceutical-grade quality available. Anecdote: extensive off-label use for body composition and longevity; subjective effects on visceral fat often perceptible over months; pairs with Ipamorelin in modern protocols. Decision frame: only FDA-approved GH peptide in this batch; pharmaceutical heritage distinguishes from research peptide alternatives; visceral fat reduction is the strongest evidence-supported application; off-label longevity / body composition use is mechanistically rational but operates outside formal evidence base; pairs with Ipamorelin similar to other GHRH analogs.",
    tags: ["Tesamorelin", "TH9507", "Egrifta", "Egrifta SV", "FDA-approved", "HIV lipodystrophy", "stabilized GHRH analog", "GHRH 1-44", "visceral fat reduction", "Theratechnologies", "GH peptide"],
    tier: "entry",
  },
];
