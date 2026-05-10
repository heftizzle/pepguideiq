// src/data/compounds/batch37.js
//
// BATCH37 — Post-launch addition (2026-05-10)
// Hormone optimization + fat-soluble triad completion + neuroprotection + liver pillar
//
// Anchor: Boron (hormone optimization — SHBG, free T, vitamin D activation).
// Closes launch-day catalog gaps:
//   - Zinc — most notable miss (SHBG, testosterone, aromatase, immune)
//   - Vitamin A — completes fat-soluble pillar (D3, K2, E shipped in BATCH35-36)
//   - Lithium Orotate — low-dose neuroprotection / BDNF / microdose lane
//   - TUDCA — referenced as soft stacksWith across BATCH16/17/18, never shipped standalone
//
// Editorial direction: 800-1,200w combined (mechanism + notes) per tile.
// Form-selection content where it matters. Closing notes line follows
// "...the catalog does not provide specific protocol guidance per locked HRT/protocol rule."
// pattern where applicable.
//
// Primary categories use existing CATEGORY_FILTER_MAP taxonomy:
//   - boron / zinc → Testosterone Support
//   - vitamin-a → Foundational
//   - lithium-orotate → Nootropic
//   - tudca → Foundational
// Specific tags (Hormone Optimization, Liver Support, etc.) preserved in `categories` array.

