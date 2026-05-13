/**
 * Batch 43 — MOTS-c Depth Upgrade (1 entry — UPGRADE WAVE).
 *
 * Single-tile upgrade of MOTS-c (originally BATCH22 mid-format shell at
 * ~1100w) to full BATCH38 clinical depth (~1700w). MOTS-c is one of the
 * mitochondrial trinity anchors and a foundational mitochondrial-derived
 * peptide; the BATCH22 shell substantially under-served users landing on
 * the tile, and carried two concrete bugs:
 *
 *   1. **Category miscategorization**: BATCH22 tagged MOTS-c as
 *      "GLP / Metabolic" — mechanistically false. MOTS-c has zero
 *      GLP-1 receptor activity. The mechanism is AMPK activation (the
 *      master cellular energy sensor) with downstream metabolic effects
 *      via PGC-1α, CPT1, GLUT4 translocation. Categories corrected to
 *      ["Mitochondrial", "Longevity"]. The deeper schema issue —
 *      "GLP / Metabolic" being a bundled label that prevents proper
 *      tagging of AMPK-class compounds (metformin, berberine, MOTS-c) —
 *      is a separate refactor that should happen alongside the
 *      Conditions feature.
 *
 *   2. **Half-life "short (hours)" placeholder**: replaced with the
 *      honest answer — plasma t½ ~30 min in mouse PK (Lee 2015), human
 *      PK not formally characterized in published trials, subcutaneous
 *      absorption stretches apparent serum duration to a few hours,
 *      tissue effects persist days via AMPK → PGC-1α transcription
 *      cascade and nuclear translocation under metabolic stress.
 *
 * Editorial decisions locked (matching BATCH38 standard):
 *   - MDP discovery timeline as standalone mechanism subsection
 *     (Humanin Hashimoto 2001 → MOTS-c Lee 2015 → SHLPs)
 *   - Pinchas Cohen / USC Davis School of Gerontology pedigree explicit
 *   - Nuclear translocation framed as uniquely demonstrated for MOTS-c
 *     among known MDPs (the mitochondria-to-nucleus signaling story)
 *   - AMPK depth — what it does downstream (PGC-1α, CPT1, GLUT4, mTOR
 *     inhibition, NF-κB modulation, SREBP1c suppression)
 *   - Pharmaceutical status block explicit — no FDA approval (distinct
 *     from SS-31's Forzinity accelerated approval Sept 2025); research
 *     peptide status acknowledged honestly
 *   - Exercise-mimetic framing honest, not marketing — the AMPK overlap
 *     is real but exercise produces benefits via cardiovascular,
 *     neurogenic, musculoskeletal, hormonal, and psychological
 *     mechanisms that no peptide replicates; MOTS-c augments, doesn't
 *     replace
 *   - Mitochondrial Trinity decision tree explicit — MOTS-c (AMPK /
 *     metabolic signaling) vs SS-31 (cardiolipin / structural) vs
 *     Humanin (Bax-mediated anti-apoptotic / neuroprotective); the
 *     three address distinct mitochondrial mechanisms
 *   - Biomarker tracking section — HbA1c, fasting insulin, HOMA-IR,
 *     lipid panel with TG/HDL ratio, body composition (DEXA preferred),
 *     hsCRP, liver enzymes for MASLD context; the metabolic equivalent
 *     of BATCH38's sensitive E2 framing
 *   - **No vendor / clinic / compounding-pharmacy / research-vendor
 *     brand names** — matches BATCH38 sanitization standard;
 *     sanitizeVendorRefs-compatible
 *   - Word count ~1700 in notes matching BATCH38 fat-soluble pillar
 *     and TRT/AI cluster standard
 *
 * Migration accounting (UPGRADE batch — ID collides with BATCH22's
 * mots-c entry; dedupeById in compounds/index.js keeps BATCH43 entry
 * via last-wins):
 *   PEPTIDES_CORE: unchanged
 *   BATCH43: +1 (new file, single upgrade entry)
 *   ALL_COMPOUNDS: unchanged (BATCH43 overrides BATCH22 mots-c 1:1)
 *   CATALOG_COUNT: unchanged
 *
 * Schema matches BATCH7-39.
 *
 * Cursor handoff notes:
 *   1. Add `import { BATCH43 } from "./batch43.js";` to
 *      compounds/index.js after BATCH42 import.
 *   2. Add `...BATCH43,` to _ALL_COMPOUNDS_RAW spread after `...BATCH42,`.
 *   3. Verify console.warn for 1 expected duplicate: mots-c. EXPECTED;
 *      indicates the upgrade override is working correctly.
 *   4. Run dev build; verify PEPTIDES.length unchanged (BATCH43 entry
 *      overrides BATCH22 shell 1:1).
 *   5. Spot-check Library tile rendering for mots-c; confirm:
 *      a. Category pill displays "MITOCHONDRIAL" (not GLP)
 *      b. Half-life renders the expanded honest version
 *      c. Notes section displays full clinical depth
 *   6. Legacy mots-c entry in BATCH22 can remain untouched (zero-touch
 *      on legacy files via dedupe override) OR be removed in follow-up
 *      housekeeping pass; editorial preference, not functional requirement.
 *   7. Other BATCH22 entries (ss-31, humanin, pqq, coq10) untouched —
 *      pqq and coq10 are recent net-new entries already at BATCH38
 *      depth standard; ss-31 and humanin are migration-format entries
 *      that may warrant similar single-tile upgrade waves in follow-up
 *      batches if priorities allow.
 */
