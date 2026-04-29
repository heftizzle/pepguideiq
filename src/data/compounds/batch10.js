/** Batch 10 — Khavinson Bioregulators expansion + named protocols.
 *
 *  Net-new Cytamins (organ targets the catalog was missing as of Apr 2026):
 *    Pielotax (kidney) · Chitomur (bladder) · Zhenoluten (ovary)
 *    Glandokort (adrenal) · Bonothyrk (parathyroid)
 *
 *  Named multi-Cytamin functional protocols (catalog-tile equivalents to
 *  KLOW/GLOW/Wolverine — defined units users would search for as a stack):
 *    Endocrine Triad Bioregulator Protocol
 *    Cardiovascular Bioregulator Protocol
 *    Cognitive Bioregulator Protocol
 *
 *  Schema matched to BATCH7/8/9 — long-form `mechanism` + rich `notes` field
 *  with 9-section structure (mechanism, dosing protocols, reconstitution,
 *  half-life/timing, synergies, contraindications, side effects, beginner
 *  vs advanced, research vs anecdote). 800+ words/compound floor.
 *
 *  Naming policy: chemical / INN / Khavinson A-number names only. No vendor
 *  or proprietary brand names anywhere in compound copy.
 */
export const BATCH10 = [
  // ============================================================================
  // SECTION 1 — New Khavinson Cytamins (5)
  // ============================================================================

  {
    id: "pielotax",
    name: "Pielotax",
    aliases: ["A-9", "Kidney Bioregulator", "Renal Cytamin"],
    category: ["Khavinson Bioregulators", "Longevity"],
    categories: ["Khavinson Bioregulators", "Longevity"],
    route: ["oral"],
    mechanism:
      "Renal-targeted Cytamin from young bovine kidney cortex tissue. Like all Cytamins in the Khavinson catalog, Pielotax is a peptide complex composed predominantly of di- and tripeptide fragments produced by controlled enzymatic hydrolysis of kidney parenchyma. The proposed mechanism — developed at the St. Petersburg Institute of Bioregulation and Gerontology — is tissue-specific bioregulation: short peptide fragments cross intestinal epithelium intact (at least partially), reach renal tissue via systemic circulation, and bind to histone-displaced regions of DNA promoter zones in renal cortical cells, modulating transcription of cell-type-specific gene programs that decline with aging. Targets include nephron tubular epithelial cells, mesangial cells, and renal vascular endothelium. Khavinson's group has published radiolabeled tracer data suggesting partial intestinal absorption and tissue-specific accumulation; Western mechanistic confirmation remains limited. The clinical-effect endpoint — modest improvements in glomerular filtration markers and tubular reabsorption efficiency in aged cohorts — has been observed in Russian elderly studies but not independently replicated by major Western nephrology research groups. Treat the mechanism as plausible-but-unsettled. Conceptually distinct from receptor-agonist therapeutics (GLP-1 agonists, GHRH analogs): Cytamins are proposed to act as transcriptional modulators selective for the tissue of origin. Whether this hypothesis is biologically accurate at the molecular level remains debated; the supporting clinical signal sits primarily in Khavinson's 12-year mortality reduction cohort (published 2011) and per-organ subgroup data with limited statistical power.",
    halfLife: "Constituent peptide fragments: minutes to hours plasma residence. Downstream effects via gene-expression modulation outlast plasma concentration.",
    reconstitution: { solvent: "N/A — oral capsule", typicalVialMg: null, typicalVolumeMl: null },
    dosingRange: { low: "2 caps/day", medium: "4 caps/day", high: "4 caps/day", frequency: "Split AM + PM with meals, 20–30 day course, 1–2 courses/year" },
    typicalDose: "2 capsules AM + 2 capsules PM with food",
    startDose: "1 capsule AM + 1 capsule PM × 3 days to assess GI tolerance, then standard dose",
    titrationNote: "Course-based protocol — minimal titration. If GI sensitivity, drop to AM-only for one week then add PM dose.",
    cycle: "20–30 days on, 4–6 months off. Khavinson protocol cadence: 2 courses per year, traditionally spring + autumn.",
    storage: "Room temperature, dry, away from direct light",
    benefits: [
      "Renal cortical cell gene-expression support per Khavinson framework",
      "Adjunctive use in early-stage CKD (stages 2–3) under nephrologist supervision",
      "Potential support post-AKI recovery contexts",
      "Course-based — no daily long-term commitment required",
      "Stacks naturally with vascular Cytamins for the vascular-renal axis",
    ],
    sideEffects: [
      "Mild GI discomfort in <5% of users (Russian cohort data)",
      "No reports of allergic reactions to bovine peptide complex in published Russian data; users with bovine allergy should still avoid",
      "Theoretical: any compound modulating renal cell gene expression warrants creatinine monitoring if baseline is elevated",
    ],
    stacksWith: ["ventfort", "vesugen", "vesilute", "klotho", "ss-31"],
    warnings: [
      "End-stage renal disease on dialysis — no data, coordinate with nephrologist before any use",
      "Renal transplant recipients — immunosuppressive drug interactions unstudied, avoid",
      "Pregnancy and lactation — no safety data",
      "Pediatric — no safety data",
      "Not a substitute for ACE inhibitors, ARBs, SGLT-2 inhibitors, or other evidence-based CKD therapies",
    ],
    sourcingNotes:
      "Available from Khavinson bioregulator distributors and select research peptide channels under product code A-9 or 'Kidney Cytamin.' The Cytamin supply chain has consolidated around a small number of producers; grey-market knockoffs are common. Look for St. Petersburg Institute of Bioregulation and Gerontology lineage or licensed manufacturer markings. Third-party CoA is rare for this class — sourcing trust matters more than batch testing.",
    notes:
      "## Beginner Protocol\nOne 30-day course: 2 capsules AM + 2 capsules PM with meals. Bracket with comprehensive metabolic panel (creatinine, BUN, eGFR), cystatin C, and urine albumin-to-creatinine ratio at start and 60 days post-course. Most users will not see dramatic lab changes from a single course — gene-expression effects are cumulative across protocol years, not acute. The protocol's value lies in semi-annual repetition, not single-cycle response.\n\n## Advanced Protocol\nQuarterly courses for users with stable CKD stage 2–3 under nephrologist supervision. Stack with Ventfort (vascular Cytamin) and Vesugen (synthetic vascular tripeptide KED) for combined vascular-renal axis coverage — a meaningful overlap with hypertensive nephropathy and diabetic kidney disease pathways. Layer in CoQ10 / Ubiquinol 200mg daily, omega-3 EPA/DHA 2g daily, and L-citrulline 3g for endothelial NO support. For users running advanced longevity stacks, recombinant Klotho protein and SS-31 (Elamipretide) target overlapping mitochondrial-renal pathways at significantly higher cost and complexity.\n\n## Reconstitution + Administration\nN/A — oral capsule format. Take with food to minimize the rare GI sensitivity. Consistent timing (same window AM + PM) supports protocol adherence, but missing a dose by a few hours does not meaningfully alter the protocol since effects are cumulative gene-expression-mediated rather than plasma-concentration-dependent.\n\n## Synergies (Detail)\nVentfort + Vesugen: vascular-renal axis. CoQ10: renal mitochondrial support. SS-31: mitochondrial cardiolipin protection in tubular cells. Klotho: phosphate-FGF23 axis modulation, renal-aging-relevant. Citrulline: arginine-NO precursor for endothelial function.\n\n## Evidence Quality\nLimited Russian clinical data, primarily from a single research lineage. No major Western replication. Anecdotal user reports are mixed: many report subjective wellbeing improvement and stable creatinine over time, fewer report objective lab changes within a single course. The strongest evidence base is for the Cytamin class as a whole rather than Pielotax specifically — kidney-targeted Cytamin data is sparser than data for the more commonly studied compounds like Endoluten or Visoluten.\n\n## Research vs Anecdote\nResearch claim: tissue-specific renal cell gene expression modulation produces measurable improvements in renal function markers in elderly cohorts. Anecdote: most users report no dramatic acute effect; the value is positioned as long-term cellular maintenance rather than short-term symptom relief. For users seeking evidence-based kidney protection, SGLT-2 inhibitors and ACE inhibitors / ARBs remain the gold standard. Pielotax is best understood as a low-risk longevity adjunct, not a primary CKD intervention. Decision frame: if labs are stable and the user is interested in cellular-maintenance protocols, Pielotax is reasonable; if labs are deteriorating or there is active kidney disease, prioritize the conventional evidence-based interventions first.",
    tags: ["Khavinson", "kidney", "renal", "Cytamin", "bioregulator", "longevity", "oral", "course-based", "A-9"],
    tier: "entry",
  },

  {
    id: "chitomur",
    name: "Chitomur",
    aliases: ["A-12", "Bladder Bioregulator", "Urothelium Cytamin"],
    category: ["Khavinson Bioregulators"],
    categories: ["Khavinson Bioregulators"],
    route: ["oral"],
    mechanism:
      "Bladder/urothelium Cytamin from young bovine bladder tissue. Peptide complex extracted via controlled enzymatic hydrolysis — predominantly di- and tripeptide fragments. Proposed mechanism follows the Khavinson framework: short peptide fragments reach urothelial cells via systemic circulation and modulate gene expression in transitional epithelium (the urothelium), which lines the bladder lumen and provides the GAG-layer barrier function preventing urine from interacting with bladder muscle. Khavinson's clinical interest in urothelial cytology pre-dates much Western interest in interstitial cystitis (IC) and bladder pain syndrome — his group has published on cellular markers of urothelial aging since the 1990s. The pathophysiologic hypothesis: age-related urothelial barrier dysfunction (GAG layer thinning, tight-junction loss, reduced cellular turnover) contributes to chronic bladder symptoms, and tissue-specific peptide bioregulation can support cellular renewal in this layer. The mechanism is plausible at the cellular biology level; whether oral peptide delivery achieves enough urothelial concentration to matter clinically remains an open question outside Russian-language literature. The bladder is a relatively niche organ in the Khavinson catalog — Cytamin data on urothelium specifically is sparser than data on more-studied tissues like brain (Cerluten/Cortagen), pineal (Endoluten), or thymus (Vladonix/Thymalin).",
    halfLife: "Constituent peptides: minutes to hours plasma. Effects via gene-expression modulation extend longer.",
    reconstitution: { solvent: "N/A — oral capsule", typicalVialMg: null, typicalVolumeMl: null },
    dosingRange: { low: "2 caps/day", medium: "4 caps/day", high: "4 caps/day", frequency: "Split AM + PM with meals, 20–30 day course" },
    typicalDose: "2 capsules AM + 2 capsules PM with food",
    startDose: "1 capsule AM + 1 capsule PM × 3 days, then standard",
    titrationNote: "Course-based, minimal titration. If urinary symptoms worsen during dosing, pause and reassess — Cytamins do not treat infection.",
    cycle: "20–30 days on, 4–6 months off. Repeat 1–2× per year.",
    storage: "Room temperature, dry",
    benefits: [
      "Urothelial barrier cellular support per Khavinson framework",
      "Adjunctive in chronic cystitis or interstitial cystitis (IC) alongside conventional therapy",
      "Post-procedural bladder mucosa support (e.g., post-cystoscopy, post-TURP, post-radiation)",
      "Course-based — no chronic daily commitment",
    ],
    sideEffects: [
      "Mild GI effects rare",
      "Theoretical caution: bladder-tissue peptide modulation in users with active urothelial malignancy is unstudied — avoid",
    ],
    stacksWith: ["bpc-157", "kpv", "stamakort"],
    warnings: [
      "Active bladder cancer or history of bladder cancer (TCC, urothelial carcinoma) — not studied, avoid",
      "Active recurrent UTI — Chitomur is not antimicrobial; treat the infection first, then consider adjunctive cellular support",
      "Pregnancy and lactation — no safety data",
      "Not a substitute for urological evaluation in chronic bladder symptoms — IC, neurogenic bladder, BPH-related obstruction need workup",
    ],
    sourcingNotes:
      "Less commonly stocked than the more popular Cytamins (Endoluten, Visoluten, Sigumir). Available from St. Petersburg-linked distributors and select research peptide channels as 'A-12' or 'Bladder Cytamin.' Limited distribution — sourcing patience required.",
    notes:
      "## Beginner Protocol\nOne 30-day course: 2 caps AM + 2 caps PM with meals. For users with chronic cystitis or IC context, bracket with a structured symptom diary tracking urinary urgency, pelvic discomfort severity (0–10), nocturia frequency, and any flare triggers. Most users will not notice acute changes — the value is cumulative across multiple courses, framed as cellular-maintenance rather than symptom-treatment.\n\n## Advanced Protocol\nFor chronic IC users, layer Chitomur with quercetin 500mg twice daily (mast cell stabilization, GAG layer support), aloe vera capsules (mucosal support — IC-formulated products specifically), and BPC-157 250mcg subcutaneous daily for 4 weeks. Add KPV 500mcg subQ daily for systemic NF-κB inhibition / anti-inflammatory coverage. The pelvic-floor PT and dietary trigger management foundation should already be in place — Chitomur is an adjunct to those interventions, not a standalone solution. For post-procedural recovery (post-TURP, post-cystoscopy), one course immediately post-procedure plus a follow-up course at 6 months.\n\n## Reconstitution + Administration\nN/A — oral capsule. With food to minimize rare GI sensitivity. Hydration matters more than usual during a Chitomur course given the urothelial focus — adequate fluid intake supports normal urothelial cycling.\n\n## Synergies (Detail)\nBPC-157: mucosal repair pathways overlap meaningfully. KPV: NF-κB inhibition addresses the inflammatory component of chronic bladder pathology. Stamakort: GI mucosal Cytamin — useful if the user has overlapping gut and bladder inflammatory presentations (the gut-bladder microbiome axis is increasingly recognized).\n\n## Evidence Quality\nLow. Even within the Khavinson catalog, bladder Cytamin data is sparse — the urothelium is a less-studied organ in this peptide framework than brain, pineal, or thymus. Anecdotal user reports from Russian patient communities suggest modest improvement in chronic cystitis symptoms; no formal placebo-controlled Western trials exist.\n\n## Research vs Anecdote\nResearch: claims of urothelial gene-expression modulation are biologically plausible but lack robust Western confirmation. Anecdote: niche use in Russian-speaking biohacker communities for chronic bladder symptoms unresponsive to conventional management. For users with severe IC, the evidence-based interventions (intravesical instillations, low-dose amitriptyline, pentosan polysulfate, pelvic floor PT) remain primary; Chitomur is adjunct only. For users with post-procedural recovery contexts, the case for Chitomur is more conceptual than evidence-based, but the risk-benefit is favorable given the safety profile.",
    tags: ["Khavinson", "bladder", "urothelium", "IC", "interstitial cystitis", "Cytamin", "bioregulator", "oral", "A-12"],
    tier: "entry",
  },

  {
    id: "zhenoluten",
    name: "Zhenoluten",
    aliases: ["A-15", "Ovary Bioregulator", "Female Reproductive Cytamin", "Ovarian Cytamin"],
    category: ["Khavinson Bioregulators"],
    categories: ["Khavinson Bioregulators"],
    route: ["oral"],
    mechanism:
      "Ovarian Cytamin from young bovine ovarian tissue. Peptide complex targeting follicular cells, granulosa cells, theca cells, and ovarian stromal tissue. The Khavinson group's interest in ovarian bioregulation stems from broader work on age-related endocrine decline — ovarian function follows a sharper trajectory than testicular function (menopause vs. gradual andropause), making it a natural target for cellular maintenance protocols. Proposed mechanism: tissue-specific peptide fragments modulate gene expression in granulosa cells (which produce estradiol from androstenedione via aromatase), theca cells (which produce androgens from cholesterol substrate), and ovarian stromal cells supporting the follicular environment. The cellular hypothesis: age-related ovarian decline reflects not just follicle depletion but also reduced cellular function in remaining tissue — and that bioregulation could modestly support remaining ovarian endocrine output, particularly in late-perimenopausal contexts where some follicular reserve remains. Conceptually pairs with Endoluten (pineal Cytamin) for HPG-axis coverage. Western mechanistic data for ovarian Cytamins specifically is essentially absent; the Russian literature covers cellular markers of ovarian aging more thoroughly than reproductive endpoints (cycle restoration, pregnancy rates, AMH change).",
    halfLife: "Hours; downstream effects via gene-expression modulation",
    reconstitution: { solvent: "N/A — oral capsule", typicalVialMg: null, typicalVolumeMl: null },
    dosingRange: { low: "2 caps/day", medium: "4 caps/day", high: "4 caps/day", frequency: "Split AM + PM with meals, 20–30 day course" },
    typicalDose: "2 capsules AM + 2 capsules PM with food",
    startDose: "1 capsule AM + 1 capsule PM × 3 days, then standard",
    titrationNote: "Course-based protocol. Users on hormonal contraception, HRT, or active fertility treatment must coordinate with prescriber before starting.",
    cycle: "20–30 days on, 4–6 months off. Repeat 1–2× per year.",
    storage: "Room temperature, dry",
    benefits: [
      "Ovarian cellular function support per Khavinson framework",
      "Adjunctive in perimenopause and early menopause contexts",
      "Conceptual pairing with Endoluten for HPG-axis cellular coverage",
      "Course-based, no chronic commitment",
    ],
    sideEffects: [
      "Mild GI discomfort rare",
      "Theoretical: hormonally active tissue modulation in users with estrogen-sensitive conditions warrants caution and prescriber coordination",
      "Anecdotal reports of cycle pattern changes in late-perimenopause users — direction varies",
    ],
    stacksWith: ["endoluten", "epitalon", "ovagen"],
    warnings: [
      "Estrogen-sensitive cancer (breast, ovarian, endometrial) — history or active disease, not studied, avoid",
      "Pregnancy and lactation — not for use",
      "Active hormonal therapy (HRT, contraception, fertility treatment) — coordinate with prescriber, do not start without alignment",
      "Postmenopausal users on tamoxifen or aromatase inhibitors — interactions unstudied, avoid",
      "BRCA1/BRCA2 carriers or strong family history of estrogen-sensitive cancers — avoid pending more data",
    ],
    sourcingNotes:
      "Less commonly stocked than male-oriented Cytamins reflecting market patterns. Available from St. Petersburg distributors and select research peptide channels as 'A-15 Zhenoluten' or 'Ovary Cytamin.' Limited distribution.",
    notes:
      "## Beginner Protocol\nOne 30-day course: 2 caps AM + 2 caps PM with meals. Bracket with comprehensive female hormone panel — estradiol, progesterone, FSH, LH, AMH, SHBG — at start and 60 days post-course. Most users will not see dramatic changes from a single course; effects are cumulative across protocol years. For perimenopausal users tracking cycle regularity, a symptom diary covering hot flashes, sleep quality, mood, and cycle pattern is more sensitive than any single-cycle hormone snapshot.\n\n## Advanced Protocol\nFor late-perimenopausal users, layer Zhenoluten with Endoluten (pineal Cytamin) for HPG-axis coverage. Add Ovagen (synthetic liver-ovary tripeptide) to the protocol if not already running — Ovagen targets the same axis from a different angle (synthetic short peptide vs organ-extract complex). For users in early menopause exploring non-HRT longevity protocols, this combination represents a bioregulator-class approach distinct from estradiol replacement — not a substitute for evidence-based HRT but an adjunct framework. Track AMH, inhibin B, and cycle regularity if cycles are still present.\n\n## Reconstitution + Administration\nN/A — oral capsule. With food. Consistent timing supports protocol adherence.\n\n## Synergies (Detail)\nEndoluten: pineal-ovarian axis (melatonin and reproductive function are linked across multiple model systems). Epitalon: synthetic tetrapeptide AEDG with pineal/telomerase activity — complementary mechanism. Ovagen: synthetic hepato-ovarian tripeptide.\n\n## Evidence Quality\nLow. Ovarian Cytamin data within the Khavinson catalog is sparse compared to the more-studied compounds (Endoluten, Visoluten, Vladonix). No Western replication of ovarian-specific endpoints. Anecdotal reports from Russian-speaking users include subjective improvements in cycle regularity, libido, and energy in perimenopausal use, but no controlled Western trials exist.\n\n## Research vs Anecdote\nResearch: ovarian cellular gene expression hypothesis is biologically plausible but unconfirmed in modern Western literature. Anecdote: niche use in female-focused biohacker protocols, often paired with Endoluten and Epitalon. For users seeking evidence-based interventions for perimenopausal symptoms or fertility extension, evidence-based HRT (where appropriate) and lifestyle interventions (sleep, resistance training, dietary adequacy) remain primary. Zhenoluten is an adjunct in a longevity-stack context, not a fertility intervention.",
    tags: ["Khavinson", "ovary", "ovarian", "female", "perimenopause", "menopause", "Cytamin", "bioregulator", "oral", "A-15"],
    tier: "entry",
  },

  {
    id: "glandokort",
    name: "Glandokort",
    aliases: ["A-17", "Adrenal Bioregulator", "Adrenal Cytamin"],
    category: ["Khavinson Bioregulators", "Testosterone Support"],
    categories: ["Khavinson Bioregulators", "Testosterone Support"],
    route: ["oral"],
    mechanism:
      "Adrenal Cytamin from young bovine adrenal cortex tissue. Peptide complex targeting the three zones of the adrenal cortex — zona glomerulosa (aldosterone), zona fasciculata (cortisol), zona reticularis (DHEA / DHEA-S) — plus components of adrenal medullary tissue (catecholamine-producing chromaffin cells). Within the Khavinson framework, Glandokort is one of the more conceptually compelling Cytamins: adrenal exhaustion and HPA-axis dysfunction are common in chronically stressed populations, and the adrenal cortex is a high-cellular-turnover environment where tissue-specific bioregulation is theoretically well-suited. Proposed effects include support for cortisol rhythm normalization (flattened diurnal curve restoration), DHEA / DHEA-S production support in age-related decline, and aldosterone-renin axis stability. Because adrenal output also impacts androgen synthesis (DHEA → androstenedione → testosterone via the adrenal pathway, accounting for ~5% of male testosterone and a larger fraction of female androgen output), Glandokort is sometimes included in TRT-adjacent or post-cycle longevity protocols. Western mechanistic confirmation is sparse; Khavinson's group has published on adrenal cellular aging markers including reduced StAR protein expression and impaired steroidogenic enzyme function.",
    halfLife: "Hours; effects via gene-expression modulation",
    reconstitution: { solvent: "N/A — oral capsule", typicalVialMg: null, typicalVolumeMl: null },
    dosingRange: { low: "2 caps/day", medium: "4 caps/day", high: "4 caps/day", frequency: "Split AM + PM with meals, 20–30 day course" },
    typicalDose: "2 capsules AM + 2 capsules PM with food. Some practitioners shift the second dose to early afternoon (not evening) to avoid theoretical evening cortisol bumps — though no clear evidence of this concern.",
    startDose: "1 capsule AM + 1 capsule PM × 3 days, then standard",
    titrationNote: "Course-based. Users on glucocorticoid therapy (prednisone, dexamethasone, hydrocortisone) coordinate with prescriber before starting.",
    cycle: "20–30 days on, 4–6 months off. Repeat 1–2× per year.",
    storage: "Room temperature, dry",
    benefits: [
      "Adrenal cortical cell support per Khavinson framework",
      "Adjunctive in HPA-axis dysfunction and chronic-stress contexts",
      "DHEA-S production support in age-related decline",
      "Common stack partner for pancreatic and thyroid bioregulators (tri-endocrine support)",
      "Conceptually relevant for users with documented flat cortisol curve or low DHEA-S relative to age",
    ],
    sideEffects: [
      "Mild GI effects rare",
      "Theoretical: altered cortisol or DHEA output could affect sleep or mood — track if dosed long-term",
      "No reports of clinically significant cortisol elevations from Cytamin dosing in published Russian data",
    ],
    stacksWith: ["thyreogen", "endoluten", "vladonix", "pancragen"],
    warnings: [
      "Cushing's syndrome or adrenal adenoma — not studied, avoid",
      "Active glucocorticoid therapy — coordinate with prescriber, do not adjust prescribed glucocorticoid doses based on Cytamin response",
      "Addison's disease — Glandokort is NOT a substitute for hydrocortisone replacement; coordinate with endocrinologist",
      "Pregnancy and lactation — no safety data",
      "Pheochromocytoma or other adrenal tumors — avoid",
      "Severe HPA-axis suppression from long-term steroid use — taper coordination required, not a steroid-discontinuation tool",
    ],
    sourcingNotes:
      "Available from Khavinson bioregulator distributors as 'A-17 Glandokort' or 'Adrenal Cytamin.' Moderately stocked relative to other organ Cytamins. Verify supplier sourcing for genuine St. Petersburg lineage.",
    notes:
      "## Beginner Protocol\nOne 30-day course: 2 caps AM + 2 caps PM with meals. Bracket with morning cortisol (8 AM, fasted), DHEA-S, and a 24-hour salivary cortisol curve if available. Glandokort is most reasonable for users with documented HPA dysfunction (flattened cortisol curve, low morning cortisol with normal ACTH stimulation, or low DHEA-S relative to age) rather than vague 'adrenal fatigue' framing — the latter is not a recognized clinical entity and Glandokort is unlikely to outperform sleep, training, and lifestyle interventions.\n\n## Advanced Protocol\nLayer with Thyreogen (thyroid Cytamin) and Pancragen (pancreatic synthetic) for tri-endocrine support — together they address the metabolic-endocrine axis broadly, anchored on the Khavinson 'Endocrine Triad' protocol concept. Add ashwagandha 600mg, phosphatidylserine 200mg pre-bed (cortisol blunting at the right time of day), and magnesium glycinate 400mg for HPA-axis support. For users with low DHEA-S, oral DHEA 25–50mg AM (under physician supervision) addresses the substrate side; Glandokort addresses the cellular/genetic regulation side. These are complementary, not redundant.\n\n## Reconstitution + Administration\nN/A — oral capsule. With food. AM + PM dosing aligns with natural cortisol rhythm; some practitioners avoid evening dosing on theoretical grounds.\n\n## Synergies (Detail)\nThyreogen + Pancragen: tri-endocrine triad (the named protocol below covers this in detail). Endoluten: pineal-adrenal-circadian coupling. Vladonix: thymic Cytamin for users with HPA-immune dysregulation.\n\n## Evidence Quality\nLimited Russian clinical data, no Western replication. Conceptually compelling but data quality is similar to other Cytamins — small cohorts, single research lineage. Anecdotal user reports include subjective improvements in stress tolerance and energy stability; objective lab changes (cortisol curve normalization) are reported but not robustly documented.\n\n## Research vs Anecdote\nResearch: adrenal cellular bioregulation hypothesis is biologically plausible. Anecdote: adrenal-axis stack popular among biohackers managing chronic stress. For users with documented adrenal insufficiency (Addison's, secondary adrenal insufficiency), evidence-based glucocorticoid replacement is non-negotiable; Glandokort is not a substitute. For users with HPA dysregulation (the gray zone between healthy and Addisonian), Glandokort is one of the more sensible bioregulators to trial alongside lifestyle and adaptogen interventions.",
    tags: ["Khavinson", "adrenal", "HPA", "cortisol", "DHEA", "stress", "Cytamin", "bioregulator", "oral", "A-17"],
    tier: "entry",
  },

  {
    id: "bonothyrk",
    name: "Bonothyrk",
    aliases: ["A-21", "Parathyroid Bioregulator", "Parathyroid Cytamin"],
    category: ["Khavinson Bioregulators"],
    categories: ["Khavinson Bioregulators"],
    route: ["oral"],
    mechanism:
      "Parathyroid Cytamin from young bovine parathyroid tissue. The parathyroid glands are the smallest endocrine organs in the body but control calcium-phosphate-PTH-vitamin D homeostasis — a dense regulatory web with profound implications for bone, kidney, cardiovascular, and neuromuscular function. Bonothyrk is the least commonly stocked Cytamin in the catalog, reflecting both small organ size in source tissue (parathyroids are pinhead-sized in cattle) and the niche clinical application. Proposed mechanism within the Khavinson framework: peptide fragments from parathyroid tissue modulate gene expression in chief cells (the PTH-producing cells responsible for calcium homeostasis) and oxyphil cells, supporting age-related decline in regulatory precision. Of all the Cytamins in the catalog, Bonothyrk has the thinnest evidence base — even within Khavinson's own publication record — and the parathyroid axis is one where over-correction can cause significant clinical problems (hypercalcemia, kidney stones, vascular calcification, cardiac conduction abnormalities). The biological hypothesis is plausible but the clinical evidence base does not support routine use without a specific indication.",
    halfLife: "Hours; effects via gene-expression modulation",
    reconstitution: { solvent: "N/A — oral capsule", typicalVialMg: null, typicalVolumeMl: null },
    dosingRange: { low: "2 caps/day", medium: "4 caps/day", high: "4 caps/day", frequency: "Split AM + PM with meals, 20–30 day course" },
    typicalDose: "2 capsules AM + 2 capsules PM with food",
    startDose: "1 capsule AM + 1 capsule PM × 3 days, then standard",
    titrationNote: "Course-based. Calcium and PTH should be checked before and after course in any user with prior bone or calcium-related concerns.",
    cycle: "20–30 days on, 4–6 months off. Repeat 1× per year typically (most conservative Cytamin cadence given the regulatory sensitivity of the target axis).",
    storage: "Room temperature, dry",
    benefits: [
      "Parathyroid cellular support per Khavinson framework — minimal supporting data",
      "Conceptual use in calcium-PTH-vitamin D axis longevity protocols",
      "Course-based, low frequency",
    ],
    sideEffects: [
      "Mild GI effects rare",
      "Theoretical: PTH-axis modulation could affect calcium / phosphate balance — worth monitoring if dosed",
    ],
    stacksWith: ["bonomarlot", "sigumir"],
    warnings: [
      "Primary or secondary hyperparathyroidism — avoid",
      "History of kidney stones (especially calcium oxalate or calcium phosphate) — avoid",
      "Active hypercalcemia or hypocalcemia — coordinate with endocrinologist before any Cytamin use",
      "Vascular calcification or coronary artery calcium-driven CV concerns — avoid; the PTH-vitamin K2-vascular calcium axis is sensitive and over-modulation could worsen calcification",
      "Pregnancy and lactation — no safety data",
      "Lowest-evidence Cytamin in the catalog — risk-benefit ratio is genuinely unclear; default position should be 'why use this' rather than 'why not'",
    ],
    sourcingNotes:
      "Rarely stocked. Available from a small number of St. Petersburg-linked Khavinson bioregulator distributors. Limited distribution — sourcing patience required, and authenticity verification is harder for low-volume products.",
    notes:
      "## Beginner Protocol\nIf you're considering Bonothyrk, the first question to ask is: why? The parathyroid axis is so tightly regulated and so consequential when disrupted that interventional approaches without specific biomarker indications are rarely sensible. A reasonable beginner approach: only run a Bonothyrk course if there's a documented parathyroid-axis concern (low PTH with appropriate calcium, post-thyroidectomy parathyroid stunning, or similar) AND under endocrinologist oversight. Bracket with full calcium-PTH-25(OH)D-1,25(OH)2D-phosphate panel.\n\n## Advanced Protocol\nFor users with documented age-related bone density decline, Bonothyrk is sometimes paired with Bonomarlot (bone marrow Cytamin) and Sigumir (cartilage-bone Cytamin) for skeletal-axis coverage — but the evidence even for this combination is sparse. Vitamin K2 MK-7 100mcg, vitamin D3 5000 IU (titrated to maintain 25(OH)D 50–80 ng/mL), magnesium glycinate 400mg, and dietary calcium adequacy remain the foundation. Bonothyrk is at most a marginal adjunct on top of those evidence-based interventions.\n\n## Reconstitution + Administration\nN/A — oral capsule. With food. Adequate hydration during course supports renal handling of any calcium or phosphate flux.\n\n## Synergies (Detail)\nBonomarlot: bone marrow Cytamin. Sigumir: joint/bone Cytamin. None of these have robust evidence for the combination — the synergy framing is conceptual.\n\n## Evidence Quality\nLowest in the Cytamin catalog. Khavinson's own published data on parathyroid bioregulation is sparse compared to better-studied organs. No Western replication. Anecdotal reports are minimal because the user base is small.\n\n## Research vs Anecdote\nResearch: parathyroid bioregulation hypothesis is biologically plausible at the cellular level but unconfirmed in clinically meaningful endpoints. Anecdote: niche use in advanced longevity stacks; not a mainstream Cytamin even within Russian-speaking biohacker communities. For users without a specific parathyroid-axis indication, Bonothyrk offers little. For users with documented hyperparathyroidism or hypoparathyroidism, evidence-based endocrine management (cinacalcet, parathyroidectomy, calcitriol replacement, or recombinant PTH) is non-negotiable. Honest bottom line: Bonothyrk is in the catalog for completeness, not because the use case is strong.",
    tags: ["Khavinson", "parathyroid", "PTH", "calcium", "Cytamin", "bioregulator", "oral", "A-21", "low-evidence"],
    tier: "entry",
  },

  // ============================================================================
  // SECTION 2 — Named Multi-Cytamin Functional Protocols (3)
  // ============================================================================

  {
    id: "endocrine-triad-protocol",
    name: "Endocrine Triad Bioregulator Protocol",
    aliases: ["Endocrine Triad", "Cytamin Endocrine Stack", "Pancreas-Adrenal-Thyroid Stack"],
    category: ["Khavinson Bioregulators", "Longevity"],
    categories: ["Khavinson Bioregulators", "Longevity"],
    route: ["oral"],
    components: [
      { name: "Pancragen (or A-1 Suprefort)", target: "Pancreas" },
      { name: "Glandokort (A-17)", target: "Adrenal cortex" },
      { name: "Thyreogen (A-2)", target: "Thyroid" },
    ],
    mechanism:
      "Functional protocol layering three tissue-specific Cytamins to address the endocrine-metabolic axis comprehensively: pancreatic (Pancragen synthetic or A-1 Suprefort organ-extract), adrenal (A-17 Glandokort), and thyroid (A-2 Thyreogen). The conceptual rationale is mechanistic: the pancreas, adrenal cortex, and thyroid form a tightly coupled regulatory triad in metabolic and stress homeostasis, with cross-talk via cortisol-glucose-insulin dynamics, thyroid hormone effects on metabolic rate and mitochondrial biogenesis, and adrenal-pancreatic interactions during chronic stress. Age-related decline in any one of these axes affects the others — chronic high cortisol drives insulin resistance and suppresses peripheral T4 → T3 conversion; subclinical hypothyroidism worsens glucose handling and HPA-axis tone; pancreatic exocrine and endocrine decline interacts with both. The protocol attempts to support cellular function across all three axes simultaneously rather than isolating any single organ. This is a Khavinson-protocol-aligned approach, not a Western evidence-based intervention; the supporting clinical signal is from Khavinson's broader Cytamin cohort data rather than a triad-specific trial.",
    halfLife: "Course-based protocol — see individual Cytamins for component half-lives",
    reconstitution: { solvent: "N/A — oral capsule protocol", typicalVialMg: null, typicalVolumeMl: null },
    dosingRange: { low: "Standard course of each component", medium: "Standard course of each component", high: "Standard course of each component", frequency: "30-day combined course, 1–2× per year" },
    typicalDose: "Pancragen: 2 caps AM + 2 caps PM. Glandokort: 2 caps AM + 2 caps PM. Thyreogen: 2 caps AM + 2 caps PM. Total: 6 caps AM + 6 caps PM with meals × 30 days.",
    startDose: "Half-dose each component (1 + 1) × 5 days to assess tolerance, then standard",
    titrationNote: "Run all three components concurrently for 30 days. Do NOT stagger — the protocol's logic depends on simultaneous coverage of the triad.",
    cycle: "30 days on, 5–6 months off. 1–2 courses per year.",
    storage: "Room temperature, dry",
    benefits: [
      "Comprehensive endocrine-metabolic axis cellular support",
      "Particularly relevant for users with documented HPA dysfunction + insulin resistance + suboptimal thyroid (the common 'middle-age metabolic decline' presentation)",
      "Single 30-day course covers three axes — efficient relative to running Cytamins individually",
      "Course-based, no chronic commitment",
    ],
    sideEffects: [
      "Pill burden during the course (6 caps AM + 6 caps PM) — primary practical limitation",
      "Mild GI sensitivity in <10% of users when running three Cytamins concurrently",
      "Theoretical: altered cortisol or thyroid output could affect sleep or energy — track during the course",
    ],
    stacksWith: ["endoluten", "vladonix", "ventfort"],
    warnings: [
      "All component-level contraindications apply — review Pancragen, Glandokort, Thyreogen warnings individually before starting",
      "Pregnancy and lactation — not for use",
      "Type 1 diabetes — pancreatic Cytamin is NOT a substitute for insulin; coordinate with endocrinologist",
      "Active glucocorticoid therapy — coordinate with prescriber",
      "Active levothyroxine therapy — separate Thyreogen dose from levothyroxine by ≥4 hours; coordinate with prescriber if TSH starts shifting",
      "Cushing's syndrome, Addison's disease, hyperthyroidism, hypothyroidism on replacement — endocrinologist coordination required",
    ],
    sourcingNotes:
      "Sourced as three individual Cytamin products, run concurrently. No pre-mixed 'triad' product exists — each component is a separate capsule course.",
    notes:
      "## Why a Named Protocol\nThe triad framing exists because users running Cytamins for metabolic-endocrine longevity contexts naturally gravitate toward this combination — pancreas-adrenal-thyroid is the most common multi-Cytamin stack in Russian biohacker protocols. Naming it as a defined protocol helps users find it as a unit rather than discovering each piece independently. Conceptually similar to KLOW or Wolverine being named blends rather than ad-hoc combinations.\n\n## Beginner Protocol\nFirst time running this triad: half-dose each component (1 cap AM + 1 cap PM) for the first 5 days to assess tolerance — running three Cytamins concurrently is a higher pill burden than most users have experienced. After 5 days, escalate to standard dose (2 caps AM + 2 caps PM each). Bracket with comprehensive metabolic panel + HbA1c + full thyroid panel (TSH, fT3, fT4, rT3) + morning cortisol + DHEA-S at start and 60 days post-course.\n\n## Advanced Protocol\nLayer the triad with Endoluten (pineal Cytamin) for circadian-endocrine coupling and Vladonix (thymic Cytamin) for immune-endocrine axis coverage. This expanded stack — five Cytamins concurrent for 30 days — represents the upper end of what serious longevity-protocol users run. Adjuncts that pair well: ashwagandha 600mg (HPA support), berberine 500mg 2× daily (insulin sensitization), selenium 200mcg (thyroid support cofactor), magnesium glycinate 400mg (HPA + sleep + thyroid cofactor).\n\n## Reconstitution + Administration\nN/A — oral capsule protocol. With meals. Pill organizer recommended given the volume — 12 capsules per day across two doses is meaningful adherence work.\n\n## Synergies (Detail)\nThe triad's internal synergy is the metabolic-endocrine cross-talk — adrenal output affects thyroid conversion; thyroid output affects pancreatic insulin sensitivity; pancreatic-adrenal axis is critical in chronic stress contexts. External synergies: Endoluten (circadian-endocrine), Vladonix (immune-endocrine), Ventfort (vascular-metabolic for users with metabolic syndrome features).\n\n## Evidence Quality\nThe triad is a Khavinson-protocol-aligned framing, not a Western evidence-based intervention. Supporting evidence is the broader Cytamin cohort data (12-year mortality reduction, etc.) rather than a triad-specific trial. Anecdotal user reports in Russian biohacker communities are favorable but the mechanism of effect — and whether the combination outperforms running components individually — is not formally tested.\n\n## Research vs Anecdote\nResearch: per-component cellular bioregulation hypothesis is biologically plausible. The triad combination is conceptual rather than evidence-based. Anecdote: this is the most popular multi-Cytamin stack in Russian-speaking biohacker communities, particularly for users with overlapping metabolic syndrome / fatigue / suboptimal thyroid / cortisol-pattern presentations. For users with documented endocrine pathology (Addison's, Cushing's, T1D, T2D, overt hypothyroidism), evidence-based hormonal management is primary; the triad is adjunct in the longevity-stack context, not a treatment for diagnosed disease.",
    tags: ["Khavinson", "protocol", "endocrine", "adrenal", "thyroid", "pancreas", "triad", "longevity", "course-based", "named-stack"],
    tier: "entry",
  },

  {
    id: "cv-bioregulator-protocol",
    name: "Cardiovascular Bioregulator Protocol",
    aliases: ["CV Cytamin Stack", "Heart-Vascular Bioregulator Protocol", "Cardiovascular Khavinson Stack"],
    category: ["Khavinson Bioregulators", "Longevity"],
    categories: ["Khavinson Bioregulators", "Longevity"],
    route: ["oral", "subQ injection"],
    components: [
      { name: "Cardiogen", target: "Cardiac muscle" },
      { name: "Vesilute", target: "Vascular endothelium (Cytamin)" },
      { name: "Vesugen (KED)", target: "Vascular endothelium (synthetic tripeptide)" },
    ],
    mechanism:
      "Functional protocol layering three Khavinson peptides targeting the cardiovascular system: Cardiogen (cardiac muscle Cytamin) addresses cardiomyocyte gene expression and contractile function; Vesilute (vascular Cytamin) supports endothelial cellular health from the organ-extract angle; and Vesugen (synthetic tripeptide Lys-Glu-Asp / KED) provides synthetic short-peptide coverage of the same vascular axis. The conceptual layering — synthetic + Cytamin coverage of the vascular endothelium plus cardiac-specific Cardiogen — provides redundancy across the cardiovascular cellular landscape. Particularly relevant for users with cardiovascular risk profiles where conventional interventions (statins, ACE/ARBs, lifestyle) are already optimized but the user wants longevity-stack adjuncts. For users with elevated Lp(a), elevated ApoB, family history of premature CAD, or post-cardiovascular-event recovery contexts, the protocol layers onto evidence-based interventions rather than substituting for them. The supporting evidence is per-component Cytamin/Cytogen literature rather than a Western trial of the combination.",
    halfLife: "Course-based — see individual components",
    reconstitution: {
      solvent: "Vesugen: Bacteriostatic Water (if injectable form) or N/A (sublingual form). Cardiogen + Vesilute: oral capsule",
      typicalVialMg: null,
      typicalVolumeMl: null,
    },
    dosingRange: { low: "Standard component courses", medium: "Standard component courses", high: "Standard component courses", frequency: "30-day combined course, 1–2× per year" },
    typicalDose: "Cardiogen: 2 caps AM + 2 caps PM. Vesilute: 2 caps AM + 2 caps PM. Vesugen: per route (sublingual 1–2 drops AM, or 5–10mg subQ daily). Run concurrently × 30 days.",
    startDose: "Half-dose each component × 5 days, then standard",
    titrationNote: "Concurrent dosing — same 30-day window for all three components.",
    cycle: "30 days on, 5–6 months off. 1–2 courses per year.",
    storage: "Room temperature for oral; refrigerate Vesugen if injectable form is reconstituted",
    benefits: [
      "Multi-modal cardiovascular cellular support — cardiac + vascular + endothelial axes",
      "Particularly relevant for high-Lp(a), high-ApoB, post-event recovery users running comprehensive longevity stacks",
      "Combines synthetic short-peptide (Vesugen) and organ-extract (Cardiogen, Vesilute) approaches for redundant coverage",
      "Course-based, no chronic commitment",
    ],
    sideEffects: [
      "Pill / injection burden during the course",
      "Vesugen sublingual occasionally produces transient mild taste effects",
      "If Vesugen used injectable, mild local reactions possible",
    ],
    stacksWith: ["epitalon", "endoluten", "klotho", "ss-31"],
    warnings: [
      "All component-level contraindications apply",
      "Active hemorrhagic event — avoid Vesugen pending stabilization",
      "Concurrent high-dose anticoagulants — coordinate with prescriber",
      "Pregnancy and lactation — not for use",
      "For users with elevated Lp(a) specifically: this protocol is an adjunct, not a replacement for the categorically more relevant emerging RNA therapies (pelacarsen, olpasiran)",
      "Active malignancy — angiogenesis-modulating compounds (vascular Cytamins included) warrant prescriber coordination",
    ],
    sourcingNotes:
      "Sourced as three individual Khavinson products. Vesugen is available in both sublingual liquid (KED tripeptide) and injectable form — protocol works with either. Verify supplier authenticity for Cardiogen and Vesilute (oral Cytamin capsules).",
    notes:
      "## Why a Named Protocol\nUsers building cardiovascular longevity stacks naturally combine cardiac and vascular Cytamins — it's the most common pairing in Khavinson-protocol-following biohacker communities. Naming the protocol formalizes what users were already constructing.\n\n## Beginner Protocol\n30-day concurrent course at standard doses. Bracket with: lipid panel including ApoB and Lp(a), hsCRP, Lp-PLA2, ankle-brachial index (if available), and resting BP / HR averaged over 7 days. Most users will not see dramatic acute changes — the value frame is cellular maintenance across protocol years, not single-cycle response.\n\n## Advanced Protocol\nLayer the CV protocol with Epitalon (pineal AEDG synthetic — telomerase activation, broadly relevant in CV longevity) and Endoluten (pineal Cytamin — circadian-cardiovascular coupling). For users running the most comprehensive longevity stacks, recombinant Klotho protein and SS-31 (Elamipretide — mitochondrial cardiolipin protection) target overlapping pathways at significantly higher cost. Adjuncts: omega-3 EPA/DHA 2–4g, CoQ10 / Ubiquinol 200mg, nattokinase 100mg, vitamin K2 MK-7 100mcg, magnesium glycinate 400mg.\n\n## Reconstitution + Administration\nCardiogen + Vesilute: oral capsules with meals. Vesugen sublingual: 1–2 drops under tongue, hold 60 seconds, AM. Vesugen injectable: subQ daily for 10 days within the 30-day window if running injectable form (some users prefer this for higher bioavailability). Concurrent timing simplifies adherence.\n\n## Synergies (Detail)\nInternal: cardiac (Cardiogen) + vascular (Vesilute organ-extract + Vesugen synthetic) = full CV-tissue coverage. External: Epitalon (telomerase, vascular aging), Klotho (vascular calcification axis), SS-31 (mitochondrial), omega-3 (membrane lipid), CoQ10 (mitochondrial electron transport).\n\n## Evidence Quality\nPer-component Khavinson literature. No Western trial of the combination. The strongest claims of clinical effect should be made about the broader Cytamin class, not this specific protocol.\n\n## Research vs Anecdote\nResearch: cardiovascular cellular bioregulation hypothesis biologically plausible. Hard-endpoint evidence (MACE reduction, mortality reduction specifically attributable to the protocol) does not exist. Anecdote: popular among longevity-stack users with elevated CV risk markers running comprehensive interventions. For users with elevated Lp(a) or ApoB, evidence-based interventions — statins, PCSK9 inhibitors, emerging Lp(a)-lowering RNA therapies (pelacarsen, olpasiran), lifestyle — remain primary. The protocol is adjunct in the cellular-maintenance frame.",
    tags: ["Khavinson", "protocol", "cardiovascular", "vascular", "endothelium", "cardiac", "Lp(a)", "longevity", "course-based", "named-stack"],
    tier: "entry",
  },

  {
    id: "cognitive-bioregulator-protocol",
    name: "Cognitive Bioregulator Protocol",
    aliases: ["Cognitive Cytamin Stack", "Brain Bioregulator Protocol", "Khavinson Cognitive Stack"],
    category: ["Khavinson Bioregulators", "Nootropic", "Longevity"],
    categories: ["Khavinson Bioregulators", "Nootropic", "Longevity"],
    route: ["oral", "subQ injection"],
    components: [
      { name: "Cerluten (A-5)", target: "Cerebral cortex (Cytamin)" },
      { name: "Cortagen", target: "Cortical (synthetic tetrapeptide)" },
      { name: "Pinealon", target: "Brain cells / pineal (synthetic tripeptide EDR)" },
    ],
    mechanism:
      "Functional protocol layering three Khavinson peptides targeting brain tissue from complementary angles: Cerluten (A-5 cerebral cortex Cytamin — natural organ extract), Cortagen (synthetic tetrapeptide — cortical neuron-targeted), and Pinealon (synthetic tripeptide Glu-Asp-Arg / EDR — broad CNS neuroprotection). The protocol's conceptual logic: organ-extract + synthetic-short-peptide redundancy across brain tissue, with cortical specificity (Cerluten + Cortagen) plus broader CNS coverage (Pinealon's reach into hippocampal and pineal regions). Of all the Khavinson Cytamin/Cytogen protocols, the cognitive stack has the strongest per-component evidence — Pinealon (EDR) has neuroprotection literature beyond Khavinson's group, including in vitro neurogenesis and in vivo cognitive-recovery studies in stress and toxicity models. The protocol layers naturally onto Western nootropic stacks (Semax, Bromantane, Bemethyl, OmegaTAU / Mr. Happy Stack) for users running comprehensive cognitive enhancement programs.",
    halfLife: "Course-based — see individual components",
    reconstitution: {
      solvent: "Pinealon: typically sublingual or injectable. Cerluten: oral capsule. Cortagen: oral capsule or injectable form available",
      typicalVialMg: null,
      typicalVolumeMl: null,
    },
    dosingRange: { low: "Standard component courses", medium: "Standard component courses", high: "Standard component courses", frequency: "30-day combined course, 2× per year for cognitive longevity protocols" },
    typicalDose: "Cerluten: 2 caps AM + 2 caps PM. Cortagen: 2 caps AM + 2 caps PM (or 1–2mg subQ daily if injectable form). Pinealon: 1–2 drops sublingual AM (or 1–2mg subQ daily). Concurrent × 30 days.",
    startDose: "Half-dose each component × 5 days, then standard",
    titrationNote: "Pinealon is the most CNS-active of the three — start with the lowest dose and assess for any sleep disturbance or vivid dreams before escalating.",
    cycle: "30 days on, 5–6 months off. 2 courses per year for users prioritizing cognitive longevity.",
    storage: "Room temperature for oral; refrigerate sublingual / injectable forms after reconstitution",
    benefits: [
      "Multi-angle cognitive-tissue cellular support — cortical + hippocampal + broader CNS",
      "Strongest per-component evidence base of the three named Cytamin protocols (Pinealon has the most independent neuroprotection literature)",
      "Layers naturally onto Western nootropic stacks",
      "Particularly relevant for: post-concussion recovery contexts, age-related cognitive decline prevention, users with family history of dementia",
      "Course-based",
    ],
    sideEffects: [
      "Vivid dreams (Pinealon, Cerluten) — common, generally well-tolerated",
      "Mild headache or transient sleep disturbance early in protocol — usually resolves within first week",
      "Pill / injection burden",
    ],
    stacksWith: ["semax", "n-acetyl-semax-amidate", "bromantane", "bemethyl", "selank", "epitalon"],
    warnings: [
      "Active seizure disorder — caution with all CNS-active peptides; coordinate with neurologist",
      "Active psychotic disorder — Pinealon and other CNS peptides may interact unpredictably",
      "Pregnancy and lactation — no safety data",
      "Concurrent SSRI/SNRI/MAOI therapy — most CNS Cytamins/Cytogens have no documented interaction but coordination is sensible",
      "Active brain malignancy — angiogenesis and growth-modulating compound concerns",
    ],
    sourcingNotes:
      "Three individual Khavinson products. Pinealon and Cortagen available in multiple formats (sublingual liquid, oral capsule, injectable lyophilized). Cerluten is typically oral capsule only. Verify authenticity for each component.",
    notes:
      "## Why a Named Protocol\nThe cognitive-stack framing — organ-extract Cytamin (Cerluten) + synthetic short peptides (Cortagen + Pinealon) — is the most evidence-supported of the named multi-Cytamin protocols. Users running CNS-longevity stacks gravitate toward this combination because it covers the brain tissue space comprehensively without redundancy.\n\n## Beginner Protocol\n30-day concurrent course. Bracket with: cognitive baseline (Cambridge Brain Sciences, Lumosity, or formal MoCA), sleep architecture (Oura, Whoop, or polysomnography if available), morning cortisol, DHEA-S. Track subjective focus, memory, sleep quality through the course. Most users notice sleep effects (vivid dreams, deeper sleep) within the first week — cognitive effects are slower and more cumulative.\n\n## Advanced Protocol\nLayer with established Western nootropic stack: Semax / N-Acetyl Semax Amidate (BDNF/NGF pathway), Bromantane (dopamine + cognitive endurance), Bemethyl (cellular energy / endurance), Selank (anxiolytic + GABAergic balance for cognitive performance under stress). For users running comprehensive longevity stacks, layer Epitalon (AEDG synthetic — telomerase activation) for combined neural-longevity coverage. Adjuncts: omega-3 high-DHA (1g+ DHA/day for membrane), creatine 5g/day (cognitive support, especially under sleep deprivation), magnesium L-threonate 2g pre-bed (CNS magnesium specifically), lithium orotate 5mg (neuroprotection, low-dose).\n\n## Reconstitution + Administration\nCerluten: oral capsule with food. Cortagen: oral capsule (or 1–2mg subQ daily if injectable form, more bioavailable). Pinealon: 1–2 drops sublingual AM held 60 seconds (or 1–2mg subQ daily). For injectable forms, reconstitute with Bacteriostatic Water per label and store refrigerated post-reconstitution.\n\n## Synergies (Detail)\nInternal: Cerluten (organ extract, broad cortical) + Cortagen (synthetic, cortical-specific) + Pinealon (synthetic, broad CNS / hippocampal). External: Semax/NAA-Semax (BDNF), Bromantane (dopaminergic), Selank (GABAergic), Epitalon (telomerase + neural longevity), OmegaTAU / Mr. Happy Stack (DHA + alpha-GPC + sesame extract + triacetyluridine — neural lipid + cholinergic + uridine for synaptic remodeling).\n\n## Evidence Quality\nStrongest of the three named Khavinson protocols. Pinealon (EDR) has independent neuroprotection literature beyond Khavinson's group. Cerluten and Cortagen are primarily Khavinson-lineage data but the cortical-Cytamin space has more publications than the kidney or bladder Cytamin space.\n\n## Research vs Anecdote\nResearch: per-component evidence supports cellular neuroprotection and modest cognitive benefit in elderly cohorts. The combination has not been formally tested in a Western trial, but the per-component case is stronger than for the Endocrine Triad or CV protocols. Anecdote: popular among biohackers running comprehensive cognitive-longevity stacks, particularly those with family history of dementia or post-concussion recovery contexts. For users with diagnosed cognitive impairment (MCI, early Alzheimer's), evidence-based interventions (cognitive training, exercise, sleep optimization, anti-amyloid antibodies where indicated) remain primary; this protocol is adjunct in the longevity / cellular-maintenance frame.",
    tags: ["Khavinson", "protocol", "cognitive", "brain", "neuroprotection", "nootropic", "longevity", "Pinealon", "Cerluten", "Cortagen", "course-based", "named-stack"],
    tier: "entry",
  },
];