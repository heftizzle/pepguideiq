/** Batch 11 — Clinic-grade prescription items.
 *
 *  Identified from GameDay clinic audit (Apr 2026) as common items in
 *  TRT/wellness/men's-health clinic catalogs that pepguideIQ users
 *  encounter and ask about — but were missing from the catalog.
 *
 *  All FDA-approved or compounded-by-pharmacy prescriptions. Sourcing
 *  notes reflect prescription-only nature (clinic, telehealth, or
 *  compounding pharmacy via licensed prescriber).
 *
 *  Naming policy: generic / INN names primary, FDA-approved brand names
 *  as aliases (these are how users actually search — "Jatenzo" not
 *  "testosterone undecanoate oral"). Brand names of FDA-approved drugs
 *  are part of the regulatory landscape, distinct from peptide-vendor
 *  product brands which we exclude.
 *
 *  Schema matches BATCH7/8/9/10 — long-form mechanism + rich notes.
 *  Average ≥800w/entry, no padding on thinner indications.
 */
export const BATCH11 = [
  {
    id: "testosterone-pellets",
    name: "Testosterone Pellets",
    aliases: ["Testopel", "BioTE pellets", "Subcutaneous T pellets", "Pellet TRT", "T pellets"],
    category: ["Anabolics / HRT", "Testosterone Support"],
    categories: ["Anabolics / HRT", "Testosterone Support"],
    route: ["subcutaneous implantation"],
    mechanism:
      "Long-acting testosterone delivery via crystallized testosterone pellets implanted subcutaneously in office procedure — typically gluteal subcutaneous fat or hip, 5–10 minute outpatient insertion under local anesthesia. Each pellet contains 75mg crystallized testosterone in a fused matrix; dissolution-rate-limited release provides 3–6 month duration. Adult male dosing: 8–12 pellets per insertion (600–900mg total testosterone). Steady-state pharmacokinetics — eliminates the trough-peak pattern of weekly testosterone cypionate or enanthate injection. No first-pass hepatic metabolism (subcutaneous → systemic absorption). Levels typically settle into mid-physiological range (500–900 ng/dL total T) for most of the cycle, with a tapering dropoff in the final 4–6 weeks before reinsertion as pellets exhaust. Aromatization to estradiol and 5-alpha reduction to DHT proceed normally — no inherent advantage over injectable T in modulating these metabolites, though the steady-state delivery makes estradiol management more predictable for some users (no weekly aromatization spikes). The most-cited clinical advantage is adherence: insertion 2–4×/year vs. weekly self-injection.",
    halfLife: "Pellet duration: 3–6 months (variable by metabolic rate, body composition, individual absorption). Effective testosterone levels typically maintained ~3–4 months in average users.",
    reconstitution: { solvent: "N/A — pre-formed pellet, in-office insertion", typicalVialMg: 75, typicalVolumeMl: null },
    dosingRange: { low: "6 pellets (450mg) — small / older male", medium: "8–10 pellets (600–750mg) — typical adult male", high: "10–12 pellets (750–900mg) — larger male / higher T target", frequency: "Reinsertion every 3–6 months based on trough levels and symptoms" },
    typicalDose: "8–10 pellets per insertion (600–750mg testosterone), repeated every 4 months",
    startDose: "First-time pellet user: 8 pellets to assess pellet duration and trough levels before titrating",
    titrationNote: "Cannot titrate dose mid-cycle — once pellets are in, you wait. Adjust pellet COUNT at next insertion based on trough labs at 90 and 120 days.",
    cycle: "Continuous TRT (not cyclical). Reinsertion intervals individualized: 3–4 months for high-metabolism users, 4–6 months for steady absorbers.",
    storage: "N/A for end user — pellets supplied to clinician, stored per manufacturer guidance",
    benefits: [
      "Eliminates weekly self-injection burden — major adherence win",
      "Steady-state testosterone delivery: no weekly peaks/troughs of injectable T",
      "No first-pass hepatic metabolism (unlike older oral T)",
      "Estradiol tends to be more stable than with injectable T (no peak aromatization windows)",
      "Often well-tolerated by users with injection anxiety or limited home-injection capacity",
    ],
    sideEffects: [
      "Pellet extrusion (5–10% of insertions) — pellet works its way back out through insertion site, partial dose loss",
      "Insertion site infection (uncommon but real — sterile technique critical)",
      "Bruising / hematoma at insertion site (common, transient)",
      "End-of-cycle dropoff symptoms (low energy, libido drop) in last 4–6 weeks of cycle as pellets exhaust",
      "Same systemic TRT effects as any T modality: erythrocytosis, estradiol shifts, fertility suppression, prostate concerns in older men",
      "Cannot rapidly discontinue if a problem develops — pellets can be surgically extracted but dose is committed once placed",
    ],
    stacksWith: ["hcg", "anastrozole", "tongkat-ali"],
    warnings: [
      "Prostate cancer (active or untreated) — absolute contraindication",
      "Breast cancer (male) — absolute contraindication",
      "Severe untreated sleep apnea — relative contraindication, optimize first",
      "Pre-existing erythrocytosis (Hct >54%) — manage before pellets, monitor closely on therapy",
      "Severe BPH with urinary obstruction — caution",
      "Active fertility goals — pellets suppress spermatogenesis like any TRT; HCG co-therapy must be coordinated and adjusted carefully given inability to dose-modulate the T side mid-cycle",
      "Anticoagulation — manage bleeding risk for the insertion procedure",
      "Pellet shortage / discontinued products — Testopel manufacturer history has had supply disruption; clinic-compounded pellets exist but quality varies",
    ],
    sourcingNotes:
      "Prescription only via licensed clinician (urologist, endocrinologist, men's-health clinic, family physician). Insertion procedure billed separately from pellets themselves. Compounded pellets exist outside the FDA-approved Testopel — quality and dose accuracy vary; users should ask the clinic which manufacturer/compounder they're using and whether the product is FDA-approved or 503A/503B compounded.",
    notes:
      "## Beginner Protocol\nFirst-time pellet user: 8 pellets at first insertion. Get trough labs at 90 days (day before next anticipated insertion) and 120 days. If trough total T is <450 ng/dL at 90 days with symptoms returning, reduce insertion interval to 3 months. If trough is >700 ng/dL at 120 days with no symptom return, extend interval to 5 months. Pellet count at second insertion adjusts based on trough trajectory: if too low at 90d, go to 10 pellets; if comfortable at 120d, stay at 8.\n\n## Advanced Protocol\nFor users transitioning from injectable T cypionate to pellets: schedule final injection ~10 days before pellet insertion, then proceed with pellets. Bracket with full hormone panel at 30, 60, 90 days post-insertion. HCG co-therapy (250–500 IU subQ 2–3×/week) maintains testicular function and fertility — important to start at insertion, not catch-up later. Anastrozole on standby (0.25–0.5mg twice weekly) for users prone to estradiol elevation, but pellets often need less AI than injectable T.\n\n## Reconstitution + Administration\nN/A for end user. In-office procedure: lidocaine local, small incision in gluteal/hip subcutaneous fat, pellet trocar inserts pellets in fan pattern, single suture or steri-strip closure. 5–10 minutes total. Avoid heavy lower-body exercise for 4–5 days post-insertion to prevent extrusion.\n\n## Synergies\nHCG: maintains testicular volume and spermatogenesis through TRT. Anastrozole: estradiol management (used judiciously). Tongkat Ali: free-T fraction support via SHBG modulation. Standard TRT-adjuncts apply.\n\n## Evidence Quality\nFDA-approved (Testopel since 1972), substantial real-world evidence base. PK / PD characteristics well-documented. Major comparative studies vs. injectable T show non-inferior efficacy with better adherence and slightly improved patient-reported QOL in some cohorts. Trade-offs (cost, procedure, inability to titrate) are real and well-characterized.\n\n## Research vs Anecdote\nResearch: well-established TRT modality with regulatory approval. Anecdote: split community — adherence-prioritizing users prefer pellets, dose-flexibility-prioritizing users prefer injection. Neither is wrong; it's a workflow preference. Cost is the third axis: pellets often run $500–1500/insertion (insurance variable), vs ~$30–80/month for self-injected cypionate.",
    tags: ["TRT", "testosterone", "pellets", "implant", "subcutaneous", "long-acting", "prescription", "men's health"],
  },

  {
    id: "testosterone-undecanoate-oral",
    name: "Testosterone Undecanoate (Oral)",
    aliases: ["Jatenzo", "Tlando", "Kyzatrex", "Oral TU", "Oral T", "TU oral"],
    category: ["Anabolics / HRT", "Testosterone Support"],
    categories: ["Anabolics / HRT", "Testosterone Support"],
    route: ["oral"],
    mechanism:
      "Lipophilic ester (testosterone esterified with undecanoic acid) absorbed via the lymphatic chylomicron pathway when taken with a fatty meal. This route bypasses portal-liver first-pass metabolism — distinguishing oral TU from older oral testosterone formulations (methyltestosterone, fluoxymesterone) that caused severe hepatotoxicity via 17-alpha alkylation. Oral TU is non-alkylated and clinically demonstrated to spare the liver. Once absorbed into chylomicrons, testosterone undecanoate is hydrolyzed by tissue esterases releasing free testosterone systemically. Approved for US TRT use 2019 (Jatenzo), with Tlando and Kyzatrex following. Pharmacokinetically distinct from injectable TU (Aveed): different ester behavior, different administration route, different pharmacology — same molecule, different drug clinically. Twice-daily dosing required. Absorption is highly food-dependent: requires meal containing ≥30g fat for adequate uptake; without fat, absorption drops dramatically. Inter-individual absorption variability is substantial — labs at 4–6 weeks essential to confirm therapeutic levels.",
    halfLife: "Plasma half-life ~3–6 hours after absorption; twice-daily dosing required to maintain therapeutic levels.",
    reconstitution: { solvent: "N/A — oral capsule", typicalVialMg: 158, typicalVolumeMl: null },
    dosingRange: { low: "158mg twice daily (starting dose)", medium: "237mg twice daily", high: "396mg twice daily (max per Jatenzo label)", frequency: "Twice daily with meals containing ≥30g fat" },
    typicalDose: "237mg twice daily with meals (Jatenzo) — titrated based on labs",
    startDose: "158mg twice daily with food × 30 days, then trough lab and titrate",
    titrationNote: "Get total T 6 hours after morning dose at 30 days. Target: 400–700 ng/dL. Increase by ~80mg/dose if low, decrease if >800 ng/dL or symptomatic. Re-check labs 4 weeks after each adjustment.",
    cycle: "Continuous TRT (not cyclical)",
    storage: "Room temperature, original packaging",
    benefits: [
      "No injection — appeals to needle-averse users or those traveling frequently",
      "No pellet procedure",
      "Easy to titrate or discontinue (vs pellets)",
      "Modern oral T does NOT carry the hepatotoxicity of older 17-alpha-alkylated oral T (methyltestosterone) — this is a meaningful distinction",
      "Useful for users with injection-site issues, severe needle phobia, or contraindications to other modalities",
    ],
    sideEffects: [
      "Blood pressure elevation — boxed warning per FDA. Average ~3–5 mmHg systolic increase observed in trials. Monitor BP closely.",
      "Variable absorption — some users get inconsistent levels day-to-day",
      "Must be taken with fatty meal — operational adherence challenge for low-fat-diet users",
      "Twice-daily dosing — adherence harder than weekly injection or quarterly pellets",
      "Standard TRT side effects: erythrocytosis, estradiol shifts, fertility suppression, acne, mood",
      "Cost — substantially more expensive than generic injectable T cypionate ($300–600/month vs $30–80/month for cypionate)",
    ],
    stacksWith: ["hcg", "anastrozole"],
    warnings: [
      "Existing hypertension — relative contraindication; control BP first, monitor on therapy",
      "Cardiovascular disease — recent MI, stroke, unstable angina — caution warranted given BP signal",
      "Prostate cancer — absolute contraindication",
      "Breast cancer (male) — absolute contraindication",
      "Pre-existing erythrocytosis — manage before, monitor on therapy",
      "Severe sleep apnea — optimize first",
      "Hepatic impairment — limited data, coordinate with prescriber",
      "Concurrent strong CYP3A4 inducers/inhibitors — potential interactions",
      "Carries the same fertility suppression as any TRT — coordinate with HCG if fertility goals",
    ],
    sourcingNotes:
      "Prescription only. Available via TRT clinics, men's health telehealth platforms, and primary care prescribers familiar with the product. Insurance coverage variable — many plans place oral TU on higher tier than injectable T cypionate due to cost. 30-day supply via specialty pharmacy.",
    notes:
      "## Beginner Protocol\nFirst-time oral TU user: start at 158mg twice daily with breakfast and dinner (each meal must contain ≥30g fat — eggs + avocado, salmon + olive oil, etc.). Bracket with baseline labs (total T, free T, SHBG, estradiol, CBC, lipid panel, PSA if indicated, BP). Take BP daily for first 30 days. At day 30, get total T 6 hours after morning dose, plus a trough level just before morning dose. Titrate based on response.\n\n## Advanced Protocol\nFor users switching from injectable T cypionate to oral TU: schedule last cypionate injection, wait 7–10 days, then start oral TU at 237mg twice daily (rough conversion). Re-baseline labs at 30 days. Some users find oral TU produces less stable mood and energy than long-ester injectable T — the trade-off is administration convenience vs. PK stability. HCG co-therapy via subQ injection (250–500 IU 2–3×/week) for fertility maintenance proceeds independently of T modality.\n\n## Reconstitution + Administration\nN/A — oral capsule. Critical detail: meal must contain ≥30g fat. Low-fat or fasting administration significantly reduces absorption. Do not crush or open capsules.\n\n## Synergies\nHCG: testicular volume + spermatogenesis maintenance. Anastrozole: estradiol management if needed. Standard TRT-adjuncts apply.\n\n## Evidence Quality\nFDA-approved 2019 (Jatenzo), 2022 (Tlando), 2022 (Kyzatrex). Pivotal trials demonstrate restoration of testosterone levels to mid-physiological range with twice-daily dosing. BP elevation signal is real — observed across all three approved products. Real-world evidence is accumulating but TRT users still skew toward injectable cypionate due to cost.\n\n## Research vs Anecdote\nResearch: solid PK/PD data, BP signal robustly documented, hepatic safety confirmed (unlike older oral T). Anecdote: variable absorption is the most common user complaint — some users get crystal-clear levels, others get erratic results despite identical dosing and meal protocol. Decision frame: if injectable T works for you, don't switch — the value proposition for oral TU is mainly for users who can't or won't inject. Cost is real (often 5–10× cypionate).",
    tags: ["TRT", "testosterone", "oral", "Jatenzo", "Tlando", "prescription", "men's health"],
  },

  {
    id: "trimix",
    name: "Trimix",
    aliases: ["Tri-Mix", "Trimix injection", "Compounded ED injection", "Intracavernosal Trimix", "PGE1/Phentolamine/Papaverine"],
    category: ["Sexual Health", "ED Treatment", "Compounded"],
    categories: ["Sexual Health", "ED Treatment", "Compounded"],
    route: ["intracavernosal injection"],
    mechanism:
      "Compounded prescription containing three vasoactive agents combined for synergistic intracavernosal vasodilation: alprostadil (prostaglandin E1, smooth muscle relaxant via cAMP elevation), phentolamine (non-selective alpha-adrenergic blocker, removes sympathetic vasoconstrictive tone), papaverine (non-selective phosphodiesterase inhibitor + direct smooth muscle relaxant). The combination produces erection independent of psychogenic input or PDE5-pathway integrity — directly causing corpus cavernosum smooth muscle relaxation, arterial inflow, and venous occlusion. Effective in many men where oral PDE5 inhibitors (sildenafil, tadalafil, vardenafil) fail — including users with severe diabetic ED, post-radical-prostatectomy, post-pelvic-radiation, severe vasculogenic ED, or PDE5i intolerance. Compounded by 503A pharmacies — formulations vary by pharmacy; common ratios are alprostadil 10mcg/mL + phentolamine 1mg/mL + papaverine 30mg/mL, but ratios are tunable based on patient response. Bimix (alprostadil + phentolamine) and quadmix (Trimix + atropine) variants exist for users with specific response patterns.",
    halfLife: "Onset 5–15 minutes after injection. Erection duration 30–90 minutes typically; >2 hours warrants concern, >4 hours is priapism (surgical emergency).",
    reconstitution: { solvent: "Pre-mixed by compounding pharmacy", typicalVialMg: null, typicalVolumeMl: 5 },
    dosingRange: { low: "0.05–0.1mL — starting dose, in-clinic titration", medium: "0.1–0.3mL — typical effective dose for most users", high: "0.3–0.5mL — high-dose, for severe ED with documented in-clinic safety", frequency: "Use as needed for sexual activity, no more than 3× per week to avoid cavernosal fibrosis" },
    typicalDose: "0.1–0.3mL intracavernosal injection 5–15 minutes before sexual activity (highly individual)",
    startDose: "Initial dose titration MUST be done in clinic. Start 0.05–0.1mL, observe for 30–60 minutes. Titrate up over multiple visits to find effective dose without excessive duration.",
    titrationNote: "Self-titration at home is dangerous — escalating dose without medical supervision risks priapism. Dose changes should go through prescriber.",
    cycle: "PRN (as needed) for sexual activity. Hard cap at 3 uses per week to prevent corporal fibrosis.",
    storage: "Refrigerated 2–8°C. Stability ~30–60 days post-compounding (varies by pharmacy formulation). Some formulations frozen for longer storage.",
    benefits: [
      "Effective in users who fail oral PDE5 inhibitors — diabetic ED, post-prostatectomy, severe vasculogenic ED",
      "Onset 5–15 minutes — faster than oral PDE5i in some users",
      "Direct mechanism (smooth muscle relaxation) bypasses neuro-vascular dysfunction",
      "Predictable dose-response once titrated in clinic",
      "Combined with vacuum erection device or external compression for users with venous leak",
    ],
    sideEffects: [
      "Priapism (erection >4 hours) — surgical emergency; risk increases with dose, decreases with proper titration",
      "Penile pain at injection site (~10–30% of users), often improves with technique adjustment",
      "Corporal fibrosis — long-term complication of frequent injection (>3×/week), can cause Peyronie-like curvature",
      "Injection bruising / hematoma",
      "Rare systemic effects (hypotension, dizziness) if injected intravascularly",
      "Infection risk at injection site — sterile technique non-negotiable",
    ],
    stacksWith: ["sildenafil", "tadalafil", "pt-141"],
    warnings: [
      "Sickle cell disease / sickle cell trait — high priapism risk, relative contraindication",
      "Multiple myeloma, leukemia — priapism risk",
      "Severe Peyronie's disease with significant penile deformity — relative contraindication",
      "Penile implant — contraindicated",
      "Active anticoagulation — bleeding risk warrants prescriber discussion",
      "PRIAPISM PROTOCOL: any erection >2 hours, take pseudoephedrine 60–120mg orally; >3 hours, ER visit; >4 hours, ER non-negotiable — surgical decompression required to prevent permanent ED",
      "Combining with oral PDE5i or PT-141 should be coordinated with prescriber — additive effects increase priapism risk",
    ],
    sourcingNotes:
      "Prescription only. Compounded by 503A pharmacies — dispensed via men's-health clinics, urology practices, or telehealth platforms with compounding partnerships. Formulation ratios vary by pharmacy and prescription. NOT to be sourced from research peptide channels — quality control and formulation accuracy are critical given the priapism risk.",
    notes:
      "## Beginner Protocol\nFirst-time use: in-clinic titration is non-negotiable. Start at 0.05–0.1mL with the prescriber observing. Document response (onset time, rigidity, duration). If no erection at 30 minutes, increase dose at next clinic visit. If 2+ hour erection, decrease dose. Do not self-titrate at home — the priapism risk is real and the consequences (permanent ED, surgical intervention) are severe. Once effective dose established, transition to home use with explicit dosing instructions and priapism protocol.\n\n## Advanced Protocol\nFor users with combined ED + low libido, PT-141 (Bremelanotide) addresses central libido while Trimix addresses peripheral erectile mechanics — but coordinated use must go through prescriber. For users on PDE5i with insufficient response, low-dose Trimix (0.05–0.1mL) added to a daily tadalafil regimen often produces synergistic improvement at lower Trimix dose than monotherapy. Vacuum erection device (VED) pre-conditioning of cavernosal tissue (post-prostatectomy patients especially) improves Trimix response over months. Quadmix (Trimix + atropine 0.2mg/mL) for users with non-response to standard Trimix — atropine adds parasympathetic enhancement.\n\n## Reconstitution + Administration\nPre-mixed by pharmacy. 30-gauge insulin needle, lateral aspect of corpora cavernosa (NOT dorsal — avoids dorsal nerve and vein), shallow angle, slow injection. Apply firm pressure 2–3 minutes after injection to minimize bruising. Detailed technique training with prescriber essential.\n\n## Synergies\nLow-dose tadalafil daily as background PDE5i support reduces required Trimix dose for many users. PT-141 for central libido component. Vacuum erection device for venous-leak augmentation.\n\n## Evidence Quality\nLong clinical track record — Trimix has been used for ED since the late 1980s. Substantial real-world evidence in urology and men's-health practice. Compounded status (no FDA approval for the combination, though individual components have approvals) means the evidence base is practice-experience rather than RCT-driven.\n\n## Research vs Anecdote\nResearch: each component is well-characterized; the combination is empirically supported by decades of urology practice. Anecdote: highly effective for users who fail PDE5i — many users describe Trimix as the modality that 'gave them their sex life back' after surgery or diabetic ED progression. The injection barrier is psychologically meaningful but most users adjust. The hard cap on frequency (3×/week) and the priapism risk profile make this a serious medication, not a recreational accessory.",
    tags: ["ED", "erectile dysfunction", "intracavernosal", "compounded", "alprostadil", "phentolamine", "papaverine", "men's health", "prescription"],
  },

  {
    id: "phentermine",
    name: "Phentermine",
    aliases: ["Adipex-P", "Lomaira", "Phentermine HCl", "Phentermine resin"],
    category: ["GLP / Metabolic", "Nootropic"],
    categories: ["GLP / Metabolic", "Nootropic"],
    route: ["oral"],
    mechanism:
      "Sympathomimetic amine, structural amphetamine derivative (phenethylamine class). Primary mechanism: stimulates norepinephrine and dopamine release in hypothalamic appetite-control centers, suppressing hunger signaling. Secondary CNS-stimulant effects (alertness, increased energy, mild euphoria). Schedule IV controlled substance — abuse liability lower than amphetamines but real. Approved for short-term obesity treatment (12 weeks per FDA label) as adjunct to diet/exercise. In real-world practice, often used longer-term off-label, particularly when combined with topiramate (FDA-approved combination = Qsymia, approved for chronic weight management). Mechanistically distinct from GLP-1 agonists (semaglutide, tirzepatide, retatrutide) which work via gut-brain axis and gastric emptying — phentermine acts on CNS appetite circuits directly. Often used as bridge therapy or adjunct in users for whom GLP-1 agonists alone are insufficient or unavailable. Average weight loss: ~5–10% over 12 weeks of monotherapy, ~10–15% with topiramate combination.",
    halfLife: "Plasma half-life ~16–24 hours. Effects (appetite suppression, alertness) typically experienced 8–14 hours after AM dose.",
    reconstitution: { solvent: "N/A — oral tablet/capsule", typicalVialMg: 37.5, typicalVolumeMl: null },
    dosingRange: { low: "8mg three times daily (Lomaira) — for users with stimulant sensitivity", medium: "15–30mg AM (Adipex-P)", high: "37.5mg AM (max approved)", frequency: "Once daily AM (or 8mg TID for Lomaira)" },
    typicalDose: "15–37.5mg orally once daily, 30 minutes before breakfast",
    startDose: "15mg AM × 7 days to assess CV response (HR, BP), then titrate up if appetite suppression inadequate",
    titrationNote: "Monitor BP and HR daily for first 2 weeks. If resting HR consistently >100 or systolic BP up >15 mmHg from baseline, decrease dose or discontinue.",
    cycle: "FDA label: short-term, ≤12 weeks. Off-label long-term use common in obesity medicine practice with regular CV monitoring and assessment of continued benefit. 'Drug holidays' (1–2 weeks off every 3 months) sometimes used to assess ongoing need.",
    storage: "Room temperature, secured (controlled substance)",
    benefits: [
      "Effective appetite suppression — particularly for grazing/snacking patterns",
      "Mechanistically complementary to GLP-1 agonists (CNS-acting vs gut-brain axis)",
      "Useful adjunct when GLP-1 agonists alone produce insufficient appetite reduction",
      "Synergy with topiramate (FDA-approved combo Qsymia)",
      "Energy / alertness boost (for some users — others find it just anxiety)",
      "Inexpensive and widely available compared to GLP-1 agonists",
    ],
    sideEffects: [
      "Tachycardia (resting HR elevation 5–15 bpm typical)",
      "Hypertension (modest BP elevation in most users; significant elevation in some)",
      "Insomnia — dose timing critical (no later than late morning to avoid sleep disruption)",
      "Dry mouth, constipation (sympathomimetic effects)",
      "Anxiety, jitteriness — particularly in stimulant-sensitive users",
      "Tolerance to appetite-suppressant effect develops in 8–12 weeks for many users — drug holiday or dose adjustment may help",
      "Mood elevation followed by mild withdrawal upon discontinuation in long-term users",
      "Mild rebound appetite increase upon discontinuation",
    ],
    stacksWith: ["semaglutide", "tirzepatide", "retatrutide", "metformin", "topiramate"],
    warnings: [
      "Coronary artery disease, recent MI — contraindicated",
      "Uncontrolled hypertension — contraindicated; BP must be controlled before initiation",
      "Hyperthyroidism — contraindicated",
      "Glaucoma (narrow-angle) — contraindicated",
      "MAOI use within 14 days — contraindicated (hypertensive crisis risk)",
      "History of substance abuse — relative contraindication, abuse liability is real (though lower than amphetamines)",
      "Pregnancy — Category X, contraindicated",
      "Lactation — not for use",
      "Serotonergic medications (SSRI, SNRI, MAOI, lithium) — caution, theoretical serotonin syndrome risk",
      "Pulmonary hypertension history (fen-phen association) — phentermine alone hasn't shown the fenfluramine-driven valve risk but caution preserved",
      "Pediatric use (under 17) — not approved",
    ],
    sourcingNotes:
      "Prescription only — Schedule IV controlled substance. Available from primary care, obesity medicine specialists, telehealth weight-loss platforms, and bariatric clinics. Lomaira (lower-dose 8mg three-times-daily formulation) gives more dose flexibility for stimulant-sensitive users. Generic phentermine HCl 37.5mg widely available and inexpensive (~$30/month without insurance).",
    notes:
      "## Beginner Protocol\nFirst-time user: 15mg AM (split a 30mg tablet, or use 15mg formulation). Take 30 minutes before breakfast — appetite suppression most useful for the rest of the day. Monitor BP and HR for first 2 weeks (home cuff if possible). Bracket with: BP, HR, basic metabolic panel, TSH (rule out hyperthyroidism), fasting glucose, lipid panel. If well-tolerated at 15mg with adequate appetite response, can stay there. If insufficient, titrate to 30–37.5mg AM at week 2.\n\n## Advanced Protocol\nFor users on GLP-1 agonist (semaglutide, tirzepatide, retatrutide) with weight-loss plateau or breakthrough hunger, phentermine 15–37.5mg AM is a common add-on. Mechanistically complementary — GLP-1 acts via gut-brain axis and gastric emptying, phentermine via CNS appetite centers. Combination requires close BP/HR monitoring. Topiramate add-on (25–100mg daily, titrated up) for additional appetite reduction and cravings management — Qsymia is the FDA-approved combination.\n\n## Reconstitution + Administration\nN/A — oral tablet or capsule. AM dose timing critical: take with first morning beverage, before breakfast. Avoid PM dosing (insomnia). Lomaira's TID schedule allows more even appetite suppression but requires three doses.\n\n## Synergies\nGLP-1 agonists (semaglutide, tirzepatide, retatrutide): mechanistically complementary, common combination. Topiramate: FDA-approved combination (Qsymia), additive weight-loss effect with cravings/binge management. Metformin: for users with insulin resistance / metabolic syndrome features.\n\n## Evidence Quality\nFDA-approved 1959. Long real-world track record. Modern obesity medicine guidelines (AACE, OMA) include phentermine in treatment algorithms. Effective for short-term weight loss; long-term efficacy depends on continued use + lifestyle. Cardiovascular outcomes data is reassuring for properly screened patients with monitoring.\n\n## Research vs Anecdote\nResearch: solid evidence base for short-term weight loss. Long-term use is less well-studied due to FDA labeling but is common practice with monitoring. Anecdote: effective for many users, especially those whose primary obesity driver is mindless eating / appetite-driven over-consumption. Less useful for users whose primary issue is metabolic (in whom GLP-1s or insulin sensitization may matter more). Tolerance to appetite suppression is real for many users by 8–12 weeks — drug holidays or dose adjustment help. The CNS-stimulant character of the drug makes it a poor fit for stimulant-sensitive users; they often do better on GLP-1 monotherapy.",
    tags: ["weight loss", "appetite suppressant", "stimulant", "controlled substance", "Schedule IV", "obesity", "prescription"],
  },

  {
    id: "tri-amino-injection",
    name: "Tri-Amino Acid Injection",
    aliases: ["Tri-Amino", "GAC injection", "Glutamine + Arginine + Carnitine injection", "Recovery amino blend"],
    category: ["Healing / Recovery", "Mitochondrial"],
    categories: ["Healing / Recovery", "Mitochondrial"],
    route: ["IM injection"],
    mechanism:
      "Compounded injection most commonly containing glutamine + arginine + carnitine (some formulations substitute or add ornithine, citrulline, or BCAAs). Each component has a distinct mechanism: glutamine — primary fuel for enterocytes (gut barrier integrity), substrate for muscle protein synthesis, modulator of mTOR signaling; arginine — nitric oxide precursor (endothelial vasodilation), modest GH secretagogue effect (more pronounced with IV than IM administration), urea cycle substrate; L-carnitine — fatty acid transporter into mitochondrial matrix for beta-oxidation, with separate roles in cellular glucose handling. The clinical case for INJECTABLE administration of these amino acids vs. oral is mixed: glutamine and arginine are both well-absorbed orally; carnitine has weaker oral bioavailability (~14–18%) which makes the injectable case stronger for that component specifically. Clinic-promoted as recovery enhancement, athletic performance, and energy support — much of the value proposition is convenience-of-clinic-administration and placebo / regression-to-mean rather than pharmacology unique to injectable route. Honest framing: the amino content can be delivered orally for substantially less cost in most cases.",
    halfLife: "Component-dependent: glutamine plasma half-life ~30 min, arginine ~1–2 hours, carnitine ~3–6 hours. Effects on cellular substrate availability extend beyond plasma residence.",
    reconstitution: { solvent: "Pre-mixed by compounding pharmacy", typicalVialMg: null, typicalVolumeMl: 10 },
    dosingRange: { low: "1mL IM weekly", medium: "2mL IM 1–2× weekly", high: "3mL IM 2× weekly", frequency: "1–2× weekly typically" },
    typicalDose: "2mL IM 1–2× weekly",
    startDose: "1mL IM × 1 to assess tolerance, then standard",
    titrationNote: "Modest titration. Increase to 2–3mL or twice-weekly if subjective benefit at lower dose.",
    cycle: "Continuous use common in clinic protocols. No formal cycle requirement.",
    storage: "Refrigerated 2–8°C. Stability per compounding pharmacy.",
    benefits: [
      "Carnitine specifically benefits from injectable route given low oral bioavailability",
      "Convenience of clinic administration (some users adhere better with scheduled clinic visits)",
      "Subjective recovery / energy benefit reported by some users — likely combination of mild pharmacology + placebo + clinical-attention effect",
      "Generally well-tolerated, low side effect profile",
    ],
    sideEffects: [
      "Injection site soreness, mild local reactions",
      "Rare hypersensitivity to compounded formulation",
      "Mild flushing with arginine component (NO-mediated)",
      "GI upset uncommon with injectable route (oral arginine and carnitine produce GI effects more often)",
    ],
    stacksWith: ["bpc-157", "tb-500", "creatine"],
    warnings: [
      "Severe renal impairment — limited data, coordinate with prescriber",
      "Severe hepatic impairment — limited data",
      "Pregnancy and lactation — no specific safety data for compounded injectable amino acid combinations",
      "Active malignancy with arginine concerns (some tumor types are arginine-auxotrophic; theoretical concern, rarely clinically relevant)",
      "Honest framing: this is mid-tier evidence at best — most users would get equivalent or better results from oral amino supplementation at lower cost",
    ],
    sourcingNotes:
      "Prescription only. Compounded by 503A pharmacies — dispensed via TRT clinics, men's-health clinics, IV bars with compounding partnerships. Formulation varies by pharmacy and prescription.",
    notes:
      "## Beginner Protocol\n1mL IM weekly × 4 weeks to assess subjective benefit. Track: training recovery (DOMS severity, time to feel recovered), energy levels (1–10 daily), workout performance (load progression). If clear benefit, continue at 1–2mL weekly. If no clear benefit, discontinue — the cost-benefit doesn't favor continued use without subjective response.\n\n## Advanced Protocol\nLayer with BPC-157 250mcg subQ daily and TB-500 2.5mg subQ weekly for users with active injury or aggressive training programs. Oral supplementation foundation: creatine 5g/day, whey protein 1.6–2.2g protein/kg total daily, EAA or BCAA pre-workout. The injectable amino layer is an adjunct on top of these basics — not a substitute for them.\n\n## Reconstitution + Administration\nPre-mixed by pharmacy. 25-gauge needle, IM into deltoid or vastus lateralis. Aspirate before injection.\n\n## Synergies\nBPC-157 + TB-500: tissue repair pathways. Creatine: PCr system for high-intensity work. Oral amino foundation: whey, EAA, BCAA — basics matter more than the injectable layer.\n\n## Evidence Quality\nWeak. The component aminos individually have varying evidence: creatine (strong), BCAA (moderate, mostly during caloric deficit), arginine (weak for performance, moderate for endothelial), carnitine (moderate for fat oxidation in deficiency states), glutamine (weak for athletic performance, moderate for gut barrier in critical illness). Injectable route adds little for glutamine and arginine; matters more for carnitine. The combination has no specific RCT evidence beyond the individual components.\n\n## Research vs Anecdote\nResearch: thin. Anecdote: positive subjective reports common in clinic-treated populations — driven by mix of pharmacology, placebo, and the clinical-attention effect (frequent clinic visits = better lifestyle adherence). Honest assessment: this is primarily a clinic-revenue product, not a high-impact intervention. For users with limited budget, oral supplementation will deliver most of the benefit at 5–10× lower cost. For users for whom the clinic visit itself is part of the value (accountability, coaching, adherence), the injection adds meaningful workflow value beyond pharmacology.",
    tags: ["amino acids", "recovery", "performance", "compounded", "IM injection", "carnitine", "arginine", "glutamine", "clinic"],
  },

  {
    id: "b-complex-injection",
    name: "B-Complex Injection",
    aliases: ["B-Complex IM", "Methyl B-Complex injection", "Megaplex", "B-50 injection", "B vitamin injection"],
    category: ["Longevity", "Immune"],
    categories: ["Longevity", "Immune"],
    route: ["IM injection", "subQ injection"],
    mechanism:
      "Combined B vitamin injectable, typically containing B1 (thiamine), B2 (riboflavin), B3 (niacin or niacinamide), B5 (pantothenic acid), B6 (pyridoxine HCl or pyridoxal-5-phosphate active form), and often B12 (cobalamin — methyl-, hydroxo-, or cyano- forms) and B9 (folate / methylfolate). Methyl B-Complex formulations specifically use methylated forms (methylcobalamin, methylfolate) to bypass MTHFR enzyme conversion limitations in users with C677T or A1298C MTHFR polymorphisms. B-vitamins are cofactors across cellular energy metabolism (Krebs cycle, beta-oxidation), methylation reactions (homocysteine to methionine, neurotransmitter synthesis, DNA methylation), neurological function (myelin synthesis, neurotransmitter substrate), and red blood cell production. IM administration achieves ~100% bioavailability vs. oral B-vitamins (which range from ~50% B12 absorption with adequate intrinsic factor, down to <5% in pernicious anemia or post-bariatric users). The injectable case is strongest in: documented deficiency, alcohol use disorder (thiamine deficiency, Wernicke encephalopathy risk), pernicious anemia (B12 deficiency), post-bariatric surgery malabsorption, MTHFR polymorphisms with elevated homocysteine, severe restrictive diets. For users without deficiency or malabsorption, the case is weaker — wellness-clinic IV/IM B-complex is often more about clinical attention and placebo than pharmacology.",
    halfLife: "Component-dependent. Water-soluble vitamins clear quickly via urine — most B-vitamins have plasma half-lives of hours, with tissue stores (especially B12 in liver) lasting months to years.",
    reconstitution: { solvent: "Pre-mixed", typicalVialMg: null, typicalVolumeMl: 10 },
    dosingRange: { low: "0.5–1mL weekly", medium: "1mL weekly", high: "1–2mL twice weekly", frequency: "Weekly typically; more frequent in active deficiency states" },
    typicalDose: "1mL IM weekly",
    startDose: "1mL IM × 1, assess tolerance",
    titrationNote: "Most users settle at 1mL weekly. Active deficiency may justify daily-then-tapered protocols (alcohol withdrawal, pernicious anemia loading, etc.) under prescriber direction.",
    cycle: "Continuous in deficiency states. Wellness/maintenance use: 1–2× monthly often sufficient if oral intake adequate.",
    storage: "Refrigerated 2–8°C. Some formulations require protection from light (riboflavin photolability).",
    benefits: [
      "Documented effective in B12 / B9 deficiency (anemia, neurological symptoms)",
      "First-line for Wernicke encephalopathy prevention in alcohol withdrawal (high-dose IV thiamine)",
      "Useful for post-bariatric surgery patients with documented malabsorption",
      "Supports MTHFR-polymorphism users with elevated homocysteine (use methylated forms)",
      "Often subjective energy / mental clarity boost reported in deficient users",
      "Convenient single-injection coverage of multiple B vitamins",
    ],
    sideEffects: [
      "Injection site soreness or local reaction",
      "Yellow / fluorescent yellow urine (riboflavin excretion — harmless, expected)",
      "Niacin flush if formulation contains free niacin (vs. niacinamide)",
      "Rare allergic reaction to cobalamin (usually cobalt-related, rare)",
      "B6 toxicity with very high chronic doses (>200mg/day chronic — peripheral neuropathy)",
      "GI upset uncommon with injectable route (vs oral)",
    ],
    stacksWith: ["nad", "vitamin-d3", "magnesium-glycinate"],
    warnings: [
      "Untreated megaloblastic anemia — IF cause is B12 deficiency, treating with folate alone can mask continuing neurological damage from B12 deficiency. Always treat B12 deficiency directly.",
      "Severe renal impairment — water-soluble vitamins generally safe but accumulation possible",
      "Cobalt allergy — rare, but cobalamin contains cobalt",
      "Pregnancy — generally safe in standard doses with prescriber awareness",
      "Concurrent levodopa therapy — high-dose pyridoxine reduces levodopa efficacy (modern carbidopa-levodopa combinations less affected)",
      "Honest framing: in users without documented deficiency or malabsorption, oral B-complex at 1/10 the cost provides equivalent benefit",
    ],
    sourcingNotes:
      "Prescription only as injection. Compounded by 503A pharmacies. Oral B-complex (Thorne, Pure Encapsulations, Designs for Health methylated formulations) is a high-quality alternative for users without specific malabsorption indications. Wellness IV bars and TRT clinics commonly stock injectable B-complex.",
    notes:
      "## Beginner Protocol\n1mL IM weekly for 4 weeks to assess subjective benefit. Bracket with: serum B12 (with methylmalonic acid if borderline), homocysteine (especially if MTHFR known), CBC. If labs are normal and subjective benefit absent at 4 weeks, oral methylated B-complex at far lower cost is the better path. If active deficiency was found, continue injectable until labs normalize, then transition to oral maintenance.\n\n## Advanced Protocol\nFor MTHFR polymorphism users with elevated homocysteine: methylated B-complex (methylcobalamin + methylfolate) injectable + oral TMG (trimethylglycine) 2g daily + adequate B6 (pyridoxal-5-phosphate active form) targets homocysteine via multiple methylation pathways. NAD (NAD+) IV or IM stack pairs naturally for users running comprehensive longevity protocols. Vitamin D3 5000 IU + K2 MK-7 100mcg + magnesium glycinate 400mg are foundational supplement adjuncts.\n\n## Reconstitution + Administration\nPre-mixed. 25-gauge needle, IM deltoid. Light protection important for riboflavin-containing formulations.\n\n## Synergies\nNAD: methylation cofactor cross-talk. Vitamin D3 + K2: foundational vitamin support. Magnesium: cofactor for B-vitamin enzyme function.\n\n## Evidence Quality\nStrong for documented deficiency states. Weak for wellness-injection use without deficiency. Methylated forms make sense for MTHFR polymorphism users (estimated ~30–40% of population carries at least one variant) but oral methylated forms work too.\n\n## Research vs Anecdote\nResearch: well-established for treating deficiency (B12 megaloblastic anemia, Wernicke encephalopathy, pernicious anemia, MTHFR-related hyperhomocysteinemia). Anecdote: subjective energy / mood benefit common in wellness-injection users — driven by mix of mild pharmacology + placebo + the clinical-attention effect. Decision frame: get serum B12, MMA, homocysteine, CBC FIRST. Treat documented deficiency aggressively. For wellness-only use without deficiency, oral methylated B-complex is the cost-effective path. The injectable route is high-bioavailability convenience, not magic.",
    tags: ["B vitamins", "B12", "methylation", "MTHFR", "energy", "vitamin", "IM injection", "wellness clinic", "prescription"],
  },

  {
    id: "vitamin-c-injection",
    name: "Vitamin C Injection (High-Dose)",
    aliases: ["IV vitamin C", "Ascorbate IV", "High-dose ascorbic acid", "Riordan protocol", "Pharmacological ascorbate"],
    category: ["Longevity", "Immune"],
    categories: ["Longevity", "Immune"],
    route: ["IV infusion", "IM injection"],
    mechanism:
      "Pharmacological-dose ascorbate behaves fundamentally differently from physiological-dose vitamin C. At oral doses (≤2g), plasma ascorbate is tightly regulated to ~0.05–0.1 mM via saturable intestinal absorption and renal reabsorption — functions as classic antioxidant cofactor for collagen synthesis, neurotransmitter synthesis, immune function. At IV doses 25–100g+, plasma ascorbate transiently reaches 5–15 mM — 50–150× normal — and behaves as a PRO-oxidant via H2O2 generation in interstitial fluid (catalyzed by labile metal ions, predominantly iron). The H2O2 generated is preferentially toxic to cells with reduced catalase activity (a feature of many cancer cell lines in vitro) while being efficiently neutralized by catalase-rich healthy cells. This pharmacological-vs-physiological distinction is the basis for integrative oncology use (Riordan protocol). Outside oncology, IV vitamin C is used in: critical illness research (sepsis trials produced mixed results — some signal in observational data, neutral or negative in RCTs like CITRIS-ALI), perioperative recovery, immune support claims, anti-inflammatory contexts, and wellness-clinic protocols. The wellness-use evidence base is thin; the oncology-adjunct use has more compelling preclinical data and ongoing clinical investigation.",
    halfLife: "Ascorbate plasma half-life with high-dose IV ~2 hours due to renal excretion. Pharmacological levels are transient — sustained effects require repeat dosing.",
    reconstitution: { solvent: "Sterile water for injection or 0.9% saline (large-volume dilution for IV)", typicalVialMg: 25000, typicalVolumeMl: 50 },
    dosingRange: { low: "10–25g IV (wellness/maintenance)", medium: "25–50g IV (immune/inflammation support)", high: "50–100g+ IV (oncology adjunct, Riordan protocol)", frequency: "Weekly typically; oncology protocols 2–3× weekly" },
    typicalDose: "25–50g IV over 1–2 hours",
    startDose: "G6PD screening MANDATORY before any high-dose IV C. Initial dose ~15–25g over 60 minutes to assess tolerance.",
    titrationNote: "Titrate up dose over 4–6 sessions. Hydration during infusion essential. Monitor for nausea, vasovagal response, BP changes.",
    cycle: "Wellness use: weekly or biweekly. Oncology adjunct: 2–3× weekly during active treatment phase, often 6–12 month courses.",
    storage: "Refrigerated 2–8°C. Light-protected. Stability ~7–14 days post-compounding (varies).",
    benefits: [
      "Pharmacological mechanism (pro-oxidant cancer cell selectivity) is biologically plausible and supported by in vitro/animal data",
      "Generally well-tolerated when properly screened (G6PD)",
      "Some evidence in integrative oncology adjunct settings — not curative monotherapy, but as supportive care",
      "Anti-inflammatory effects in critical illness (mixed clinical trial evidence)",
      "Fast plasma vitamin C correction for severe deficiency (scurvy, malnutrition)",
    ],
    sideEffects: [
      "Vasovagal reaction during/after infusion (lightheadedness, nausea)",
      "Vein irritation with very-high-dose peripheral IV (central line preferred for >50g)",
      "Osmotic diuresis — significant fluid shifts during infusion",
      "False blood glucose readings on point-of-care glucometers (interferes with assay) — important in diabetic patients on insulin; use lab-based glucose during/after infusion",
      "Kidney stone risk in users with prior calcium oxalate stones (theoretical, low evidence base)",
      "Rebound vitamin C deficiency on abrupt discontinuation of high-dose protocols (controversial)",
    ],
    stacksWith: ["glutathione-iv", "nad", "alpha-lipoic-acid"],
    warnings: [
      "G6PD DEFICIENCY — ABSOLUTE CONTRAINDICATION for high-dose IV C. Hemolytic crisis risk is fatal. Screen with G6PD enzyme activity test before any dose >5g IV. This screening is non-negotiable.",
      "Active calcium oxalate kidney stones — relative contraindication (theoretical risk)",
      "Iron overload conditions (hereditary hemochromatosis, transfusion-dependent thalassemia) — caution; ascorbate increases iron absorption",
      "Severe renal failure — dosing modification required, electrolyte monitoring",
      "Pregnancy — generally safe in moderate doses; high-dose IV protocols not well-studied",
      "Active chemotherapy — some chemotherapeutics may interact with high-dose vitamin C; coordinate with oncologist (some agents work better, others may be antagonized)",
      "Diabetes — point-of-care glucose monitor interference is real and dangerous if insulin dosing is based on POC readings during/after infusion",
    ],
    sourcingNotes:
      "Prescription only as IV. Compounded by 503A pharmacies. Available via integrative medicine clinics, IV bars, oncology integrative practices, and wellness clinics. Cost varies widely ($50–250/infusion). Insurance coverage essentially zero outside specific oncology adjunct contexts.",
    notes:
      "## Beginner Protocol\nG6PD screening FIRST — non-negotiable. Initial 15–25g IV over 60 minutes. Hydrate well before and after. Monitor BP, HR, subjective response. If well-tolerated, titrate up to 25–50g over 4–6 sessions. For wellness use without active disease indication, the rationale is thin — most users will not see objective benefit, and the cost-benefit is poor outside specific contexts.\n\n## Advanced Protocol\nFor integrative oncology adjunct (always coordinated with oncologist): Riordan-style protocol of 50–100g IV 2–3× weekly during active treatment phase. Pair with glutathione IV (1–2g push at end of vitamin C infusion or different day) and alpha-lipoic acid 600mg IV for comprehensive antioxidant cycling. Critical: this is adjunctive supportive care, NOT curative monotherapy. Patients should not delay or substitute for evidence-based oncology treatment.\n\n## Reconstitution + Administration\nLarge-volume IV (250–500mL saline) infused over 60–120 minutes. 18–20 gauge IV catheter for peripheral; central line preferred for very high doses or chronic protocols. Hydration before and after. Light-protected line.\n\n## Synergies\nGlutathione IV: complementary antioxidant. NAD IV: cellular energy / methylation. Alpha-lipoic acid IV: thiol-based antioxidant cycling.\n\n## Evidence Quality\nMixed and context-dependent. Strong evidence for treating scurvy and severe deficiency. Suggestive evidence in integrative oncology (in vitro and animal data, mixed clinical trials). Negative or neutral evidence in critical illness sepsis trials (CITRIS-ALI, VITAMINS). Wellness-use evidence is thin.\n\n## Research vs Anecdote\nResearch: pharmacological mechanism is biologically plausible and well-characterized. Clinical translation has been mixed — high promise in vitro doesn't always translate to RCT outcomes. Anecdote: enthusiastic user community in integrative medicine; subjective energy/wellness reports common but heavily confounded by placebo and the clinical-attention effect. Honest assessment: G6PD screening matters; the oncology-adjunct case is more compelling than the wellness case; cost-benefit favors targeted use over chronic wellness protocols.",
    tags: ["vitamin C", "ascorbate", "IV therapy", "antioxidant", "integrative oncology", "compounded", "high-dose", "Riordan protocol"],
  },

  {
    id: "minoxidil",
    name: "Minoxidil",
    aliases: ["Rogaine (topical)", "Loniten (oral antihypertensive)", "Oral minoxidil", "Low-dose oral minoxidil", "LDOM"],
    category: ["Skin / Hair / Nails"],
    categories: ["Skin / Hair / Nails"],
    route: ["topical", "oral"],
    mechanism:
      "Originally developed in the 1970s as a potent peripheral vasodilator antihypertensive (Loniten) — mechanism: ATP-sensitive potassium channel opener in vascular smooth muscle, producing arteriolar dilation. Hypertrichosis (excessive hair growth) was an unwanted side effect of oral antihypertensive use that became a serendipitous indication. The hair-growth mechanism involves multiple pathways: (1) sulfotransferase enzymes in hair follicle dermal papilla cells convert minoxidil to minoxidil sulfate, the active metabolite; (2) follicular vasodilation increases nutrient delivery; (3) anagen (growth) phase extension and shortening of telogen (resting) phase; (4) prostaglandin synthesis modulation; (5) potential direct effect on follicle dermal papilla cell proliferation. Topical 5% minoxidil is the FDA-approved hair-loss treatment (men's and women's). Oral low-dose minoxidil (0.625–5mg daily) is increasingly used off-label for both male and female pattern hair loss — produces stronger response than topical for many users (some studies suggest 2–3× greater density gains) but introduces systemic vasodilator effects requiring CV monitoring. The oral low-dose movement (LDOM) has accelerated significantly since 2018, with major dermatology centers increasingly offering it as standard-of-care option. Sulfotransferase enzyme activity in follicles is genetically variable — explains why some users get strong topical response and others get nothing.",
    halfLife: "Topical: minimal systemic absorption typically. Oral: plasma half-life ~4 hours; cardiovascular effects extend longer.",
    reconstitution: { solvent: "N/A — pre-formulated", typicalVialMg: null, typicalVolumeMl: null },
    dosingRange: { low: "Topical 5% solution/foam 1–2mL daily | Oral 0.625–1.25mg daily", medium: "Topical 5% twice daily | Oral 2.5mg daily", high: "Topical 5% twice daily + Oral 5mg daily (combination)", frequency: "Topical 1–2× daily; Oral once daily AM" },
    typicalDose: "Topical: 1mL 5% solution or foam to scalp twice daily, OR Oral: 1.25–2.5mg once daily AM",
    startDose: "Topical: 1mL once daily for first 2 weeks (assess scalp tolerance), then 2× daily | Oral: 0.625–1.25mg AM × 30 days, monitor BP/HR, then titrate",
    titrationNote: "Oral minoxidil: increase by 1.25mg every 4 weeks based on tolerance and response. Most users find effective dose at 1.25–2.5mg. Going above 5mg rarely adds benefit, increases CV side effects.",
    cycle: "Continuous indefinite use required for benefit. Discontinuation produces shedding back to baseline within 2–3 months.",
    storage: "Topical: room temperature, away from heat. Oral: room temperature.",
    benefits: [
      "FDA-approved hair-loss treatment (topical) with strong real-world evidence base",
      "Oral low-dose minoxidil (LDOM) produces stronger response than topical for many users",
      "Mechanistically distinct from finasteride (5-alpha reductase) — can be combined for additive effect",
      "Inexpensive (generic topical $15–30/month, generic oral ~$10/month)",
      "Useful for both male and female pattern hair loss",
      "No hormonal mechanism (unlike finasteride) — appeals to users avoiding androgen modulation",
      "Beard / facial hair growth applications (off-label, oral form)",
    ],
    sideEffects: [
      "Topical: scalp irritation, dryness, dermatitis (often from propylene glycol vehicle — switch to foam)",
      "Initial shedding (telogen effluvium) in first 4–8 weeks — paradoxical worsening before improvement, common and expected",
      "Oral: facial / body hypertrichosis (often a deal-breaker for women, less so for men)",
      "Oral: edema (peripheral, ankles), fluid retention",
      "Oral: tachycardia, mild HR elevation",
      "Oral: rare pericardial effusion (very rare at low doses, more common at antihypertensive doses)",
      "Oral: BP drop in some users (relevant for users on existing antihypertensives)",
      "Permanent shedding of new growth on discontinuation — long-term commitment",
    ],
    stacksWith: ["finasteride", "dutasteride", "ketoconazole-shampoo"],
    warnings: [
      "Cardiovascular disease — caution with oral form, optimize before initiation",
      "Pheochromocytoma — contraindication for oral",
      "Pregnancy — not recommended (Category C)",
      "Lactation — not recommended",
      "Severe hypertension or hypotension — caution, dose adjustment required",
      "Concurrent strong vasodilators or antihypertensives — interaction warrants prescriber coordination",
      "Pre-existing edema or heart failure — caution with oral form",
      "Pediatric — not for use in children under 18 (off-label use under specialty supervision exists)",
      "Pets (especially cats) — topical exposure can be FATAL to cats; users with cats should be extremely careful with topical formulations",
    ],
    sourcingNotes:
      "Topical 5%: OTC in US (Rogaine and generics). Oral minoxidil: prescription only in US — most often via dermatology clinics, telehealth hair-loss platforms (Hims, Keeps, etc.). Generic oral minoxidil (Loniten) is inexpensive but typically prescribed in 2.5mg or 10mg tablets; pill splitting is common to achieve LDOM doses (0.625–1.25mg requires splitting a 2.5mg tablet).",
    notes:
      "## Beginner Protocol\nTopical 5% minoxidil twice daily to affected areas of scalp. Foam formulation often better tolerated than solution (no propylene glycol). Expect initial shedding at 4–8 weeks — do not panic, this is the existing telogen-phase hairs being pushed out by new anagen growth. Real visible improvement at 4–6 months; full effect at 12 months. Photograph standardized angles monthly under consistent lighting to track progress. Hair-loss progression is gradual and the absence of further loss is itself a positive outcome.\n\n## Advanced Protocol\nLow-dose oral minoxidil (LDOM): 1.25mg daily AM × 30 days, monitor BP/HR daily. Bracket with: BP, HR, baseline ECG if any CV concern, baseline labs. If well-tolerated and inadequate response, titrate to 2.5mg daily. Topical + oral combination produces additive effect for many users. Combine with finasteride 1mg daily (men) or spironolactone 50–100mg daily (women) for the dual mechanism — anti-androgen + minoxidil — that produces best long-term results in pattern hair loss. Ketoconazole shampoo 2× weekly as adjunct (anti-DHT scalp surface action + anti-inflammatory). Microneedling 1.5mm dermaroller weekly enhances topical absorption.\n\n## Reconstitution + Administration\nN/A. Topical: apply to dry scalp, distribute through affected areas, avoid washing for ≥4 hours after application. Oral: with or without food.\n\n## Synergies\nFinasteride (men) or dutasteride (men) or spironolactone (women): anti-androgen mechanism complements minoxidil. Ketoconazole shampoo: anti-DHT scalp surface action. Microneedling: enhanced topical absorption + wound-healing growth factor release.\n\n## Evidence Quality\nTopical minoxidil: strong, FDA-approved since 1988 (men), 1991 (women). Oral LDOM: emerging strong evidence base, increasingly mainstream in dermatology since ~2018, multiple dermatology center reports of effectiveness comparable to or exceeding topical with manageable side effect profile at low doses.\n\n## Research vs Anecdote\nResearch: topical strongly evidence-based. Oral LDOM evidence accumulating rapidly — well-tolerated at low doses with effective hair-loss response. Anecdote: oral LDOM experience is overwhelmingly positive in male hair-loss communities; female experience more mixed (hypertrichosis side effect is significant). The cat-exposure risk for topical minoxidil is real and underappreciated — users with cats should be aware. Decision frame: topical first (lower commitment, OTC), add oral if topical inadequate after 6–12 months. Combine with anti-androgen (finasteride/dutasteride/spironolactone) for best long-term results in pattern hair loss.",
    tags: ["minoxidil", "hair loss", "Rogaine", "LDOM", "oral minoxidil", "topical", "cosmetic", "alopecia", "cardiovascular drug repurposed"],
  },
];