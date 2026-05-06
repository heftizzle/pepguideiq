/** Batch 14 — AAS medical-context + Longevity/metabolic + Clinic injectables.
 *
 *  AAS (3): Oxandrolone (Anavar), Oxymetholone (Anadrol), Stanozolol (Winstrol).
 *  Locked policy: these are included because they have current legitimate
 *  medical contexts (HIV wasting, severe burns, Turner syndrome, anemia of
 *  chronic disease, hereditary angioedema). Tren / EQ / Masteron / Primo /
 *  Dbol — no current medical indication, deliberately excluded from catalog.
 *
 *  Framing for AAS entries (mirrors insulin pattern from BATCH12):
 *    - Medical indication leads
 *    - Mechanism + pharmacology covered fully
 *    - Performance use acknowledged factually, NO dosing recipes provided
 *    - Lab-monitoring framework included (lipid, liver, CBC, BP, HPG axis,
 *      estradiol) — genuine medical safety info that applies regardless of
 *      indication
 *    - Honest framing: this catalog does not endorse non-medical AAS use,
 *      but acknowledges users will encounter these compounds and provides
 *      harm-reduction information
 *
 *  Longevity / metabolic (2): Rapamycin (Sirolimus), Metformin.
 *  Clinic injectables (2): MIC (standalone, distinct from Lipo-C),
 *    B12 (standalone — cyanocobalamin, methylcobalamin, hydroxocobalamin).
 *
 *  Schema matches BATCH7-13. Average ≥800w/entry; AAS entries longer
 *  due to safety content density.
 */