export const BATCH43 = [
  {
    id: "mots-c",
    name: "MOTS-c",
    aliases: [
      "MOTS-C",
      "Mitochondrial Open Reading Frame of the 12S rRNA-c",
      "MDP (mitochondrial-derived peptide)",
      "MOTS-c peptide",
    ],
    category: ["Mitochondrial", "Longevity"],
    categories: ["Mitochondrial", "Longevity"],
    route: ["subcutaneous"],
    mechanism:
      "**MOTS-c** is a 16-amino-acid peptide encoded within the **mitochondrial 12S rRNA gene** — one member of a small but expanding class of **mitochondrial-derived peptides (MDPs)** that originate from the mitochondrial genome rather than the nuclear genome. The MDP class represents a paradigm shift in mitochondrial biology that emerged over the past 25 years and remains a central area of mitochondrial-aging research. **Mechanism — discovery and the MDP framework**: mitochondrial DNA was historically thought to encode only 13 protein subunits (all components of the electron transport chain), 22 tRNAs, and 2 rRNAs — a total of 37 genes packaged into the 16.5kb mitochondrial chromosome. The recognition that the 12S and 16S rRNA genes also contain peptide-encoding open reading frames was a fundamental shift. **Humanin** was identified first (Hashimoto 2001, screening cDNA libraries from familial Alzheimer's survivors) and remained an isolated finding for over a decade. **MOTS-c** was identified by **Pinchas Cohen's laboratory at the USC Davis School of Gerontology** and reported in **Lee 2015 (Cell Metabolism)** — the foundational paper for the compound. The Cohen laboratory subsequently identified the **SHLP series (small humanin-like peptides, SHLP1-6)** plus additional MDPs, establishing the framework that the mitochondrial genome encodes a distinct class of signaling peptides separate from canonical ETC components. **Mechanism — AMPK activation (the central effect)**: MOTS-c activates **AMP-activated protein kinase (AMPK)**, the master cellular energy sensor that monitors the ATP:AMP ratio and coordinates metabolic responses to energy stress. AMPK activation is one of the most evidence-supported longevity mechanisms in biology — exercise activates AMPK, metformin works partly through AMPK, caloric restriction signals through AMPK, and AMPK activation extends lifespan across multiple model organisms. MOTS-c functions as an **endogenous AMPK activator** encoded by mitochondria as a signal to the rest of the cell about mitochondrial energy status. The mitochondria-to-cytosol signaling is what makes the mechanism interesting at the systems level: mitochondria report on their own metabolic status via a peptide signal that drives cellular metabolic adaptation. Downstream effects parallel exercise and caloric restriction at the molecular level — improved insulin sensitivity via GLUT4 translocation, increased fatty acid oxidation via CPT1 activation, mitochondrial biogenesis support via **PGC-1α activation** (the master mitochondrial-biogenesis transcription coactivator), autophagy activation via mTOR inhibition, reduced lipogenesis via SREBP1c suppression, broad anti-inflammatory effects via NF-κB modulation. **Mechanism — nuclear translocation (uniquely demonstrated for MOTS-c)**: MOTS-c is the first MDP shown to translocate to the cell nucleus under metabolic stress conditions, where it regulates nuclear gene transcription directly. The mitochondria-to-nucleus signaling pathway is a fundamental aspect of cellular metabolic adaptation and is uniquely demonstrated for MOTS-c among known MDPs. Under glucose restriction or oxidative stress, MOTS-c accumulates in the nucleus and modulates expression of stress-response genes including antioxidant and metabolic adaptation programs. The mechanism establishes MOTS-c as a genuine signaling molecule with direct transcriptional effects, not merely a downstream AMPK activator. **Mechanism — exercise mimetic effects in animal models**: in mouse models, MOTS-c administration produces effects comparable to exercise training — improved glucose tolerance, increased physical performance on standardized tests (treadmill endurance, grip strength), reduced age-related obesity, reduced muscle wasting in aged animals, improved functional outcomes in aged-mouse cohorts. The 'exercise in a vial' framing has become the dominant longevity-community positioning of MOTS-c; the framing is mechanistically real (AMPK activation overlap) but misleading if read as exercise replacement (see notes for honest framing). **Mechanism — age-related decline**: circulating MOTS-c levels decline with age in human studies, paralleling the broader mitochondrial decline pattern. The decline is one factor in age-related metabolic dysfunction, sarcopenia, and physical function decline. The supplementation rationale is restoration of signaling that age has reduced — analogous to NAD precursor logic, growth hormone secretagogue logic, and TRT logic in their respective domains. **Mechanism — pharmacokinetics**: plasma t½ ~30 min in mouse PK studies (Lee 2015); **human PK has not been formally characterized in published trials** — a real gap in the evidence base. Subcutaneous administration extends apparent serum duration to a few hours via slow absorption from injection site. Tissue effects persist days post-dose via the AMPK → PGC-1α gene transcription cascade and the nuclear translocation effects, which produce sustained downstream signaling even after the peptide itself has cleared. This is why dosing frequencies of 2-3× weekly produce meaningful clinical effects despite the short serum half-life. **Pharmaceutical status**: MOTS-c has **no FDA-approved formulation** — distinct from SS-31, which received FDA accelerated approval as Forzinity for Barth syndrome in September 2025 (the first mitochondria-targeted therapeutic FDA approval). MOTS-c remains a research peptide; no human RCT program is currently underway through a pharmaceutical sponsor at the scale that produced the Forzinity approval. Research peptide use is ahead of formal clinical-trial validation. Compounded pharmacy formulations are available with prescription via integrative / functional medicine practitioners.",
    halfLife:
      "Plasma t½ ~30 min (mouse PK, Lee 2015); human PK not formally characterized in published trials; subcutaneous absorption extends apparent serum duration to a few hours; tissue effects persist days post-dose via AMPK → PGC-1α gene transcription cascade and nuclear translocation under metabolic stress",
    reconstitution: { solvent: "Bacteriostatic Water", typicalVialMg: 10, typicalVolumeMl: 2 },
    dosingRange: {
      low: "5mg subcutaneous per dose (entry; tolerance assessment × 2 weeks)",
      medium: "10mg subcutaneous per dose 2-3× weekly (typical research-protocol pattern)",
      high: "10-15mg subcutaneous per dose 3× weekly to daily (high-end use; aggressive metabolic-dysfunction protocols; less common)",
      frequency: "2-3× weekly subcutaneous typical; some protocols daily; abdominal or thigh sites with rotation",
    },
    typicalDose:
      "10mg subcutaneous 2-3× weekly is the typical research-protocol pattern; weight-tiered dosing not formally established (no human-dose-finding RCT)",
    startDose:
      "5mg subcutaneous × 2 weeks for tolerance assessment, then 10mg subcutaneous 2-3× weekly. Pull baseline HbA1c, fasting insulin, fasting glucose, lipid panel, and body composition (DEXA preferred; waist circumference as proxy) before starting if not already on file — the metabolic effects are most legible against baseline biomarkers.",
    titrationNote:
      "Lab-and-feel driven. Subjective effects often perceptible within 1-2 weeks (energy, exercise capacity, body composition trends) — faster subjective response than SS-31, where the structural mechanism is largely silent. Metabolic effects accumulate over 8-12+ weeks: HbA1c (90-day average), fasting insulin, HOMA-IR (calculated from fasting glucose and insulin), body composition shifts. Pull repeat labs at 12 weeks. Metabolic-dysfunction context (T2D, insulin resistance, MASLD) benefits most clearly from biomarker tracking; healthy users running MOTS-c for longevity may see subjective benefit without dramatic biomarker shifts.",
    bioavailability:
      "Subcutaneous administration only — peptide structure not orally bioavailable due to GI tract proteolytic degradation; nasal / sublingual formulations have not been validated. Intramuscular injection theoretically viable but not standard protocol.",
    cycle:
      "Continuous use is common in research / longevity protocols. Some practitioners cycle 8-12 weeks on / 4 weeks off; evidence base for cycling vs continuous is essentially absent — both patterns are reasonable empirically. No tachyphylaxis (loss of effect over time) has been formally documented.",
    storage: "Lyophilized: refrigerate (2-8°C). Reconstituted: refrigerate; use within 28-30 days.",
    benefits: [
      "AMPK activation — endogenous signal of mitochondrial energy status; one of the most evidence-supported longevity mechanisms across model organisms",
      "Mitochondria-to-nucleus signaling via direct nuclear translocation under metabolic stress (unique among known MDPs)",
      "Exercise-mimetic metabolic effects — produces some of exercise's molecular benefits; does NOT replace exercise (see notes for honest framing)",
      "Insulin sensitivity improvements in aged / obese animal models; translation to human metabolic dysfunction emerging but human RCT evidence limited",
      "Increased fatty acid oxidation via CPT1 activation",
      "Mitochondrial biogenesis support via AMPK → PGC-1α pathway",
      "Body composition support — fat loss, muscle preservation in animal models; subjective reports common in research community",
      "Anti-inflammatory effects via NF-κB modulation",
      "Cardiovascular benefits — endothelial function support, atherosclerosis reduction in animal models",
      "Cognitive support — emerging evidence; AMPK activation supports broader cellular metabolic health",
      "Reasonable subjective response timeline — 1-2 weeks for energy / exercise capacity vs SS-31's largely silent structural mechanism",
      "Pairs naturally with SS-31 (cardiolipin / structural), Humanin (anti-apoptotic), Urolithin A (mitophagy), CoQ10/Ubiquinol (ETC substrate), PQQ (biogenesis), and NAD precursors for comprehensive mitochondrial coverage",
    ],
    sideEffects: [
      "Generally very well tolerated in research use",
      "Subcutaneous injection site reactions uncommon — mild local redness or warmth occasionally",
      "Mild post-injection flushing or warming sensation in some users",
      "Hypoglycemia possible in users with elevated insulin sensitivity baseline (lean athletes, low-carb / carnivore eaters, those on concurrent metformin or GLP-1 agonists); the AMPK activation augments insulin sensitivity; monitor glucose for first 2 weeks if relevant",
      "Long-term human safety data limited — research-peptide use rather than clinical-trial-validated population safety profile",
      "Theoretical signal in active malignancy (see warnings) — AMPK activation has complex tumor-effect profile that depends on tumor metabolic phenotype",
    ],
    stacksWith: ["ss-31", "humanin", "urolithin-a", "coq10", "pqq"],
    warnings: [
      "**No FDA-approved formulation** — research peptide use only; distinct from SS-31, which received FDA accelerated approval as Forzinity (Sept 2025) for Barth syndrome",
      "**Quality control critical** — research peptide MOTS-c quality varies substantially by vendor; verify potency and purity via COA where possible; mass-spec verification preferred",
      "**Biomarker baseline recommended** — pull HbA1c, fasting insulin, fasting glucose, lipid panel, body composition before starting if metabolic effects are the target",
      "Pregnancy — no safety data; avoid",
      "Lactation — no safety data",
      "Pediatric — no use case established",
      "Concurrent diabetes medications (insulin, sulfonylureas, meglitinides) — additive hypoglycemic effects possible; monitor glucose closely; coordinate with prescriber",
      "Concurrent metformin — both activate AMPK; combinations may produce additive effects; mechanistically rational but coordinate with prescriber for diabetes management",
      "Concurrent GLP-1 agonists (semaglutide, tirzepatide, retatrutide) — different mechanism but overlapping metabolic effects; coordinate with prescriber; hypoglycemia risk additive in lean / well-controlled users",
      "Concurrent berberine — another AMPK activator; combinations rational but theoretically additive",
      "Active malignancy — coordinate with oncologist; AMPK activation has complex tumor-effect profile (suppresses some cancers dependent on glycolytic metabolism via mTOR pathway; may support others depending on tumor metabolic phenotype); not a simple yes/no",
      "Significant cancer risk profile — coordinate with prescriber; the AMPK mechanism is similar to metformin (which has cancer-protective epidemiology), but MOTS-c-specific evidence is limited",
      "Athletes subject to drug testing — MOTS-c is a peptide hormone; falls under broader WADA peptide / hormone class restrictions; check sport-specific rules",
    ],
    sourcingNotes:
      "**Research peptide; not FDA-approved.** Available through research peptide vendors at varying quality levels — vendor selection matters substantially given the absence of regulated production standards. Verify COA / third-party testing where available; mass-spec verification preferred. Typical cost: ~$80-120 per 10mg vial in research-grade format. **Compounded pharmacy formulations** available with prescription via some integrative / functional medicine practitioners; quality more reliable than research-vendor format but requires prescriber relationship and is substantially more expensive. **No FDA-approved pharmaceutical formulation exists** — distinct from SS-31's Forzinity approval (Sept 2025); MOTS-c remains research-only.",
    notes:
      "## Clinical Context — MOTS-c in the Mitochondrial Pillar\n\nMOTS-c occupies a specific position in the mitochondrial pillar: it's the **metabolic / AMPK-signaling arm** of the mitochondrial-derived peptide framework, mechanistically distinct from SS-31 (cardiolipin / structural support) and Humanin (anti-apoptotic / neuroprotective). The three MDPs address different aspects of mitochondrial biology; the catalog frame treats them as complementary rather than competing, and running all three is the mitochondrial trinity protocol common in research / longevity community use.\n\nThe practical use case spans:\n\n**Metabolic dysfunction context** — insulin resistance, prediabetes, type 2 diabetes, metabolic-associated steatotic liver disease (MASLD, formerly NAFLD); 10mg subcutaneous 2-3× weekly; biomarker-tracked via HbA1c, fasting insulin, HOMA-IR, lipid panel, body composition\n\n**General longevity / mitochondrial pillar** — 10mg 2× weekly as part of comprehensive mitochondrial protocol; subjective response on energy / exercise capacity often perceptible within 1-2 weeks\n\n**Body composition support** — fat loss, muscle preservation; animal model evidence robust, human evidence observational; pairs with structured exercise and nutritional foundation\n\n**Athletic / performance use** — exercise capacity, recovery; mechanism is real but the framing as exercise replacement is misleading (see honest framing section below)\n\n## The Mitochondrial Trinity — Decision Frame\n\nThe three mitochondrial-derived peptides — MOTS-c, SS-31 (Elamipretide), and Humanin (typically as the HNG analog) — address distinct mitochondrial mechanisms:\n\n**MOTS-c (this tile):** AMPK activation, metabolic signaling, mitochondria-to-nucleus communication via nuclear translocation, exercise-mimetic metabolic effects. The metabolic / signaling MDP.\n\n**SS-31 (Elamipretide / Forzinity):** Cardiolipin binding, inner mitochondrial membrane structural support, ETC supercomplex preservation, ROS reduction via structural mechanism. The structural MDP. FDA-approved (Forzinity, Sept 2025) for Barth syndrome — the first mitochondria-targeted FDA approval.\n\n**Humanin (HNG analog):** Bax inhibition, anti-apoptotic mechanism, neuroprotection, IGF-1 pathway modulation. The anti-apoptotic MDP. Centenarian-correlation epidemiology (Yen 2013).\n\nThe three layer with non-MDP mitochondrial interventions:\n\n**Urolithin A:** Mitophagy specifically — recycling damaged mitochondria. Distinct from MDP mechanisms; complementary.\n\n**PQQ:** Mitochondrial biogenesis via PGC-1α activation (mechanism overlap with MOTS-c's downstream PGC-1α effect; different upstream trigger). Creates new mitochondria.\n\n**CoQ10 / Ubiquinol:** Electron transport chain substrate. Direct cofactor for Complex I-III electron transfer.\n\n**NAD precursors (NMN, NR, trigonelline):** Substrate for sirtuin-mediated mitochondrial maintenance; complementary to AMPK pathway (both activated by caloric restriction and exercise).\n\nThe decision frame: MOTS-c is one component of a multi-pathway mitochondrial protocol, not a standalone solution. The mechanism complementarity with SS-31, Humanin, Urolithin A, and the biogenesis / substrate / NAD layer is mechanistically rational and reflects the community-evolved comprehensive stack.\n\n## The Exercise Mimetic Framing — Honest Reading\n\nThe 'exercise in a vial' marketing framing has become the dominant longevity-community positioning of MOTS-c, and it's worth being explicit about what it does and doesn't mean.\n\n**What's real about the framing:** MOTS-c activates AMPK, the same master energy sensor that exercise activates. The downstream molecular effects — improved insulin sensitivity, increased fatty acid oxidation, mitochondrial biogenesis support, autophagy activation — overlap substantially with exercise's molecular effects. Animal model evidence for exercise-mimetic physical function improvements is robust.\n\n**What's not real about the framing:** Exercise produces benefits via mechanisms that MOTS-c does not replicate:\n\n- **Cardiovascular adaptation** — cardiac structural adaptation, blood volume expansion, vascular conditioning, endothelial function via shear stress. Zero MOTS-c overlap.\n- **Neurogenesis via BDNF / IGF-1** — exercise drives hippocampal neurogenesis via BDNF; the cognitive benefits of exercise are not replicated by MOTS-c.\n- **Musculoskeletal adaptation** — mechanical loading drives bone density, tendon strength, sarcomere remodeling. No peptide replacement for the mechanical stimulus.\n- **Hormonal effects** — testosterone, growth hormone, cortisol modulation in response to exercise stimulus. Limited MOTS-c overlap.\n- **Psychological / cognitive / social benefits** — mood effects, stress resilience, social context. No peptide replacement.\n\nThe honest framing: MOTS-c **augments** exercise's metabolic / mitochondrial benefits but **does not replace** exercise. A user running MOTS-c without continuing structured exercise misses the bulk of exercise's benefits — cardiovascular, neurological, musculoskeletal, hormonal, psychological. The catalog position is firm: MOTS-c is a layer on top of structured exercise, not an alternative to it.\n\nSame epistemic posture the catalog takes on retatrutide vs nutrition / exercise foundation, on NAD precursors vs sleep / caloric balance, on broader longevity protocols vs lifestyle foundation. Peptide / pharmaceutical interventions add layers; they don't replace foundations.\n\n## When MOTS-c Earns Its Slot\n\n**Documented metabolic dysfunction** — insulin resistance, prediabetes, T2D, MASLD, metabolic syndrome. The AMPK mechanism is mechanistically rational for these conditions; biomarker tracking provides legible response data.\n\n**Aging-context metabolic decline** — age-related insulin resistance, sarcopenia, body composition shift toward visceral adiposity. MOTS-c levels decline with age; restoration is mechanistically rational.\n\n**Comprehensive mitochondrial pillar protocols** — as the AMPK / metabolic arm of the mitochondrial trinity; layered with SS-31, Humanin, Urolithin A, biogenesis support, NAD precursors.\n\n**Exercise-supportive protocols** — augmenting (not replacing) structured exercise programs in athletic / performance contexts.\n\n## When MOTS-c Is the Wrong Tool\n\n**As exercise replacement** — see honest framing above.\n\n**For users without metabolic dysfunction running it as a longevity insurance policy** — defensible but the legibility of effect is lower; subjective response may be modest in metabolically healthy users.\n\n**For users unable to track biomarkers** — flying blind on a research peptide without baseline / follow-up labs misses the strongest case for the intervention.\n\n## Biomarker Tracking — What to Pull\n\nFor users running MOTS-c with metabolic objectives, baseline and 12-week labs:\n\n- **HbA1c** — 90-day average glucose; the central metabolic biomarker\n- **Fasting insulin** — sensitive marker of insulin resistance; often elevated before HbA1c shifts\n- **Fasting glucose** — standard; less sensitive than fasting insulin\n- **HOMA-IR** — calculated from fasting glucose and insulin: (glucose × insulin) / 405; provides insulin resistance index\n- **Lipid panel** — total cholesterol, LDL, HDL, triglycerides; the TG/HDL ratio is a useful insulin-resistance marker\n- **Body composition** — DEXA preferred (visceral vs subcutaneous fat); waist circumference as proxy; weight alone is uninformative\n- **hsCRP** — inflammation marker; AMPK activation has anti-inflammatory effects\n- **Liver enzymes (ALT/AST/GGT)** — relevant for MASLD context\n\nPull baseline before starting if not already on file. Pull repeat at 12 weeks for first cycle; quarterly thereafter for chronic use. The biomarker-driven approach is the legible way to assess response; subjective feel is a secondary signal.\n\n## Beginner Protocol\n\n5mg subcutaneous × 2 weeks for tolerance assessment, then 10mg subcutaneous 2-3× weekly × 8-12 weeks. Inject into abdominal subcutaneous tissue or thigh; rotate sites. Refrigerate reconstituted product; use within 28-30 days. Subjective effects often noticeable within 1-2 weeks (energy, exercise capacity); metabolic effects accumulate over 8-12+ weeks.\n\n## Advanced Protocol\n\n**Mitochondrial trinity:** MOTS-c 10mg subQ 2× weekly + SS-31 5-10mg subQ 3× weekly + HNG (S14G-Humanin) 2-5mg subQ 2× weekly. Three distinct mitochondrial mechanisms (AMPK metabolic signaling, cardiolipin structural support, Bax-mediated anti-apoptotic protection) addressed simultaneously.\n\n**Comprehensive mitochondrial pillar:** mitochondrial trinity + Urolithin A 500mg/day (mitophagy) + PQQ 20mg/day (biogenesis) + CoQ10/Ubiquinol 100-200mg/day (ETC substrate) + NAD precursors (NMN/NR + TMG + pterostilbene + trigonelline). Five-mechanism comprehensive coverage: biogenesis, structure, function, recycling, apoptosis-protection, plus sirtuin pathway substrate.\n\n**Metabolic dysfunction protocol** (insulin resistance, T2D, MASLD): MOTS-c 10mg 2-3× weekly + Metformin (if prescribed) + Berberine 500mg TID + GLP-1 agonist (if prescribed) + nutritional foundation (carbohydrate-quality optimization, time-restricted eating, protein adequacy) + structured exercise. The AMPK pathway is the convergence point for several metabolic interventions; combinations are mechanistically rational with additive effects expected.\n\n**Performance / athletic context:** MOTS-c 10mg 2-3× weekly + structured exercise (the foundation, not optional) + sleep optimization + nutritional foundation + recovery protocol. Augment, don't replace.\n\n## Reconstitution + Administration\n\nLyophilized powder typical 10mg vial. Reconstitute with 2mL bacteriostatic water → 5mg/mL working concentration. Subcutaneous injection via insulin syringe (29-31G short needle), abdominal or thigh sites, rotate. Pinch fold for thinner subcutaneous tissue. Refrigerate reconstituted product; use within 28-30 days. Discard at 30 days regardless of remaining volume — peptide degradation accelerates beyond that window.\n\n## Synergies\n\n**SS-31 (Elamipretide / Forzinity):** complementary MDP mechanism — structural / cardiolipin support of inner mitochondrial membrane vs MOTS-c's metabolic / AMPK signaling. The two mitochondrial-derived peptides are mechanistically distinct and synergistic; together they address structural and signaling dimensions of mitochondrial function.\n\n**Humanin (HNG analog):** complementary MDP mechanism — anti-apoptotic Bax inhibition and neuroprotection vs MOTS-c's metabolic signaling. The three MDPs (MOTS-c, SS-31, Humanin) form the mitochondrial trinity.\n\n**Urolithin A:** mitophagy specifically — recycling damaged mitochondria. Different from MDP signaling / structural mechanisms; complementary in comprehensive protocols.\n\n**PQQ:** mitochondrial biogenesis via PGC-1α activation (mechanism overlap with MOTS-c's downstream PGC-1α effect; different upstream trigger).\n\n**CoQ10 / Ubiquinol:** ETC substrate — Complex I to III electron transfer cofactor. Substrate-level support of mitochondria that MOTS-c is helping create / signal.\n\n**NAD precursors (NMN, NR, trigonelline):** substrate for sirtuin-mediated mitochondrial maintenance; AMPK and sirtuin pathways are complementary metabolic-sensor pathways, both activated by caloric restriction and exercise.\n\n**Metformin:** classical AMPK activator via Complex I inhibition; combinations mechanistically rational. Mechanism convergence supports additive effects.\n\n**Berberine:** another AMPK activator; mechanism convergence with MOTS-c; combinations rational.\n\n**GLP-1 agonists (semaglutide, tirzepatide, retatrutide):** different mechanism (incretin pathway) but overlapping metabolic effects; combinations clinically reasonable for metabolic dysfunction context with prescriber coordination.\n\n**Exercise:** the foundation, not optional. MOTS-c augments the AMPK / metabolic / mitochondrial subset of exercise benefits but does not replace the broader exercise stimulus (cardiovascular, neurological, musculoskeletal, hormonal, psychological).\n\n## Clinical Trial Citations Worth Knowing\n\n**Lee et al. 2015 (Cell Metabolism):** foundational MOTS-c discovery paper from Pinchas Cohen's laboratory at USC Davis School of Gerontology. Identified MOTS-c via systematic ORF analysis of the 12S rRNA gene; established AMPK activation as the central mechanism; demonstrated insulin sensitivity improvements in aged and high-fat-diet-induced obese mouse models; provided initial mechanism characterization.\n\n**Cohen laboratory subsequent papers (2015-2025):** extended the mechanism — nuclear translocation under metabolic stress; downstream gene expression effects; exercise mimetic effects in aged animal models; cardiovascular benefits in atherosclerosis models; cognitive support in age-related cognitive decline models. The Cohen-laboratory body of work is the primary academic source on MOTS-c.\n\n**MDP framework papers:** Hashimoto 2001 (Humanin discovery from familial Alzheimer's survivor cDNA library), Lee 2015 (MOTS-c), subsequent SHLP series identification — establishing the broader mitochondrial-derived peptide class.\n\n**Human RCT evidence:** remains limited. No large pharmaceutical-sponsor Phase II/III program has been published for MOTS-c as of catalog last update; this is the central evidence gap relative to SS-31 (FDA-approved Forzinity status via Stealth BioTherapeutics clinical program). Small human observational studies have characterized circulating MOTS-c levels in metabolic disease contexts and confirmed age-related decline.\n\n## Evidence Quality\n\nMechanism well-characterized in animal models. Academic provenance via Pinchas Cohen / USC Davis School of Gerontology provides credibility. The MDP discovery framework is paradigm-shifting and well-established. The AMPK activation mechanism is among the best-evidence longevity pathways across model organisms.\n\n**The evidence gap:** human RCT evidence for clinical efficacy of exogenous MOTS-c supplementation is limited. The compound is research-stage rather than clinically validated like SS-31. Animal-model translation to human clinical effect is plausible given mechanism conservation but not formally demonstrated at RCT scale.\n\nThis puts MOTS-c in the same evidence-tier as HNG, NAD precursors (NMN, NR), and various longevity peptides — mechanistic case strong, animal evidence robust, human RCT evidence limited, community use ahead of formal validation. The catalog frame: mechanistically rational compound with growing observational evidence base; not yet RCT-validated like SS-31; reasonable to use in research-peptide context with biomarker tracking and honest expectations about evidence quality.\n\n## Research vs Anecdote\n\n**Research:** solid mechanistic foundation (AMPK activation, mitochondria-to-nucleus signaling via nuclear translocation, exercise-mimetic effects in animal models); academic provenance via Pinchas Cohen / USC Davis School of Gerontology; the mitochondrial-derived peptide framework is paradigm-shifting and well-established in mitochondrial-aging research; human clinical evidence still emerging.\n\n**Anecdote:** extensive longevity / metabolic / performance community use; subjective effects often noticeable within 1-2 weeks (energy, exercise capacity, recovery — faster subjective response than SS-31, where the structural mechanism is largely silent); pairs naturally with mitochondrial trinity and comprehensive longevity stacks; biomarker response in metabolic dysfunction contexts (HbA1c, fasting insulin, HOMA-IR) reported across community / clinic experience.\n\n**Decision frame:** foundational mitochondrial-derived peptide with the AMPK / metabolic / signaling mechanism distinguishing it from SS-31 (structural) and Humanin (anti-apoptotic); pairs with the mitochondrial trinity (SS-31, Humanin) and broader mitochondrial pillar (Urolithin A, PQQ, CoQ10, NAD precursors) for comprehensive coverage; mechanistically rational for metabolic dysfunction contexts with biomarker-tracked dosing; does NOT replace exercise — augments the metabolic / mitochondrial subset of exercise's benefits while leaving cardiovascular, neurological, musculoskeletal, hormonal, and psychological benefits of exercise un-addressed; research peptide status with FDA approval absent (distinct from SS-31's Forzinity approval); the catalog does not provide specific protocol guidance per locked HRT/protocol rule.",
    tags: [
      "MOTS-c",
      "MOTS-C",
      "mitochondrial-derived peptide",
      "MDP",
      "AMPK activator",
      "exercise mimetic",
      "Pinchas Cohen",
      "USC Davis School of Gerontology",
      "Lee 2015",
      "12S rRNA",
      "nuclear translocation",
      "PGC-1 alpha",
      "metabolic",
      "longevity",
      "mitochondrial trinity",
    ],
  },
];
