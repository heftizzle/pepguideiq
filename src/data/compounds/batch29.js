/** Batch 29 — Testosterone Ester / Delivery Variants Migration Cluster (5 entries, 5 migrations).
 *
 *  Five PEPTIDES_CORE migrations rewritten at full long-form depth.
 *  Five separate single-line deletions from PEPTIDES_CORE — non-contiguous
 *  pattern matching BATCH28; same migration accounting as recent batches.
 *
 *    testosterone-cypionate — MIGRATED. 8-carbon ester (cyclopentyl
 *      propionate); ~8 day half-life; the dominant US TRT ester; IM
 *      and SubQ routes covered with SubQ oil-pooling welt reality.
 *    testosterone-enanthate — MIGRATED. 7-carbon ester (heptanoate);
 *      ~7 day half-life; functionally interchangeable with cypionate;
 *      Xyosted SubQ autoinjector formulation specifically engineered
 *      to address oil-pooling injection site reactions.
 *    testosterone-propionate — MIGRATED. 3-carbon ester (propanoate);
 *      ~2 day half-life; EOD dosing required; PIP (post-injection
 *      pain) reality; largely historical for first-line TRT in modern
 *      US clinical practice but persists in specific contexts.
 *    testosterone-undecanoate — MIGRATED. 11-carbon ester; long-ester
 *      outlier with ~33 day half-life IM; Aveed (US IM, REMS-required
 *      due to POME), Nebido (ex-US IM), Jatenzo (oral via lymphatic
 *      absorption); three distinct pharmaceutical formulations.
 *    testosterone-topical — MIGRATED. Transdermal gels/creams/solutions;
 *      AndroGel/Testim/Fortesta/Vogelxo/Axiron; ~10% absorption with
 *      substantial inter-individual variability; transfer risk to
 *      family/pets is real, documented, FDA-boxed-warning safety
 *      content (not theoretical).
 *
 *  Theme: comprehensive testosterone delivery format coverage. The
 *  molecule is identical across all five entries; ester chemistry and
 *  delivery vehicle determine PK profile, dosing interval, route
 *  considerations, and clinical use case. Each tile covers shared
 *  mechanism (concise) and ester-specific PK / clinical / route
 *  considerations (depth).
 *
 *  Migration accounting:
 *    PEPTIDES_CORE: 31 → 26 (−5)
 *    ALL_COMPOUNDS: 277 → 282 (+5 net new ids; PEPTIDES_CORE override
 *      filter handles transition before step-3 deletion executes)
 *    Total catalog count maintained via merge logic.
 *
 *  Editorial decisions locked:
 *    - Medical-context-only framing (no abuse-dosing recipes)
 *    - Lab-monitoring foundation across all five tiles
 *    - E2 management coverage (anastrozole/exemestane in clinical context)
 *    - Fertility considerations (hCG, enclomiphene, PCT for cycling-off)
 *    - Honest SubQ welt / oil-pooling reality for cyp/enan
 *    - Honest topical absorption variability and transfer risk
 *    - No personal protocol integration (per locked decision for
 *      GLP/TRT/HRT batches)
 *    - TRAVERSE 2023 (NEJM) cited for cardiovascular safety evidence
 *
 *  Cross-references (descriptive, not stacksWith ids):
 *    - hCG, kisspeptin, hMG (HPG axis support — BATCH31 queue)
 *    - Enclomiphene / clomiphene / tamoxifen (PCT context — separate)
 *    - Anastrozole / exemestane (E2 management — descriptive context)
 *
 *  Schema matches BATCH7-28.
 */