export const BATCH14 = [
  // ============================================================================
  // SECTION 1 — AAS Medical Context (3)
  // ============================================================================

  {
    id: "oxandrolone",
    name: "Oxandrolone",
    aliases: ["Anavar", "Var", "Oxandrin", "Oxandrolone (Anavar)"],
    category: ["Anabolics / HRT"],
    categories: ["Anabolics / HRT"],
    route: ["oral"],
    mechanism:
      "Synthetic anabolic-androgenic steroid (AAS), a modified derivative of dihydrotestosterone (DHT). Two structural engineering choices define its profile: (1) methyl group at C17α, which prevents first-pass hepatic metabolism and provides oral bioavailability — but also produces hepatotoxicity (the 17α-alkylated class effect); (2) substitution of a carbon with oxygen at the C2 position of the A-ring, which essentially eliminates aromatization to estradiol. Result: orally active, minimal estrogenic activity, moderate androgen receptor binding. The androgenic-to-anabolic ratio is favorable for tissue-building applications relative to direct androgenic effects (the basis for its longstanding 'mild AAS' reputation, including the 'girl steroid' performance-community nickname — though that nickname undersells its real lipid and HPG impact). Activates androgen receptors in muscle and bone, driving nitrogen retention, protein synthesis, and erythropoiesis. Effects are dose-dependent and indication-dependent: at medical doses (5–20mg daily), the compound supports protein anabolism in catabolic states; at higher non-medical doses, anabolic effects increase but adverse effects (hepatotoxicity, lipid disruption, HPG suppression) scale faster than benefit. FDA-approved indications: HIV-associated wasting syndrome, severe burns, alcoholic hepatitis (limited evidence), Turner syndrome growth support (off-label widely used in pediatric endocrinology), and hereditary angioedema (HAE) prophylaxis.",
    halfLife: "Plasma half-life ~9 hours; twice-daily dosing typical for medical applications",
    reconstitution: { solvent: "N/A — oral tablet", typicalVialMg: null, typicalVolumeMl: null },
    dosingRange: { low: "5mg twice daily (medical, mild indications)", medium: "10mg twice daily (HIV wasting, established medical dose)", high: "20mg twice daily (severe burns, severe wasting — short courses)", frequency: "Twice daily with food" },
    typicalDose: "Medical use is highly indication-specific. HIV wasting: 5–10mg twice daily. Burns: 0.1mg/kg/day. Turner syndrome: 0.05–0.1mg/kg/day. Alcoholic hepatitis: 80mg/day in trials. HAE: 2.5–10mg daily. The catalog does not provide performance-use dosing protocols.",
    startDose: "Lowest therapeutic dose for the indication, with bracketed labs (lipid panel, liver enzymes, CBC, basic metabolic panel) at baseline and 4 weeks.",
    titrationNote: "Medical titration is response-based with lab oversight. For HIV wasting, weight gain and lean mass changes drive titration. For Turner syndrome, growth velocity is the endpoint.",
    cycle: "Medical use: courses range from weeks (burns, alcoholic hepatitis) to chronic (HAE prophylaxis, Turner syndrome). Performance-use cycle structures are NOT documented in this catalog.",
    storage: "Room temperature, away from moisture and light. Schedule III controlled substance — secured storage required.",
    benefits: [
      "FDA-approved for HIV-associated wasting syndrome and severe burn recovery",
      "Effective for Turner syndrome growth velocity support (off-label, widely used in pediatric endocrinology)",
      "Hereditary angioedema prophylaxis — reduces attack frequency in HAE patients",
      "Lower aromatization than testosterone-based AAS — minimal estradiol-related side effects (gynecomastia, water retention)",
      "Oral administration — useful for patient populations who cannot self-inject",
      "Lower androgenic profile than testosterone or oxymetholone — somewhat reduced virilization risk in women relative to other AAS (still real, see warnings)",
    ],
    sideEffects: [
      "Hepatotoxicity — 17α-alkylated, real liver enzyme elevations expected; rarely cholestatic injury",
      "Lipid panel disruption — HDL drops substantially (often 30–50%), LDL rises moderately. The HDL crash is a major cardiovascular risk driver.",
      "HPG axis suppression — testosterone production decreases, fertility suppressed (less severe than testosterone-based AAS but real)",
      "Erythrocytosis — hematocrit elevation requires monitoring",
      "Acne, hair loss in genetically susceptible users (DHT-derivative)",
      "Mood changes — anxiety, irritability, aggression possible at higher doses",
      "Virilization in women — clitoromegaly, voice deepening, body hair, hair loss. THESE EFFECTS ARE OFTEN PERMANENT. Discontinue at first sign; do not 'push through' to assess reversibility.",
      "Sleep apnea exacerbation in predisposed users",
      "BP elevation modest relative to other AAS",
    ],
    stacksWith: ["hcg", "tongkat-ali", "cardio-iq-panel"],
    warnings: [
      "Pregnancy — Category X, absolute contraindication (virilization of female fetus)",
      "Lactation — not for use",
      "Active prostate cancer or breast cancer — contraindicated",
      "Severe hepatic impairment — hepatotoxic, contraindicated",
      "Active or history of MI / stroke / unstable cardiovascular disease — caution; HDL crash worsens CV risk",
      "Hypercalcemia in breast cancer patients — historical contraindication",
      "Pediatric use in non-Turner-syndrome contexts — coordinate with pediatric endocrinologist",
      "Concurrent warfarin — oxandrolone potentiates anticoagulant effect; INR monitoring required",
      "Concurrent insulin or oral diabetic medications — may alter glucose homeostasis",
      "Diabetes — may affect insulin requirements; monitor",
      "Schedule III controlled substance — federal prescription required, no OTC access in US",
      "WOMEN: virilization risk is real even at medical doses; permanent effects (voice, clitoromegaly) require immediate discontinuation at any sign",
      "PERFORMANCE USE: this catalog does not provide bodybuilding-protocol dosing. For users engaging in non-medical use against advice, the lab-monitoring framework below is essential — multiple AAS-related deaths trace to unmonitored cardiovascular damage and undiagnosed liver injury.",
    ],
    sourcingNotes:
      "Prescription only — Schedule III controlled substance in the US. Available via specialty pharmacies for medical indications (HIV/AIDS specialty pharmacies, pediatric endocrinology compounding pharmacies, men's-health clinics that prescribe within medical context). Generic oxandrolone is FDA-approved and inexpensive (~$50–150/month at medical doses). Cash-only TRT clinic prescribing happens but operates in regulatory gray areas. Underground / black-market sourcing is common — quality control is genuinely poor (multiple historical analyses found 'Anavar' tablets containing other AAS, often dianabol or no AAS at all). The compound's reputation for being 'safe' has driven aggressive counterfeit market activity.",
    notes:
      "## Medical Indication Protocols\n**HIV-associated wasting syndrome:** 5–10mg twice daily for 4–12 weeks, with monitoring of weight, lean mass (DEXA if available), albumin, transaminases. Combined with adequate protein intake (1.5–2g/kg/day) and resistance training when feasible. May extend treatment if response sustained.\n\n**Severe burns (>40% BSA):** 0.1mg/kg twice daily during recovery phase, typically continued through wound healing. Demonstrated to reduce length of stay and improve protein balance in pediatric and adult burn populations.\n\n**Turner syndrome:** 0.05–0.1mg/kg/day continuous, typically initiated alongside or following recombinant growth hormone therapy. Pediatric endocrinology coordinates dosing and growth velocity monitoring.\n\n**Hereditary angioedema (HAE):** 2.5–10mg daily for prophylaxis. Reduces attack frequency and severity. Has been largely superseded by C1-INH replacement (Cinryze, Berinert), kallikrein inhibitors (Takhzyro), and bradykinin receptor antagonists (Firazyr) — all of which target HAE pathophysiology more specifically and avoid AAS side effects. Oxandrolone use in HAE persists primarily for cost-sensitive patients or those unable to access biologic therapy.\n\n## Lab Monitoring Framework (Applies to Any AAS Use)\nBaseline + every 3 months on therapy, regardless of indication: lipid panel (focus on HDL), liver enzymes (ALT, AST, GGT), CBC with hematocrit, basic metabolic panel, total testosterone + free testosterone + LH + FSH (HPG axis status), estradiol, PSA (men >40), BP at every visit. The HDL crash is the most clinically meaningful CV risk driver — when HDL drops >50%, the cardiovascular risk-benefit equation has shifted and the indication needs to justify continuation.\n\n## Performance Use Discussion (Harm-Reduction Frame, Not Endorsement)\nThis catalog acknowledges Anavar is widely used in non-medical performance contexts (cutting, contest prep, women's bodybuilding given the lower virilization profile relative to other AAS). The catalog does NOT provide performance-use dosing protocols. For users engaging in non-medical use against medical advice: (1) the lab monitoring framework above is non-negotiable — multiple AAS-related deaths trace to unmonitored CV damage and undiagnosed liver injury; (2) physician supervision (TRT clinic, sports medicine physician familiar with AAS) is genuinely safer than underground/forum-guided use; (3) HDL crash is real and the cardiovascular risk-benefit equation is unfavorable for cosmetic-only use; (4) PCT (post-cycle therapy with HCG, clomiphene, or tamoxifen) supports HPG axis recovery but doesn't reverse all damage; (5) hepatotoxicity is real even with the 'mild' Anavar — never stack multiple oral 17α-alkylated compounds. For users seeking the cosmetic outcomes Anavar is associated with, evidence-based alternatives include: testosterone replacement therapy (men with documented hypogonadism), GH peptides (CJC-1295/Ipamorelin), creatine, dietary protein optimization, structured resistance training. None match the dramatic acute effects of AAS, but none carry the same cardiovascular and HPG-axis risk profile.\n\n## Synergies (Medical Context)\nHCG: HPG axis preservation if used during AAS therapy. Tongkat ali: SHBG modulation for free-T fraction support during recovery. Comprehensive cardiovascular monitoring panel: cardio-IQ inflammation panel, NMR lipid profile, ApoB, Lp(a) — relevant for any AAS user given the lipid disruption.\n\n## Evidence Quality\nFDA-approved with substantial RCT evidence base for HIV wasting and severe burns. Strong real-world evidence for Turner syndrome support. Reasonable evidence for HAE (now largely supplanted by biologics). Performance-use evidence is observational / anecdotal — the gym-pharma literature is not RCT-driven.\n\n## Research vs Anecdote\nResearch: solid medical efficacy in established indications; well-characterized safety profile; HDL crash and HPG suppression robustly documented. Anecdote: extensive performance-community use generates substantial anecdotal data on dosing and side-effect patterns, but this is not a substitute for clinical research. Decision frame: medical use is appropriate when indicated and supervised; non-medical use carries real cardiovascular and hepatic risk that the lab-monitoring framework can identify but not eliminate.",
    tags: ["AAS", "anabolic steroid", "oxandrolone", "Anavar", "HIV wasting", "Turner syndrome", "HAE", "Schedule III", "17-alpha-alkylated", "oral", "medical use"],
    tier: "entry",
  },

  {
    id: "oxymetholone",
    name: "Oxymetholone",
    aliases: ["Anadrol", "Anadrol-50", "Anapolon", "A50", "Drol"],
    category: ["Anabolics / HRT"],
    categories: ["Anabolics / HRT"],
    route: ["oral"],
    mechanism:
      "Synthetic AAS, a 2-hydroxymethylene derivative of methyl-DHT. 17α-methylated for oral bioavailability (with attendant hepatotoxicity); the 2-hydroxymethylene group at the A-ring distinguishes oxymetholone from other DHT-derived AAS and contributes to its strong erythropoietic effect (the basis for its FDA-approved anemia indication). Mechanism at the cellular level: androgen receptor activation in muscle, bone, and erythroid precursors. Strong erythropoietic effect drives RBC production via direct stimulation of bone marrow + indirect erythropoietin elevation. Pharmacologically distinct from other AAS in two ways: (1) despite being a DHT derivative (which should not aromatize), oxymetholone produces clinically significant estrogen-like effects — water retention, gynecomastia in some users, and elevated estradiol. The mechanism is debated; possibly via direct estrogen receptor binding rather than aromatase conversion, or via 17β-hydroxysteroid dehydrogenase reverse activity. (2) Among the most hepatotoxic of commonly used AAS — significant liver enzyme elevations expected, with rare but reported cholestatic injury and hepatic adenomas with prolonged use. FDA-approved for treatment of anemia of various etiologies (aplastic anemia, myelodysplastic syndromes, anemia of chronic disease). Off-label use includes HIV-associated wasting syndrome.",
    halfLife: "Plasma half-life ~8–9 hours; once or twice daily dosing",
    reconstitution: { solvent: "N/A — oral tablet", typicalVialMg: null, typicalVolumeMl: null },
    dosingRange: { low: "1–2mg/kg/day (medical anemia indication)", medium: "2–5mg/kg/day", high: "5mg/kg/day (max recommended medical dose)", frequency: "Once or twice daily with food" },
    typicalDose: "Medical use: anemia 1–5mg/kg/day (typically 50–150mg/day in adults). HIV wasting (off-label): 50–100mg/day. Catalog does not provide performance-use dosing protocols.",
    startDose: "Lowest therapeutic dose for indication. Anemia: typically 50mg/day, escalate based on hematocrit response over 3–6 months.",
    titrationNote: "Anemia indication: response measured by hematocrit, transfusion-dependence reduction, hemoglobin trajectory over 3–6 months. Hepatic enzymes monitored every 4–6 weeks.",
    cycle: "Medical use: chronic in transfusion-dependent anemia; finite courses for HIV wasting. Hepatic stress means most clinicians limit to 6-month courses with breaks even in chronic indications.",
    storage: "Room temperature, away from moisture. Schedule III controlled substance — secured storage required.",
    benefits: [
      "FDA-approved for anemias of multiple etiologies — aplastic anemia, myelodysplastic syndromes, anemia of chronic disease — particularly relevant pre-erythropoietin era and still useful in some refractory cases",
      "Strong erythropoietic effect — reduces transfusion dependence in some refractory anemia patients",
      "Established efficacy in HIV-associated wasting syndrome (off-label)",
      "Oral administration",
      "Inexpensive generic available",
    ],
    sideEffects: [
      "Hepatotoxicity — significant elevation of ALT/AST common, rare cholestatic injury, rare hepatic adenoma with prolonged use. Among the most hepatotoxic AAS in current medical use.",
      "Substantial water retention — bloating, edema, weight gain that is partly fluid",
      "Blood pressure elevation — clinically meaningful, monitoring required",
      "Lipid panel disruption — significant HDL drop, LDL elevation",
      "Gynecomastia — paradoxically common despite DHT-derivative structure (mechanism debated)",
      "HPG axis suppression — substantial; testosterone production decreases dramatically",
      "Erythrocytosis — hematocrit elevation can become clinically significant (the same effect that drives the anemia indication can cause hyperviscosity in users without anemia)",
      "Acne, oily skin, hair loss in genetically susceptible users",
      "Mood changes — irritability, aggression possible at higher doses",
      "Virilization in women — strong DHT-derivative profile, virilization risk substantial. Permanent effects possible.",
      "Insulin resistance / impaired glucose tolerance",
    ],
    stacksWith: ["hcg", "cardio-iq-panel"],
    warnings: [
      "Pregnancy — Category X, absolute contraindication",
      "Lactation — not for use",
      "Active prostate cancer or breast cancer (male) — contraindicated",
      "Severe hepatic impairment — contraindicated; this is the most hepatotoxic AAS in routine medical use",
      "Active or recent MI / stroke — contraindicated",
      "Severe heart failure with fluid retention — contraindicated; substantial water retention exacerbates",
      "Hypercalcemia in breast cancer — historical contraindication",
      "Pediatric use — pediatric endocrinology coordination required; can affect bone maturation",
      "Concurrent warfarin — oxymetholone potentiates anticoagulant effect; INR monitoring required",
      "Insulin / oral diabetic medications — may alter glucose homeostasis substantially",
      "Schedule III controlled substance — federal prescription required",
      "WOMEN: virilization risk is substantial; many effects permanent; this is among the worst AAS choices for women relative to milder options",
      "Polycythemia / pre-existing erythrocytosis — contraindicated; the erythropoietic effect that helps anemia patients harms others",
      "PERFORMANCE USE: this catalog does not provide bodybuilding-protocol dosing. The combination of severe hepatotoxicity + significant BP elevation + lipid destruction makes Anadrol one of the higher-risk AAS in non-medical use. For users engaging in non-medical use against advice, the lab-monitoring framework below is essential.",
    ],
    sourcingNotes:
      "Prescription only — Schedule III controlled substance. Available via specialty pharmacies for medical indications (hematology/oncology specialty pharmacies, HIV/AIDS specialty pharmacies). Generic oxymetholone available, ~$200–500/month at medical doses. Underground / black-market sourcing common — quality control poor.",
    notes:
      "## Medical Indication Protocols\n**Anemia (aplastic, myelodysplastic, anemia of chronic disease):** 1–5mg/kg/day, typically starting 50mg daily and titrating based on hematocrit response. Treatment courses 3–6 months; longer courses involve hepatic risk reassessment. Often coordinated with hematology specialty care. In the modern era, erythropoietin-stimulating agents (epoetin alfa, darbepoetin) have largely superseded AAS for most anemia indications, but oxymetholone retains a niche for refractory cases or cost-sensitive contexts.\n\n**HIV-associated wasting syndrome (off-label):** 50–100mg/day for 8–16 weeks. Less commonly used than oxandrolone for this indication due to higher hepatotoxicity profile, but historically effective for severe wasting.\n\n## Lab Monitoring Framework\nBaseline + every 4–6 weeks on therapy: liver enzymes (ALT, AST, GGT, bilirubin — Anadrol's hepatotoxicity warrants more frequent monitoring than other AAS), lipid panel, CBC with hematocrit (monitor for excessive erythrocytosis), basic metabolic panel, BP at every visit, total testosterone + LH + FSH, estradiol (paradoxically relevant despite DHT-derivative structure). PSA in men >40. Annual liver imaging in users on chronic therapy >6 months. The hepatotoxicity profile is the standout safety concern — Anadrol is the AAS most likely to produce clinically meaningful liver injury, including rare hepatic adenoma with prolonged use.\n\n## Performance Use Discussion (Harm-Reduction Frame, Not Endorsement)\nAnadrol is widely used in non-medical bodybuilding contexts as a 'wet bulker' — produces dramatic mass gain through a combination of true muscle hypertrophy + significant water retention. The combination of severe hepatotoxicity + significant BP elevation + lipid panel destruction makes Anadrol one of the higher-risk AAS in performance use. The catalog does NOT provide performance-use dosing protocols. For users engaging in non-medical use against advice: (1) lab monitoring framework above is non-negotiable; (2) physician supervision genuinely safer than forum-guided use; (3) BP management and lipid management may require pharmacological intervention (statins, antihypertensives); (4) hepatic stress is severe — never stack with other oral 17α-alkylated AAS, never extend cycles beyond what the literature supports for medical doses, never run consecutively without hepatic recovery period; (5) PCT supports HPG axis recovery but doesn't reverse hepatic, cardiac, or HDL damage. Evidence-based alternatives for cosmetic muscle gain remain testosterone replacement therapy (with documented hypogonadism), GH peptides, creatine, dietary protein, resistance training.\n\n## Synergies (Medical Context)\nHCG: HPG axis preservation. Cardio-IQ inflammation panel + NMR lipid profile: relevant for any AAS user. Erythropoietin / darbepoetin (in anemia indications): often replaces AAS as first-line in modern hematology practice.\n\n## Evidence Quality\nFDA-approved with substantial historical evidence base for anemia treatment. Modern hematology has largely moved to erythropoietin-stimulating agents for primary anemia management; oxymetholone retains a niche role. HIV wasting evidence is established but oxandrolone is more commonly used for this indication due to better hepatic profile.\n\n## Research vs Anecdote\nResearch: solid medical efficacy in established anemia indications; well-characterized safety profile (severe hepatotoxicity is the standout signal). Anecdote: extensive bodybuilding-community use generates substantial anecdotal dosing data; this is not RCT-driven and the harm patterns observed in long-term performance users are consistent with the documented hepatotoxicity, lipid disruption, and CV risk profile from medical literature. Decision frame: medical use is appropriate when indicated; non-medical use carries the highest hepatic and cardiovascular risk profile of the medical-AAS class.",
    tags: ["AAS", "anabolic steroid", "oxymetholone", "Anadrol", "anemia", "aplastic anemia", "myelodysplastic syndrome", "HIV wasting", "Schedule III", "17-alpha-alkylated", "oral", "hepatotoxic"],
    tier: "entry",
  },

  {
    id: "stanozolol",
    name: "Stanozolol",
    aliases: ["Winstrol", "Winny", "Winstrol Depot (injectable)", "Stromba", "Stanozolol"],
    category: ["Anabolics / HRT"],
    categories: ["Anabolics / HRT"],
    route: ["oral", "intramuscular injection (aqueous suspension)"],
    mechanism:
      "Synthetic AAS, a heterocyclic-modified DHT derivative — the 3-keto group of DHT is replaced by a pyrazole ring fused to the A-ring, producing distinctive pharmacology: minimal aromatization, high androgen receptor selectivity, oral bioavailability, and notably lower SHBG binding than other AAS (stanozolol displaces other steroids from SHBG, paradoxically increasing free fraction of co-administered hormones). 17α-alkylated for oral bioavailability — and notable among AAS for being 17α-alkylated even in its INJECTABLE form (unique among injectable AAS), which means injectable Winstrol carries the same hepatotoxicity profile as the oral. Strongest impact on lipid panel of any commonly-used AAS — HDL drops dramatically (often 40–60%), LDL rises substantially. Historical FDA approval for hereditary angioedema (HAE) prophylaxis (withdrawn from US market 2010 by manufacturer Sanofi for commercial reasons, not safety; still available via compounding pharmacies and international supply). Off-label use: severe HAE, anemia of chronic disease, debility states. Famous for the 1988 Ben Johnson Olympic doping case which catapulted Winstrol into public awareness as a performance-enhancing drug. Performance-use community has used stanozolol heavily for cutting / contest prep and for athletic performance enhancement (sprinters, racing, sports requiring strength-to-weight ratio).",
    halfLife: "Oral plasma half-life ~9 hours; injectable suspension provides longer effective duration via slow release — though metabolic clearance is similar",
    reconstitution: { solvent: "Oral: N/A. Injectable: pre-formulated aqueous suspension — RESUSPEND by shaking before injection", typicalVialMg: null, typicalVolumeMl: 1 },
    dosingRange: { low: "2mg three times daily (HAE prophylaxis, oral)", medium: "2–6mg/day oral, OR 50mg IM 1–2× weekly", high: "6mg/day oral, OR 50–100mg IM weekly (max practical medical doses)", frequency: "Oral: BID-TID; injectable: 1–3× weekly typical" },
    typicalDose: "Medical use: HAE prophylaxis 2mg TID (oral). Anemia (off-label): 2–6mg/day oral. Catalog does not provide performance-use dosing protocols.",
    startDose: "HAE prophylaxis: 2mg TID with bracketed labs. Titrate based on attack frequency reduction.",
    titrationNote: "HAE: titrate to lowest effective dose that prevents attacks. Monitoring for AAS adverse effects every 3 months.",
    cycle: "Medical (HAE prophylaxis): chronic when needed, frequently with attempts at minimum effective dose. Modern HAE management has largely moved to non-AAS biologics (C1-INH, kallikrein inhibitors, bradykinin receptor antagonists).",
    storage: "Oral: room temperature. Injectable suspension: room temperature, away from freezing. Schedule III controlled substance.",
    benefits: [
      "FDA-approved historically for hereditary angioedema (HAE) prophylaxis — effective in reducing attack frequency",
      "Useful in anemia of chronic disease (off-label)",
      "Oral and injectable forms available — different routes can be selected for patient preference or specific clinical contexts",
      "Less aromatization than testosterone-based AAS",
      "Inexpensive when accessible (cost-sensitive HAE prophylaxis context)",
    ],
    sideEffects: [
      "DRAMATIC LIPID PANEL DISRUPTION — HDL drops 40–60% (the most severe HDL crash of any commonly-used AAS), LDL rises substantially. Cardiovascular risk-benefit is unfavorable for anyone without a strong indication.",
      "Hepatotoxicity — both oral and injectable are 17α-alkylated, both hepatotoxic. Liver enzyme elevations expected.",
      "Significant joint pain / dryness — characteristic and often-cited Winstrol side effect; mechanism involves sebum and synovial fluid changes",
      "HPG axis suppression — significant",
      "Acne, hair loss in genetically susceptible users (DHT-derivative)",
      "Virilization in women — strong DHT-derivative profile, virilization risk substantial",
      "Erythrocytosis — hematocrit elevation",
      "Tendon rupture — increased risk reported in athletes using stanozolol; mechanism may involve collagen synthesis modulation",
      "Mood changes — anxiety, aggression possible",
      "Injectable suspension produces injection-site soreness more than oil-based AAS injectables (aqueous suspension irritates muscle tissue)",
    ],
    stacksWith: ["hcg", "cardio-iq-panel"],
    warnings: [
      "Pregnancy — Category X, absolute contraindication",
      "Lactation — not for use",
      "Active prostate cancer or breast cancer (male) — contraindicated",
      "Severe hepatic impairment — contraindicated",
      "Severe cardiovascular disease — contraindicated; HDL crash is severe",
      "Hypercalcemia in breast cancer — historical contraindication",
      "Concurrent warfarin — stanozolol potentiates anticoagulant effect; INR monitoring required",
      "Concurrent corticosteroids — additive fluid retention effects",
      "Schedule III controlled substance — federal prescription required",
      "WOMEN: virilization risk is substantial; permanent effects possible. Among the worse AAS choices for women relative to oxandrolone.",
      "Athletes / heavy resistance training: tendon rupture risk genuine — caution with maximal-load training",
      "PERFORMANCE USE: this catalog does not provide bodybuilding-protocol dosing. The dramatic HDL crash makes stanozolol cardiovascular risk-benefit unfavorable for cosmetic-only use. For users engaging in non-medical use against advice, the lab-monitoring framework below is essential.",
    ],
    sourcingNotes:
      "Schedule III controlled substance. Withdrawn from US market 2010 by Sanofi (commercial decision, not safety). Available in US via compounding pharmacies for HAE indication and other off-label uses. International availability varies. Underground / black-market sourcing common — quality control poor; both oral and injectable counterfeit prevalence high. Modern HAE management has largely moved to biologics (C1-INH replacement Cinryze/Berinert, kallikrein inhibitor Takhzyro, bradykinin receptor antagonist Firazyr) that target HAE pathophysiology more specifically and avoid the AAS side effect profile.",
    notes:
      "## Medical Indication Protocols\n**Hereditary angioedema (HAE) prophylaxis:** 2mg orally three times daily, titrate to lowest effective dose preventing attacks. Modern HAE management has largely moved to biologic therapy targeting HAE pathophysiology directly (C1-INH replacement, kallikrein inhibitors, bradykinin receptor antagonists). Stanozolol persists in HAE management primarily for cost-sensitive patients or those unable to access biologic therapy, and for patients with documented historical response to AAS prophylaxis who prefer to remain on it.\n\n**Anemia of chronic disease (off-label):** 2–6mg orally daily. Less effective than oxymetholone for this indication; not commonly used as first-line.\n\n## Lab Monitoring Framework (Especially Important for Stanozolol)\nBaseline + every 3 months: lipid panel (the HDL crash with stanozolol is dramatic and clinically meaningful — cardiovascular risk increases substantially), liver enzymes, CBC with hematocrit, basic metabolic panel, BP, total testosterone + LH + FSH, estradiol (despite low aromatization), PSA in men >40. Cardiovascular risk reassessment at 6 months — the HDL crash often shifts the risk-benefit equation enough that the indication needs to justify continuation.\n\n## Performance Use Discussion (Harm-Reduction Frame, Not Endorsement)\nStanozolol is widely used in non-medical contexts for cutting / contest prep and athletic performance enhancement. The famous Ben Johnson 1988 case made Winstrol publicly synonymous with sports doping. The dramatic HDL crash (40–60% reductions documented) and the tendon rupture risk are the standout safety concerns for performance use beyond the standard AAS profile. The catalog does NOT provide performance-use dosing protocols. For users engaging in non-medical use against advice: (1) lab monitoring framework above is non-negotiable; (2) physician supervision genuinely safer; (3) the cardiovascular risk-benefit is the worst of the medical-AAS class for cosmetic-only use due to the HDL crash; (4) tendon rupture risk is real for athletes doing maximal-load work; (5) injectable Winstrol's 17α-alkylation means injectable does NOT spare the liver (unlike most injectable AAS) — this is a frequently misunderstood point in performance communities. Evidence-based alternatives for cosmetic and athletic outcomes remain testosterone replacement therapy, GH peptides, creatine, structured training, dietary protein optimization.\n\n## Synergies (Medical Context)\nHCG: HPG axis preservation. Cardio-IQ inflammation panel + NMR lipid profile: especially relevant given the dramatic HDL impact. C1-INH replacement (Cinryze, Berinert) and kallikrein inhibitors (Takhzyro) — modern HAE biologics that have largely replaced stanozolol for primary HAE management.\n\n## Evidence Quality\nFDA-approved historically for HAE; substantial historical evidence base. Withdrawal from US market in 2010 was commercial, not safety-driven. Modern HAE management has moved beyond AAS for first-line. Performance-use evidence is observational / anecdotal. Tendon rupture risk in athletes is documented in case series and small studies.\n\n## Research vs Anecdote\nResearch: established medical efficacy in HAE; well-characterized safety profile with the HDL crash and tendon rupture risk as standout concerns beyond standard AAS effects. Anecdote: extensive performance-community use across multiple sports; the HDL crash and tendon rupture pattern are observed clinically and consistent with mechanistic predictions. Decision frame: medical HAE use is appropriate when biologic therapy is unavailable or unsuccessful; non-medical use carries the worst lipid risk profile of the medical-AAS class plus tendon rupture risk for maximal-load athletes.",
    tags: ["AAS", "anabolic steroid", "stanozolol", "Winstrol", "HAE", "hereditary angioedema", "Ben Johnson", "Schedule III", "17-alpha-alkylated", "oral", "injectable", "tendon rupture risk"],
    tier: "entry",
  },

  // ============================================================================
  // SECTION 2 — Longevity / Metabolic (2)
  // ============================================================================

  {
    id: "rapamycin",
    name: "Rapamycin",
    aliases: ["Sirolimus", "Rapamune", "Rapa", "RAPA"],
    category: ["Longevity", "mTOR Inhibitor", "Immunosuppressant"],
    categories: ["Longevity", "mTOR Inhibitor", "Immunosuppressant"],
    route: ["oral"],
    mechanism:
      "Macrolide immunosuppressant and selective mTORC1 inhibitor. Discovered in 1972 from Streptomyces hygroscopicus bacteria isolated on Easter Island (Rapa Nui — hence the name). Originally developed as antifungal, repurposed as immunosuppressant after T-cell-suppressive properties identified. FDA-approved 1999 for prevention of organ transplant rejection (kidney transplant primarily). Mechanism: binds intracellular FKBP12, the rapamycin-FKBP12 complex inhibits mechanistic target of rapamycin complex 1 (mTORC1) — a master kinase regulating cell growth, protein synthesis, autophagy, and cellular metabolism. mTORC1 inhibition produces: (1) suppression of cap-dependent protein translation, (2) upregulation of autophagy (cellular cleanup of damaged proteins and organelles), (3) shift from anabolic to catabolic cellular state, (4) reduced cellular senescence accumulation, (5) immunomodulation via T-cell IL-2 signaling suppression. The longevity application emerged from animal data: rapamycin is the most reproducible lifespan-extending compound in mammalian models — extends lifespan in yeast, worms, flies, and mice, with mouse lifespan extension of 9–14% in both sexes documented in the NIA Interventions Testing Program (most consistent positive result in that program). Human longevity data is emerging: PEARL trial (2023 results) in healthy older adults showed improvements in some biomarkers without clear functional outcome benefits at 48 weeks. No definitive long-term human longevity trial exists. Off-label longevity dosing typically uses pulse protocols (intermittent dosing 5–10mg weekly) rather than the continuous daily dosing of transplant immunosuppression — the rationale is that pulse dosing achieves mTORC1 inhibition (longevity benefit) while sparing mTORC2 inhibition (which produces metabolic side effects).",
    halfLife: "Plasma half-life ~62 hours — long. Once-weekly pulse dosing in longevity protocols allows clearance between doses.",
    reconstitution: { solvent: "N/A — oral tablet or liquid solution", typicalVialMg: 1, typicalVolumeMl: null },
    dosingRange: { low: "3–5mg once weekly (longevity, conservative)", medium: "5–8mg once weekly (longevity, typical)", high: "10mg once weekly (longevity, aggressive)", frequency: "Once weekly (longevity); daily for transplant indication (different dosing)" },
    typicalDose: "Longevity off-label: 5–10mg orally once weekly. Transplant indication: 2–5mg daily continuously (different dosing framework, with target trough levels).",
    startDose: "Longevity beginner: 3–5mg once weekly × 4 weeks to assess tolerance, then titrate up if no significant side effects.",
    titrationNote: "Longevity titration based on subjective tolerance (mouth ulcers, GI changes, fatigue) and labs (lipid panel, glucose, CBC). Most users settle at 5–8mg weekly. >10mg weekly produces increasing side effects without clear additional longevity benefit per current evidence.",
    cycle: "Longevity protocols typically continuous weekly pulse dosing — no formal cycling required given the pulse-dosing strategy itself spaces out exposure. Some users include 4–8 week breaks every 6–12 months.",
    storage: "Room temperature, away from light. Liquid solution: refrigerate after opening.",
    benefits: [
      "Most reproducible lifespan-extending compound in mammalian animal models — substantial preclinical evidence base across multiple species",
      "Upregulates autophagy — cellular cleanup mechanism associated with multiple longevity pathways",
      "Reduced cellular senescence accumulation in animal studies",
      "Improves immune function in older adults paradoxically (despite immunosuppressant classification — likely via 'immune rejuvenation' effect at low pulse doses)",
      "Pulse dosing strategy minimizes metabolic side effects vs. continuous transplant-dose immunosuppression",
      "Cancer prevention signal in some animal and human observational studies",
      "Improved cardiovascular markers in some users",
      "Off-label longevity use is increasingly mainstream among informed users (Bryan Johnson, Peter Attia, others), increasingly accessible via longevity clinics",
    ],
    sideEffects: [
      "Mouth ulcers (aphthous stomatitis) — most common dose-limiting side effect at longevity doses",
      "Mild GI upset — usually transient",
      "Lipid panel changes — modest LDL and triglyceride elevation, particularly at higher doses",
      "Glucose intolerance — modest fasting glucose elevation in some users; mTORC2 inhibition (more pronounced at higher doses) drives this",
      "Mild anemia or thrombocytopenia at higher doses",
      "Pneumonitis — rare but documented; presents as cough, dyspnea; requires immediate discontinuation and pulmonary evaluation",
      "Wound healing impairment — postpone elective surgery 2–4 weeks before/after weekly doses; longer for major surgery",
      "Modest immune function changes at low pulse doses; significant immunosuppression at continuous transplant doses",
      "Drug interaction sensitivity — strong CYP3A4 substrate, multiple interactions",
    ],
    stacksWith: ["metformin", "nad", "spermidine", "berberine"],
    warnings: [
      "Active infection — defer dose until resolution",
      "Recent or imminent surgery — postpone weekly dose 2 weeks before / 2 weeks after minor surgery; longer for major surgery",
      "Pregnancy — Category C; avoid during pregnancy and contraception during therapy",
      "Lactation — not for use",
      "Active malignancy — coordinate with oncologist; rapamycin has both pro-cancer and anti-cancer effects depending on context",
      "Hyperlipidemia or active CV disease — monitor lipids, may require statin adjustment",
      "Diabetes / pre-diabetes — monitor glucose; mTORC2 inhibition affects glucose homeostasis",
      "CYP3A4 interactions — strong inhibitors (ketoconazole, clarithromycin, grapefruit juice) substantially elevate rapamycin levels; strong inducers (rifampin, carbamazepine) reduce levels. Coordinate any new prescription medication with prescriber.",
      "Concurrent live vaccines — avoid",
      "Wound healing impairment — flag any surgical/dental work to prescriber",
    ],
    sourcingNotes:
      "Prescription only. Available via transplant pharmacy supply chain (organ transplant indication) and increasingly via longevity-medicine clinics offering off-label prescribing. Longevity clinics: AgelessRx (telehealth), Healthspan Health, Modern Aging, several others. Compounded versions exist; FDA-approved generic Sirolimus (Pfizer Rapamune and generic) is preferable. Cost: ~$50–200/month for longevity dosing depending on source and pharmacy.",
    notes:
      "## Beginner Longevity Protocol\n3–5mg once weekly × 4 weeks. Bracket with: lipid panel, fasting glucose, HbA1c, CBC, comprehensive metabolic panel, hsCRP at baseline. Re-check at 4 and 12 weeks. Assess subjective tolerance — mouth ulcers, GI, fatigue, sleep. If well-tolerated, titrate to 5–8mg weekly over the next 8–12 weeks based on subjective and objective response.\n\n## Advanced Longevity Protocol\n5–10mg once weekly continuous, paired with metformin (500mg BID), aerobic + resistance training, dietary protein optimization, and standard longevity-stack supplements (NAD precursors, spermidine, urolithin A, etc.). Track biomarker panel quarterly: comprehensive metabolic, lipid, hsCRP, IL-6, GlycanAge or similar epigenetic age markers if accessible. Annual cancer screening appropriate for age + comprehensive cardiovascular workup. The pulse-dosing strategy (vs continuous) is the central design choice for longevity off-label use — preserves mTORC2-dependent metabolic functions while achieving mTORC1 inhibition.\n\n## Reconstitution + Administration\nN/A — oral tablet or liquid. Take consistently with or without food (food modestly reduces absorption but consistency matters more than absolute level for longevity use). Avoid grapefruit juice within 24 hours of dose (CYP3A4 inhibition substantially elevates rapamycin levels).\n\n## Synergies\n**Metformin:** common longevity-stack pairing — different mechanism (AMPK activation + complex I modulation) targeting overlapping pathways. **NAD precursors (NMN, NR):** mitochondrial / sirtuin pathway complementarity. **Spermidine:** autophagy upregulation via different mechanism — potentially additive. **Berberine:** insulin sensitization complementary to rapamycin's metabolic effects.\n\n## Evidence Quality\nAnimal data: among the strongest longevity evidence bases of any compound — mouse lifespan extension robust and reproducible across labs and protocols. Human data: emerging. PEARL trial (2023) showed some biomarker improvements without clear functional outcome benefits at 48 weeks. No definitive long-term human longevity outcome trial exists. The off-label longevity use is rational based on preclinical data + early human biomarker work, but should be framed as best-current-bet rather than proven intervention.\n\n## Research vs Anecdote\nResearch: solid preclinical longevity data, emerging human biomarker data, established immunosuppressant safety profile (with the caveat that pulse low-dose use differs from continuous transplant-dose use). Anecdote: longevity-community user reports overwhelmingly positive on subjective markers (energy, recovery, sleep) and reasonable safety at pulse doses. Decision frame: rapamycin is among the most evidence-supported off-label longevity interventions; pulse dosing strategy is mechanistically rational; ongoing trials will define the human outcome benefit more precisely. Reasonable to add to a comprehensive longevity protocol with monitoring; not yet 'standard of care' for healthy aging.",
    tags: ["rapamycin", "sirolimus", "mTOR", "longevity", "autophagy", "immunosuppressant", "Easter Island", "PEARL trial", "off-label", "pulse dosing"],
    tier: "entry",
  },

  {
    id: "metformin",
    name: "Metformin",
    aliases: ["Glucophage", "Glucophage XR", "Fortamet", "Glumetza", "Riomet", "Metformin HCl", "Metformin ER"],
    category: ["GLP / Metabolic", "Longevity", "Diabetes Management"],
    categories: ["GLP / Metabolic", "Longevity", "Diabetes Management"],
    route: ["oral"],
    mechanism:
      "Biguanide derivative, originally derived from French lilac (Galega officinalis) — used in herbal medicine for centuries before guanidine compounds were isolated and synthesized. Metformin specifically synthesized in 1922; clinical use established in 1957 in Europe; FDA approved in US 1995 (relatively late US adoption due to lingering concerns from the related drug phenformin, which was withdrawn for lactic acidosis). Now first-line pharmacotherapy for type 2 diabetes worldwide and one of the most-prescribed drugs in the world. Multi-mechanism action — the precise primary mechanism remains debated despite 70+ years of clinical use: (1) inhibits mitochondrial respiratory complex I in hepatocytes — the proposed primary mechanism — reducing hepatic gluconeogenesis (the dominant metabolic effect); (2) AMPK activation downstream of complex I inhibition, producing broad cellular metabolic rewiring; (3) gut microbiome modulation — some metformin effects appear mediated by altered gut bacterial populations rather than direct cellular action; (4) modest insulin sensitization in peripheral tissues (smaller effect than originally believed); (5) mTOR pathway suppression (overlap with rapamycin mechanism — basis for longevity off-label use); (6) reduced inflammatory cytokine signaling. Net clinical effects: lowers fasting glucose primarily by reducing hepatic glucose output; modest weight-neutral or weight-favorable effect (unlike insulin and sulfonylureas which cause weight gain); HbA1c reduction ~1–1.5%. Off-label longevity use is increasingly mainstream — Targeting Aging with Metformin (TAME) trial enrollment ongoing, designed to test whether metformin extends healthspan in non-diabetic older adults. Performance / athletic context: the AMPK-activating + mTOR-suppressing mechanism partially blunts post-workout muscle protein synthesis when timed near training — relevant for athletes optimizing hypertrophy.",
    halfLife: "Plasma half-life ~6 hours; tissue half-life longer due to slow elimination from intracellular sites",
    reconstitution: { solvent: "N/A — oral tablet, immediate-release or extended-release", typicalVialMg: 500, typicalVolumeMl: null },
    dosingRange: { low: "500mg once daily (longevity / starting dose)", medium: "500mg twice daily (typical T2D, longevity stable dose)", high: "1000mg twice daily (max recommended)", frequency: "BID with meals (immediate release); once daily (extended release)" },
    typicalDose: "T2D: 500mg twice daily with meals, titrated up to 1000mg twice daily if tolerated. Longevity off-label: 500mg twice daily typical (some users 500mg once daily). Extended-release formulations dosed once daily.",
    startDose: "500mg once daily with dinner × 7 days, then 500mg twice daily (with breakfast and dinner) — slow titration reduces GI side effects, the primary tolerability barrier",
    titrationNote: "Titrate slowly. GI side effects (nausea, diarrhea, abdominal discomfort) are common at initiation and frequently resolve with slow titration. Extended-release formulations have substantially better GI tolerance.",
    cycle: "Continuous use for T2D and longevity indications. No formal cycling. Some athletes time discontinuation around competition or peak training windows due to mTOR-suppression effect on muscle protein synthesis.",
    storage: "Room temperature, dry",
    benefits: [
      "First-line T2D pharmacotherapy worldwide — strongest evidence base of any diabetes drug",
      "Weight-neutral or modestly weight-favorable (unlike insulin and sulfonylureas)",
      "Cardiovascular risk reduction in T2D (UKPDS landmark trial)",
      "Cancer risk reduction signal in observational diabetic cohorts (most robust for colorectal, possibly hepatocellular and others)",
      "Inexpensive — generic, ~$5–15/month at retail",
      "Long safety record — 70+ years of clinical use",
      "Off-label longevity use rationale: TAME trial in progress, supporting biomarker data accumulating",
      "AMPK activation and mTOR suppression provide mechanistic rationale for longevity benefit beyond glucose control",
      "Useful adjunct in PCOS, NAFLD, prediabetes",
    ],
    sideEffects: [
      "GI upset — nausea, diarrhea, abdominal cramping (common; reduced with extended-release and slow titration)",
      "Vitamin B12 deficiency with chronic use — clinically relevant; monitor B12 every 1–2 years on chronic therapy. Cross-references the B12 injection entry below for users with documented metformin-induced B12 deficiency.",
      "Metallic taste",
      "Lactic acidosis — rare but the historically-worried complication. Risk concentrated in patients with severe renal impairment, severe heart failure, sepsis, or metabolic acidosis from other causes. Modern dose-adjustment guidelines (avoid in eGFR <30, dose-reduce in eGFR 30–45) have made lactic acidosis genuinely rare.",
      "mTOR suppression effect on post-workout muscle protein synthesis — relevant for athletes; consider timing relative to training",
      "Modest fat loss / body composition improvement in some users — typically welcomed but worth noting",
    ],
    stacksWith: ["rapamycin", "berberine", "b12-injection", "semaglutide", "tirzepatide", "retatrutide"],
    warnings: [
      "Severe renal impairment (eGFR <30) — contraindicated due to lactic acidosis risk",
      "Moderate renal impairment (eGFR 30–45) — dose reduction; coordinate with prescriber",
      "Severe heart failure (NYHA Class IV) — contraindicated",
      "Severe hepatic impairment — contraindicated",
      "Acute illness with potential for hypoperfusion (sepsis, MI, severe dehydration) — temporarily discontinue",
      "Iodinated contrast administration (CT scans, angiography) — temporarily hold metformin around contrast administration; coordinate with prescriber",
      "Pre-surgical — typically held morning of surgery",
      "Pregnancy — Category B; used in some PCOS pregnancies; coordinate with OB",
      "Lactation — present in breast milk; discuss with prescriber",
      "Alcohol use disorder — increases lactic acidosis risk; coordinate carefully",
      "B12 deficiency on long-term therapy — monitor B12 + MMA; supplement if deficient (oral methylcobalamin or B12 injection)",
      "Athletic users: muscle protein synthesis effect — time dose around training if hypertrophy is the goal",
    ],
    sourcingNotes:
      "Prescription required in US. Generic widely available, very inexpensive ($5–15/month). Available via primary care, endocrinology, telehealth platforms (longevity clinics offering off-label prescribing). Extended-release formulations preferred for GI tolerability. International availability varies — OTC in some countries.",
    notes:
      "## T2D Beginner Protocol\n500mg with dinner × 7 days; if tolerated, escalate to 500mg twice daily (breakfast + dinner) × 4 weeks. Recheck HbA1c at 3 months. Titrate to 1000mg twice daily if HbA1c response is inadequate. Most T2D users settle 500–1000mg twice daily. B12 baseline + every 1–2 years on chronic therapy. Renal function monitored at baseline and annually.\n\n## Longevity Off-Label Protocol\n500mg twice daily (or 500–1000mg extended-release once daily) continuous. Bracket with: comprehensive metabolic panel, lipid panel, HbA1c, B12, fasting insulin, hsCRP at baseline and every 6 months. Pair commonly with rapamycin (5–10mg weekly), comprehensive lifestyle interventions (resistance + aerobic training, dietary protein optimization, sleep), and longevity-stack supplements as desired. The TAME trial (Targeting Aging with Metformin) will eventually provide more definitive guidance on longevity benefit; in the meantime, off-label use is supported by mechanistic rationale + observational diabetic cohort data + animal evidence.\n\n## Athletic Considerations\nFor athletes prioritizing hypertrophy: metformin's AMPK activation + mTOR suppression partially blunt post-workout muscle protein synthesis when active near the training window. Practical management: take metformin doses far from training (e.g., dinner-only dosing if training is morning/midday; alternatively, structured discontinuation during peak training blocks). Some athletes discontinue metformin entirely during dedicated muscle-building phases and resume during cutting/maintenance phases. The mTOR suppression effect is the same mechanism that drives the longevity benefit — there is a genuine trade-off between hypertrophy maximization and longevity-pathway activation.\n\n## Reconstitution + Administration\nN/A — oral tablet. Immediate-release with meals (reduces GI side effects); extended-release once daily, evening dosing common.\n\n## Synergies\n**Rapamycin:** classic longevity stack pairing — different mechanism, overlapping pathways. **Berberine:** AMPK activation overlap; sometimes used as a 'metformin alternative' (less robust evidence, similar mechanism, milder GI profile). **B12 injection or oral methylcobalamin:** addresses metformin-induced B12 depletion. **GLP-1 agonists (semaglutide, tirzepatide, retatrutide):** synergistic in T2D management; metformin remains first-line, GLP-1 added when HbA1c response inadequate or weight-loss goals exist.\n\n## Evidence Quality\nT2D evidence: extensive RCT and real-world evidence base, 70+ years of clinical use. UKPDS landmark trial demonstrated cardiovascular benefit. First-line in all major diabetes guidelines. Cancer risk reduction signal is observational but consistent across multiple large diabetic cohorts. Longevity off-label use evidence: mechanistic rationale + animal data + observational human data + ongoing TAME trial. Best-evidence-supported off-label longevity intervention along with rapamycin.\n\n## Research vs Anecdote\nResearch: T2D efficacy and safety thoroughly established; longevity benefit is biologically plausible with accumulating supportive data; cardiovascular benefit demonstrated in T2D populations. Anecdote: longevity community use is widespread; subjective effects are typically modest (vs the dramatic reports common in supplement contexts); the value frame is decades-of-cellular-maintenance rather than acute response. Decision frame: extremely safe, very inexpensive, mechanistically rational, accumulating evidence — rapamycin and metformin are the two most defensible off-label longevity prescriptions for users without contraindications.",
    tags: ["metformin", "biguanide", "T2D", "diabetes", "longevity", "AMPK", "mTOR", "TAME trial", "B12 depletion", "first-line diabetes drug"],
    tier: "entry",
  },

  // ============================================================================
  // SECTION 3 — Clinic Injectables (2)
  // ============================================================================

  {
    id: "mic-injection",
    name: "MIC Injection",
    aliases: ["MIC", "Methionine Inositol Choline injection", "MIC shot", "Lipotropic injection (MIC formulation)"],
    category: ["GLP / Metabolic", "Longevity"],
    categories: ["GLP / Metabolic", "Longevity"],
    route: ["IM injection", "subQ injection"],
    mechanism:
      "Compounded injection containing three lipotropic compounds: methionine (essential sulfur amino acid, methyl donor in S-adenosylmethionine pathway), inositol (cyclitol involved in cell membrane phospholipid composition and signaling), and choline (essential nutrient required for phosphatidylcholine synthesis in liver — the substrate for VLDL particle formation that exports triglycerides from liver). The 'lipotropic' framing — claimed mechanism for the weight-loss and fat-burning marketing — proposes that these three compounds support hepatic fat metabolism: choline enables fat export from liver via VLDL formation; methionine supports hepatic methylation reactions including those involved in lipid metabolism; inositol contributes to insulin signaling and membrane lipid composition. The honest evidence assessment: methionine and inositol have no robust evidence as weight-loss agents in non-deficient users. Choline has more legitimate biochemical case — choline deficiency does cause hepatic fat accumulation (a recognized mechanism in NAFLD), and choline supplementation may be relevant for users with documented deficiency or low-egg / low-organ-meat dietary patterns. The injectable route adds little vs. oral for any of the three components — all are well-absorbed orally. The compounded MIC injection is largely a clinic-revenue product whose effects are dominated by placebo, the clinical-attention effect of frequent clinic visits (accountability, coaching, dietary support), and very modest pharmacology. Distinct from Lipo-C (which adds B12 to the MIC base, sometimes plus other ingredients) — both products have similar evidence-base limitations. Marketed primarily in weight-management and wellness clinic protocols, often paired with low-calorie diets or as adjunct to other weight-loss interventions.",
    halfLife: "Component-dependent. Methionine plasma half-life ~30 min; inositol ~hours; choline ~hours.",
    reconstitution: { solvent: "Pre-mixed by compounding pharmacy", typicalVialMg: null, typicalVolumeMl: 30 },
    dosingRange: { low: "0.5–1mL IM weekly", medium: "1mL IM 1–2× weekly", high: "1mL IM 3× weekly", frequency: "Typically 1–3× weekly in clinic protocols" },
    typicalDose: "1mL IM 1–2× weekly",
    startDose: "1mL IM × 1 to assess tolerance, then standard frequency",
    titrationNote: "Modest titration. Increase to 2–3× weekly if subjective benefit at lower frequency.",
    cycle: "Continuous use common in clinic weight-management protocols (8–12 week courses typical alongside dietary intervention). No formal cycle requirement.",
    storage: "Refrigerated 2–8°C; stability per compounding pharmacy",
    benefits: [
      "Choline component has legitimate biochemical relevance for users with documented choline deficiency or low dietary intake (vegetarian/vegan, low-egg, low-organ-meat)",
      "Some users report subjective energy / wellness improvement — likely combination of mild pharmacology + placebo + clinical-attention effect",
      "Generally well-tolerated, low adverse event profile",
      "Convenient single-injection delivery of three compounds in clinic-attendance context",
      "Honest framing: most effects are clinic-attention and lifestyle-driven, not pharmacology-driven",
    ],
    sideEffects: [
      "Injection site soreness, mild local reactions",
      "Methionine: rare GI upset, sulfur breath",
      "Choline (especially at high doses): fishy body odor (TMA-related; less common at injectable doses)",
      "Inositol: rare GI upset",
      "Trimethylamine N-oxide (TMAO) elevation possible with high choline doses — relevance for cardiovascular risk in chronically elevated TMAO contexts is debated",
    ],
    stacksWith: ["b12-injection", "semaglutide", "tirzepatide", "phentermine"],
    warnings: [
      "Severe renal impairment — limited data, coordinate with prescriber",
      "Severe hepatic impairment — limited data; methionine has theoretical concerns in some hepatic conditions (homocystinuria, hepatic encephalopathy)",
      "Pregnancy and lactation — no specific safety data for compounded MIC injections; component nutrients individually safe in standard doses",
      "Active malignancy — methionine restriction is being studied as cancer-adjunct in some protocols; the case for methionine SUPPLEMENTATION in active cancer is unclear",
      "Honest framing: this is mid-tier evidence at best — most users would get equivalent or better results from oral choline supplementation (especially CDP-choline or alpha-GPC) at substantially lower cost",
    ],
    sourcingNotes:
      "Prescription required. Compounded by 503A pharmacies — dispensed via TRT clinics, weight-management clinics, IV bars with compounding partnerships, men's-health clinics. Formulation varies by pharmacy and prescription; ratios are tunable by prescribing clinician. Cost: $30–80 per injection at clinic, or $100–200 for vial supply with self-administration.",
    notes:
      "## Honest Use-Case Framing\nMIC injection is most defensible for: (1) users with documented choline deficiency or markedly low choline dietary intake (vegan, vegetarian, low-egg patterns); (2) users in clinic weight-management programs where the injection serves as an accountability anchor (clinic visits drive lifestyle adherence more than the injection drives metabolism); (3) users for whom the clinical-attention component is part of the value (coaching, dietary support, body composition tracking).\n\nFor users with adequate dietary choline, no clinical contraindications, and budget sensitivity: oral CDP-choline or alpha-GPC at $20–40/month delivers most of the choline benefit at substantially lower cost than $300–800/month MIC injection courses.\n\n## Beginner Protocol\n1mL IM weekly × 4 weeks alongside structured dietary and exercise intervention. Track: body weight, body composition (DEXA or BIA), subjective energy, sleep. If clear benefit beyond what the dietary/exercise intervention would predict, continue. If no clear differential benefit, the cost-benefit doesn't favor continuation.\n\n## Advanced Protocol\nFor users in comprehensive weight-management protocols, MIC is typically a small component alongside: GLP-1 agonist therapy (semaglutide, tirzepatide — these are the actual weight-loss drivers in modern protocols), structured caloric deficit, resistance training, sleep optimization. Phentermine added for users with appropriate cardiovascular profile and need for additional appetite suppression. The MIC injection in this stack is an adjunct, not a primary driver.\n\n## Reconstitution + Administration\nPre-mixed. 25-gauge needle, IM into deltoid or vastus lateralis. Aspirate before injection. Site rotation.\n\n## Synergies\n**B12 injection:** common pairing — Lipo-C (which is essentially MIC + B12) is the more popular variant. **GLP-1 agonists:** the actual weight-loss drivers in modern protocols. **Phentermine:** appetite suppression layer. The MIC component itself is supporting cast in any serious weight-management protocol.\n\n## Evidence Quality\nWeak. The component nutrients are biochemically real with established roles in hepatic lipid metabolism, methylation, and cell signaling. The injectable route adds little vs. oral for any component. Weight-loss specific evidence is essentially nonexistent in placebo-controlled trials. Clinic-attendance effects (the accountability and lifestyle support that come with weekly clinic visits) are real and valuable but aren't pharmacology.\n\n## Research vs Anecdote\nResearch: thin. Component nutrients are well-characterized but the combination as a weight-loss intervention lacks RCT evidence. Anecdote: positive subjective reports are common in clinic-treated populations — overwhelmingly driven by the lifestyle-intervention bundle that surrounds the injection rather than the injection itself. Honest assessment: this is a clinic-revenue product whose value is largely in the clinic-attendance ecosystem (accountability, coaching, structured care) rather than in the pharmacology. Users who can afford it and find the clinical-attention component motivating may benefit; users on tight budgets are better served by oral choline supplementation (CDP-choline or alpha-GPC) plus structured lifestyle interventions plus GLP-1 agonist therapy if weight loss is the goal.",
    tags: ["MIC", "methionine", "inositol", "choline", "lipotropic", "weight management", "compounded", "clinic injection", "IM injection"],
    tier: "entry",
  },

  {
    id: "b12-injection",
    name: "B12 Injection",
    aliases: ["Cyanocobalamin injection", "Methylcobalamin injection", "Hydroxocobalamin injection", "B-12 shot", "Vitamin B12 IM"],
    category: ["Longevity", "Immune"],
    categories: ["Longevity", "Immune"],
    route: ["IM injection", "subQ injection"],
    mechanism:
      "Vitamin B12 (cobalamin) is an essential cofactor for two human enzymes: methionine synthase (converts homocysteine to methionine, the precursor of S-adenosylmethionine — the universal methyl donor) and L-methylmalonyl-CoA mutase (converts methylmalonyl-CoA to succinyl-CoA in the catabolism of odd-chain fatty acids and branched-chain amino acids). B12 deficiency produces megaloblastic anemia (via impaired DNA synthesis from disrupted folate metabolism) plus progressive neurological damage (via impaired myelin synthesis) — the latter often irreversible if deficiency is prolonged. Three injectable forms: cyanocobalamin (most common, cheapest, requires intracellular conversion to active forms — sufficient for most users), methylcobalamin (active methyl-donor form, preferred for users with MTHFR polymorphisms or wanting methyl-pathway support), hydroxocobalamin (longest-acting depot form due to slow tissue release, preferred for users wanting less-frequent injections; also used in cyanide poisoning treatment). IM/SubQ administration achieves ~100% bioavailability. Oral B12 absorption requires intrinsic factor (gastric parietal cell glycoprotein), which is absent or impaired in: pernicious anemia (autoimmune destruction of parietal cells), atrophic gastritis (common in elderly), post-bariatric surgery (gastric bypass), severe chronic PPI/H2-blocker use, and certain genetic conditions. For these populations, injectable B12 is essential — oral absorption is insufficient. For users without malabsorption, oral methylcobalamin at high doses (1000+ mcg) is an effective alternative. Cross-reference: metformin causes B12 depletion via still-incompletely-understood mechanisms (likely multifactorial — calcium-dependent ileal absorption disruption, gut microbiome modulation), and chronic metformin users should monitor B12 every 1–2 years and supplement if deficient.",
    halfLife: "Cyanocobalamin: hours to days. Hydroxocobalamin: weeks (depot form). Methylcobalamin: intermediate.",
    reconstitution: { solvent: "Pre-formulated; multi-dose vials available", typicalVialMg: null, typicalVolumeMl: 30 },
    dosingRange: { low: "1000mcg IM monthly (maintenance after deficiency correction)", medium: "1000mcg IM weekly (loading phase or wellness use)", high: "1000mcg IM daily for 1 week, then weekly for 1 month, then monthly (acute deficiency or pernicious anemia loading)", frequency: "Weekly typical for wellness; daily-then-tapered for active deficiency loading; monthly maintenance" },
    typicalDose: "Wellness / mild deficiency: 1000mcg IM weekly. Active deficiency: 1000mcg IM daily × 7 days, then weekly × 4 weeks, then monthly maintenance. Pernicious anemia: lifetime monthly injections (or bi-weekly self-administered subQ).",
    startDose: "1000mcg IM × 1 to assess tolerance",
    titrationNote: "B12 is water-soluble with no significant toxicity ceiling — titration is mostly about deficiency loading vs maintenance phase. Once deficiency is corrected, monthly maintenance is sufficient for most users.",
    cycle: "Continuous lifetime in pernicious anemia and other malabsorption contexts. Wellness use is variable — weekly or monthly maintenance typical.",
    storage: "Refrigerated 2–8°C. Light-protected (cobalamin photolability, particularly cyanocobalamin).",
    benefits: [
      "Documented effective in B12 deficiency — corrects megaloblastic anemia, halts neurological progression (though established neurological damage may not fully reverse)",
      "Essential lifetime therapy for pernicious anemia, post-gastrectomy, post-bariatric surgery, and other malabsorption contexts",
      "Indicated for chronic metformin users with documented B12 deficiency",
      "Methylcobalamin form supports MTHFR polymorphism users (estimated ~30–40% of population carries at least one variant) bypassing the impaired folate methylation step",
      "Hydroxocobalamin's long depot duration allows monthly or even less-frequent dosing — convenient for stable maintenance",
      "Subjective energy / mental clarity boost reported by users with deficiency-state symptoms",
      "Generally well-tolerated, very low adverse effect profile",
      "Inexpensive — cyanocobalamin generic costs <$20/vial (10mL multi-dose)",
    ],
    sideEffects: [
      "Injection site soreness or mild local reaction",
      "Pink-red urine briefly post-injection (cobalamin chromophore — harmless, expected, transient)",
      "Hypokalemia at very high doses during active treatment of severe pernicious anemia (rare, clinical context)",
      "Rare allergic reaction — typically to cobalt component or preservative in multi-dose vials",
      "Acne flare in some users (mechanism unclear, likely related to cobalt or excipients)",
    ],
    stacksWith: ["mic-injection", "metformin", "nad", "vitamin-d3"],
    warnings: [
      "Untreated megaloblastic anemia of unknown cause — important: if cause is B12 deficiency, treating with FOLATE alone can mask continuing neurological damage from B12 deficiency. Always treat suspected B12 deficiency with B12, not folate alone, until diagnosis is confirmed.",
      "Pre-existing peripheral neuropathy of unclear cause — workup B12 status before chronic supplementation; rule out other neuropathy etiologies",
      "Cobalt allergy — rare but real",
      "Concurrent levodopa therapy — high-dose pyridoxine (B6) reduces levodopa efficacy; B12 alone less concerning but combination B-complex products may matter",
      "Pregnancy — generally safe, often recommended in pregnancy for users with low intake or absorption concerns",
      "Lactation — present in breast milk; appropriate maternal supplementation is beneficial",
      "Chronic PPI / H2-blocker users — likely to benefit; flag B12 status to prescriber",
      "Post-bariatric surgery users — lifetime supplementation typically required",
      "Pernicious anemia: lifetime therapy required; do not discontinue once initiated without endocrine/hematology coordination",
    ],
    sourcingNotes:
      "Prescription required for injection. Cyanocobalamin generic widely available, very inexpensive (<$20 per 10mL multi-dose vial = ~30 doses). Methylcobalamin and hydroxocobalamin available compounded or branded, slightly more expensive. Available via primary care, endocrinology, hematology, wellness clinics, IV bars, telehealth platforms. Self-administration with subQ technique is reasonable for users on chronic therapy after appropriate education.",
    notes:
      "## When B12 Injection Is Genuinely Indicated\n**Absolute indications:** pernicious anemia (autoimmune anti-parietal cell antibodies), post-total-gastrectomy, post-Roux-en-Y gastric bypass, ileal resection or severe Crohn's affecting terminal ileum, congenital intrinsic factor deficiency. These require lifetime B12 supplementation; oral absorption is insufficient.\n\n**Strong indications:** documented B12 deficiency (low B12 + elevated MMA + elevated homocysteine) of any cause; chronic metformin users with documented depletion; chronic PPI / H2-blocker users with documented depletion; chronic alcohol use disorder with documented depletion; vegan users with documented depletion despite oral supplementation.\n\n**Wellness / energy-boost use without documented deficiency:** weak indication. Equivalent benefit available from oral methylcobalamin at $5–15/month vs $50–100/month for clinic injections. The wellness-injection enthusiasm is overwhelmingly driven by clinic-attendance effects + placebo + the rare user who turns out to actually have undiagnosed deficiency.\n\n## Beginner Protocol\nStart with workup: serum B12, methylmalonic acid (MMA — more sensitive than serum B12 for early deficiency), homocysteine, CBC. If deficient, loading protocol: 1000mcg IM daily × 7 days, then weekly × 4 weeks, then monthly. If not deficient and using for wellness: oral methylcobalamin 1000mcg daily is the cost-effective path; injection unnecessary.\n\n## Advanced Protocol\nFor users with MTHFR polymorphism + elevated homocysteine: methylcobalamin injection 1000mcg weekly + methylated folate 1mg daily + TMG (trimethylglycine) 2g daily + B6 (pyridoxal-5-phosphate active form) 50mg daily. This methylation-stack approach addresses homocysteine via multiple complementary pathways. For users on chronic metformin: B12 monitoring every 1–2 years; when deficient, methylcobalamin or cyanocobalamin injection 1000mcg monthly maintains levels. For users in comprehensive longevity / wellness protocols: B12 alongside NAD precursors (NMN, NR, NAD injection) for combined methylation + redox support; vitamin D3 5000 IU + K2 MK-7 100mcg as foundational adjuncts.\n\n## Self-Administration\nSubQ injection of B12 is reasonable for chronic-therapy users after education. 27–29 gauge needle, abdominal or thigh subQ, weekly or monthly. Multi-dose vials with proper storage (refrigerated, light-protected) provide cost-effective long-term supply. Pernicious anemia patients commonly self-administer for lifetime.\n\n## Reconstitution + Administration\nPre-formulated. IM (deltoid most common) or subQ. Light-protected throughout dose preparation (cobalamin is photolabile, especially cyanocobalamin).\n\n## Synergies\n**MIC injection / Lipo-C:** common pairing in clinic protocols (Lipo-C = MIC + B12). **Metformin:** pair with B12 monitoring to address depletion. **NAD precursors:** methylation pathway cross-talk. **Vitamin D3 + K2:** foundational vitamin support.\n\n## Evidence Quality\nStrong for documented deficiency states (megaloblastic anemia, pernicious anemia, neurological deficiency). Strong for malabsorption contexts (post-gastrectomy, post-bariatric, ileal disease). Strong for metformin-induced depletion. Weak for wellness use without documented deficiency.\n\n## Research vs Anecdote\nResearch: well-established for treating deficiency states; well-characterized pharmacology; strong evidence base for malabsorption-context lifetime supplementation. Anecdote: subjective energy / mental clarity benefit is widely reported in wellness-injection users — overwhelmingly driven by either undiagnosed mild deficiency, placebo, or clinical-attention effect. Decision frame: get serum B12 + MMA + homocysteine + CBC FIRST. Treat documented deficiency aggressively. For wellness-only use without deficiency, oral methylcobalamin 1000mcg daily is the cost-effective path — the injectable advantage is reserved for confirmed malabsorption contexts.",
    tags: ["B12", "vitamin B12", "cyanocobalamin", "methylcobalamin", "hydroxocobalamin", "pernicious anemia", "methylation", "MTHFR", "metformin B12 depletion", "injection"],
    tier: "entry",
  },
];