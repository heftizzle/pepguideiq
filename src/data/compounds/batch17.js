/** Batch 17 — Berberine + Urolithin A + Ephedrine.
 *
 *  Three entries previously scoped into BATCH16 but moved here for shipping
 *  manageability after BATCH16 was enriched to 12 deep adaptogen entries.
 *
 *  Berberine: single tile with four forms covered (HCl / DHB / phytosome /
 *  liposomal). Founder direction: bloat on the tile is fine — this is one
 *  compound with form variants users have to choose between. Distinct from
 *  the B12-vs-B-complex case (those are pharmacologically different products).
 *
 *  Urolithin A: postbiotic mitophagy enhancer, mainstream longevity supplement
 *  (Mitopure / Amazentis FDA GRAS-cleared 2018).
 *
 *  Ephedrine / Bronkaid Max: OTC bronchodilator with real performance-community
 *  use (ECA stack). Same harm-reduction framing pattern as phentermine —
 *  medical use primary, performance use acknowledged factually with safety
 *  framework, no abuse-protocol dosing.
 *
 *  Schema matches BATCH7-16.
 */
export const BATCH17 = [
  {
    id: "berberine",
    name: "Berberine",
    aliases: ["Berberine HCl", "Dihydroberberine", "DHB", "Berbevis", "Berberine phytosome", "Liposomal berberine", "GlucoVantage", "Berberis aristata extract"],
    category: ["Metabolic", "Longevity", "AMPK Activator"],
    categories: ["Metabolic", "Longevity", "AMPK Activator"],
    route: ["oral"],
    mechanism:
      "Isoquinoline alkaloid found in multiple Berberis genus plants (barberry, Oregon grape, goldenseal, Chinese goldthread / Coptis chinensis). Used in Chinese and Ayurvedic medicine for centuries before modern pharmacological characterization. Mechanism (multi-pathway): (1) AMPK activation — the central mechanism, overlapping with metformin's primary mechanism. AMPK activation drives metabolic 'energy stress' signaling: enhanced fatty acid oxidation, improved insulin sensitivity, suppression of hepatic gluconeogenesis, mTOR pathway modulation. (2) Gut microbiome modulation — berberine has direct antimicrobial activity in the gut, shifting microbiome composition with downstream metabolic effects. The microbiome modulation may be a substantial fraction of berberine's metabolic benefit. (3) Lipid handling improvements — meaningful LDL cholesterol reductions in clinical trials (~20–25% in some studies), HDL elevation, triglyceride reductions. (4) Mild antimicrobial activity beyond gut. (5) Possible direct cardiovascular protective effects beyond lipid and glucose mechanisms. **Bioavailability is the dominant practical issue:** standard berberine HCl has only ~5% oral bioavailability due to extensive intestinal P-glycoprotein efflux and rapid hepatic metabolism. This pharmacological limitation has driven development of multiple alternative forms covered below. Effect sizes for standard berberine HCl in RCTs: HbA1c reduction ~0.5–0.9% (comparable to weaker oral diabetic medications), LDL reduction 20–25%, triglyceride reduction 15–25%, modest weight reduction, improved fasting glucose. Often called 'nature's metformin' though this oversimplifies — mechanism overlap is real (AMPK) but mechanism distinct (microbiome) and effect magnitude is generally smaller than metformin.",
    halfLife: "Berberine HCl plasma half-life ~hours, but tissue distribution and gut effects extend longer; alternative forms have improved PK profiles",
    reconstitution: { solvent: "N/A — oral capsule, tablet, or powder", typicalVialMg: 500, typicalVolumeMl: null },
    dosingRange: { low: "500mg twice daily (HCl)", medium: "500mg three times daily (HCl, classic protocol) OR 100mg DHB twice daily OR 550mg phytosome daily", high: "2000mg/day (HCl, upper end)", frequency: "Variable by form — see notes" },
    typicalDose: "Form-dependent. Berberine HCl 500mg three times daily (with meals) is the classic protocol. DHB 100–150mg twice daily for users wanting better bioavailability. Berberine phytosome 550mg once or twice daily.",
    startDose: "500mg HCl once daily × 1 week to assess GI tolerance, then escalate to standard dosing",
    titrationNote: "GI tolerance is the primary barrier with HCl form. Slow titration (start once daily, titrate to BID then TID over 2–3 weeks) substantially improves tolerance. Alternative forms (DHB, phytosome) generally have better GI profile.",
    cycle: "Continuous use common. Some users cycle 8 weeks on / 2 weeks off out of caution. No clear cycling requirement.",
    storage: "Room temperature, dry, away from light",
    benefits: [
      "Glucose handling improvement — HbA1c reduction comparable to weaker oral diabetic medications",
      "Lipid panel improvement — meaningful LDL reductions, HDL elevation, triglyceride reduction",
      "Insulin sensitization via AMPK activation",
      "Mild weight loss in metabolic syndrome contexts",
      "Gut microbiome modulation",
      "Often used as alternative or complement to metformin",
      "Useful adjunct in PCOS, NAFLD, prediabetes, metabolic syndrome",
      "Cardioprotective effects beyond lipid/glucose mechanisms",
      "Inexpensive (HCl form)",
    ],
    sideEffects: [
      "GI upset — primary side effect, particularly with HCl form. Diarrhea, abdominal cramping, gas. Frequently dose-limiting at full TID dosing.",
      "Constipation in some users (paradoxical to the diarrhea group)",
      "Mild hypoglycemia possible, particularly when stacked with metformin or insulin",
      "Bitter taste (powder / tincture)",
      "Mild blood-thinning effect",
      "Theoretical concern: long-term chronic use may modulate gut microbiome in ways with unclear long-term effects",
    ],
    stacksWith: ["metformin", "rapamycin", "trigonelline", "alpha-lipoic-acid"],
    warnings: [
      "Pregnancy — CONTRAINDICATED. Berberine has been associated with kernicterus risk in newborns (displaces bilirubin from albumin) and is traditionally contraindicated in pregnancy. Avoid.",
      "Lactation — avoid",
      "Severe hepatic impairment — caution",
      "Concurrent insulin or oral diabetic medications — additive glucose-lowering effects; monitor closely",
      "Concurrent metformin — combination is common but additive effects on glucose handling; monitor",
      "Concurrent CYP3A4 substrates — berberine inhibits CYP3A4 and P-glycoprotein; potential drug interactions (cyclosporine, statins, calcium channel blockers, others)",
      "Surgery — discontinue 1–2 weeks before due to mild antiplatelet effects",
      "Pediatric — caution; bilirubin-displacement concern is most acute in newborns",
      "G6PD deficiency — theoretical concern; coordinate with prescriber",
    ],
    sourcingNotes:
      "OTC supplement. Form selection matters substantially — see notes. Standard HCl widely available, very inexpensive (~$15–25/month at 1500mg/day). DHB / GlucoVantage more expensive but better bioavailability (~$30–60/month). Berberine phytosome / Berbevis branded products mid-range. Liposomal berberine premium-priced. Reputable brands: Thorne Berberine-500 (HCl), NOW Foods Berberine, GlucoVantage (DHB), Designs for Health Berberine Synergy (phytosome).",
    notes:
      "## Form Selection — The Practical Decision\nBerberine's poor oral bioavailability (~5% for HCl) drives the existence of multiple alternative forms. Each has different pharmacokinetic and cost profiles:\n\n**Berberine HCl (standard form):**\n- Most studied — virtually all RCT evidence is on this form\n- Cheapest (~$15–25/month at typical dosing)\n- ~5% oral bioavailability — requires high doses (1500mg/day split into 3 doses with meals)\n- Worst GI tolerance — TID dosing burden + GI side effects are common\n- The classic protocol: 500mg with breakfast, lunch, dinner\n\n**Dihydroberberine (DHB) — GlucoVantage and generic forms:**\n- Reduced metabolite of berberine; the body normally converts berberine → DHB in the gut via bacterial reductase, then DHB re-oxidizes to berberine in tissues. Direct DHB supplementation bypasses the microbiome-dependent conversion step (which fails in some users).\n- ~5× better bioavailability than HCl per published PK data\n- Twice-daily dosing typically sufficient (100–150mg BID)\n- Better GI tolerance than HCl\n- More expensive (~$30–60/month)\n- ~100mg DHB ≈ 500mg berberine HCl in clinical effect\n\n**Berberine phytosome (Berbevis):**\n- Phospholipid complex for improved absorption\n- ~10× improvement over HCl in some PK studies\n- Once-daily dosing typically sufficient (550–1100mg)\n- Good GI tolerance\n- Mid-range pricing\n\n**Liposomal berberine:**\n- Liposomal delivery system for improved bioavailability\n- Premium-priced; cost-benefit varies\n- Less clinical data than HCl, DHB, or phytosome forms\n\n**Decision frame:**\n- **Cost-conscious users:** HCl 500mg TID (cheapest, most studied, but PK-limited and GI-challenging)\n- **Better bioavailability priority:** DHB 100–150mg BID (best evidence-to-cost ratio for alternative forms) or phytosome 550mg daily\n- **GI sensitivity:** DHB or phytosome over HCl\n- **Users on metformin already:** combination is common; HCl form is fine; the additive AMPK activation can produce greater glucose effects than either alone\n\n## Beginner Protocol\nIf using HCl: 500mg with dinner × 1 week, then 500mg with breakfast + dinner × 1 week, then 500mg TID with meals × 8 weeks. Bracket with: comprehensive metabolic panel, lipid panel, HbA1c, fasting insulin at baseline and 12 weeks. If GI side effects are problematic, switch to DHB 100mg BID.\n\nIf using DHB from start: 100mg BID with meals × 8 weeks; same lab bracketing.\n\n## Advanced Protocol\nFor users running comprehensive longevity / metabolic stack: Berberine (any form) + Metformin (500mg BID) + Rapamycin (5–10mg weekly pulse) + lifestyle interventions (resistance + aerobic training, dietary protein optimization, sleep). The Berberine + Metformin combination is common — overlapping AMPK mechanism produces additive metabolic benefit; the microbiome and CYP3A4 modulation effects of berberine are non-redundant with metformin's mechanism. Bracket with B12 monitoring (metformin causes B12 depletion, which berberine doesn't reverse).\n\n## Reconstitution + Administration\nN/A — oral capsule, tablet, or powder. With meals to reduce GI side effects.\n\n## Synergies\n**Metformin:** AMPK activation overlap; combinations common in metabolic protocols. **Rapamycin:** mTOR pathway complement; comprehensive longevity stack. **Trigonelline:** NAD precursor synergy. **Alpha-lipoic acid:** complementary insulin sensitization mechanism.\n\n## Evidence Quality\nSubstantial RCT evidence base for HCl form across glucose, lipid, weight, and metabolic syndrome outcomes. DHB has growing PK evidence; phytosome and liposomal forms have less clinical data than HCl.\n\n## Research vs Anecdote\nResearch: solid evidence for metabolic and lipid effects; effect sizes meaningful. Anecdote: positive for users with metabolic syndrome / prediabetes / mild T2D contexts; GI tolerance is the practical barrier with HCl form. Decision frame: foundational metabolic supplement; form selection is the practical decision; pairs naturally with metformin in comprehensive metabolic protocols.",
    tags: ["berberine", "berberine HCl", "dihydroberberine", "DHB", "berberine phytosome", "AMPK", "metabolic", "diabetes", "longevity", "metformin alternative"],
    tier: "entry",
  },

  {
    id: "urolithin-a",
    name: "Urolithin A",
    aliases: ["UA", "Mitopure", "Urolithin A postbiotic"],
    category: ["Longevity", "Mitochondrial Support"],
    categories: ["Longevity", "Mitochondrial Support"],
    route: ["oral"],
    mechanism:
      "Postbiotic metabolite — meaning a compound produced by gut bacteria from dietary precursors rather than directly consumed. Specifically, urolithin A is produced in the colon via bacterial conversion of ellagitannins and ellagic acid (found in pomegranate, walnuts, raspberries, strawberries, oak-aged wines and spirits). Mechanism: induces mitophagy — the cellular process of clearing damaged mitochondria — via PINK1/Parkin pathway activation. Mitophagy is essential for mitochondrial quality control; impaired mitophagy is implicated in aging, neurodegenerative disease, sarcopenia, and metabolic dysfunction. Urolithin A is the most-studied direct mitophagy enhancer in supplement form. Effects: improved mitochondrial function, increased muscle endurance, improved cellular ATP production, reduced inflammation in aging contexts, possible cognitive benefits. **Critical individual variation: only ~30–40% of the population produces urolithin A endogenously from precursors.** The conversion depends on specific gut bacteria (Gordonibacter, others); users without these bacteria gain little urolithin A from dietary pomegranate or walnut consumption regardless of intake. Direct urolithin A supplementation bypasses this microbiome-dependent conversion entirely — relevant for the majority of users who don't produce it natively. This is an unusual feature in the supplement landscape — most compounds work the same regardless of microbiome status; urolithin A's relevance is concentrated in users who can't produce it endogenously. Mitopure (Amazentis brand, FDA GRAS-cleared 2018) is the primary commercial product; multiple generic versions have entered the market.",
    halfLife: "Plasma half-life ~17 hours; tissue effects on mitophagy markers extend longer (days)",
    reconstitution: { solvent: "N/A — oral capsule or powder", typicalVialMg: 500, typicalVolumeMl: null },
    dosingRange: { low: "250mg/day", medium: "500mg/day (clinical trial dose)", high: "1000mg/day (high-end use)", frequency: "Once daily" },
    typicalDose: "500mg/day (Mitopure or generic urolithin A) — the dose used in published clinical trials",
    startDose: "250mg/day × 1 week, then 500mg/day",
    titrationNote: "Modest titration. Effects on mitochondrial markers and muscle endurance build over 4 months in clinical trials.",
    cycle: "Continuous use — clinical trial protocols are 4-month continuous courses. No formal cycling requirement.",
    storage: "Room temperature, dry, away from light",
    benefits: [
      "Mitophagy enhancement — most direct mechanism of action in mitochondrial-quality-control supplement category",
      "Improved muscle endurance — clinical trial evidence (Mitopure pivotal trial, 2022)",
      "Enhanced cellular ATP production",
      "Reduced inflammatory biomarkers in aging cohorts",
      "Bypasses microbiome-dependent conversion that limits dietary urolithin A in 60–70% of users",
      "FDA GRAS-cleared (Mitopure)",
      "Strong evidence base relative to most longevity supplements",
      "Postbiotic mechanism is novel and mechanistically interesting",
    ],
    sideEffects: [
      "Generally very well tolerated",
      "Mild GI upset uncommon",
      "Long-term safety data accumulating but limited beyond 4-month trial durations",
    ],
    stacksWith: ["nmn", "nicotinamide-riboside", "spermidine", "rapamycin"],
    warnings: [
      "Pregnancy — limited safety data; avoid",
      "Lactation — limited safety data",
      "Pediatric — no use case established",
      "Active malignancy — coordinate with oncologist; mitochondrial-quality-control compounds have complex tumor-effect profiles",
      "Limited long-term human safety data beyond 4-month trial durations",
    ],
    sourcingNotes:
      "OTC supplement. Mitopure (Amazentis brand) is the original FDA GRAS-cleared product — most expensive ($60–90/month) but most-studied. Generic urolithin A from Timeline Nutrition, Pure Encapsulations, several others ($30–50/month). Quality verification: third-party testing matters given the relatively new commercial supply chain.",
    notes:
      "## Beginner Protocol\n500mg/day × 4 months (the clinical trial protocol duration). Track: muscle endurance (training capacity, recovery), subjective energy. Effects accumulate slowly over months — this is not an acute-response compound. Bracket with comprehensive longevity panel (lipids, glucose, hsCRP, kidney function) at baseline and 4 months.\n\n## Advanced Protocol\nLayer with NAD precursors (NMN 250–500mg/day or NR 300mg/day) — complementary mitochondrial mechanisms (urolithin A clears damaged mitochondria, NAD precursors support mitochondrial energy production). Add spermidine 1mg/day for autophagy upregulation via complementary mechanism, rapamycin pulse-dosing (5–10mg weekly) for mTOR-pathway longevity activation. The urolithin A + NAD + spermidine + rapamycin combination is the comprehensive mitochondrial-longevity stack.\n\n## Microbiome Status — Practical Note\nIf you've done microbiome testing (Viome, others), check whether you produce urolithin A endogenously. ~30–40% of people do — for these users, dietary pomegranate, walnuts, and berries can provide some urolithin A, and supplementation may be redundant. ~60–70% of people don't produce it — for these users, dietary intake of precursors provides minimal urolithin A regardless of consumption, and direct supplementation is the only effective pathway. Microbiome testing isn't necessary; empirical trial of supplementation is reasonable.\n\n## Reconstitution + Administration\nN/A — oral capsule. Once daily; consistent timing helpful but not critical given the long half-life and cumulative effect pattern.\n\n## Synergies\n**NAD precursors (NMN, NR):** complementary mitochondrial mechanisms. **Spermidine:** autophagy upregulation. **Rapamycin:** mTOR pathway longevity activation. **Exercise:** the most evidence-supported mitochondrial-quality-control intervention.\n\n## Evidence Quality\nStrong relative to most longevity supplements. Mitopure pivotal RCT (2022, ~90 older adults, 4 months) showed improved muscle endurance and mitochondrial gene expression markers. Multiple animal studies on mitophagy mechanism. Postbiotic mechanism is novel and well-characterized.\n\n## Research vs Anecdote\nResearch: solid mechanistic evidence for mitophagy enhancement; clinical trial evidence for muscle endurance and mitochondrial function in older adults. Anecdote: emerging in longevity-stack space; subjective effects are typical of mitochondrial-support compounds (modest, cumulative). Decision frame: foundational mitochondrial-support compound for longevity stacks; particularly relevant for users who don't endogenously produce urolithin A from dietary precursors (the majority of population).",
    tags: ["urolithin A", "mitopure", "mitophagy", "postbiotic", "longevity", "mitochondrial support", "muscle endurance", "FDA GRAS"],
    tier: "entry",
  },

  {
    id: "ephedrine",
    name: "Ephedrine",
    aliases: ["Bronkaid Max", "Bronkaid", "Ephedrine sulfate", "Ephedrine HCl", "Primatene"],
    category: ["Bronchodilator", "Stimulant", "Performance"],
    categories: ["Bronchodilator", "Stimulant", "Performance"],
    route: ["oral"],
    mechanism:
      "Sympathomimetic alkaloid originally isolated from Ephedra plants (ma huang in Chinese medicine). Indirect-acting plus direct-acting at adrenergic receptors: indirectly releases norepinephrine from sympathetic nerve terminals, plus directly agonizes α1, α2, β1, β2, and β3 adrenergic receptors. The β2 agonism produces bronchodilation (the FDA-approved indication for Bronkaid). The β1 agonism produces cardiovascular stimulation (BP elevation, HR elevation, increased cardiac contractility). The α1 agonism produces vasoconstriction. The β3 agonism produces thermogenesis and lipolysis (the basis for performance / fat-loss community use). Mechanistically distinct from caffeine (adenosine receptor antagonist) and from phentermine (sympathomimetic but predominantly CNS-acting amphetamine derivative) — ephedrine has more peripheral cardiovascular effects than either. **Regulatory and access reality:** the FDA banned ephedra-containing dietary supplements in 2004 following deaths attributed to ephedra. Pharmaceutical ephedrine was NOT banned — it remained available as an OTC bronchodilator (Bronkaid). Bronkaid Max (ephedrine sulfate 25mg + guaifenesin 200mg) is sold behind-the-counter in US pharmacies under PSE precursor monitoring laws (same restrictions as pseudoephedrine — ID required, quantity limits). The behind-the-counter access enables both medical use (asthma rescue) and the documented performance-community use (ECA stack — ephedrine + caffeine + aspirin — for fat-loss/thermogenesis). WADA banned in competition.",
    halfLife: "Plasma half-life ~3–6 hours; CV and thermogenic effects similar duration",
    reconstitution: { solvent: "N/A — oral tablet (Bronkaid Max contains 25mg ephedrine sulfate + 200mg guaifenesin per tablet)", typicalVialMg: 25, typicalVolumeMl: null },
    dosingRange: { low: "12.5mg per dose (half tablet) — sensitive users, mild bronchodilation", medium: "25mg per dose (one Bronkaid Max tablet)", high: "Catalog does not provide performance-use dosing protocols; medical bronchodilation cap is 150mg/24 hours per Bronkaid Max label", frequency: "Up to 6 tablets/24 hours per medical label; ECA stack patterns vary" },
    typicalDose: "Medical (asthma): 1 tablet (25mg ephedrine + 200mg guaifenesin) every 4 hours as needed, max 6 tablets/24 hours. Performance use: catalog does not provide protocols.",
    startDose: "Medical: 0.5–1 tablet to assess CV response. Performance use: not endorsed.",
    titrationNote: "Cardiovascular response (HR, BP) is the dose-limiting factor. Sensitive users should start with half-tablet (12.5mg) and assess.",
    cycle: "Medical use: PRN (as needed) for bronchospasm. Catalog does not provide performance-use cycling protocols.",
    storage: "Room temperature, dry. Behind-the-counter — secured storage / ID-tracked purchase per PSE precursor laws.",
    benefits: [
      "Effective bronchodilator for asthma and bronchospasm — the FDA-approved indication",
      "OTC behind-the-counter access (no prescription required despite restrictions on purchase quantity / ID)",
      "Inexpensive (~$15–25 per box of 60 tablets at most US pharmacies)",
      "Established safety profile when used as labeled for medical bronchodilation",
      "Useful rescue medication for users with intermittent asthma who lack inhaler access",
    ],
    sideEffects: [
      "**Cardiovascular: HR elevation, BP elevation, palpitations** — the dose-limiting concerns",
      "Anxiety, jitteriness, restlessness",
      "Insomnia (long half-life makes evening dosing problematic)",
      "Tremor",
      "Headache",
      "Nausea",
      "Dry mouth",
      "Urinary retention (anticholinergic-like effects)",
      "Tolerance to thermogenic / appetite-suppressant effects develops within 4–6 weeks of regular use",
      "Tolerance to bronchodilator effect develops more slowly",
      "Rebound bronchospasm possible with overuse",
    ],
    stacksWith: ["caffeine"],
    warnings: [
      "**Cardiovascular disease (CAD, recent MI, unstable angina, severe heart failure) — CONTRAINDICATED**",
      "**Uncontrolled hypertension — contraindicated**; controlled HTN warrants caution and monitoring",
      "**Hyperthyroidism — contraindicated**",
      "**Severe arrhythmia history — contraindicated**",
      "Pheochromocytoma — contraindicated",
      "Glaucoma (narrow-angle) — contraindicated",
      "Diabetes — modest glucose elevation; monitor",
      "Concurrent MAOI within 14 days — contraindicated (hypertensive crisis risk)",
      "Concurrent stimulant medications (ADHD treatments, phentermine, MDMA, other sympathomimetics) — additive cardiovascular effects, severe risk",
      "Concurrent caffeine — additive CV effects (the ECA stack rationale; also the ECA stack risk amplifier)",
      "Pregnancy — Category C; avoid except for severe asthma management coordinated with OB",
      "Lactation — present in breast milk; not recommended",
      "BPH — urinary retention worsening",
      "WADA banned in competition",
      "**PERFORMANCE USE: catalog does not provide ECA stack dosing protocols. Documented deaths from ephedrine/ephedra use (the basis for the 2004 FDA ban on supplement ephedra) primarily involved high-dose, chronic, or stacked use in users with undiagnosed cardiovascular disease. The harm-reduction framework: BP / HR monitoring, ECG before initiating, conservative dosing, no chronic use, no use during dehydration / heat stress / extreme exertion, no stacking with other stimulants beyond moderate caffeine.**",
    ],
    sourcingNotes:
      "Behind-the-counter at US pharmacies (Bronkaid Max, Bronkaid). Federal PSE precursor laws apply: photo ID required at purchase, quantity limits, purchase logged in tracking database. No prescription required. Walmart, CVS, Walgreens, most independent pharmacies stock it. Primatene Mist (epinephrine inhaler) is a related but pharmacologically different OTC asthma rescue product. International availability varies — pharmaceutical ephedrine is more freely available in some countries, more restricted in others.",
    notes:
      "## Medical Use Protocol\nFor mild-moderate asthma rescue or bronchospasm: 1 Bronkaid Max tablet (25mg ephedrine + 200mg guaifenesin) every 4 hours as needed, max 6 tablets/24 hours. The FDA-approved use case. Inhaled albuterol is the modern first-line rescue medication for most users with diagnosed asthma — Bronkaid is an alternative for users without inhaler access, those with prescription gaps, or those for whom inhaled β2-agonists are insufficient. Coordinate ongoing asthma management with prescriber; chronic Bronkaid use without proper asthma workup is not appropriate medical care.\n\n## Lab / CV Monitoring Framework (For Any Regular User)\nBaseline: BP (multiple measurements averaged), HR (resting), ECG if any cardiovascular concern, fasting glucose. Periodic: BP / HR daily during active use periods. Discontinue if resting HR consistently >100 bpm or systolic BP up >15 mmHg from baseline.\n\n## Performance Use Discussion (Harm-Reduction Frame, Not Endorsement)\nEphedrine has well-documented use in fat-loss/thermogenesis contexts — specifically the ECA stack (ephedrine + caffeine + aspirin) popularized in 1990s–2000s bodybuilding and physique communities. The FDA's 2004 ephedra ban followed deaths attributed to ephedra-containing dietary supplements; the deaths typically involved high-dose, chronic, or stacked use in users with undiagnosed cardiovascular disease, often combined with extreme exertion or dehydration. The catalog does NOT provide ECA stack dosing protocols. For users engaging in non-medical use against medical advice: (1) cardiovascular workup before initiating (ECG, BP/HR baseline, lipid panel, family history of CV disease) is non-negotiable; (2) conservative dosing relative to community-reported protocols; (3) no chronic use — tolerance develops within 4–6 weeks and the CV harm accumulates faster than the benefit; (4) no use during dehydration, heat stress, or extreme exertion (the documented death cases overwhelmingly involved this combination); (5) no stacking with stimulants beyond moderate caffeine — additive sympathomimetic effects are dangerous; (6) discontinue at first sign of CV symptoms (chest pain, palpitations, severe BP elevation). Evidence-based alternatives for fat-loss include GLP-1 agonists (semaglutide, tirzepatide, retatrutide), phentermine (with appropriate CV screening), structured caloric deficit, resistance training, sleep optimization. None reproduce ephedrine's specific β3-adrenergic thermogenesis but all are substantially safer.\n\n## Reconstitution + Administration\nN/A — oral tablet. With food to reduce GI side effects.\n\n## Synergies\n**Caffeine:** the well-known ECA stack pairing — additive thermogenic and stimulant effects; also additive CV effects warranting caution. **Aspirin:** historically third component of ECA stack (proposed prostaglandin-mediated effect on adipose); aspirin's antiplatelet effect adds bleeding risk for limited additional benefit; not endorsed.\n\n## Evidence Quality\nFDA-approved as bronchodilator with substantial evidence base. ECA stack performance evidence: substantial real-world use; some clinical trials showing short-term fat loss; the long-term safety signal that drove the 2004 ban is real.\n\n## Research vs Anecdote\nResearch: solid bronchodilator evidence; modest fat-loss evidence in short-term trials; substantial mortality and morbidity signal in chronic / high-dose / inappropriate-use contexts that drove the supplement ban. Anecdote: ECA stack has decades of performance-community use; the deaths and adverse events that drove the supplement ban are the safety signal worth respecting. Decision frame: appropriate for medical bronchodilator use as labeled; performance use carries real cardiovascular risk that the harm-reduction framework can mitigate but not eliminate; evidence-based alternatives (GLP-1s, phentermine with screening) are substantially safer for fat-loss outcomes.",
    tags: ["ephedrine", "Bronkaid Max", "Bronkaid", "bronchodilator", "sympathomimetic", "ECA stack", "fat loss", "OTC behind-the-counter", "WADA banned", "asthma"],
    tier: "entry",
  },
];