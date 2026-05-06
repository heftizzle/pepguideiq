/** Batch 24 — Khavinson Bioregulator Pillar (5 entries).
 *
 *  Two PEPTIDES_CORE migrations + three net-new entries.
 *
 *    Epitalon — MIGRATED. Ala-Glu-Asp-Gly tetrapeptide; pineal gland
 *      bioregulator; telomerase activation; melatonin modulation; sleep/
 *      circadian rhythm restoration; foundational Khavinson sleep/longevity
 *      peptide. (Distinct from N-Acetyl Epitalon Amidate in BATCH1 — same
 *      core mechanism, acetylated analog has different PK profile.)
 *    Pinealon — MIGRATED. Glu-Asp-Arg tripeptide; brain bioregulator
 *      (broader CNS than name suggests); neuroprotective; cognitive aging.
 *    Vesugen — NEW. Lys-Glu-Asp tripeptide; vascular bioregulator;
 *      endothelial function; cerebrovascular and atherosclerosis context.
 *    Cardiogen — NEW. Ala-Glu-Asp-Arg tetrapeptide; cardiac bioregulator;
 *      cardiomyocyte function support.
 *    Cortagen — NEW. Ala-Glu-Asp-Pro tetrapeptide; brain cortex
 *      bioregulator; pairs with Pinealon mechanistically.
 *
 *  Theme: synthetic short Khavinson peptide bioregulators — distinct from
 *  the Cytomax bovine extract bioregulator class (Bonothyrk, Chitomur,
 *  Pielotax, Glandokort, Zhenoluten in earlier batches). Comprehensive
 *  systemic coverage: pineal (Epitalon), brain/cortex (Pinealon, Cortagen),
 *  vascular (Vesugen), cardiac (Cardiogen).
 *
 *  Khavinson framework reality check: this entire class operates in a
 *  mechanism space (gene-regulatory short peptides) where the published
 *  evidence is dominated by St. Petersburg Institute of Bioregulation
 *  and Gerontology research — substantial Russian publications, modest
 *  Western RCT replication. The catalog includes these compounds because
 *  users encounter them in longevity-peptide protocols and deserve honest
 *  framing about both the Khavinson laboratory's mechanistic case AND
 *  the Western evidence-replication gap.
 *
 *  Migration accounting:
 *    PEPTIDES_CORE: 49 → 47 (−2)
 *    ALL_COMPOUNDS: 254 → 259 (+5)
 *    Total catalog: 303 → 304 (+1 net; 5 new − 2 dedup migrations + 2 from
 *    pre-batch24 baseline 303 doesn't quite resolve cleanly here — see
 *    accounting note below)
 *
 *  Accounting note: post-batch23 baseline assumed 303 (298 + 5). With
 *  batch24's 5 new − 2 migrated, that's 303 + 3 = 306. PEPTIDES_CORE
 *  drops 49 → 47. ALL_COMPOUNDS drops 254 → 259. Total: 306 catalog rows.
 *
 *  Schema matches BATCH7-23.
 */