export const BATCH29 = [
  {
    id: "testosterone-cypionate",
    name: "Testosterone Cypionate",
    aliases: ["Depo-Testosterone", "Test Cyp", "Cypionate", "Cyp"],
    category: ["Anabolics / HRT", "Testosterone Support"],
    categories: ["Anabolics / HRT", "Testosterone Support"],
    route: ["intramuscular", "subcutaneous"],
    mechanism:
      "Testosterone is the principal androgen in human males, secreted by Leydig cells under pulsatile LH stimulation from the anterior pituitary. The HPG axis (hypothalamus → GnRH → pituitary → LH/FSH → testes) maintains endogenous production through negative feedback, where circulating testosterone and estradiol suppress hypothalamic GnRH release. **Mechanism — three-pathway action**: testosterone acts through (1) direct binding to the androgen receptor (AR), (2) conversion to dihydrotestosterone (DHT) via 5α-reductase (DHT has 3-10x higher AR affinity than testosterone itself), and (3) aromatization to estradiol (E2) via aromatase (CYP19A1). This three-pathway architecture explains why exogenous testosterone produces effects beyond pure AR activation: DHT drives prostate, scalp, and skin effects; E2 drives bone density, lipid effects, libido, and a portion of mood and cognition; direct AR binding drives muscle, hematopoiesis, and metabolic effects. **Mechanism — HPG suppression on exogenous administration**: exogenous testosterone administration suppresses the HPG axis through negative feedback. LH and FSH drop to near-zero within weeks. Intratesticular testosterone (which is 50-100x serum levels under endogenous production) collapses. Spermatogenesis ceases or markedly reduces. Testicular atrophy follows within months. The suppression is reversible in most cases, though recovery duration scales with duration of exogenous administration. **Mechanism — ester chemistry (the cypionate-specific PK feature)**: cypionate is an 8-carbon ester (cyclopentyl propionate) attached at the 17β-hydroxyl position of the testosterone molecule. The ester delays release from the intramuscular oil depot through hydrolysis by serum esterases, producing an effective half-life of approximately 8 days. Peak serum levels occur at 24-48 hours post-IM injection, followed by exponential decay. **Pharmacokinetics — dosing interval considerations**: standard TRT protocols of 100-200mg/week IM produce supraphysiologic peaks 24-48 hours after injection and trough levels at the end of the dosing interval. Twice-weekly dosing (splitting the same weekly total into two injections every 3.5 days) flattens the curve substantially. Daily or every-other-day microdosing approximates physiologic continuous release. Pharmaceutical concentration is typically 200mg/mL in cottonseed or grapeseed oil; compounded pharmacies stock varying concentrations and oil vehicles.",
    halfLife: "~8 days (intramuscular oil depot); peak serum at 24-48h post-injection; exponential decay across the dosing interval",
    reconstitution: { solvent: "Pre-formulated oil-based injectable (cottonseed or grapeseed oil vehicle); no reconstitution required for pharmaceutical or compounded product", typicalVialMg: 2000, typicalVolumeMl: 10 },
    dosingRange: { low: "100mg/week (entry; lower-dose TRT for sensitive responders or starting protocols)", medium: "150-200mg/week (typical TRT range; the prescribed clinical norm)", high: "200mg/week (high-end TRT range; supraphysiologic protocols beyond this fall outside TRT and into AAS territory — outside this catalog's scope)", frequency: "Once weekly IM/SubQ (traditional); twice weekly (every 3.5 days) for flatter PK; EOD or daily microdosing (most-flat PK profile)" },
    typicalDose: "100-200mg/week total, split as once weekly, twice weekly (every 3.5 days), or EOD/daily microdose protocols depending on PK preference",
    startDose: "100-150mg/week split into twice-weekly injections × 6-8 weeks, then trough labs to assess steady-state response",
    titrationNote: "Steady state reached at 4-6 weeks. Trough labs drawn immediately before next injection captures lowest point of cycle. Mid-cycle draws produce higher numbers and are useful for confirming peak does not exceed safe ranges. Symptom resolution (energy, libido, mood, body composition) often perceptible within 4-8 weeks; full clinical effect over 3-6 months.",
    cycle: "Continuous (TRT context); not cycled. Cycling-off requires PCT protocol (clomiphene, enclomiphene, tamoxifen) to restart HPG axis if fertility or endogenous production restoration is the goal. Some protocols use intermittent cycling under specialist coordination but this is the exception rather than the norm in modern TRT practice.",
    storage: "Room temperature; protect from light; avoid freezing. Do not refrigerate (oil viscosity increases substantially when cold and complicates draw). Pharmaceutical multi-dose vials per label expiration; compounded vials per pharmacy assigned beyond-use date.",
    benefits: [
      "FDA-approved as Depo-Testosterone for primary and secondary male hypogonadism",
      "Most commonly prescribed TRT ester in the United States — patent history, manufacturing scale, prescriber familiarity",
      "Restored eugonadal serum testosterone with appropriate symptom resolution in symptomatic hypogonadism",
      "8-day half-life supports flexible dosing schedules — once weekly to daily microdosing",
      "Decades of clinical use; extensive RCT evidence for TRT efficacy in symptomatic hypogonadism",
      "Cardiovascular safety established by TRAVERSE trial (NEJM 2023) — non-inferior to placebo for major adverse cardiovascular events in middle-aged men with hypogonadism and elevated cardiovascular risk",
      "Bone density support; mood and cognition support; libido restoration; lean mass support; metabolic improvements",
      "Functionally interchangeable with enanthate at clinical doses — switching does not require dose adjustment",
      "Multiple route options (IM and SubQ) provide flexibility based on patient preference and tolerance",
    ],
    sideEffects: [
      "Erythrocytosis — TRT-induced elevation of hematocrit; the most common adverse effect; therapeutic phlebotomy threshold typically 52-54%",
      "Estradiol elevation — symptomatic in some users (gynecomastia risk, water retention, mood disruption, nipple sensitivity)",
      "Acne — particularly in users with adolescent acne history",
      "Hair loss acceleration (in users genetically predisposed to androgenetic alopecia) — DHT-mediated",
      "Sleep apnea worsening — testosterone can worsen existing OSA; screen and treat",
      "Testicular atrophy — universal on TRT without hCG support; reversible with cessation or hCG addition",
      "Spermatogenesis suppression / fertility impact — near-universal on TRT without concurrent hCG or enclomiphene",
      "Injection site soreness — particularly first weeks; site rotation reduces",
      "SubQ-specific: oil-pooling welts, palpable nodules, sterile inflammation — particularly with volumes above ~0.3mL per site; smaller more-frequent injections mitigate",
      "Mood effects — both improvement and irritability are reported",
      "Lipid changes — HDL reduction is documented; LDL effects variable; clinical significance debated",
      "PSA elevation — monitor in men over 40",
    ],
    stacksWith: ["hcg", "kisspeptin", "anastrozole", "enclomiphene"],
    warnings: [
      "Prostate cancer (active or treated) — relative contraindication; coordinate with urology / oncology",
      "Severe untreated sleep apnea — treat OSA first; testosterone can worsen",
      "Erythrocytosis history or current — relative contraindication; monitor hematocrit; therapeutic phlebotomy as needed",
      "Severe heart failure (uncompensated) — relative contraindication; coordinate with cardiology",
      "Active fertility intention — TRT suppresses spermatogenesis; concurrent hCG, enclomiphene monotherapy, or scheduled cycling-off with PCT required for fertility preservation",
      "Pregnancy / women / pediatric — contraindicated except in specific specialist contexts",
      "Concurrent anticoagulants — testosterone can affect clotting parameters; coordinate dosing",
      "Quality control — pharmaceutical Depo-Testosterone provides reliable potency; compounded cypionate quality varies by pharmacy; verify pharmacy 503A/503B status and quality assurance",
      "Athletes subject to drug testing — testosterone is universally banned by WADA, USADA, NCAA, and professional sport leagues; therapeutic use exemptions (TUEs) vary by organization and require documentation",
      "Schedule III controlled substance in the US — prescription required",
    ],
    sourcingNotes:
      "Pharmaceutical: Depo-Testosterone (Pfizer/Pharmacia & Upjohn) and generic cypionate from multiple manufacturers; available with prescription via standard pharmacies and TRT clinics. Compounded: 503A and 503B compounding pharmacies stock cypionate in varying concentrations and oil vehicles (cottonseed, grapeseed, MCT). TRT clinic networks (Defy Medical, Marek Health, Maximus, similar) prescribe via telemedicine in most US states. Insurance coverage varies by plan and indication documentation.",
    notes:
      "## Clinical Context — Why Cypionate Dominates US TRT\n\nCypionate is the most commonly prescribed TRT ester in the United States primarily because of patent history, manufacturing scale, and prescriber familiarity rather than any clinical superiority over enanthate. The two esters are functionally interchangeable at clinical doses; switching between cypionate and enanthate does not require dose adjustment. Globally, enanthate dominates many international markets — the geographic split is supply-chain driven, not clinical.\n\n## Routes of Administration\n\n### Intramuscular (traditional)\n- Glute, ventrogluteal, quadriceps (vastus lateralis), deltoid\n- 1-1.5\" needle, 22-25 gauge for the injection itself, 18-20g draw needle\n- Larger oil bolus, slower absorption from the muscle depot\n- Standard pharmaceutical labeling reflects IM administration\n\n### Subcutaneous (increasingly common)\n- Smaller gauge (27-30g insulin syringe), abdominal subcutaneous tissue or thigh\n- Some clinicians report flatter PK profile and reduced E2 spikes versus IM, though the published comparative literature is mixed\n- **Practical reality: SubQ delivery of oil-based testosterone can produce welts, palpable nodules, or sterile inflammation from oil pooling at the injection site, particularly with volumes above ~0.3mL per site**\n- Site rotation is mandatory\n- Smaller, more-frequent injections mitigate the issue (e.g., 0.1mL EOD rather than 0.5mL weekly)\n- SubQ is more common now than five years ago, but oil-vehicle-related injection site reactions remain a real consideration\n\n## Monitoring — Standard TRT Lab Panel\n- **Total testosterone** — target eugonadal range, typically 700-1000 ng/dL trough\n- **Free testosterone** — bioavailable fraction\n- **Sensitive estradiol assay** (LC-MS/MS preferred over standard assay)\n- **Complete blood count** — hematocrit specifically; therapeutic phlebotomy threshold typically 52-54%\n- **Comprehensive metabolic panel** — liver, kidney, glucose\n- **Lipid panel** — HDL reduction is documented on TRT\n- **PSA** — baseline and follow-up in men over 40\n- **LH, FSH** — confirms HPG suppression on TRT (expected); informs PCT planning if cycling off\n- **Semen analysis** — when fertility preservation is in scope\n- **SHBG** — for free testosterone calculation context\n\n**Lab timing:** trough draw immediately before next injection captures the lowest point of the cycle. Mid-cycle draws produce higher numbers and are useful for confirming peak does not exceed safe ranges.\n\n## Estradiol Management\n\nAromatase inhibitors (anastrozole, exemestane) are sometimes prescribed when E2 elevates symptomatically — gynecomastia, water retention, mood disruption. Modern TRT practice generally avoids reflexive AI use unless clinically indicated, because E2 has substantial benefits in male physiology (bone density, lipid profile, libido, mood, cognition) and over-suppression produces measurable harm.\n\nThe clinical mistake of treating E2 numbers rather than E2 symptoms is well-documented. Eugonadal men have E2 in the 20-40 pg/mL range typically; supraphysiologic peaks 1-2 days post-injection are normal on weekly cypionate and resolve to physiologic ranges by trough. Treating the peak number with AI dosing produces over-suppression at trough and the symptomatic harms of low E2 (joint pain, low libido, mood disruption, lipid worsening, bone density loss).\n\n## Fertility Considerations\n\nHPG suppression on TRT is near-universal. Fertility preservation strategies:\n\n**Concurrent hCG** (typically 250-500 IU 2-3x/week) to maintain intratesticular testosterone and spermatogenesis. The most-used fertility-preservation strategy alongside ongoing TRT.\n\n**Scheduled cycling off TRT with PCT protocols** (clomiphene, enclomiphene, tamoxifen) to restart the axis. Used when fertility intention is time-limited and TRT can be paused.\n\n**Enclomiphene monotherapy** for men who want eugonadal levels with preserved fertility — stimulates endogenous LH/FSH rather than replacing testosterone exogenously. Increasingly common in fertility-conscious TRT contexts.\n\n## Cardiovascular Safety — TRAVERSE 2023\n\nThe TRAVERSE trial (NEJM 2023) provided the most robust modern data on TRT cardiovascular safety, finding TRT non-inferior to placebo for major adverse cardiovascular events (MACE) in middle-aged men with hypogonadism and elevated cardiovascular risk. The trial enrolled 5,246 men aged 45-80 with pre-existing cardiovascular disease or high CV risk, followed for an average of 22 months. Earlier observational concerns (Vigen 2013, Finkle 2014) that drove FDA labeling changes are not supported by the TRAVERSE RCT data.\n\nClinical implication: TRT in symptomatic hypogonadism with appropriate monitoring does not increase cardiovascular event risk. Erythrocytosis remains a manageable adverse effect requiring monitoring; venous thromboembolism risk requires individual assessment.\n\n## Synergies\n**hCG** for fertility preservation and testicular function preservation. **Enclomiphene** as monotherapy alternative or post-TRT PCT. **Anastrozole / exemestane** for E2 management when clinically indicated. **Foundational health stack** (vitamin D3, magnesium, zinc, comprehensive nutrition) supports endogenous testosterone production and androgen receptor function.\n\n## Clinical Trial Citations Worth Knowing\nTRAVERSE (Lincoff 2023, NEJM) — the modern cardiovascular safety RCT. Bhasin 2018 (Endocrine Society guideline). Multiple decades of efficacy RCTs in symptomatic hypogonadism.\n\n## Evidence Quality\nDecades of FDA-approved use; extensive RCT evidence; modern cardiovascular safety RCT (TRAVERSE 2023); established monitoring protocols; well-characterized PK and AE profile. The molecule has the most evidence base of any androgen pharmacotherapy.\n\n## Research vs Anecdote\nResearch: foundational TRT RCT evidence; TRAVERSE establishes modern CV safety; established Endocrine Society guidelines for diagnosis and monitoring. Anecdote: extensive TRT clinic experience; community familiarity with twice-weekly and EOD/daily microdose protocols; SubQ adoption growing despite oil-pooling reality. Decision frame: foundational TRT ester for symptomatic hypogonadism; functionally interchangeable with enanthate; route choice (IM vs SubQ) is patient preference with documented tradeoffs; concurrent hCG or enclomiphene for fertility preservation; comprehensive lab monitoring foundation; E2 management based on symptoms not numbers.",
    tags: ["testosterone-cypionate", "Depo-Testosterone", "TRT", "androgen replacement", "8-day half-life", "IM injection", "SubQ injection", "FDA-approved", "TRAVERSE", "Schedule III"],
    tier: "entry",
  },

  {
    id: "testosterone-enanthate",
    name: "Testosterone Enanthate",
    aliases: ["Delatestryl", "Xyosted", "Test E", "Enanthate", "Test Enan"],
    category: ["Anabolics / HRT", "Testosterone Support"],
    categories: ["Anabolics / HRT", "Testosterone Support"],
    route: ["intramuscular", "subcutaneous"],
    mechanism:
      "Testosterone is the principal androgen in human males, secreted by Leydig cells under pulsatile LH stimulation. Three-pathway action: direct AR binding, conversion to DHT via 5α-reductase, and aromatization to E2 via aromatase. Exogenous administration suppresses the HPG axis through negative feedback, dropping LH/FSH to near-zero, collapsing intratesticular testosterone, and reducing spermatogenesis. (Full mechanism detail per testosterone-cypionate tile — the molecule and three-pathway action are identical across all testosterone esters; ester chemistry and delivery vehicle determine the PK profile and clinical use case.) **Mechanism — ester chemistry (the enanthate-specific PK feature)**: enanthate is a 7-carbon ester (heptanoate). Half-life approximately 7 days — slightly shorter than cypionate's 8 days, but functionally equivalent at TRT dosing intervals. Peak serum at 24-48 hours post-injection, similar curve shape to cypionate, marginally faster decay. **Pharmacokinetics — dosing interval**: 100-200mg/week IM or SubQ; twice-weekly or daily microdosing protocols are functionally identical to cypionate protocols. The two esters are interchangeable at clinical doses; switching between cypionate and enanthate does not require dose adjustment. **Geographic and pharmaceutical distribution**: cypionate dominates US pharmaceutical TRT; enanthate is more common in international markets, including most of Europe and Asia. Compounding pharmacies in the US stock both. The dominance pattern is historical and supply-chain driven, not clinical. **Xyosted — the SubQ-specific innovation**: Xyosted (Antares Pharma) is a notable enanthate formulation — an autoinjector specifically designed for SubQ administration, which addresses oil-pooling injection site reactions through formulation engineering: refined sesame oil vehicle, autoinjector-controlled depth and angle, fixed-dose cartridges (50, 75, 100mg). Xyosted carries its own boxed warning for blood pressure elevation; ambulatory blood pressure monitoring is specifically recommended in labeling.",
    halfLife: "~7 days (intramuscular oil depot); peak serum at 24-48h post-injection; exponential decay across the dosing interval",
    reconstitution: { solvent: "Pre-formulated oil-based injectable (sesame oil for Delatestryl/Xyosted; varying oil vehicles for compounded product); no reconstitution required", typicalVialMg: 2000, typicalVolumeMl: 10 },
    dosingRange: { low: "100mg/week (entry; lower-dose TRT for sensitive responders or starting protocols)", medium: "150-200mg/week (typical TRT range)", high: "200mg/week (high-end TRT range; supraphysiologic protocols beyond this fall outside TRT scope)", frequency: "Once weekly (traditional); twice weekly (every 3.5 days) for flatter PK; EOD or daily microdosing; Xyosted is once-weekly fixed-dose autoinjector" },
    typicalDose: "100-200mg/week total, split as once weekly, twice weekly, or EOD/daily microdose protocols; Xyosted: 75mg SubQ once weekly fixed-dose (titratable up to 100mg)",
    startDose: "100-150mg/week split into twice-weekly injections × 6-8 weeks, then trough labs to assess steady-state response",
    titrationNote: "Steady state reached at 4-6 weeks. Same lab timing and clinical assessment pattern as cypionate. Symptom resolution timeline identical to cypionate. The two esters should be considered functionally equivalent for clinical decision-making, monitoring intervals, and ancillary medication considerations.",
    cycle: "Continuous (TRT context); not cycled. Cycling-off considerations identical to cypionate — PCT protocol required if fertility or endogenous production restoration is the goal.",
    storage: "Room temperature; protect from light; avoid freezing. Pharmaceutical Delatestryl and Xyosted per label; Xyosted autoinjectors are single-use.",
    benefits: [
      "FDA-approved as Delatestryl and Xyosted for primary and secondary male hypogonadism",
      "Functionally interchangeable with cypionate at clinical doses",
      "Dominates international (non-US) pharmaceutical TRT markets",
      "**Xyosted** — engineered SubQ autoinjector specifically addresses oil-pooling injection site reactions through refined formulation and delivery hardware",
      "7-day half-life supports flexible dosing schedules — once weekly to daily microdosing",
      "Restored eugonadal serum testosterone with appropriate symptom resolution",
      "Cardiovascular safety established by TRAVERSE 2023 (testosterone-molecule-level evidence)",
      "Bone density support; mood and cognition support; libido restoration; lean mass support; metabolic improvements",
      "Multiple route options (IM and SubQ) and multiple delivery formats (pharmaceutical multi-dose vials, Xyosted autoinjectors, compounded vials)",
    ],
    sideEffects: [
      "AE profile identical to cypionate at the molecule level",
      "Erythrocytosis — monitor hematocrit; therapeutic phlebotomy threshold typically 52-54%",
      "Estradiol elevation — symptomatic in some users",
      "Acne, hair loss acceleration (DHT-mediated, in genetically predisposed)",
      "Sleep apnea worsening",
      "Testicular atrophy and spermatogenesis suppression",
      "Injection site soreness; SubQ oil-pooling reactions for non-Xyosted products (Xyosted formulation specifically addresses this)",
      "Xyosted-specific: blood pressure elevation (boxed warning) — ambulatory BP monitoring specifically recommended",
      "Mood effects — both improvement and irritability reported",
      "Lipid changes — HDL reduction documented",
      "PSA elevation — monitor in men over 40",
    ],
    stacksWith: ["hcg", "kisspeptin", "anastrozole", "enclomiphene"],
    warnings: [
      "Prostate cancer (active or treated) — relative contraindication",
      "Severe untreated sleep apnea — treat OSA first",
      "Erythrocytosis history or current — relative contraindication; monitor hematocrit",
      "Severe heart failure (uncompensated) — relative contraindication",
      "Active fertility intention — TRT suppresses spermatogenesis; concurrent hCG or enclomiphene required for preservation",
      "Pregnancy / women / pediatric — contraindicated except in specific specialist contexts",
      "Xyosted-specific: hypertension — ambulatory BP monitoring required per boxed warning; uncontrolled HTN is a relative contraindication",
      "Concurrent anticoagulants — coordinate dosing",
      "Quality control — pharmaceutical Delatestryl and Xyosted provide reliable potency; compounded enanthate quality varies",
      "Athletes subject to drug testing — universally banned by WADA, USADA, NCAA, professional sport leagues; TUE requires documentation",
      "Schedule III controlled substance in the US",
    ],
    sourcingNotes:
      "Pharmaceutical: Delatestryl (multi-dose IM vial), Xyosted (single-use SubQ autoinjector, Antares Pharma), and generic enanthate; available with prescription via standard pharmacies and TRT clinics. Compounded: 503A and 503B compounding pharmacies stock enanthate in varying concentrations and oil vehicles. TRT clinic networks prescribe via telemedicine in most US states. Xyosted is a specialty pharmacy product; insurance coverage varies.",
    notes:
      "## Clinical Context — Cypionate vs Enanthate\n\nThe two esters should be considered functionally equivalent for clinical decision-making, monitoring intervals, and ancillary medication considerations. Switching between cypionate and enanthate does not require dose adjustment. The choice between them is typically driven by:\n\n- **Geographic availability** — enanthate dominates international markets; cypionate dominates US pharmaceutical channels\n- **Specific product preference** — Xyosted's SubQ-engineered autoinjector format is a meaningful clinical differentiator for users wanting SubQ delivery without oil-pooling concerns\n- **Insurance formulary** — coverage varies by plan and product\n- **Compounding pharmacy stock** — some compounding pharmacies stock one ester preferentially\n\n## Xyosted — The SubQ-Engineered Formulation\n\nXyosted (Antares Pharma) is the most clinically significant differentiator between enanthate and cypionate in the modern US market. The product addresses three problems with traditional SubQ testosterone:\n\n1. **Oil-pooling injection site reactions** — refined sesame oil vehicle and autoinjector-controlled depth/angle reduce the welt and palpable nodule reality of generic SubQ oil testosterone\n\n2. **Fixed-dose convenience** — pre-filled single-use cartridges (50, 75, 100mg) eliminate dose-drawing error and improve compliance\n\n3. **Autoinjector technology** — needle-shielded delivery, automated injection mechanism, simplified self-administration\n\n**Xyosted's blood pressure boxed warning** is the principal clinical limitation. Ambulatory blood pressure monitoring is specifically recommended in labeling. Users with uncontrolled hypertension are not appropriate Xyosted candidates.\n\n## Routes, Monitoring, E2 Management, Fertility — Identical to Cypionate\n\nAll clinical considerations from the cypionate tile apply to enanthate without modification:\n- **IM and SubQ routes** with the same oil-pooling realities for non-Xyosted products\n- **Standard TRT lab panel** with same trough timing\n- **E2 management** based on symptoms not numbers\n- **Fertility preservation** via concurrent hCG, enclomiphene monotherapy, or scheduled PCT\n- **Cardiovascular safety** evidence from TRAVERSE 2023 applies (testosterone-molecule-level evidence)\n\n## Synergies\nIdentical to cypionate. **hCG** for fertility preservation. **Enclomiphene** as monotherapy alternative or post-TRT PCT. **Anastrozole / exemestane** for E2 management when clinically indicated. **Foundational health stack** for endogenous androgen support.\n\n## Clinical Trial Citations Worth Knowing\nTRAVERSE (Lincoff 2023, NEJM) — applies to all testosterone esters at the molecule level. Bhasin 2018 (Endocrine Society guideline). Xyosted-specific approval data (FDA approval 2018, Antares Pharma).\n\n## Evidence Quality\nIdentical to cypionate. Decades of FDA-approved use; extensive RCT evidence; established monitoring protocols. Xyosted adds modern SubQ-specific clinical trial data supporting its formulation differentiation.\n\n## Research vs Anecdote\nResearch: same evidence base as cypionate; Xyosted adds product-specific trial data. Anecdote: international TRT communities favor enanthate due to availability; US-based SubQ users increasingly prefer Xyosted for the engineered formulation when insurance permits. Decision frame: functionally interchangeable with cypionate; choose based on availability, insurance, and product format preferences; Xyosted is a clinically meaningful SubQ option for users who want to avoid oil-pooling reactions without resorting to daily microdose protocols with generic oil products.",
    tags: ["testosterone-enanthate", "Delatestryl", "Xyosted", "TRT", "androgen replacement", "7-day half-life", "SubQ autoinjector", "FDA-approved", "Schedule III"],
    tier: "entry",
  },

  {
    id: "testosterone-propionate",
    name: "Testosterone Propionate",
    aliases: ["Test Prop", "Propionate", "Prop"],
    category: ["Anabolics / HRT", "Testosterone Support"],
    categories: ["Anabolics / HRT", "Testosterone Support"],
    route: ["intramuscular", "subcutaneous"],
    mechanism:
      "Testosterone mechanism per testosterone-cypionate tile. The molecule is identical; only the ester differs. Same three-pathway action (AR, DHT, E2), same HPG suppression on exogenous administration. **Mechanism — ester chemistry (the propionate-specific PK feature)**: propionate is a 3-carbon ester (propanoate). Short ester. Half-life approximately 2 days. Peak serum at 24 hours post-injection, rapid decay. **Pharmacokinetics — dosing interval requirement**: every-other-day (EOD) dosing required to maintain stable serum levels. Typical TRT range when prop is used: 50-100mg EOD, or 25-50mg EOD for low-dose protocols. Once-weekly or twice-weekly schedules produce unacceptable peak-trough swings with prop because of the short half-life. **Pharmacokinetics — flatter PK profile potential**: the short half-life that mandates frequent dosing also produces a flatter overall PK profile when run on EOD or daily schedules — some patients who are symptomatic with cypionate or enanthate peak-trough patterns do better on prop's flatter curve. **Injection-site pharmacology — why prop hurts**: propionate is notably more painful at the injection site than cypionate or enanthate. The mechanism is straightforward: shorter ester length means faster hydrolysis at the depot, producing higher local concentrations of free testosterone. Post-injection pain (PIP) is sufficiently common that EOD rotation across multiple injection sites is standard practice.",
    halfLife: "~2 days (intramuscular oil depot); peak serum at 24h post-injection; rapid decay requiring EOD dosing",
    reconstitution: { solvent: "Pre-formulated oil-based injectable (varying oil vehicles); no reconstitution required", typicalVialMg: 1000, typicalVolumeMl: 10 },
    dosingRange: { low: "25-50mg EOD (entry; low-dose TRT)", medium: "50-100mg EOD (typical TRT range when prop is used)", high: "100mg EOD (high-end TRT range; supraphysiologic protocols beyond this fall outside TRT scope)", frequency: "Every other day (EOD) standard; daily microdose alternative for flattest PK profile" },
    typicalDose: "50-100mg EOD (or 25-50mg daily) for total weekly dose equivalent to 100-200mg/week of cypionate or enanthate",
    startDose: "25-50mg EOD × 4-6 weeks, then trough labs to assess steady-state response",
    titrationNote: "Steady state reached substantially faster than long esters (~10-14 days vs 4-6 weeks for cyp/enan). Lab timing matters more with prop because of the short half-life — a draw at 36-48 hours post-injection captures mid-cycle rather than true trough levels. Trough on prop is the morning of the next-scheduled injection, before that injection is given.",
    cycle: "Continuous (TRT context); not cycled. Cycling-off considerations identical to long esters — PCT protocol required if fertility or endogenous production restoration is the goal. The faster clearance of prop means PCT can begin sooner after last dose vs long esters.",
    storage: "Room temperature; protect from light; avoid freezing.",
    benefits: [
      "Functionally identical molecule to cypionate and enanthate at the testosterone-action level",
      "Faster onset of action — steady state in ~10-14 days vs 4-6 weeks for long esters",
      "Faster clearance — useful for users transitioning off TRT or wanting shorter PCT lead-in",
      "Flatter PK profile potential when run EOD or daily — some patients symptomatic on weekly cyp/enan peak-trough patterns prefer prop's curve",
      "Useful in clinical fine-tuning — patients who don't tolerate long-ester PK can sometimes succeed on prop EOD",
      "Mixable with long esters — some users blend prop with cypionate or enanthate for flatter overall PK without daily EOD pinning (long ester provides steady-state baseline; prop covers trough end)",
      "Bone density support; mood and cognition support; libido restoration; lean mass support; metabolic improvements (testosterone-molecule-level benefits)",
      "Cardiovascular safety from TRAVERSE 2023 applies at the molecule level",
    ],
    sideEffects: [
      "AE profile identical to cypionate and enanthate at the molecule level",
      "**Post-injection pain (PIP)** — substantially more common and more pronounced than long esters; the principal user-facing tradeoff",
      "Erythrocytosis — monitor hematocrit",
      "Estradiol elevation — symptomatic in some users; may be less pronounced than weekly long-ester peaks because of flatter PK profile",
      "Acne, hair loss acceleration (DHT-mediated)",
      "Sleep apnea worsening",
      "Testicular atrophy and spermatogenesis suppression",
      "Injection site soreness — frequent (EOD or daily) site rotation across multiple sites required",
      "Mood effects — both improvement and irritability reported",
      "Lipid changes — HDL reduction documented",
      "PSA elevation — monitor in men over 40",
    ],
    stacksWith: ["hcg", "kisspeptin", "anastrozole", "enclomiphene"],
    warnings: [
      "Prostate cancer (active or treated) — relative contraindication",
      "Severe untreated sleep apnea — treat OSA first",
      "Erythrocytosis history or current — relative contraindication",
      "Severe heart failure (uncompensated) — relative contraindication",
      "Active fertility intention — TRT suppresses spermatogenesis; concurrent hCG or enclomiphene required",
      "Pregnancy / women / pediatric — contraindicated except in specific specialist contexts",
      "Concurrent anticoagulants — coordinate dosing",
      "Quality control — pharmaceutical propionate availability has declined sharply in US; most prop in current use is from compounding pharmacies or research peptide markets — quality varies; verify pharmacy 503A/503B status or COA",
      "Athletes subject to drug testing — universally banned",
      "Schedule III controlled substance in the US",
    ],
    sourcingNotes:
      "Pharmaceutical availability has declined sharply in US — most prescribers favor cypionate or enanthate for once or twice-weekly convenience. Compounding pharmacies stock prop. International markets retain pharmaceutical-grade options. Research peptide market presence is significant — quality varies substantially. Schedule III controlled substance in US — prescription required regardless of source.",
    notes:
      "## Clinical Context — Why Propionate Persists Despite Long-Ester Dominance\n\nPropionate is largely historical for first-line TRT in modern US clinical practice. Pharmaceutical availability has declined sharply. Most prescribers favor cypionate or enanthate for once or twice-weekly convenience. Propionate persists in three contexts:\n\n### 1. Athletic and bodybuilding underground use\n- Faster onset, faster clearance for drug-test windows\n- Shorter post-cycle recovery time relative to long-ester molecules\n- Persistent in performance-enhancement contexts despite declining medical use\n\n### 2. Clinical fine-tuning\n- Patients who are symptomatic with cypionate or enanthate peak-trough patterns sometimes do better on a flatter PK profile that prop EOD or daily can produce\n- Useful in users with strong E2 sensitivity where long-ester peaks drive symptomatic E2 elevation\n- Some users blend propionate with cypionate or enanthate to achieve flatter overall PK without daily EOD pinning — the long ester provides the steady-state baseline and the prop covers the trough end of the cycle\n\n### 3. International markets\n- Where prop remains a pharmaceutical-standard option in some countries\n- Compounding pharmacies stock it broadly\n\n## The PIP Reality\n\nPropionate is notably more painful at the injection site than cypionate or enanthate. The mechanism is straightforward: shorter ester length means faster hydrolysis at the depot, producing higher local concentrations of free testosterone. Post-injection pain (PIP) is sufficiently common that EOD rotation across multiple injection sites is standard practice.\n\n**PIP mitigation strategies:**\n- Site rotation across abdomen, thigh, glute, deltoid (EOD frequency necessitates ≥4 sites)\n- Smaller-volume injections at more sites\n- Warming oil before draw (thins viscosity, reduces injection trauma)\n- Slow injection technique\n- Some users blend prop with long-ester product to reduce per-injection prop concentration\n\n## Routes\n\nIM is standard. SubQ is possible but the higher injection frequency required by the short ester compounds any SubQ-related site reactions. The oil-pooling welt reality of SubQ long-ester products is amplified by EOD prop dosing. Site rotation across abdomen, thigh, glute, and deltoid is necessary regardless of route.\n\n## Monitoring\n\nSame TRT panel as cypionate and enanthate. **Lab timing matters more with prop** because of the short half-life — a draw at 36-48 hours post-injection captures mid-cycle rather than true trough levels. Trough on prop is the morning of the next-scheduled injection, before that injection is given.\n\n## E2 Management, Fertility, Evidence Base\n\nIdentical to cypionate and enanthate. Underlying molecule is identical; ester is the only difference. Cardiovascular safety evidence (TRAVERSE 2023) applies to the testosterone molecule and is not ester-specific.\n\n## Synergies\n**hCG** for fertility preservation. **Enclomiphene** as monotherapy alternative or post-TRT PCT. **Anastrozole / exemestane** for E2 management when clinically indicated. **Long-ester blend** (prop + cypionate or enanthate) for users wanting prop's PK shape without exclusive EOD pinning.\n\n## Clinical Trial Citations Worth Knowing\nSame foundational TRT evidence base as cypionate and enanthate (testosterone-molecule-level evidence). Prop-specific historical use predates modern RCT methodology; modern trials favor long esters for protocol simplicity.\n\n## Evidence Quality\nMolecule-level evidence identical to cypionate and enanthate. Ester-specific clinical evidence smaller because pharmaceutical use has declined; prop persists in compounded and research peptide markets where formal trial evidence is correspondingly limited.\n\n## Research vs Anecdote\nResearch: testosterone-molecule-level RCT evidence applies; ester-specific modern trials smaller. Anecdote: persistent use in clinical fine-tuning contexts (E2-sensitive users, peak-trough symptomatic users on long esters); persistent use in performance-enhancement contexts (faster onset/clearance); blend protocols with long esters. Decision frame: niche TRT ester appropriate for users who don't tolerate long-ester PK or who specifically want flatter PK profile; PIP is the principal user-facing tradeoff; EOD or daily dosing required; same monitoring and clinical considerations as long esters; pharmaceutical availability declining in US — most current use is compounded.",
    tags: ["testosterone-propionate", "Test Prop", "TRT", "androgen replacement", "2-day half-life", "EOD dosing", "PIP", "short ester", "Schedule III"],
    tier: "entry",
  },

  {
    id: "testosterone-undecanoate",
    name: "Testosterone Undecanoate",
    aliases: ["Aveed", "Nebido", "Jatenzo", "Test U", "TU", "Undecanoate"],
    category: ["Anabolics / HRT", "Testosterone Support"],
    categories: ["Anabolics / HRT", "Testosterone Support"],
    route: ["intramuscular", "oral"],
    mechanism:
      "Testosterone mechanism per testosterone-cypionate tile. Same three-pathway action (AR, DHT, E2), same HPG suppression on exogenous administration. The molecule is testosterone; the ester and delivery vehicle determine the PK profile. **Mechanism — ester chemistry (the undecanoate-specific PK feature)**: undecanoate is an 11-carbon ester. The longest ester in pharmaceutical use for testosterone. Half-life is on the order of 33 days for IM administration in oil vehicle, producing dramatically extended dosing intervals. **Mechanism — three distinct pharmaceutical formulations**: undecanoate is unique among testosterone esters in having three meaningfully distinct pharmaceutical products with different routes, dosing schedules, and clinical considerations. **Mechanism — Aveed (US, IM)**: 750mg IM in castor oil. Loading dose at week 0, second dose at week 4, then maintenance every 10 weeks. Half-life ~33 days. **Boxed warning for serious pulmonary oil microembolism (POME) and anaphylaxis** events, requiring 30-minute post-injection observation in a healthcare setting. REMS program enrollment required for prescribers and pharmacies. The logistical requirement (mandatory in-clinic administration with observation) limits Aveed adoption in US TRT practice despite the dramatic dosing-frequency advantage. **Mechanism — Nebido (ex-US, IM)**: 1000mg IM in castor oil. Same molecule as Aveed, slightly different vehicle and dose. Standard TRT in many European, Australian, and Asian markets. Lower documented POME rates than Aveed, attributed in part to slower injection technique and viscosity considerations. **Mechanism — Jatenzo (US, oral)**: 158-237mg twice daily oral capsule. Approved 2019. The lymphatic absorption pathway via chylomicrons bypasses the first-pass hepatic metabolism that historically made oral testosterone (methyltestosterone) unacceptably hepatotoxic. Twice-daily dosing required because of short oral PK. Food intake significantly affects absorption — Jatenzo must be taken with food. Carries a boxed warning for blood pressure elevation; ambulatory blood pressure monitoring is specifically called out in labeling.",
    halfLife: "Aveed/Nebido (IM): ~33 days; Jatenzo (oral): short oral PK requiring twice-daily dosing",
    reconstitution: { solvent: "Aveed/Nebido: pre-formulated castor oil injectable; Jatenzo: oral capsule (no reconstitution)", typicalVialMg: 750, typicalVolumeMl: 3 },
    dosingRange: { low: "Jatenzo 158mg BID oral (lower-dose oral); IM not typically titrated below 750mg loading", medium: "Aveed 750mg IM at week 0, week 4, then every 10 weeks; Nebido 1000mg IM at week 0, week 6, then every 10-14 weeks; Jatenzo 158-237mg BID oral with food", high: "Aveed/Nebido fixed-dose; Jatenzo titrated up to 396mg BID per labeling", frequency: "Aveed every 10 weeks IM (after loading); Nebido every 10-14 weeks IM (after loading); Jatenzo twice daily oral with food" },
    typicalDose: "Aveed 750mg IM at week 0, week 4, then every 10 weeks (US); Nebido 1000mg IM at week 0, week 6, then every 10-14 weeks (ex-US); Jatenzo 158-237mg BID oral with food (US)",
    startDose: "Aveed/Nebido: pharmaceutical loading protocol per label; Jatenzo: 237mg BID with food, titrate based on labs and clinical response",
    titrationNote: "Aveed/Nebido reach steady state after the loading phase (week 4-6 or later). Trough labs at end of dosing interval (week 10 for Aveed). Jatenzo reaches steady state within ~7 days of consistent BID dosing; lab timing more flexible due to relatively flat oral PK at steady state. The slow feedback loop on long-ester IM is the principal clinical tradeoff — adjusting dose has a 10-week feedback delay rather than the 1-2 week feedback delay of cypionate or enanthate.",
    cycle: "Continuous (TRT context); not cycled. Cycling-off considerations: long-ester IM has prolonged tapering due to ~33 day half-life; PCT planning must account for sustained serum levels well past last injection.",
    storage: "Aveed/Nebido: room temperature; protect from light; avoid freezing. Jatenzo: room temperature per oral capsule label; with-food dosing requirement is critical for absorption.",
    benefits: [
      "Aveed FDA-approved (US) for primary and secondary male hypogonadism",
      "Jatenzo FDA-approved (US, 2019) for primary and secondary male hypogonadism — oral route option",
      "Nebido approved in 35+ countries internationally for hypogonadism",
      "Aveed/Nebido: dramatic dosing-frequency advantage (every 10 weeks vs weekly cypionate/enanthate)",
      "Aveed/Nebido: extremely flat serum profile after loading phase — eliminates weekly peak-and-trough cycling that some patients find symptomatic on cyp/enan",
      "Jatenzo: oral route option for patients who decline injections",
      "Jatenzo: lymphatic absorption bypasses first-pass hepatic metabolism — dramatically improved hepatic safety profile vs older oral methyltestosterone",
      "Long-ester IM: reduced injection frequency improves compliance for some patients",
      "Cardiovascular safety from TRAVERSE 2023 applies at the molecule level",
      "Bone density support; mood and cognition support; libido restoration; lean mass support; metabolic improvements (testosterone-molecule-level benefits)",
    ],
    sideEffects: [
      "AE profile shares testosterone-molecule-level effects with cypionate/enanthate (erythrocytosis, E2 elevation, acne, hair loss acceleration, sleep apnea worsening, testicular atrophy, spermatogenesis suppression)",
      "**Aveed-specific: pulmonary oil microembolism (POME)** — boxed warning; requires 30-minute post-injection observation in healthcare setting; REMS program enrollment",
      "**Aveed-specific: anaphylaxis** — boxed warning; rare but serious",
      "**Jatenzo-specific: blood pressure elevation** — boxed warning; ambulatory BP monitoring specifically required in labeling",
      "Long-ester IM: reduced dose-titration agility (10-week feedback delay) — frustrating for users who run lab-driven titration cycles",
      "Jatenzo: GI side effects (nausea, GI discomfort) more common than injectable; with-food dosing critical for absorption and tolerance",
      "Long-ester IM: prolonged tapering on cessation due to ~33 day half-life",
      "Lipid changes — HDL reduction documented",
      "PSA elevation — monitor in men over 40",
    ],
    stacksWith: ["hcg", "kisspeptin", "anastrozole", "enclomiphene"],
    warnings: [
      "Prostate cancer (active or treated) — relative contraindication",
      "Severe untreated sleep apnea — treat OSA first",
      "Erythrocytosis history or current — relative contraindication",
      "Severe heart failure (uncompensated) — relative contraindication",
      "Active fertility intention — TRT suppresses spermatogenesis; concurrent hCG or enclomiphene required",
      "Pregnancy / women / pediatric — contraindicated except in specific specialist contexts",
      "**Aveed-specific: REMS program required** — only available through certified prescribers and healthcare facilities",
      "**Aveed-specific: 30-minute post-injection observation** required for POME and anaphylaxis monitoring",
      "**Jatenzo-specific: hypertension** — boxed warning; uncontrolled HTN is a relative contraindication; ambulatory BP monitoring required",
      "**Jatenzo-specific: must be taken with food** — absorption substantially affected by fasted dosing",
      "Concurrent anticoagulants — coordinate dosing",
      "Quality control — Aveed and Jatenzo are pharmaceutical with reliable potency; compounded oral undecanoate from research peptide and wellness clinic markets has variable formulation quality and absorption profiles",
      "Athletes subject to drug testing — universally banned",
      "Schedule III controlled substance in the US",
    ],
    sourcingNotes:
      "**Aveed** (Endo Pharmaceuticals) — US pharmaceutical IM; REMS program required; available only through certified prescribers and healthcare facilities; insurance coverage varies. **Nebido** (Bayer) — international pharmaceutical IM; not available in US. **Jatenzo** (Tolmar Pharmaceuticals, formerly Clarus Therapeutics) — US pharmaceutical oral; specialty pharmacy distribution; insurance coverage varies. Compounded oral testosterone undecanoate is also encountered in research peptide and wellness clinic markets, with variable formulation quality.",
    notes:
      "## Three Distinct Pharmaceutical Formulations\n\nUndecanoate is unique among testosterone esters in having three meaningfully distinct pharmaceutical products. The clinical decision is product-specific rather than generic-undecanoate-level:\n\n### Aveed (US, IM)\n- 750mg IM in castor oil\n- Loading: week 0, week 4 → maintenance every 10 weeks\n- Half-life ~33 days\n- **Boxed warnings: POME and anaphylaxis** — 30-minute post-injection observation required in healthcare setting\n- **REMS program** — certified prescribers and facilities only\n- The logistical requirement (mandatory in-clinic administration with observation) limits Aveed adoption in US TRT practice despite the dramatic dosing-frequency advantage over cypionate or enanthate\n- Best for: patients who value dosing convenience over titration flexibility and accept in-clinic administration\n\n### Nebido (ex-US, IM)\n- 1000mg IM in castor oil\n- Loading: week 0, week 6 → maintenance every 10-14 weeks\n- Same molecule as Aveed, slightly different vehicle and dose\n- Standard TRT in many European, Australian, and Asian markets\n- Lower documented POME rates than Aveed (slower injection technique and viscosity considerations)\n- Not available in US\n\n### Jatenzo (US, oral)\n- 158-237mg twice daily oral capsule\n- Approved 2019\n- **Lymphatic absorption pathway via chylomicrons** — bypasses first-pass hepatic metabolism that made older oral methyltestosterone unacceptably hepatotoxic\n- **Twice-daily dosing required** because of short oral PK\n- **Food intake significantly affects absorption** — Jatenzo must be taken with food\n- **Boxed warning for blood pressure elevation** — ambulatory BP monitoring specifically required\n- Best for: patients who decline injections and accept twice-daily oral dosing with food and BP monitoring\n\n## PK Clinical Considerations — The Long-Ester Tradeoff\n\nLong-ester IM produces an extremely flat serum profile after the loading phase, which is the primary clinical advantage of Aveed and Nebido. Eliminates the weekly peak-and-trough cycling that some patients find symptomatic on cypionate or enanthate.\n\n**The clinical tradeoff is reduced dose-titration agility** — adjusting dose has a 10-week feedback delay rather than the 1-2 week feedback delay of cypionate or enanthate. Patients who run lab-driven titration cycles often find this slower feedback loop frustrating. Long-ester IM is best for patients who reach a stable dose and want to forget about TRT logistics; it is poorly suited to patients who actively manage and adjust their protocol.\n\n## Routes — Aveed Logistics Reality\n\nAveed administration requires:\n1. REMS-certified prescriber\n2. REMS-certified healthcare facility\n3. In-clinic injection by trained personnel\n4. 30-minute post-injection observation for POME and anaphylaxis monitoring\n5. Documentation of observation period\n\nThis logistical reality means Aveed is rarely a self-administered TRT option in US practice. Patients who want Aveed accept the every-10-weeks clinic visit; patients who want self-administered convenience choose cypionate or enanthate.\n\n## Monitoring\n\n**Aveed/Nebido:** trough labs drawn immediately before the next IM injection (week 10 of the maintenance cycle). Standard TRT panel.\n\n**Jatenzo:** lab timing more flexible because of the relatively flat oral PK at steady state. Standard TRT panel plus ambulatory blood pressure monitoring per boxed warning.\n\n## E2 Management, Fertility, Evidence Base\n\nIdentical to other esters at the molecule level. Trial evidence specific to long-ester PK profiles has accumulated over 15+ years for Nebido and ~5 years for Aveed and Jatenzo. Cardiovascular safety evidence (TRAVERSE 2023) applies at the molecule level.\n\n## Synergies\n**hCG** for fertility preservation. **Enclomiphene** as monotherapy alternative. **Anastrozole / exemestane** for E2 management when clinically indicated. The flat PK of long-ester IM may reduce E2-management needs vs weekly long-ester products that produce supraphysiologic peaks.\n\n## Clinical Trial Citations Worth Knowing\nTRAVERSE (Lincoff 2023, NEJM) — applies to all testosterone esters at the molecule level. Aveed approval data (FDA 2014, Endo Pharmaceuticals). Jatenzo approval data (FDA 2019, Clarus Therapeutics/Tolmar). Multiple Nebido European trial data over 15+ years.\n\n## Evidence Quality\nLong-ester IM has decades of clinical use internationally (Nebido) and ~10 years US (Aveed). Jatenzo is the most modern testosterone formulation with the highest-quality recent FDA-approval trial data. All three formulations have reliable pharmaceutical-grade quality.\n\n## Research vs Anecdote\nResearch: long-ester IM evidence base substantial via European Nebido use and US Aveed trials; Jatenzo brings modern oral testosterone evidence with lymphatic absorption mechanism. Anecdote: long-ester IM patients value dosing convenience but report frustration with slow titration feedback; Jatenzo users report compliance benefits of oral route but BP monitoring requirement is the principal management consideration. Decision frame: long-ester IM (Aveed/Nebido) for patients who value dosing convenience over titration flexibility and accept in-clinic administration (Aveed) or have international access (Nebido); Jatenzo for patients who decline injections and accept twice-daily oral with food and BP monitoring; not first-line choices for users wanting active dose titration or flexible administration.",
    tags: ["testosterone-undecanoate", "Aveed", "Nebido", "Jatenzo", "TRT", "androgen replacement", "long ester", "33-day half-life", "oral testosterone", "REMS", "POME", "Schedule III"],
    tier: "entry",
  },

  {
    id: "testosterone-topical",
    name: "Testosterone Topical",
    aliases: ["AndroGel", "Testim", "Fortesta", "Vogelxo", "Axiron", "Testosterone Gel", "Testosterone Cream", "Topical Testosterone"],
    category: ["Anabolics / HRT", "Testosterone Support"],
    categories: ["Anabolics / HRT", "Testosterone Support"],
    route: ["topical"],
    mechanism:
      "Testosterone mechanism per testosterone-cypionate tile. Three-pathway action (AR, DHT, E2) and HPG suppression on exogenous administration are unchanged. The delivery route is what differs. **Mechanism — transdermal absorption pathway**: testosterone diffuses through the stratum corneum into the dermis, enters cutaneous capillaries, and reaches systemic circulation. The skin acts as a depot, providing sustained release over the 24-hour application interval. **Mechanism — pharmaceutical formulations**: major branded products include AndroGel (1%, 1.62%), Testim (1%), Fortesta (2%), Vogelxo (1%), Axiron (axillary solution, 2%). Compounded creams from compounding pharmacies are widely prescribed and offer customized concentrations. **Pharmacokinetics — relatively flat 24-hour serum profile**: once-daily application produces relatively flat serum levels compared to weekly IM injections. Steady state is reached at 2-3 weeks. Application sites vary by product: shoulders, upper arms, and abdomen for gels; axilla for Axiron; inner thigh or scrotum for some compounded creams. **Mechanism — scrotal application differential**: scrotal application produces dramatically higher absorption due to thinner stratum corneum and high regional blood flow, and is used clinically with explicit dosing adjustments to account for the absorption differential. **Mechanism — absorption variability (the principal clinical limitation)**: transdermal testosterone has limited and variable absorption. Approximately 10% of the applied dose reaches systemic circulation for most gel formulations. Patient factors affecting absorption include skin hydration, ambient temperature, individual stratum corneum properties, application site choice, hair density, and sweat. A meaningful minority of patients are non-responders despite proper application — failure to achieve eugonadal serum levels at maximum labeled dose occurs frequently enough that switching to injectable forms is a common clinical pathway after 2-3 months on topical therapy. **The dose-response relationship is less predictable than injectable forms, and many patients who achieve symptom resolution on injectables do not achieve the same response on topicals at any labeled dose.**",
    halfLife: "24-hour application interval; relatively flat serum profile at steady state; testosterone half-life in circulation ~10 minutes (very short — sustained effect comes from continuous absorption rather than depot effect)",
    reconstitution: { solvent: "Pre-formulated topical gel, cream, or solution; no reconstitution required", typicalVialMg: 50, typicalVolumeMl: 5 },
    dosingRange: { low: "AndroGel 1% 25mg/2.5g daily (entry; lower-dose); compounded creams from 25mg/0.5mL daily", medium: "AndroGel 1% 50mg/5g daily; AndroGel 1.62% 40.5mg/2.5g daily; Testim 1% 50mg/5g daily; Fortesta 2% 40mg/4 pumps daily; compounded 50-100mg/mL creams 1-2mL daily", high: "AndroGel 1.62% 81mg/5g daily; Fortesta 2% 70mg/7 pumps daily; compounded high-concentration creams up to 200mg/mL", frequency: "Once daily (most products); twice daily for some compounded protocols" },
    typicalDose: "AndroGel 1% 50mg daily; AndroGel 1.62% 40.5mg daily; compounded cream 50-100mg/mL at 1-2mL daily — titrate based on serum testosterone response and symptom resolution",
    startDose: "Pharmaceutical labeled starting dose × 2-3 weeks to steady state, then labs and titration",
    titrationNote: "Steady state reached at 2-3 weeks. Symptom resolution timeline 4-8 weeks for most patients. **Non-responder rate is substantial** — failure to achieve eugonadal serum levels at maximum labeled dose occurs frequently enough that switching to injectable forms is a common clinical pathway after 2-3 months. Lab timing more flexible than injectable forms — any time of day after steady state acceptable; many clinicians draw labs 4-6 hours post-application for representative serum value.",
    cycle: "Continuous (TRT context); not cycled. Daily application required for sustained levels — interruption produces rapid serum decline.",
    storage: "Room temperature; per pharmaceutical product label. Compounded creams per pharmacy beyond-use date.",
    benefits: [
      "AndroGel, Testim, Fortesta, Vogelxo, Axiron all FDA-approved for primary and secondary male hypogonadism",
      "Daily topical application avoids injections — first-line consideration for patients who decline injections",
      "Relatively flat 24-hour serum profile vs weekly IM peak-trough cycling",
      "Multiple pharmaceutical products with different vehicles, application sites, and absorption characteristics",
      "Compounded creams offer customized concentrations and application site flexibility",
      "Cardiovascular safety from TRAVERSE 2023 applies at the molecule level",
      "Bone density support; mood and cognition support; libido restoration; lean mass support; metabolic improvements (testosterone-molecule-level benefits)",
      "Useful in early TRT before commitment to injectable forms — allows trial of TRT with reversible delivery",
      "Useful where injection logistics are unworkable",
    ],
    sideEffects: [
      "AE profile shares testosterone-molecule-level effects with injectable forms (erythrocytosis, E2 elevation, acne, hair loss acceleration, sleep apnea worsening, testicular atrophy, spermatogenesis suppression)",
      "**Skin reactions at application site** — erythema, irritation, contact dermatitis; the principal product-specific AE",
      "**Variable absorption — non-responder rate substantial**; failure to achieve eugonadal levels at maximum labeled dose is the principal clinical limitation",
      "Lipid changes — HDL reduction documented",
      "PSA elevation — monitor in men over 40",
      "**Transfer to family members and pets — documented, real harm; FDA boxed warnings exist because of confirmed adverse events** (full coverage in notes section)",
      "Application site interactions — hair density, sweat, swimming, bathing all affect absorption",
      "Adherence dependence — daily application required; missed doses produce rapid serum decline vs injection sustained release",
    ],
    stacksWith: ["hcg", "kisspeptin", "anastrozole", "enclomiphene"],
    warnings: [
      "**TRANSFER RISK to family members and pets is real, documented, FDA-boxed-warning safety content — not theoretical** (full coverage in notes section)",
      "Prostate cancer (active or treated) — relative contraindication",
      "Severe untreated sleep apnea — treat OSA first",
      "Erythrocytosis history or current — relative contraindication",
      "Severe heart failure (uncompensated) — relative contraindication",
      "Active fertility intention — TRT suppresses spermatogenesis; concurrent hCG or enclomiphene required",
      "Pregnancy / women / pediatric — contraindicated except in specific specialist contexts",
      "**Children, women, and pets in household** — transfer risk is the principal safety consideration; rigorous transfer-prevention protocol required (notes section)",
      "Application site coverage and washing protocols — non-optional; per product labeling",
      "Skin conditions (eczema, psoriasis, dermatitis) at application site — affect absorption and may worsen with application",
      "Concurrent anticoagulants — coordinate dosing",
      "Quality control — pharmaceutical products provide reliable formulation; compounded creams quality varies by pharmacy; verify pharmacy 503A/503B status",
      "Athletes subject to drug testing — universally banned",
      "Schedule III controlled substance in the US",
    ],
    sourcingNotes:
      "**Pharmaceutical:** AndroGel (AbbVie, 1% and 1.62%), Testim (Endo, 1%), Fortesta (Endo, 2% metered pump), Vogelxo (Upsher-Smith, 1%), Axiron (Eli Lilly, 2% axillary solution); available with prescription via standard pharmacies. Insurance coverage varies. **Compounded:** 503A and 503B compounding pharmacies stock testosterone creams in customizable concentrations (typically 25-200mg/mL) with various vehicles (PLO base, anhydrous, lipoderm); often more cost-effective than branded pharmaceutical products and allow application site customization. TRT clinic networks frequently prescribe compounded topical formulations.",
    notes:
      "## Transfer Risk — Critical Safety Content\n\nTestosterone gels and creams transfer from the application site to anyone or anything that touches the skin during the hours after application. **This is documented, real-world harm, not a theoretical concern.** Boxed warnings on these products exist because of confirmed adverse events in family members of patients using topical testosterone.\n\n### Documented transfer harms\n\n**Transfer to women** can produce androgenization symptoms — acne, hirsutism (unwanted hair growth), voice deepening, menstrual disruption, libido changes. Pregnant women face additional risk to fetal development with testosterone exposure.\n\n**Transfer to children** has produced cases of premature puberty, accelerated bone age, behavioral changes, clitoromegaly in females, and growth-plate effects. Several serious adverse events drove the FDA boxed warnings on these products. Children are particularly vulnerable due to lower body weight (relative dose effects) and ongoing developmental processes that testosterone exposure can disrupt permanently.\n\n**Transfer to pets** is documented, with case reports of androgen-related illness in household dogs (particularly smaller breeds where the relative dose is higher), and similar concerns for cats. Pet exposure occurs through skin contact, shared bedding, licking application sites, and clothing contact.\n\n### Transfer risk management — these are not optional precautions\n\n- **Wash hands thoroughly with soap and water immediately after application**\n- **Allow application site to dry completely** before clothing contact\n- **Cover application site with clothing** for the labeled interval (typically 2-6 hours depending on product)\n- **Wash application site with soap and water before any anticipated close contact** (intimate contact, holding children, sleeping in shared bedding)\n- **Wash sheets, towels, and clothing that contact application sites** in a separate load or at a known interval after contact\n- **Do not apply to skin that will be in contact with others** — favor sites that will be reliably clothed and not directly contacted by family members\n- **Keep pets away from application sites** — particularly bedding and clothing that has contacted application sites\n\nThe boxed warnings on these products exist because of documented harm to family members. Transfer risk is a real and ongoing consideration that does not diminish with patient experience or careful technique. Patients with young children, pregnant or nursing women in household, or close-contact pets should weigh transfer risk seriously when choosing between topical and injectable testosterone — injectable forms eliminate transfer risk entirely.\n\n## Absorption Reality — The Principal Clinical Limitation\n\nTransdermal testosterone has limited and variable absorption. Approximately 10% of the applied dose reaches systemic circulation for most gel formulations. Patient factors affecting absorption include:\n\n- **Skin hydration** — dry skin reduces absorption; over-hydrated skin disrupts barrier function unpredictably\n- **Ambient temperature** — higher temperatures increase absorption (heat exposure, hot showers, exercise)\n- **Individual stratum corneum properties** — genetic and dermatologic variation\n- **Application site choice** — scrotal substantially higher than other sites; abdomen lower than shoulders\n- **Hair density** — affects gel distribution and skin contact\n- **Sweat** — both reduces gel adherence and accelerates absorption\n- **Skin conditions** — eczema, psoriasis, dermatitis disrupt barrier function\n\n**A meaningful minority of patients are non-responders** despite proper application. Failure to achieve eugonadal serum levels at maximum labeled dose occurs frequently enough that switching to injectable forms is a common clinical pathway after 2-3 months on topical therapy.\n\nThis is the principal clinical limitation of topical testosterone: **the dose-response relationship is less predictable than injectable forms**, and many patients who achieve symptom resolution on injectables do not achieve the same response on topicals at any labeled dose.\n\n## Application Site Specifics\n\n### Shoulders, upper arms, abdomen (most gels)\n- Standard application sites for AndroGel, Testim, Vogelxo\n- Reasonable absorption with manageable transfer risk if clothing covers sites\n\n### Axilla (Axiron)\n- Specific to Axiron formulation (2% axillary solution)\n- Antiperspirant-like application\n- Specific clothing and contact precautions\n\n### Inner thigh (Fortesta, some compounded creams)\n- Lower transfer risk to upper-body contact (children carried, partner contact)\n- Compounded creams often applied here for transfer-risk-conscious patients\n\n### Scrotum (specialized compounded protocols)\n- **Substantially higher absorption** due to thinner stratum corneum and high regional blood flow\n- Used clinically with explicit dosing adjustments\n- Lower applied dose for equivalent serum response\n- Application-site-specific transfer risk considerations\n\n## Monitoring\n\nSame TRT lab panel as injectable forms. Lab timing is more flexible — any time of day after steady state is reached is acceptable, given the relatively flat 24-hour PK profile. Many clinicians draw labs 4-6 hours post-application for a representative serum value.\n\n## Clinical Role\n\nFirst-line for patients who decline injections, in early TRT before commitment to injectable forms, or where injection logistics are unworkable. **Substantial non-responder rate** means many patients ultimately transition to injectable forms after 2-3 months of inadequate response on topical therapy.\n\nNot appropriate for households with young children, pregnant or nursing women, or close-contact pets where rigorous transfer prevention is impractical — injectable forms are the appropriate choice in those contexts.\n\n## E2 Management, Fertility, Evidence Base\n\nIdentical to other delivery routes at the molecule level. Trial evidence specific to topical formulations is substantial (15+ years of AndroGel data, 10+ years for newer products). Cardiovascular safety evidence (TRAVERSE 2023) applies at the molecule level.\n\n## Synergies\n**hCG** for fertility preservation. **Enclomiphene** as monotherapy alternative. **Anastrozole / exemestane** for E2 management when clinically indicated. The relatively flat PK of topical may reduce E2-management needs vs weekly long-ester injectable products with supraphysiologic peaks.\n\n## Clinical Trial Citations Worth Knowing\nTRAVERSE (Lincoff 2023, NEJM) — applies to all testosterone formulations at the molecule level. AndroGel approval data (FDA 2000). Multiple comparative trials of topical vs injectable bioavailability. Transfer-risk case reports drove FDA boxed warning labeling.\n\n## Evidence Quality\nDecades of FDA-approved use; extensive RCT evidence; well-characterized PK and AE profile. Transfer risk evidence is robust and clinically actionable. Non-responder rate is well-documented in clinical literature.\n\n## Research vs Anecdote\nResearch: substantial RCT evidence base for topical TRT efficacy and safety; transfer risk evidence robust; non-responder rate documented. Anecdote: substantial clinical experience with transition from topical to injectable in non-responders; substantial patient preference for topical among injection-averse patients; transfer risk management is well-known but compliance varies. Decision frame: appropriate first-line for injection-averse patients without young children, pregnant women, or close-contact pets in household; substantial non-responder rate means topical is often a transition phase rather than long-term solution; transfer risk is the principal household-safety consideration that drives appropriate-patient selection; injectable forms eliminate transfer risk entirely and are the appropriate choice when household transfer prevention is impractical.",
    tags: ["testosterone-topical", "AndroGel", "Testim", "Fortesta", "Vogelxo", "Axiron", "TRT", "androgen replacement", "transdermal", "topical gel", "transfer risk", "FDA boxed warning", "non-responder", "Schedule III"],
    tier: "entry",
  },
];