export const BATCH37 = [
  // ─────────────────────────────────────────────────────────────────────────────
  // 1. BORON
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "boron",
    name: "Boron",
    category: "Testosterone Support",
    categories: ["Testosterone Support", "Hormone Optimization", "Mineral", "Bone Support", "Vitamin D Cofactor"],
    brief: "Trace mineral with outsized hormonal effects — reduces SHBG, raises free testosterone, activates vitamin D, and modulates estradiol at doses far below tolerable upper limits.",
    mechanism: `Boron is a trace mineral that punches well above its weight on hormonal and skeletal endpoints despite being absent from most multivitamins and rarely discussed outside the hormone optimization niche. The mechanisms operate at the steroid hormone level, the vitamin D activation pathway, the bone matrix, and the inflammatory milieu simultaneously, which is why a single 6-10 mg daily dose produces effects spanning free testosterone, estradiol balance, bone mineral density, joint inflammation, and cognition.

The signature effect — and the one driving boron's social media moment — is **sex hormone binding globulin (SHBG) reduction**. SHBG binds testosterone and estradiol in circulation, rendering them biologically inactive. Only "free" testosterone engages the androgen receptor. A landmark study showed that 10 mg of boron daily for one week reduced SHBG by approximately 9% while increasing free testosterone by roughly 28%. Total testosterone barely moved — the effect was redistribution from bound to free fraction. This is the same mechanism that makes elevated SHBG (common in older men, men on TRT with high estradiol, men with liver dysfunction, women on oral contraceptives) functionally hypogonadal even when total T looks normal on a lab panel.

Boron also **activates vitamin D**. The kidney enzyme 1-alpha-hydroxylase converts 25-hydroxyvitamin D (the storage form on standard labs) to 1,25-dihydroxyvitamin D (the active hormone). Boron upregulates this conversion. In one study, supplementation raised active vitamin D by 19.6% over 60 days. This is why people taking adequate D3 but still showing stubborn deficiency on labs sometimes respond dramatically to boron — they have substrate but lack activation. The vitamin D / boron / magnesium triad is functionally inseparable.

The **estradiol modulation** story is more nuanced. The same study that showed SHBG reduction also showed a modest increase in estradiol — which sounds bad to anyone reflexively trained to suppress estrogen, but in context represents a healthy androgen-estrogen balance shift, not aromatase upregulation. Boron does not appear to be an aromatase activator. In men on TRT, the practical observation is that boron does not blow up estradiol or require AI adjustment in most cases.

Boron also supports **bone mineral density** through reduced urinary calcium and magnesium loss, parathyroid hormone modulation, and direct osteoblast support. The combined effect of vitamin D activation, calcium retention, and osteoblast signaling makes boron quietly important for postmenopausal women managing osteoporosis risk and for older men whose bone density tracks closely with free testosterone and estradiol. The **anti-inflammatory effects** at higher doses (10 mg+) are mediated through suppression of TNF-alpha, IL-6, and hs-CRP — the mechanism behind joint pain reduction reported in arthritis literature and by users who notice morning stiffness improving within a few weeks of starting boron.`,
    notes: `**Form selection — the only decision that matters**

The four common forms are **boron citrate**, **boron glycinate**, **boron amino acid chelate**, and **calcium fructoborate**. Practical differences:

- **Boron citrate** — most common, well-absorbed, cheap. The default. Most studies demonstrating SHBG and free-T effects used citrate or borate forms.
- **Boron glycinate / chelate** — marginally gentler on the stomach. Slightly more expensive. No meaningful efficacy edge.
- **Calcium fructoborate** — naturally occurring form found in fruits and vegetables. The arthritis literature uses this preferentially. If joint inflammation is the primary reason, this is the form to consider.
- **Borax** — yes, the laundry product. There is a forum-driven Borax protocol (Walter Last) that uses food-grade borax dissolved in water. The math works within safe range, but recommending laundry boosters as supplements is not a defensible catalog position. Stick with food-grade boron supplements.

**Dose**

Effects are documented at **3 mg/day** (deficiency correction, vitamin D activation), **6 mg/day** (the sweet spot for hormonal effects), and **10 mg/day** (the SHBG / free-T study dose, where anti-inflammatory effects also appear). Tolerable upper limit is 20 mg/day, leaving wide safety margin. Above 10 mg long-term is not necessary and starts running into estradiol elevation territory in men.

**Timing**

Half-life is approximately 21 hours. Once-daily dosing is fine. Most users take it with breakfast alongside vitamin D3, K2, and magnesium — the fat-soluble vitamins benefit from food, and the four-way stack is logically integrated.

**Who benefits most**

- Men with high SHBG and low free testosterone despite normal total T
- Men on TRT whose free T fraction is suppressed by elevated SHBG (common with weekly Test Cyp protocols)
- Postmenopausal women managing bone density, joint inflammation, or cognitive concerns
- Anyone supplementing vitamin D3 who is not seeing serum 25-OH-D rise as expected
- Individuals with chronic low-grade joint inflammation or arthritis (10 mg, calcium fructoborate)

**Who should be cautious**

Boron has high renal clearance, so individuals with significant kidney impairment should discuss with a clinician before starting. No significant drug interactions in the standard hormone optimization stack — boron pairs cleanly with TRT, vitamin D, magnesium, zinc, and the broader catalog stacks.

The catalog does not provide specific protocol guidance per locked HRT/protocol rule. Form (citrate is the workhorse) and dose (3-10 mg) are the only meaningful decisions.`,
    stacksWith: ["vitamin-d3", "vitamin-k2", "magnesium", "zinc", "tudca", "testosterone-cypionate", "testosterone-enanthate"],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. ZINC
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "zinc",
    name: "Zinc",
    category: "Testosterone Support",
    categories: ["Testosterone Support", "Mineral", "Hormone Optimization", "Immune Support", "Aromatase Modulator"],
    brief: "Essential trace mineral central to testosterone production, aromatase modulation, immune function, and over 300 enzymatic reactions. The most consequential mineral deficiency in modern populations after magnesium.",
    mechanism: `Zinc is a structural and catalytic cofactor in over 300 enzymes spanning DNA synthesis, immune function, wound healing, sensory perception, and steroid hormone biosynthesis. The mineral is so deeply embedded in mammalian physiology that frank deficiency presents with hypogonadism, immune collapse, growth retardation, hair loss, and skin lesions — and yet marginal deficiency in modern populations is common and frequently missed because serum zinc is a poor marker of total body status.

The signature endocrine effect is **direct support of testosterone production**. Zinc is required for luteinizing hormone (LH) synthesis at the pituitary and for the activity of multiple steroidogenic enzymes in the testes. The classic Prasad data demonstrated that zinc-deficient men had testosterone in the hypogonadal range and that repletion with 30 mg daily for six months returned testosterone to normal physiological levels. The effect ceiling is real: zinc supplementation in zinc-replete men does not push testosterone above normal. This is repletion, not augmentation.

Zinc functions as an **aromatase modulator**. Aromatase converts testosterone to estradiol, and zinc deficiency increases aromatase activity. This is why men with low zinc often present with low total testosterone, elevated estradiol, gynecomastia risk, and abdominal fat distribution. Zinc supplementation does not act as a pharmacological aromatase inhibitor like anastrozole or exemestane (already in the catalog), but in zinc-deficient individuals it brings aromatase back to physiological set point. This is important context for men on TRT managing estradiol — restoring zinc adequacy is upstream of reaching for an AI.

The **immune function** evidence is the strongest in the entire mineral literature. Zinc is required for T-cell development, NK cell activity, and thymic integrity. The 2010 Cochrane review on zinc lozenges and the common cold concluded that zinc taken within 24 hours of symptom onset reduces duration by approximately 33% — one of the more robust effect sizes for any nutritional intervention against acute illness. The mechanism is direct antiviral activity at the nasal mucosa plus broader support of innate immunity.

The **wound healing** mechanism intersects with collagen synthesis (zinc is required for prolyl hydroxylase) and the broader proliferative phase of tissue repair — relevant context for stacking zinc with peptides like BPC-157, TB-500, and GHK-Cu.

The **5-alpha-reductase modulation** story is more controversial. Some in vitro and animal data suggest zinc inhibits 5-alpha-reductase, the enzyme that converts testosterone to DHT. Clinical relevance at supplemental doses appears modest; finasteride remains in the catalog as the pharmacological tool for that mechanism. The **sensory and cognitive symptoms** of zinc deficiency are subtle but characteristic — loss of taste (ageusia) and smell (anosmia) are textbook deficiency signs, and zinc supplementation has shown adjunctive antidepressant effects in some trials.`,
    notes: `**Form selection — meaningful differences here**

Not all zinc forms are equivalent:

- **Zinc picolinate** — most users' best default. Picolinic acid is endogenously produced and chelates zinc cleanly; absorption studies favor picolinate over gluconate and citrate. Easy on the stomach with food.
- **Zinc bisglycinate (chelate)** — also excellent. Glycine carrier improves absorption and tolerability.
- **Zinc citrate** — well-absorbed, common in multivitamins. Reasonable.
- **Zinc gluconate** — the form in cold lozenges. Adequate for that acute use case but not the form for daily supplementation.
- **Zinc oxide** — found in cheap multivitamins. Poor bioavailability when oral. Not a serious choice.

The practical rule: **zinc picolinate or bisglycinate, 15-30 mg daily, with food.**

**Dose and the copper interaction**

The RDA is 11 mg for men, 8 mg for women. Effective supplemental doses for hormonal repletion are **15-30 mg daily**. Doses above 40 mg long-term begin to compete with copper absorption and can drive a secondary copper deficiency that presents with neurological symptoms, anemia, and connective tissue issues. The fix: any zinc supplement taken long-term above 25 mg should be paired with **1-2 mg of copper** (typically copper bisglycinate). Many quality zinc supplements come pre-formulated with copper at the correct ratio. The 15:1 zinc-to-copper ratio is the workable target.

**Timing**

Take with food to avoid nausea, the most common side effect on an empty stomach. Calcium and iron compete with zinc absorption — separate by a few hours from large doses of either.

**Who benefits most**

- Men with marginal or low total testosterone, especially with elevated estradiol
- Men on TRT managing estradiol (zinc adequacy is upstream of AI use)
- Vegetarians and vegans (phytate-rich plant sources reduce bioavailability)
- Anyone in the immune-stress lane: frequent travelers, parents of young children, healthcare workers
- Individuals reporting loss of taste or smell, slow wound healing, or recurrent skin issues

**Lozenge protocol for acute viral illness**

For cold and flu symptoms, **zinc gluconate or acetate lozenges** at 75-100 mg total elemental zinc per day in divided doses every 2-3 hours, started within 24 hours of symptom onset, continued no longer than 5-7 days. The mechanism is local antiviral activity; swallowing capsules does not produce the same effect.

The catalog does not provide specific protocol guidance per locked HRT/protocol rule. Form (picolinate or bisglycinate) and dose (15-30 mg with food) are the practical decisions. Long-term users above 25 mg should pair with copper at 15:1 ratio.`,
    stacksWith: ["boron", "magnesium", "vitamin-d3", "vitamin-a", "selenium", "bpc-157", "tb-500", "ghk-cu", "testosterone-cypionate"],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. VITAMIN A (RETINOL)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "vitamin-a",
    name: "Vitamin A (Retinol)",
    category: "Foundational",
    categories: ["Foundational", "Fat-Soluble Vitamin", "Skin Health", "Hair Health", "Immune Support", "Vision"],
    brief: "Fat-soluble vitamin essential for vision, skin and hair regeneration, immune function, and steroid hormone synthesis. Retinol (animal form) is bioavailable; beta-carotene (plant form) requires conversion that is poor in many genotypes.",
    mechanism: `Vitamin A is the umbrella term for a family of fat-soluble retinoids (retinol, retinal, retinoic acid, retinyl esters) and pro-vitamin A carotenoids (beta-carotene primarily). The retinoids and carotenoids are not interchangeable in practice, which is the source of most confusion in the supplement aisle.

The biologically active form is **retinoic acid**, which binds nuclear retinoic acid receptors (RAR) and retinoid X receptors (RXR) to regulate transcription of hundreds of genes. The downstream effects span epithelial cell differentiation (skin, hair follicles, gut lining, ocular surface), photoreceptor function in the retina, immune cell maturation, and crosstalk with thyroid and steroid hormone signaling.

The signature **skin and hair effects** are why retinol is the gold-standard topical anti-aging compound and why oral vitamin A status drives so much of how skin and hair look. Retinoic acid promotes epithelial turnover, upregulates collagen synthesis, normalizes follicular keratinization (the mechanism behind retinoid efficacy in acne), and is required for the hair growth cycle. Vitamin A deficiency presents with dry skin, follicular hyperkeratosis (the bumpy "chicken skin" appearance), brittle hair, and impaired wound healing.

The **vision** mechanism is the original 1930s discovery — retinal is the chromophore in rhodopsin, the photopigment in rod cells responsible for low-light vision. Night blindness is the earliest clinical sign of vitamin A deficiency. The **immune function** evidence is sufficiently established that vitamin A supplementation is a standard WHO intervention in measles outbreaks — high-dose vitamin A reduces measles mortality by 50% in deficient children.

The **carotenoid conversion problem** deserves its own paragraph because it confuses people. Beta-carotene must be enzymatically cleaved by beta-carotene 15,15'-monooxygenase (BCMO1) to produce retinal, then reduced to retinol. Genetic polymorphisms in BCMO1 — present in approximately 45% of the population in some studies — can reduce conversion efficiency by 50-90%. Add food matrix effects (raw carrots absorbed at maybe 5-10% efficiency without fat; cooked with fat, 20-30%), and individuals relying on plant sources can be functionally deficient despite eating recommended amounts of carrots, sweet potatoes, and leafy greens. This is the genetic basis behind why the carnivore community rediscovered preformed vitamin A from animal sources and reports the dramatic skin, hair, and energy improvements that follow.

The **steroid hormone interaction** is relevant for this catalog's audience: vitamin A is required for normal testicular function and spermatogenesis, and retinoids interact with thyroid hormone signaling at the receptor level (RXR heterodimerizes with thyroid receptor TR), which is why vitamin A status modulates thyroid hormone effects on metabolism.`,
    notes: `**Form selection — the only decision that matters here**

The forms split cleanly into preformed retinoids (animal-derived) and pro-vitamin A carotenoids (plant-derived):

- **Retinyl palmitate** — the most common supplemental form. Stable, well-absorbed, predictably converted. The default choice.
- **Retinyl acetate** — equivalent to palmitate, slightly less common.
- **Beef liver capsules / desiccated liver** — whole-food vitamin A from the highest-density natural source. Pairs with B12, copper, choline, and a full vitamin/mineral matrix. Reputable brands provide ~1,500-3,000 mcg per serving.
- **Cod liver oil** — traditional source providing vitamin A (1,250-3,750 mcg per serving), vitamin D (~250-1,000 IU), and EPA/DHA. Quality varies.
- **Beta-carotene supplements** — pro-vitamin A, requires BCMO1 conversion. Adequate for conversion-competent individuals; meaningfully insufficient for the genetically slow-converter population. Also implicated in **increased lung cancer risk in smokers** from the ATBC and CARET trials — high-dose beta-carotene specifically should be avoided in smokers.

The practical rule: **preformed vitamin A from retinyl palmitate, beef liver, or cod liver oil — not high-dose isolated beta-carotene supplements.**

**Dose and the fat-soluble triad**

The RDA is 900 mcg RAE for men and 700 mcg RAE for women. The tolerable upper limit from preformed vitamin A is 3,000 mcg RAE daily for adults. Most users supplementing for skin, hair, immune, or fat-soluble triad balance do well at **1,500-3,000 mcg RAE daily**. Beyond 10,000 mcg RAE long-term raises hepatotoxicity concerns.

The integrated fat-soluble vitamin stack ratios that work in practice are roughly **A : D3 : K2 = 3,000 mcg : 5,000 IU : 100-200 mcg**. These vitamins compete and cooperate; isolated mega-dosing of any single one (vitamin D3 megadoses without K2 and A is the most common error) creates imbalances that show up as soft tissue calcification, bone density issues, or excessive epithelial turnover.

**Timing**

Vitamin A is fat-soluble — take with a meal containing at least some fat.

**Pregnancy caution**

Vitamin A is teratogenic at high doses (above approximately 3,000 mcg RAE daily) during early pregnancy. This is the single most important caution. Women who are pregnant or trying to conceive should keep preformed vitamin A intake within RDA range (700-770 mcg RAE) and rely on beta-carotene from food sources for any additional vitamin A activity.

The catalog does not provide specific protocol guidance per locked HRT/protocol rule. Form (preformed retinyl palmitate or whole-food liver) and dose (1,500-3,000 mcg RAE daily) are the practical decisions.`,
    stacksWith: ["vitamin-d3", "vitamin-k2", "vitamin-e", "zinc", "omega-3", "biotinoyl-tripeptide-1", "redensyl"],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. LITHIUM OROTATE
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "lithium-orotate",
    name: "Lithium Orotate",
    category: "Nootropic",
    categories: ["Nootropic", "Neuroprotection", "Mood Support", "Mineral", "BDNF Modulator", "Microdose Lithium"],
    brief: "Low-dose elemental lithium (1-20 mg) for neuroprotection, BDNF upregulation, and mood stability — orders of magnitude below pharmaceutical lithium carbonate doses, with a different risk profile and use case.",
    mechanism: `The relevant distinction is between **pharmaceutical lithium** (lithium carbonate, 600-1,800 mg daily, serum target 0.6-1.2 mEq/L, requires monitoring) and **microdose lithium** (lithium orotate, 1-20 mg elemental lithium daily, well below detectable serum levels). These are the same element with fundamentally different pharmacology — the same way aspirin at 81 mg for cardiovascular protection is mechanistically distinct from aspirin at 4 grams daily for inflammatory conditions.

The mechanism most relevant at microdose levels is **glycogen synthase kinase 3 beta (GSK-3β) inhibition**. GSK-3β is implicated in neurodegeneration, tau hyperphosphorylation (the protein deposit characteristic of Alzheimer's disease), and mood dysregulation. Lithium inhibits GSK-3β at low intracellular concentrations, the leading mechanistic hypothesis for both its mood-stabilizing effect at high pharmaceutical doses and its neuroprotective effect at microdoses. Downstream effects include increased BDNF (brain-derived neurotrophic factor) expression, neurogenesis in the hippocampus, and reduced apoptotic signaling.

The **epidemiological evidence** for microdose lithium is provocative. Multiple population studies have shown inverse correlations between trace lithium concentrations in drinking water and rates of suicide, all-cause mortality, dementia incidence, and violent crime. The 2017 Danish nationwide cohort study found areas with higher drinking water lithium had a 17% lower dementia incidence over a 17-year follow-up. These studies use lithium concentrations that translate to microgram-per-day intakes — orders of magnitude below microdose supplements.

The **BDNF and neuroplasticity** story connects lithium to the broader nootropic and neuroprotective lane already represented in the catalog by Dihexa, Bromantane, Cerebrolysin, NSI-189, P21, and the racetam family. BDNF is the master neurotrophic factor for adult hippocampal neurogenesis. Lithium is unique in supporting BDNF expression at trace mineral doses through GSK-3β rather than direct receptor agonism. The **mood stability** mechanism at microdose levels follows logically from GSK-3β inhibition and from the pharmacological dose mechanism, though the trial evidence at microdose levels is limited — the literature consists mainly of case reports, open-label studies from the 1970s (Hans Nieper's clinical work), and contemporary anecdotal reports from integrative psychiatry.

The **orotate carrier** is purported to facilitate cellular delivery of lithium more efficiently than the carbonate carrier, which would explain why microdose lithium orotate produces effects at doses where lithium carbonate would be subtherapeutic. The practical observation — that users report effects at lithium orotate doses corresponding to 1-20 mg elemental lithium without serum lithium toxicity — is real regardless of the precise carrier mechanism.`,
    notes: `**The microdose vs pharmaceutical distinction is the entire conversation**

The single most important point about lithium: pharmaceutical lithium carbonate for bipolar disorder requires prescription, serum monitoring, kidney function tracking, thyroid surveillance, and clinician oversight — and is one of the most effective psychiatric medications ever developed when properly used. **Microdose lithium orotate is not that.** The doses are 30-100x lower, serum levels remain undetectable, the toxicity profile is fundamentally different, and the use case is preventive neuroprotection and subtle mood support rather than treatment of a psychiatric disorder.

This distinction matters because uninformed conflation leads to two opposite errors: dismissing microdose lithium as dangerous (it isn't, at the doses discussed here), or assuming microdose lithium is sufficient for someone with bipolar disorder (it almost certainly isn't — that's a clinical condition requiring proper psychiatric management).

**Form selection**

- **Lithium orotate** — the standard form. Most commercial supplements provide 5 mg of elemental lithium per capsule. The Hans Nieper-tradition default form.
- **Lithium aspartate** — alternative chelate form. Similar pharmacology. Less common in the US market.
- **Lithium carbonate / lithium citrate** — pharmaceutical forms. **Not the form discussed here.** Requires prescription and clinical monitoring.

**Dose**

Starting dose is **1-5 mg elemental lithium daily** (one capsule of standard 5 mg lithium orotate). Some users titrate to **5-10 mg daily** for more pronounced effects on mood and cognition. **Above 20 mg daily** moves into territory warranting clinical conversation.

Half-life is approximately 24 hours, so once-daily dosing is fine. Take with food to minimize GI sensitivity.

**Who benefits most**

- Individuals with strong family history of dementia, especially Alzheimer's disease
- Older adults pursuing healthspan and cognitive longevity protocols
- Users with subclinical mood lability — mild irritability, low-grade dysthymia, or stress reactivity that doesn't meet diagnostic threshold
- Individuals with high-stress work or family situations who notice cumulative emotional dysregulation
- Anyone interested in the GSK-3β / BDNF neuroprotective lane already represented by Dihexa, Cerebrolysin, NSI-189, and the racetam family

**Who should be cautious**

- Anyone with **diagnosed bipolar disorder, schizoaffective disorder, or major depressive disorder** under psychiatric care — should be discussed with the treating clinician
- Individuals with **kidney impairment** (lithium clears renally)
- Individuals with **thyroid disease**, especially hypothyroidism
- Pregnancy — pharmaceutical lithium has documented fetal cardiac risk; caution warrants conversation with an obstetrician
- Users on **NSAIDs, ACE inhibitors, or thiazide diuretics**, which can elevate serum lithium

The catalog does not provide specific protocol guidance per locked HRT/protocol rule and does not substitute for psychiatric care in individuals with diagnosed mood disorders. Form (orotate), dose (start 1-5 mg, titrate to 5-10 mg as tolerated), and the pharmaceutical-vs-microdose distinction are the practical decisions.`,
    stacksWith: ["nmn", "nr", "tmg", "spermidine", "dihexa", "cerebrolysin", "nsi-189", "p21-peptide", "klotho", "cortagen", "epitalon"],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. TUDCA
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "tudca",
    name: "TUDCA (Tauroursodeoxycholic Acid)",
    category: "Foundational",
    categories: ["Foundational", "Liver Support", "Bile Acid", "Mitochondrial Support", "Endoplasmic Reticulum Stress Modulator"],
    brief: "Taurine-conjugated bile acid that improves bile flow, reduces ER stress, supports hepatocyte and mitochondrial function, and protects the liver across a range of insults from oral anabolics to fatty liver disease.",
    mechanism: `TUDCA — tauroursodeoxycholic acid — is the taurine-conjugated form of ursodeoxycholic acid (UDCA), itself a minor bile acid that occurs naturally in human bile and is concentrated in bear bile, where it has been used in traditional Chinese medicine for over a millennium. The compound earns its catalog place at the intersection of three converging therapeutic stories: liver protection during pharmaceutical and supplement-induced hepatic stress, mitochondrial and ER stress modulation in chronic disease, and bile flow support for the increasingly common population dealing with subclinical biliary dysfunction.

The signature mechanism is **reduction of endoplasmic reticulum (ER) stress**. The endoplasmic reticulum is the cellular organelle responsible for protein folding; when misfolded proteins accumulate, the cell either resolves the stress through chaperone-mediated refolding, induces autophagy to clear aggregates, or — if stress is sustained — undergoes apoptosis. ER stress is mechanistically implicated in fatty liver disease, type 2 diabetes, neurodegeneration, and atherosclerosis. TUDCA acts as a chemical chaperone, stabilizing protein folding and reducing unfolded protein response activation. This is the unifying mechanism behind the breadth of TUDCA's apparent effects.

The **bile flow and choleretic effect** is the original use case and remains the most clinically validated. UDCA (the parent compound) is approved for primary biliary cholangitis at 13-15 mg/kg daily. TUDCA shares this mechanism — it shifts the bile acid pool toward more hydrophilic, less cytotoxic acids; stimulates bile flow at the hepatocyte canalicular membrane; and protects bile duct epithelium from the detergent effects of more cytotoxic bile acids. The practical consequence is that TUDCA is genuinely useful for individuals with sluggish bile flow, gallbladder dysfunction, or post-cholecystectomy bile acid dysregulation.

The **hepatoprotective effect during anabolic steroid use** drove TUDCA from a niche supplement into mainstream awareness in the bodybuilding community. Oral 17-alpha-alkylated anabolic steroids (oxandrolone, oxymetholone, stanozolol — all in the catalog) cause cholestatic hepatotoxicity through canalicular transporter inhibition, mitochondrial dysfunction, and ER stress. TUDCA addresses all three. The empirical observation is that TUDCA at 500-1,000 mg daily during oral anabolic cycles substantially reduces ALT, AST, GGT, and bilirubin elevation.

The **mitochondrial protection** mechanism overlaps with the ER stress story — TUDCA reduces mitochondrial membrane permeability, prevents cytochrome c release, and reduces apoptotic signaling. This is the basis for the TUDCA research literature in **neurodegeneration** (ALS, Huntington's, Parkinson's). The AMX0035 combination drug (TUDCA plus phenylbutyrate) achieved FDA approval for ALS in 2022 and was subsequently withdrawn in 2024 after a confirmatory trial failed to replicate the original benefit — the kind of nuance the supplement marketing rarely captures.

The **fatty liver / insulin sensitivity** mechanism is becoming clinically relevant as MASLD becomes one of the most common chronic conditions in the United States. The 2010 Kars et al. study in obese subjects with insulin resistance demonstrated improved insulin sensitivity in muscle and liver after four weeks of TUDCA at 1,750 mg daily — a striking finding for what is essentially a bile acid supplement.`,
    notes: `**Form selection**

- **Pure TUDCA powder or capsules** — the standard supplemental form. Most quality products provide 250-500 mg per capsule. Reputable brands publish third-party COAs verifying TUDCA content (the supplement market has had quality issues with TUDCA being underdosed or substituted).
- **TUDCA + UDCA combination** — adequate but not superior to TUDCA alone for most use cases.
- **UDCA (Ursodiol, Actigall)** — the pharmaceutical parent compound. Effective for cholestasis use cases but lacks the taurine conjugation that improves TUDCA's tissue distribution.
- **Bear bile** — the traditional Chinese medicine source, with serious ethical and legal concerns. Not the form to use; pharmaceutical or supplemental TUDCA is equivalent and ethically straightforward.

The practical rule: **pure TUDCA capsules at 250-1,000 mg daily**, from a brand publishing third-party verification.

**Dose**

- **250 mg daily** — general liver support and bile flow optimization for healthy users.
- **500 mg daily** — the typical "I'm doing something hepatically demanding" dose. Appropriate for users running consistent methylene blue protocols or with mild liver enzyme elevation.
- **500-1,000 mg daily, divided** — the protective dose during oral anabolic steroid cycles or active hepatic stress. Bodybuilding community standard.
- **1,000-1,750 mg daily, divided** — the dose used in the fatty liver insulin sensitivity research. Appropriate for individuals working with a clinician on a specific hepatic concern.

Half-life is ~4 hours; divided dosing with meals is standard.

**Who benefits most**

- **Users running oral 17-alpha-alkylated anabolic steroids** (oxandrolone, oxymetholone, stanozolol). The catalog does not endorse or guide oral anabolic protocols, but for users running them, TUDCA support is mechanistically warranted.
- **Individuals with elevated liver enzymes** of any non-emergent cause — fatty liver, supplement load, alcohol exposure, pharmaceutical hepatotoxicity. Worth retesting after 8-12 weeks of TUDCA at 500 mg daily.
- **Post-cholecystectomy patients** managing bile acid dysregulation — bloating, fat malabsorption, irregular bowel function after gallbladder removal.
- **Individuals with sluggish bile flow** — right upper quadrant fullness after fatty meals, slow fat digestion, mildly elevated GGT.
- **Users running consistent methylene blue protocols** — TUDCA is a sensible co-supplement for the hepatic processing load.
- **Individuals with family history of biliary disease** — primary biliary cholangitis, primary sclerosing cholangitis, gallstone disease.

**Who should be cautious**

- **Pregnancy** — limited safety data; not recommended outside clinician guidance.
- **Active gallstone disease with biliary obstruction** — clinical situation, not a supplement situation.
- **Severe hepatic impairment** — warrants clinician involvement.

The catalog does not provide specific protocol guidance per locked HRT/protocol rule and does not substitute for clinical care in individuals with diagnosed hepatobiliary disease. Form (pure TUDCA, third-party verified) and dose (250-1,000 mg daily, divided with meals) are the practical decisions.`,
    stacksWith: ["nac", "methylene-blue", "oxandrolone", "oxymetholone", "stanozolol", "metformin", "berberine", "omega-3", "vitamin-e", "boron", "zinc"],
  },
];