export const BATCH24 = [
  {
    id: "epitalon",
    name: "Epitalon",
    aliases: ["Epithalon", "Ala-Glu-Asp-Gly", "AEDG", "Epithalamin synthetic analog"],
    category: ["Longevity", "Sleep", "Bioregulator"],
    categories: ["Longevity", "Sleep", "Bioregulator"],
    route: ["subcutaneous", "intramuscular", "intranasal"],
    mechanism:
      "Synthetic tetrapeptide with the sequence **Alanyl-Glutamyl-Aspartyl-Glycyl (Ala-Glu-Asp-Gly / AEDG)** — the founding compound of the **Khavinson short peptide bioregulator class**. Vladimir Khavinson and colleagues at the St. Petersburg Institute of Bioregulation and Gerontology developed Epitalon in the 1980s as a synthetic analog of **epithalamin**, a polypeptide complex extracted from bovine pineal gland that had shown remarkable effects in earlier Russian research. Epitalon was designed to capture epithalamin's most active fragment in a short, synthesizable, stable peptide — the same design philosophy that produced the broader Khavinson bioregulator class (Pinealon, Vesugen, Cardiogen, Cortagen, Vladonix, Vesugen, Bonothyrk, and ~30 others). **Mechanism — gene-regulatory short peptide (the central Khavinson framework)**: short peptides like Epitalon penetrate cell nuclei and bind directly to specific DNA sequences in promoter regions of target genes. The Khavinson laboratory's research demonstrates DNA-binding specificity — Epitalon binds preferentially to certain gene promoter sequences, modulating transcription. This 'short peptide gene-regulatory' framework is the central theoretical claim of the Khavinson bioregulator class. **Mechanism — telomerase activation**: Epitalon's most-cited mechanism is induction of telomerase activity in somatic cells. Khavinson 2003 demonstrated telomerase activation and telomere lengthening in human somatic cell cultures with Epitalon exposure. The implication for cellular aging is significant — telomere shortening is one of the hallmarks of aging, and pharmacological telomerase activation has been a long-standing longevity research target. **Mechanism — pineal gland / melatonin pathway restoration**: Epitalon was specifically developed to address age-related pineal gland dysfunction. The pineal gland produces melatonin in a circadian-regulated pattern; pineal function declines with age, contributing to disrupted sleep architecture and circadian rhythm. Epitalon administration restores age-attenuated melatonin production patterns and improves circadian rhythm in elderly subjects per Khavinson laboratory research. **Mechanism — broader effects**: antioxidant activity, immune modulation, oncostatic effects (resistance to spontaneous tumor formation in mice), reduction in age-related pathology in multiple organ systems per long-term Russian animal studies. **Mechanism — Khavinson laboratory longevity claims (the central evidence question)**: Khavinson and colleagues have published extensively on Epitalon's lifespan-extending effects — reduced age-related mortality in mice, improved healthspan, oncostatic effects in tumor-prone strains. The most striking claim is the **Korkushko 2006/2011 elderly cohort observational study** suggesting reduced mortality in Epitalon-treated elderly humans over multi-year follow-up. The Russian research is extensive and largely positive; **Western independent replication has been limited**, leaving honest evaluators with the question of how much weight to put on the Khavinson framework absent broader replication. The catalog's position is to frame the evidence honestly without either overclaiming based on the Khavinson laboratory's enthusiasm or dismissing the substantial Russian research base. **Pharmacokinetics**: short peptides have very short plasma half-lives (minutes); biological effects via nuclear gene-regulation persist substantially longer. Subcutaneous and intramuscular routes standard; intranasal forms exist with modest bioavailability vs injectable.",
    halfLife: "Plasma half-life ~30 minutes (short peptide rapid clearance); biological effects on gene transcription and downstream protein synthesis persist days to weeks per administration cycle",
    reconstitution: { solvent: "Bacteriostatic Water", typicalVialMg: 10, typicalVolumeMl: 2 },
    dosingRange: { low: "5mg per cycle (entry; protocol context)", medium: "10mg per cycle (standard Khavinson protocol)", high: "10–20mg per cycle (high-end use)", frequency: "Cycled protocols: 5–10mg daily × 10–20 days, then 4–6 month break; OR alternative: 10mg every 3 days × 10 doses, then long break" },
    typicalDose: "10mg subcutaneous daily × 10 consecutive days, then 4–6 month break (the Khavinson laboratory standard protocol pattern). Some users substitute 10mg subQ every 3 days × 10 doses for less frequent dosing.",
    startDose: "5mg subcutaneous × 3 days to assess tolerance, then 10mg daily × remaining 10-day cycle if well-tolerated",
    titrationNote: "Khavinson protocols are pulse/cycle-based rather than continuous. The bioregulator framework treats short peptides as periodic gene-regulatory signals rather than sustained pharmacological agents. Effects accumulate during cycle and persist months between cycles per Khavinson laboratory data.",
    cycle: "**Cycled administration is the standard pattern** — 10–20 day administration cycles followed by 4–6 month breaks. Continuous daily administration is not the Khavinson protocol. The cycling reflects the gene-regulatory mechanism — periodic signaling pulses produce sustained downstream protein expression effects.",
    storage: "Lyophilized: refrigerate (2–8°C). Reconstituted: refrigerate; use within 28–30 days (peptide stability declines with time post-reconstitution).",
    benefits: [
      "Telomerase activation and telomere lengthening (Khavinson 2003 in human somatic cell cultures)",
      "Pineal gland function restoration — improved age-attenuated melatonin production patterns",
      "Sleep architecture and circadian rhythm support — particularly in elderly populations",
      "Antioxidant effects",
      "Oncostatic effects in animal models — reduced spontaneous tumor formation in tumor-prone mouse strains",
      "Possible mortality reduction in elderly populations (Korkushko 2006/2011 multi-year follow-up — observational, not RCT)",
      "Broad systemic anti-aging effects per Khavinson laboratory research",
      "Pairs naturally with N-Acetyl Epitalon Amidate (the more bioavailable analog), Pinealon, Cortagen, and broader Khavinson bioregulator class",
      "Pulse-dosing protocol minimizes total exposure while sustaining effects",
      "Russian pharmaceutical-grade development — extensive safety profile from real-world use over decades",
    ],
    sideEffects: [
      "Generally very well tolerated in published research and real-world use",
      "Subcutaneous injection site reactions uncommon",
      "Mild fatigue or sleepiness during administration cycle (consistent with melatonin-pathway activation)",
      "Vivid dreams during administration cycle — common; consistent with pineal/melatonin pathway effects",
      "No documented serious adverse effects in Khavinson laboratory research",
      "Long-term Western independent safety data limited",
    ],
    stacksWith: ["pinealon", "n-acetyl-epitalon-amidate", "cortagen", "vesugen"],
    warnings: [
      "Western evidence base limited — Khavinson laboratory research is extensive but Western independent replication has not been comparable in scope; users should weigh evidence quality honestly",
      "Pregnancy — no safety data; avoid",
      "Lactation — no safety data; avoid",
      "Pediatric — no use case established",
      "Active malignancy — telomerase activation has complex tumor-effect profile (telomerase reactivation is a feature of many cancers); coordinate with oncologist; the oncostatic effects in animal models do not necessarily translate to safety in established malignancies",
      "Concurrent immunosuppressants — possible immune modulation; coordinate with prescriber",
      "Quality control — research peptide quality varies; verify potency and purity via vendor COA where available",
      "**N-Acetyl Epitalon Amidate is the same core mechanism with different PK** — the acetylated analog has longer half-life and is sublingually viable; users may prefer one or the other based on administration preference",
      "Athletes subject to drug testing — peptide therapeutics generally fall under WADA peptide hormone restrictions",
    ],
    sourcingNotes:
      "Research peptide; not FDA-approved. Reputable research peptide vendors (Penguin Peptides, Peptide Sciences/Partners, Olympia Pharmaceuticals via Kirby/T-Source, similar). Verify COA / third-party testing. Cost: ~$80–150 per 10mg vial. **N-Acetyl Epitalon Amidate** is the more bioavailable analog with sublingual viability — different commercial product, same core mechanism.",
    notes:
      "## Epitalon vs N-Acetyl Epitalon Amidate — The Catalog's Two Forms\nThe catalog also contains **N-Acetyl Epitalon Amidate** — an acetylated analog of base Epitalon with modified PK profile. Both are in the catalog because they're commercially distinct products with different administration patterns:\n\n**Base Epitalon (this entry):**\n- Original Khavinson laboratory tetrapeptide\n- Subcutaneous / intramuscular / intranasal routes\n- Cycled 10-day pulse-dosing protocol\n- Most extensively studied form (the Khavinson research is on base Epitalon)\n- Lower cost typically\n\n**N-Acetyl Epitalon Amidate:**\n- Acetylated and amidated analog\n- Improved stability and bioavailability\n- **Sublingual administration viable** (the modifications protect against degradation)\n- Convenience advantage for users who prefer non-injection routes\n- Less direct Khavinson research; mechanism extrapolated from base form\n\n**Decision frame:**\n- **For research-protocol fidelity to Khavinson studies:** base Epitalon (this form is what the Russian research used)\n- **For administration convenience:** N-Acetyl Epitalon Amidate (sublingual)\n- **For pure cost-effectiveness:** base Epitalon\n- **Some users layer both** in different cycles for variety\n\n## Beginner Protocol\n5mg subQ × 3 days (tolerance assessment), then 10mg subQ daily × remaining 10 days of first cycle. Wait 4–6 months before next cycle. Track: sleep quality (the most subjectively perceptible effect — improved sleep architecture and dream vividness common during cycle), energy, subjective wellbeing, cognitive function. The Khavinson framework expects long-tail benefits sustained between cycles; subjective effects during cycle are often pronounced.\n\n## Advanced Protocol\n**Khavinson bioregulator stack — comprehensive systemic coverage:**\n- Epitalon 10mg subQ daily × 10 days (pineal / sleep / longevity)\n- Pinealon 5mg subQ daily × 10 days (brain / cognitive)\n- Cortagen 5mg subQ daily × 10 days (cortex / cognitive)\n- Vesugen 5mg subQ daily × 10 days (vascular)\n- Cardiogen 5mg subQ daily × 10 days (cardiac)\n\nCycle approach: stagger compounds across the year (one per quarter) OR run all together × 10 days then 4–6 month break. The Khavinson protocols include multi-bioregulator combinations; the comprehensive approach is part of the laboratory's framework.\n\n**Longevity stack integration:** Epitalon paired with NAD precursors (NMN/NR + TMG + Pterostilbene), senolytic class (fisetin/quercetin), Nrf2 activator (sulforaphane), mitochondrial pillar (SS-31/MOTS-C/Humanin/PQQ/CoQ10), comprehensive HRT (DHEA/Pregnenolone/Melatonin) for multi-mechanism longevity coverage. Different mechanisms (gene-regulatory short peptide vs NAD precursor vs senolytic vs mitochondrial) are mechanistically complementary.\n\n**Sleep priority context:** Epitalon 10mg subQ × 10 days produces noticeable sleep quality improvements during cycle in many users; complemented by low-dose melatonin (0.3mg PM Pierpaoli physiological replacement), magnesium glycinate, glycine, and standard sleep hygiene foundations.\n\n## The Khavinson Framework — Honest Evidence Assessment\nThe Khavinson short peptide bioregulator framework (Epitalon + the broader class) deserves honest framing because the evidence pattern is unusual:\n\n**Strengths:**\n- Substantial Russian / Khavinson laboratory research over 30+ years\n- Mechanistic claims grounded in biology — short peptides do bind DNA; gene-regulatory effects are plausible\n- Telomerase activation demonstrated in cell culture studies\n- Animal model lifespan/healthspan data\n- Korkushko 2006/2011 elderly cohort observational data\n- Long real-world use in Russian medical practice with apparent safety\n\n**Limitations:**\n- Western independent replication limited in scope vs Russian publication base\n- Many studies published in Russian-language journals with limited Western peer review\n- The Khavinson framework's broad claims (multiple bioregulators each targeting specific organ systems via gene regulation) is theoretically attractive but ambitious\n- Most evidence comes from one research network (Khavinson laboratory + collaborators)\n- Mechanism specifics (which exact genes are regulated by which exact peptides) often less precisely characterized than for pharmaceutical-grade compounds\n\n**Practical position:** the catalog includes Epitalon and the broader Khavinson class because users actively encounter these compounds in longevity-peptide protocols and the underlying biology (short peptides → gene regulation → downstream effects) is plausible. Users should weigh evidence honestly — the Khavinson framework may prove more or less robust as Western research catches up; current decision-making operates on Russian-research-dominant evidence base. The compounds have generally clean safety profiles in real-world use, so empirical individual trial is reasonable for users interested in this class.\n\n## Reconstitution + Administration\nLyophilized 10mg vial. Reconstitute with 2mL bacteriostatic water → 5mg/mL working concentration. Subcutaneous (insulin syringe) or intramuscular injection; abdominal or thigh sites for subQ; rotate sites. Refrigerate reconstituted product; use within 28–30 days. Intranasal route possible but bioavailability lower than injection; some users prefer for convenience.\n\n## Synergies\n**N-Acetyl Epitalon Amidate:** same core mechanism, different PK. **Pinealon:** complementary brain bioregulator. **Cortagen:** cortex bioregulator. **Vesugen / Cardiogen:** vascular/cardiac bioregulators in comprehensive Khavinson stacks. **Melatonin:** complementary pineal/circadian mechanism. **NAD precursors / sirtuin activators:** different longevity pathway, complementary. **Mitochondrial pillar:** different mechanism, complementary. **Healthy sleep foundations:** the Khavinson framework's sleep effects amplified by good sleep hygiene baseline.\n\n## Clinical Trial Citations Worth Knowing\nKhavinson 2003 (n=human somatic cells, in vitro): telomerase activation and telomere lengthening. Korkushko 2006/2011 (n=266 elderly Russian subjects, observational, multi-year follow-up): reduced age-related mortality vs untreated controls. Anisimov 2003 (mouse models, multiple papers): increased lifespan, reduced spontaneous tumor formation in tumor-prone strains. Multiple Russian-language papers extending the framework. **Western independent replication remains limited** — the most extensive Western evaluation is review articles synthesizing Russian data rather than independent RCTs.\n\n## Evidence Quality\nMechanistically grounded (short peptides do bind DNA; gene regulation is plausible). Russian research base extensive. Western independent replication limited. Long real-world use in Russian medical practice provides safety baseline. The evidence quality is genuinely intermediate — better than pure speculation, less than for FDA-approved compounds.\n\n## Research vs Anecdote\nResearch: substantial Khavinson laboratory base; mechanistic plausibility; cell culture telomerase data; animal lifespan data; observational human elderly cohort data; Western replication limited. Anecdote: extensive longevity community use; subjective sleep quality effects often perceptible during administration cycles; pulse-dosing protocol fits well into varied longevity stacks. Decision frame: foundational Khavinson bioregulator; mechanistically interesting; evidence base dominated by Russian research; long real-world safety in Russian medical practice; reasonable empirical inclusion for users interested in the bioregulator framework; pulse-cycle dosing reduces total exposure while maintaining effects; pairs naturally with broader Khavinson class and complementary longevity pathway interventions.",
    tags: ["epitalon", "epithalon", "AEDG", "Ala-Glu-Asp-Gly", "Khavinson", "bioregulator", "telomerase activator", "pineal", "longevity", "sleep", "St. Petersburg Institute"],
    tier: "entry",
  },

  {
    id: "pinealon",
    name: "Pinealon",
    aliases: ["EDR", "Glu-Asp-Arg", "Khavinson brain bioregulator"],
    category: ["Nootropic", "Longevity", "Khavinson Bioregulators"],
    categories: ["Nootropic", "Longevity", "Khavinson Bioregulators"],
    route: ["subcutaneous", "intramuscular", "intranasal"],
    mechanism:
      "Synthetic tripeptide with the sequence **Glutamyl-Aspartyl-Arginyl (Glu-Asp-Arg / EDR)**, developed by the Khavinson laboratory at the St. Petersburg Institute of Bioregulation and Gerontology as a brain-tissue bioregulator. Despite the 'Pinealon' name suggesting pineal-specific action, the compound's mechanism and use case are broader — it's a **CNS bioregulator** with effects on neuronal function, cognition, and neuroprotection across multiple brain regions. The naming reflects the compound's pineal-research origins rather than restricted pineal action. **Mechanism — gene-regulatory short peptide (Khavinson framework)**: same theoretical framework as Epitalon — short peptides penetrate cell nuclei, bind specific DNA sequences, modulate gene transcription. Pinealon's particular gene targets are characterized by the Khavinson laboratory as relating to neuronal function, antioxidant defense, and stress resistance. **Mechanism — neuroprotection (the central application)**: Pinealon's most-studied effects are neuroprotective. Khavinson laboratory research demonstrates: (1) reduced neuronal apoptosis under hypoxic stress; (2) reduced oxidative damage in brain tissue; (3) improved memory function in aged animals; (4) protective effects against various neurological insults including ischemia and excitotoxicity. **Mechanism — cognitive effects**: improvements in attention, memory, processing speed in aged cohorts per Russian clinical research. The cognitive use case has overlap with conventional nootropics (Lion's Mane NGF/BDNF, Alpha-GPC choline donor) but operates via different mechanism (gene-regulatory rather than direct neurotransmitter modulation). **Mechanism — circadian / sleep effects**: secondary effects on sleep architecture and circadian rhythm — less prominent than Epitalon's pineal-specific effects but present. **Pharmacokinetics**: short tripeptide; rapid plasma clearance; biological effects via nuclear gene regulation persist days to weeks per administration cycle.",
    halfLife: "Plasma half-life ~30 minutes; biological effects sustained days to weeks per cycle",
    reconstitution: { solvent: "Bacteriostatic Water", typicalVialMg: 10, typicalVolumeMl: 2 },
    dosingRange: { low: "5mg per cycle (entry)", medium: "5–10mg per cycle (standard Khavinson protocol)", high: "10mg per cycle (upper end)", frequency: "Cycled: 5–10mg daily × 10 days, then 4–6 month break (standard Khavinson protocol pattern)" },
    typicalDose: "5–10mg subcutaneous daily × 10 consecutive days, cycled with 4–6 month breaks",
    startDose: "5mg subcutaneous × 3 days to assess tolerance, then standard cycle",
    titrationNote: "Pulse/cycle-based protocol per Khavinson framework. Effects often perceptible during cycle (cognitive, sleep) and persist between cycles.",
    cycle: "**Cycled administration** — 10-day cycles followed by 4–6 month breaks. Same protocol pattern as Epitalon and broader Khavinson class.",
    storage: "Lyophilized: refrigerate. Reconstituted: refrigerate; use within 28–30 days.",
    benefits: [
      "Neuroprotection — reduced neuronal apoptosis under hypoxic and oxidative stress",
      "Cognitive support — memory, attention, processing speed improvements in aged cohorts",
      "Antioxidant effects in brain tissue",
      "Stress resistance in animal models",
      "Sleep architecture support (secondary to Epitalon's stronger pineal effects)",
      "Pairs naturally with Epitalon (different brain region focus), Cortagen (cortex bioregulator), and broader Khavinson class",
      "Pulse-dosing protocol — minimal total exposure with sustained effects",
      "Russian clinical research backing for cognitive aging contexts",
    ],
    sideEffects: [
      "Generally well tolerated in published research and real-world use",
      "Subcutaneous injection site reactions uncommon",
      "Vivid dreams during administration cycle (mild pineal-axis effect)",
      "No documented serious adverse effects in Khavinson laboratory research",
      "Long-term Western independent safety data limited",
    ],
    stacksWith: ["epitalon", "cortagen", "vesugen", "lions-mane"],
    warnings: [
      "Western evidence base limited (same caveat as Epitalon and broader Khavinson class)",
      "Pregnancy — no safety data; avoid",
      "Lactation — no safety data; avoid",
      "Pediatric — no use case established",
      "Active malignancy — coordinate with oncologist; gene-regulatory short peptide effects on tumor biology not extensively characterized",
      "Concurrent immunosuppressants — coordinate with prescriber",
      "Quality control — research peptide quality varies; verify potency via vendor COA where available",
      "Athletes subject to drug testing — falls under WADA peptide hormone restrictions",
    ],
    sourcingNotes:
      "Research peptide; not FDA-approved. Less commercially common than Epitalon (smaller market). Reputable research peptide vendors. Cost: ~$60–120 per 10mg vial.",
    notes:
      "## Pinealon vs Epitalon — Distinct Despite Similar Class\nBoth are Khavinson short peptide bioregulators but address different priorities:\n\n**Epitalon (tetrapeptide AEDG):**\n- Pineal gland focus, melatonin pathway restoration\n- Telomerase activation (the most-cited mechanism)\n- Sleep / circadian rhythm primary use case\n- Most extensively researched Khavinson compound\n\n**Pinealon (tripeptide EDR):**\n- Broader CNS focus despite the 'Pinealon' name\n- Neuroprotection and cognitive effects primary use case\n- Antioxidant brain tissue effects\n- Less famous than Epitalon but mechanistically distinct\n\nThe two are commonly run together in Khavinson protocols — addressing pineal/sleep (Epitalon) + broader CNS/cognitive (Pinealon).\n\n## Beginner Protocol\n5mg subQ × 3 days (tolerance), then 5–10mg subQ daily × remaining 10 days. Wait 4–6 months before next cycle. Track: cognitive function, memory, attention, sleep quality, subjective wellbeing.\n\n## Advanced Protocol\n**Khavinson cognitive bioregulator combination:** Pinealon 5mg subQ daily × 10 days + Cortagen 5mg subQ daily × 10 days (concurrent or staggered). The two address different CNS regions — Pinealon broader CNS, Cortagen cortex-specific — and combine for comprehensive cognitive bioregulator coverage.\n\n**Comprehensive Khavinson stack:** Pinealon + Cortagen + Epitalon + Vesugen + Cardiogen on staggered cycles across the year. The Khavinson framework supports multi-bioregulator combinations.\n\n**Cognitive longevity stack integration:** Pinealon 5mg subQ × 10-day cycles + Lion's Mane 1000mg/day continuous + Alpha-GPC 600mg/day continuous + Bacopa Monnieri continuous + omega-3 high-DHA + B-complex methylated. The Khavinson bioregulator pulse-dosing layered onto continuous nootropic foundation.\n\n## Reconstitution + Administration\nLyophilized 10mg vial. Reconstitute with 2mL bacteriostatic water → 5mg/mL working concentration. Subcutaneous or intramuscular injection. Refrigerate reconstituted; use within 28–30 days.\n\n## Synergies\n**Epitalon:** complementary Khavinson bioregulator (pineal vs broader CNS focus). **Cortagen:** complementary brain region (cortex specific). **Vesugen:** complementary system (vascular). **Lion's Mane:** complementary cognitive mechanism (NGF/BDNF). **Alpha-GPC / CDP-Choline:** complementary cholinergic mechanism. **NAD precursors:** different longevity pathway.\n\n## Clinical Trial Citations Worth Knowing\nKhavinson laboratory publications on Pinealon's neuroprotective effects (multiple Russian-language papers). Animal model evidence for cognitive improvements in aged cohorts. Western independent replication limited (same pattern as broader Khavinson class).\n\n## Evidence Quality\nSame quality framework as Epitalon and broader Khavinson class — mechanistically grounded, Russian research base, Western replication gap. The neuroprotective effects have animal model support; human clinical evidence is primarily Russian and observational/small-trial.\n\n## Research vs Anecdote\nResearch: solid Khavinson laboratory base; neuroprotection mechanism plausible; cognitive effects in aged cohorts. Anecdote: less extensive use than Epitalon in longevity community (smaller commercial market); subjective cognitive effects often perceptible during cycles. Decision frame: complementary to Epitalon for users running comprehensive Khavinson stacks; useful cognitive bioregulator option; pulse-cycle protocol; same evidence-quality caveats as broader Khavinson class.",
    tags: ["pinealon", "EDR", "Glu-Asp-Arg", "Khavinson", "bioregulator", "neuroprotection", "cognitive", "tripeptide", "St. Petersburg Institute"],
    tier: "entry",
  },

  {
    id: "vesugen",
    name: "Vesugen",
    aliases: ["KED", "Lys-Glu-Asp", "Khavinson vascular bioregulator"],
    category: ["Khavinson Bioregulators", "Cardiovascular", "Longevity", "Bioregulator"],
    categories: ["Khavinson Bioregulators", "Cardiovascular", "Longevity", "Bioregulator"],
    route: ["subcutaneous", "intramuscular", "intranasal"],
    mechanism:
      "Synthetic tripeptide with the sequence **Lysyl-Glutamyl-Aspartyl (Lys-Glu-Asp / KED)**, developed by the Khavinson laboratory as a vascular tissue bioregulator. The compound targets endothelial function and vascular wall integrity — addressing the vascular component of comprehensive systemic bioregulation. **Mechanism — gene-regulatory short peptide**: same Khavinson framework as Epitalon and Pinealon. Vesugen's gene targets are characterized as relating to endothelial cell function, vascular smooth muscle homeostasis, and vascular wall integrity. **Mechanism — endothelial function**: improved endothelial nitric oxide production, reduced endothelial dysfunction markers, improved vasodilator responsiveness in animal and limited human studies. Endothelial dysfunction is a foundational mechanism in atherosclerosis, hypertension, and cerebrovascular disease — Vesugen's targeting is conceptually sound for vascular aging contexts. **Mechanism — atherosclerosis effects**: reduced atherosclerotic plaque progression in animal models per Khavinson research; modulation of inflammatory and lipid markers. **Mechanism — cerebrovascular effects**: improved cerebral blood flow in cerebrovascular disease contexts per Russian clinical research; potential applications in vascular cognitive impairment / vascular dementia. **Mechanism — broader vascular health**: peripheral vascular function support, microcirculation effects, possible benefits in diabetic vascular complications. **Pharmacokinetics**: short tripeptide; rapid plasma clearance; gene-regulatory effects sustained days to weeks per cycle.",
    halfLife: "Plasma half-life ~30 minutes; biological effects sustained days to weeks per cycle",
    reconstitution: { solvent: "Bacteriostatic Water", typicalVialMg: 10, typicalVolumeMl: 2 },
    dosingRange: { low: "3–5mg per cycle (entry)", medium: "5–10mg per cycle (standard)", high: "10mg per cycle", frequency: "Cycled: 5–10mg daily × 10 days, 4–6 month breaks" },
    typicalDose: "5–10mg subcutaneous daily × 10 consecutive days, cycled",
    startDose: "5mg subcutaneous × 3 days, then standard cycle",
    titrationNote: "Pulse/cycle-based per Khavinson framework. Vascular effects accumulate over cycles; subjective response often subtle (cardiovascular markers more informative than subjective response).",
    cycle: "10-day cycles followed by 4–6 month breaks — standard Khavinson pattern.",
    storage: "Lyophilized: refrigerate. Reconstituted: refrigerate; use within 28–30 days.",
    benefits: [
      "Endothelial function support — improved nitric oxide production, vasodilator responsiveness",
      "Atherosclerosis modulation in animal models",
      "Cerebrovascular flow improvements per Russian clinical research",
      "Microcirculation effects",
      "Vascular smooth muscle homeostasis",
      "Pairs naturally with Epitalon, Pinealon, Cortagen, Cardiogen in comprehensive Khavinson stacks",
      "Cardiovascular complement to broader longevity protocols",
      "Pulse-dosing protocol — minimal total exposure",
    ],
    sideEffects: [
      "Generally well tolerated in published research and real-world use",
      "Subcutaneous injection site reactions uncommon",
      "Mild flushing or warmth post-injection in some users (vasodilator effect)",
      "No documented serious adverse effects",
      "Long-term Western independent safety data limited (same Khavinson-class caveat)",
    ],
    stacksWith: ["epitalon", "pinealon", "cardiogen", "cortagen"],
    warnings: [
      "Western evidence base limited (Khavinson-class caveat)",
      "Pregnancy — no safety data; avoid",
      "Lactation — no safety data; avoid",
      "Pediatric — no use case established",
      "Concurrent vasodilator medications (nitrates, calcium channel blockers, alpha-blockers) — additive effects possible; coordinate with prescriber",
      "Concurrent anticoagulants — modest theoretical additive effects; coordinate with prescriber",
      "Hypotension — may worsen at high doses",
      "Active vascular disease — coordinate with cardiologist for comprehensive vascular management; bioregulator use is adjunct, not replacement for evidence-supported cardiovascular pharmacology",
      "Quality control — research peptide quality varies",
      "Athletes — WADA peptide hormone restrictions apply",
    ],
    sourcingNotes:
      "Research peptide; not FDA-approved. Less commercially common than Epitalon. Reputable research peptide vendors. Cost: ~$60–120 per 10mg vial.",
    notes:
      "## Vesugen Use Cases\n**Vascular aging / atherosclerosis context:** Vesugen 5–10mg subQ × 10 days, cycled. Adjunct to comprehensive cardiovascular risk management (lipid management, blood pressure control, statin/Lp(a) management as indicated, omega-3, lifestyle foundation).\n\n**Cerebrovascular health:** Vesugen + standard cerebrovascular management. The Russian clinical research includes vascular cognitive impairment contexts.\n\n**Comprehensive Khavinson cardiovascular pillar:** Vesugen (vascular) + Cardiogen (cardiac muscle) — paired bioregulator approach for cardiovascular system coverage.\n\n## Beginner Protocol\n5mg subQ × 3 days (tolerance), then 5–10mg daily × remaining 10 days. Cycled with 4–6 month breaks. Track cardiovascular markers (BP, lipid panel, hsCRP) at baseline and 6–12 weeks post-cycle if relevant; subjective response often subtle.\n\n## Advanced Protocol\n**Cardiovascular Khavinson stack:** Vesugen + Cardiogen on concurrent or staggered 10-day cycles. Adjunct to comprehensive cardiovascular care under prescriber coordination.\n\n**Comprehensive Khavinson combination:** Epitalon + Pinealon + Cortagen + Vesugen + Cardiogen — full systemic bioregulator coverage. Stagger across the year (one per quarter) or run together × 10 days then 4–6 month break.\n\n**Longevity stack integration:** Vesugen layered with NAD precursors, senolytic class, mitochondrial pillar, comprehensive HRT for multi-mechanism longevity coverage.\n\n## Reconstitution + Administration\nLyophilized 10mg vial. Reconstitute with 2mL bacteriostatic water. Subcutaneous or intramuscular. Refrigerate reconstituted; use within 28–30 days.\n\n## Synergies\n**Cardiogen:** complementary Khavinson cardiovascular bioregulator (vascular + cardiac muscle pairing). **Epitalon / Pinealon / Cortagen:** comprehensive Khavinson stack. **Omega-3 high EPA/DHA:** complementary cardiovascular mechanism. **Statin therapy (where indicated):** different mechanism, complementary. **Standard cardiovascular pharmacology:** bioregulator is adjunct, not replacement.\n\n## Clinical Trial Citations Worth Knowing\nKhavinson laboratory publications on Vesugen's vascular effects (multiple Russian-language papers). Animal model evidence for atherosclerosis modulation. Limited Western independent replication.\n\n## Evidence Quality\nSame Khavinson-class evidence framework. Mechanistically grounded for endothelial function and vascular health applications. Russian research base; Western replication gap.\n\n## Research vs Anecdote\nResearch: Khavinson laboratory base; mechanism plausible for endothelial / vascular effects. Anecdote: limited Western longevity community use vs Epitalon; pulse-cycle protocol fits varied longevity stacks; subjective response subtle. Decision frame: cardiovascular complement in comprehensive Khavinson protocols; reasonable empirical inclusion for users running multi-bioregulator stacks; same evidence-quality caveats; not a replacement for evidence-supported cardiovascular pharmacology in users with established cardiovascular disease.",
    tags: ["vesugen", "KED", "Lys-Glu-Asp", "Khavinson", "bioregulator", "vascular", "endothelial", "cardiovascular", "tripeptide"],
    tier: "entry",
  },

  {
    id: "cardiogen",
    name: "Cardiogen",
    aliases: ["AEDR", "Ala-Glu-Asp-Arg", "Khavinson cardiac bioregulator"],
    category: ["Khavinson Bioregulators", "Cardiovascular", "Longevity", "Bioregulator"],
    categories: ["Khavinson Bioregulators", "Cardiovascular", "Longevity", "Bioregulator"],
    route: ["subcutaneous", "intramuscular", "intranasal"],
    mechanism:
      "Synthetic tetrapeptide with the sequence **Alanyl-Glutamyl-Aspartyl-Arginyl (Ala-Glu-Asp-Arg / AEDR)**, developed by the Khavinson laboratory as a cardiac tissue bioregulator. While Vesugen targets vascular tissue, Cardiogen targets cardiomyocyte function and cardiac tissue homeostasis — addressing the cardiac muscle component of comprehensive cardiovascular bioregulation. **Mechanism — gene-regulatory short peptide**: Khavinson framework. Cardiogen's gene targets are characterized as relating to cardiomyocyte function, cardiac contractile machinery, and cardiac tissue integrity. **Mechanism — cardiomyocyte function**: improved cardiac contractile function in animal models, reduced cardiomyocyte apoptosis under stress, modulation of cardiac inflammatory markers. **Mechanism — heart failure / cardiac aging contexts**: Russian clinical research includes cardiac aging and chronic heart failure adjunct contexts. The bioregulator framework treats cardiac decline as gene-regulatory addressable, complementary to standard heart failure pharmacology. **Mechanism — ischemia-reperfusion protection**: cardioprotective effects in ischemia-reperfusion animal models per Khavinson laboratory research. **Mechanism — arrhythmia modulation**: emerging evidence for arrhythmia-stabilizing effects in some research contexts. **Pharmacokinetics**: short tetrapeptide; rapid plasma clearance; gene-regulatory effects sustained days to weeks per cycle.",
    halfLife: "Plasma half-life ~30 minutes; biological effects sustained days to weeks per cycle",
    reconstitution: { solvent: "Bacteriostatic Water", typicalVialMg: 10, typicalVolumeMl: 2 },
    dosingRange: { low: "3–5mg per cycle (entry)", medium: "5–10mg per cycle (standard)", high: "10mg per cycle", frequency: "Cycled: 5–10mg daily × 10 days, 4–6 month breaks" },
    typicalDose: "5–10mg subcutaneous daily × 10 consecutive days, cycled",
    startDose: "5mg subcutaneous × 3 days, then standard cycle",
    titrationNote: "Pulse/cycle-based protocol. Cardiac effects best assessed via objective markers (echo, BNP/NT-proBNP if relevant) over multiple cycles rather than subjective response.",
    cycle: "10-day cycles, 4–6 month breaks. Standard Khavinson pattern.",
    storage: "Lyophilized: refrigerate. Reconstituted: refrigerate; use within 28–30 days.",
    benefits: [
      "Cardiomyocyte function support",
      "Reduced cardiomyocyte apoptosis under stress",
      "Cardiac contractile function improvements (animal models)",
      "Ischemia-reperfusion protection",
      "Cardiac aging support per Russian clinical research",
      "Pairs naturally with Vesugen for comprehensive cardiovascular bioregulator coverage (vascular + cardiac muscle)",
      "Adjunct to standard cardiac care under prescriber coordination",
      "Pulse-dosing protocol — minimal total exposure",
    ],
    sideEffects: [
      "Generally well tolerated",
      "Subcutaneous injection site reactions uncommon",
      "No documented serious adverse effects",
      "Long-term Western independent safety data limited",
    ],
    stacksWith: ["vesugen", "epitalon", "pinealon", "ss-31", "coq10"],
    warnings: [
      "Western evidence base limited (Khavinson-class caveat)",
      "Pregnancy — no safety data; avoid",
      "Lactation — no safety data; avoid",
      "Pediatric — no use case established",
      "Active heart failure — coordinate with cardiologist; bioregulator is adjunct to evidence-supported heart failure pharmacology, not replacement",
      "Active arrhythmia — coordinate with prescriber; emerging evidence for arrhythmia-stabilizing effects but not validated as antiarrhythmic therapy",
      "Recent acute coronary syndrome — defer use; coordinate cardiac recovery with cardiologist",
      "Quality control — research peptide quality varies",
      "Athletes — WADA peptide hormone restrictions apply",
    ],
    sourcingNotes:
      "Research peptide; not FDA-approved. Less commercially common than Epitalon. Reputable research peptide vendors. Cost: ~$60–120 per 10mg vial.",
    notes:
      "## Cardiogen Use Cases\n**Cardiac aging / cardiac longevity context:** Cardiogen 5–10mg subQ × 10 days, cycled. Adjunct to comprehensive cardiovascular health management.\n\n**Heart failure adjunct (under cardiologist coordination):** Cardiogen as adjunct to standard heart failure pharmacology (beta-blockers, ACE inhibitors / ARBs / ARNIs, MRAs, SGLT2 inhibitors). Not a replacement for evidence-supported HF therapy. Pairs with Q-SYMBIO-protocol CoQ10/Ubiquinol 100mg TID and SS-31 (Forzinity for Barth syndrome; research-grade for general cardiac mitochondrial support).\n\n**Comprehensive cardiovascular Khavinson pillar:** Vesugen (vascular) + Cardiogen (cardiac muscle) on concurrent or staggered 10-day cycles. The pairing addresses both vascular and cardiac muscle components.\n\n## Beginner Protocol\n5mg subQ × 3 days (tolerance), then 5–10mg subQ daily × remaining 10 days. 4–6 month breaks between cycles. Track cardiac markers (echo, BNP, exercise capacity) over multiple cycles for objective assessment.\n\n## Advanced Protocol\n**Comprehensive cardiac longevity stack:** Cardiogen 10-day cycles + Vesugen 10-day cycles (concurrent or staggered) + SS-31 5–10mg subQ 3× weekly (cardiolipin/mitochondrial support — Forzinity-grade if available) + CoQ10/Ubiquinol 200mg/day continuous + omega-3 high-EPA/DHA 2–4g/day continuous + targeted cardiovascular pharmacology as indicated.\n\n**Heart failure adjunct comprehensive protocol:** Cardiogen + Vesugen + SS-31 + CoQ10 (Q-SYMBIO 100mg TID = 300mg/day) + Q-SYMBIO-supported pharmacological foundation. Coordinate all components with cardiologist.\n\n## Reconstitution + Administration\nLyophilized 10mg vial. Reconstitute with 2mL bacteriostatic water. Subcutaneous or intramuscular. Refrigerate reconstituted; use within 28–30 days.\n\n## Synergies\n**Vesugen:** complementary Khavinson cardiovascular bioregulator (vascular + cardiac muscle). **SS-31:** complementary mitochondrial cardiac support (cardiolipin). **CoQ10/Ubiquinol:** ETC substrate. **Standard cardiac pharmacology:** bioregulator is adjunct.\n\n## Clinical Trial Citations Worth Knowing\nKhavinson laboratory publications on Cardiogen's cardiac effects. Animal model evidence for ischemia-reperfusion protection. Limited Western independent replication.\n\n## Evidence Quality\nSame Khavinson-class framework. Cardiomyocyte function effects mechanistically grounded; clinical translation primarily Russian.\n\n## Research vs Anecdote\nResearch: Khavinson laboratory base; mechanism plausible. Anecdote: limited Western longevity community use; pulse-cycle protocol fits varied stacks. Decision frame: cardiac complement to Vesugen in comprehensive Khavinson cardiovascular coverage; adjunct to standard cardiac care; same Khavinson-class evidence caveats.",
    tags: ["cardiogen", "AEDR", "Ala-Glu-Asp-Arg", "Khavinson", "bioregulator", "cardiac", "cardiomyocyte", "cardiovascular", "tetrapeptide"],
    tier: "entry",
  },

  {
    id: "cortagen",
    name: "Cortagen",
    aliases: ["AEDP", "Ala-Glu-Asp-Pro", "Khavinson cortex bioregulator"],
    category: ["Khavinson Bioregulators", "Cognitive", "Longevity", "Bioregulator"],
    categories: ["Khavinson Bioregulators", "Cognitive", "Longevity", "Bioregulator"],
    route: ["subcutaneous", "intramuscular", "intranasal"],
    mechanism:
      "Synthetic tetrapeptide with the sequence **Alanyl-Glutamyl-Aspartyl-Prolyl (Ala-Glu-Asp-Pro / AEDP)**, developed by the Khavinson laboratory as a brain cortex tissue bioregulator. The compound complements Pinealon (broader CNS bioregulator) by specifically targeting cortical function — relevant for higher cognitive functions including executive function, working memory, and complex reasoning. **Mechanism — gene-regulatory short peptide**: Khavinson framework. Cortagen's gene targets are characterized as relating to cortical neuronal function, synaptic plasticity in cortical circuits, and cognitive resilience. **Mechanism — cognitive function (the central application)**: Khavinson laboratory research demonstrates Cortagen's effects on memory, attention, executive function, and recovery from cognitive insults. The cortex-specific targeting positions Cortagen for higher-order cognitive applications — complementary to Pinealon's broader CNS effects. **Mechanism — neuroplasticity**: synaptic plasticity support in cortical networks; possible relevance for cognitive recovery contexts (post-stroke, post-TBI, age-related cognitive decline). **Mechanism — anti-aging cognitive applications**: cognitive aging in healthy adults — the typical longevity-community use case. **Pharmacokinetics**: short tetrapeptide; rapid plasma clearance; gene-regulatory effects sustained per cycle.",
    halfLife: "Plasma half-life ~30 minutes; biological effects sustained per cycle",
    reconstitution: { solvent: "Bacteriostatic Water", typicalVialMg: 10, typicalVolumeMl: 2 },
    dosingRange: { low: "3–5mg per cycle (entry)", medium: "5–10mg per cycle (standard)", high: "10mg per cycle", frequency: "Cycled: 5–10mg daily × 10 days, 4–6 month breaks" },
    typicalDose: "5–10mg subcutaneous daily × 10 consecutive days, cycled",
    startDose: "5mg subcutaneous × 3 days, then standard cycle",
    titrationNote: "Pulse/cycle-based protocol. Cognitive effects often perceptible during cycle.",
    cycle: "10-day cycles, 4–6 month breaks. Standard Khavinson pattern.",
    storage: "Lyophilized: refrigerate. Reconstituted: refrigerate; use within 28–30 days.",
    benefits: [
      "Cortex-specific cognitive function support",
      "Executive function, working memory, complex reasoning",
      "Synaptic plasticity in cortical networks",
      "Cognitive recovery contexts (post-stroke, post-TBI, age-related decline)",
      "Pairs naturally with Pinealon (broader CNS) for comprehensive cognitive bioregulator coverage",
      "Russian clinical research backing for cognitive aging",
      "Pulse-dosing protocol",
    ],
    sideEffects: [
      "Generally well tolerated",
      "Subcutaneous injection site reactions uncommon",
      "No documented serious adverse effects",
      "Long-term Western independent safety data limited",
    ],
    stacksWith: ["pinealon", "epitalon", "lions-mane", "alpha-gpc"],
    warnings: [
      "Western evidence base limited (Khavinson-class caveat)",
      "Pregnancy — no safety data; avoid",
      "Lactation — no safety data; avoid",
      "Pediatric — no use case established",
      "Active malignancy — coordinate with oncologist",
      "Quality control — research peptide quality varies",
      "Athletes — WADA peptide hormone restrictions apply",
    ],
    sourcingNotes:
      "Research peptide; not FDA-approved. Less commercially common than Epitalon. Reputable research peptide vendors. Cost: ~$60–120 per 10mg vial.",
    notes:
      "## Cortagen Use Cases\n**Cognitive aging context:** Cortagen 5–10mg subQ × 10 days, cycled. Adjunct to comprehensive cognitive aging support (Lion's Mane, Alpha-GPC, Bacopa, omega-3, B-complex).\n\n**Cognitive recovery context (post-stroke, post-TBI):** Cortagen as adjunct to standard rehabilitation; coordinate with neurologist. Russian clinical research includes cognitive recovery applications.\n\n**Comprehensive Khavinson cognitive pillar:** Cortagen (cortex specific) + Pinealon (broader CNS) on concurrent or staggered cycles. The pairing addresses different brain regions for comprehensive cognitive bioregulator coverage.\n\n## Beginner Protocol\n5mg subQ × 3 days (tolerance), then 5–10mg daily × remaining 10 days. 4–6 month breaks between cycles. Track cognitive function (memory, attention, executive function) at baseline and during/after cycles.\n\n## Advanced Protocol\n**Comprehensive cognitive Khavinson stack:** Cortagen + Pinealon (concurrent 10-day cycles) + continuous Lion's Mane + Alpha-GPC or CDP-Choline + Bacopa Monnieri + omega-3 high-DHA + creatine.\n\n**Comprehensive Khavinson combination:** Cortagen + Pinealon + Epitalon + Vesugen + Cardiogen — full systemic bioregulator coverage on staggered cycles across the year.\n\n## Reconstitution + Administration\nLyophilized 10mg vial. Reconstitute with 2mL bacteriostatic water. Subcutaneous or intramuscular. Refrigerate reconstituted; use within 28–30 days.\n\n## Synergies\n**Pinealon:** complementary CNS bioregulator (cortex specific + broader CNS pairing). **Epitalon:** complementary pineal/longevity. **Lion's Mane:** complementary cognitive mechanism (NGF/BDNF). **Alpha-GPC / CDP-Choline:** complementary cholinergic. **Bacopa Monnieri:** complementary cognitive mechanism.\n\n## Clinical Trial Citations Worth Knowing\nKhavinson laboratory publications on Cortagen's cognitive effects. Animal model evidence for cortex-specific cognitive improvements. Limited Western independent replication.\n\n## Evidence Quality\nSame Khavinson-class framework. Cortex-specific targeting mechanistically reasonable; clinical translation primarily Russian.\n\n## Research vs Anecdote\nResearch: Khavinson laboratory base. Anecdote: limited Western longevity community use vs Epitalon; subjective cognitive effects often perceptible during cycles. Decision frame: cortex-specific cognitive complement to Pinealon in comprehensive Khavinson protocols; pairs with continuous nootropic foundation; same Khavinson-class evidence caveats.",
    tags: ["cortagen", "AEDP", "Ala-Glu-Asp-Pro", "Khavinson", "bioregulator", "cortex", "cognitive", "tetrapeptide"],
    tier: "entry",
  },
];
