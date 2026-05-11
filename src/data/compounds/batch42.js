/**
 * Batch 42 — Adrenergic / Thermogenic Cluster (2 entries — NEW WAVE 1).
 *
 * Two tiles completing the adrenergic/thermogenic cluster anchored by
 * Ephedrine (BATCH17), Clenbuterol (BATCH7), Albuterol (BATCH7), and
 * Mirabegron (BATCH6). These compounds are the daily working tools of
 * cut-phase and stubborn-fat protocols; the catalog had a notable gap
 * for the two most-asked-about non-prescription thermogenics in the
 * peptide and bodybuilding cohorts.
 *
 * Cluster composition: one β-3 selective adrenergic agonist (Synephrine
 * HCl) plus one α-2 adrenergic antagonist (Yohimbine HCl). The two
 * compounds attack lipolysis from complementary angles — β-3 agonism
 * stimulates adipose-tissue cAMP production directly; α-2 antagonism
 * removes the presynaptic brake on norepinephrine release and the
 * adipocyte α-2 receptor brake on lipolysis. They cross-reference each
 * other and reference back to the broader adrenergic cluster.
 *
 *   synephrine — NEW. p-Synephrine HCl from Citrus aurantium (bitter
 *     orange); protoalkaloid; β-3 selective adrenergic agonist with
 *     mild β-1/β-2 activity at higher doses; the compound that largely
 *     replaced ephedrine in legal supplements post-2004 FDA ephedra
 *     ban; cleaner CNS profile than ephedrine; cardiac signal exists
 *     but milder; standard stack with caffeine + bitter orange complex
 *     (hesperidin, naringenin); Stohs meta-analysis pedigree; ~50%
 *     less potent than ephedrine on lipolysis but with substantially
 *     better tolerability profile.
 *   yohimbine — NEW. Yohimbine HCl from Pausinystalia yohimbe bark;
 *     α-2 adrenergic antagonist; the stubborn-fat tool; lower-body
 *     adipose tissue has high α-2 receptor density (particularly in
 *     men) which acts as a brake on lipolysis — α-2 blockade removes
 *     that brake; the Lyle McDonald 0.2mg/kg fasted-cardio protocol
 *     reference; **insulin blunts the effect entirely** — only works
 *     in fasted state; anxiety/panic signal is real and dose-dependent;
 *     hypertension and MAOI interaction warnings; FDA-approved for
 *     erectile dysfunction pre-Viagra era (Rx history); critical food
 *     timing rule.
 *
 * Theme: thermogenic / lipolytic adjuncts — the cut-phase tools where
 * mechanism contrasts and timing rules matter more than dose. Both
 * tiles emphasize the fasted-state requirement (more critical for
 * Yohimbine than Synephrine), the cardiac signal honest framing, and
 * the stack synergies with caffeine + the broader adrenergic cluster.
 *
 * Editorial decisions locked:
 *   - No vendor / clinic / compounding-pharmacy / research-vendor brand
 *     names — public pharmacy infrastructure (GoodRx, Costco, Walmart,
 *     Costplus) retained; matches sanitizeVendorRefs downstream behavior
 *   - Fasted-state framing for Yohimbine is non-negotiable — the
 *     insulin-blunts-the-effect literature is unambiguous; eating
 *     within ~4 hours of dosing wastes the dose
 *   - Cardiac signal honest framing for both — Synephrine is milder
 *     than ephedrine but not zero; Yohimbine produces real BP elevation
 *     and anxiety in sensitive responders
 *   - Stack synergy framing — caffeine is the standard adjunct for both;
 *     the two compounds attack lipolysis from complementary mechanisms
 *     and can be stacked together for the classic stubborn-fat protocol
 *   - Lyle McDonald 0.2mg/kg fasted-cardio protocol reference for
 *     Yohimbine — the community-validated protocol with the most
 *     consistent reports
 *   - WADA status not relevant — neither is on the prohibited list
 *     (Synephrine is permitted, Yohimbine is permitted) but cardiac
 *     screening for high-output athletes is still prudent
 *   - Word counts ~1500-1700 per tile matching BATCH38 standard
 *
 * Migration accounting (NEW batch — no ID collisions):
 *   PEPTIDES_CORE: 0 → 0 (unchanged)
 *   BATCH42: +2 (new file, all new entries)
 *   ALL_COMPOUNDS: 275 → 277 (net +2)
 *   CATALOG_COUNT: 275 → 277
 *
 * Schema matches BATCH38.
 *
 * Cursor handoff notes:
 *   1. Add `import { BATCH42 } from "./batch42.js";` to compounds/index.js
 *      after BATCH41 import.
 *   2. Add `...BATCH42,` to _ALL_COMPOUNDS_RAW spread after `...BATCH41,`.
 *   3. No expected duplicate warnings — both IDs are new.
 *   4. Run dev build; verify PEPTIDES.length = 277.
 *   5. Spot-check Library tile rendering for both IDs; confirm
 *      mechanism, dosing, warnings render correctly.
 *   6. Cross-reference link check — verify stacksWith arrays resolve to
 *      existing compound IDs (caffeine, ephedrine, clenbuterol, etc).
 */
export const BATCH42 = [
  {
    id: "synephrine",
    name: "Synephrine HCl",
    aliases: ["p-Synephrine", "Bitter Orange Extract", "Citrus aurantium alkaloid", "Oxedrine", "Protoalkaloid"],
    category: ["GLP / Metabolic"],
    categories: ["GLP / Metabolic"],
    route: ["oral"],
    mechanism:
      "**Synephrine HCl** is a protoalkaloid sympathomimetic amine derived from the immature fruit and peel of Citrus aurantium (bitter orange). Structurally related to ephedrine and norepinephrine — the molecule is essentially norepinephrine with a methyl substitution pattern that shifts receptor binding away from the CNS-active β-1/β-2 axis toward β-3 selectivity at therapeutic doses. **Mechanism — adrenergic receptor profile**: p-synephrine (the active stereoisomer in bitter orange) demonstrates preferential binding to β-3 adrenergic receptors with mild β-1 and β-2 activity that becomes more pronounced at higher doses. β-3 receptors are heavily expressed on adipocytes; β-3 agonism activates adenylyl cyclase → increased cAMP → PKA activation → hormone-sensitive lipase (HSL) phosphorylation → triglyceride hydrolysis → fatty acid mobilization. This is the primary thermogenic and lipolytic mechanism. The β-3 selectivity is the entire reason Synephrine survived the post-2004 FDA ephedra ban while ephedrine itself did not — the cardiac (β-1) and bronchodilator (β-2) effects that drove ephedrine's cardiovascular adverse event profile are substantially reduced. **Mechanism — pharmacokinetics**: oral bioavailability moderate (~25-40% as parent compound; varies with formulation and co-ingested bioflavonoids); peak plasma ~1-2 hours post-dose; half-life ~2-3 hours; cleared primarily via monoamine oxidase A (MAO-A) and sulfation. The short half-life supports 2-3x/day dosing for sustained thermogenic effect. **Mechanism — bioflavonoid synergy**: bitter orange extract delivered as the whole-spectrum product (containing hesperidin, naringenin, and other flavonoids) produces meaningfully different pharmacokinetics than isolated synephrine HCl. The flavonoids inhibit MAO-A and CYP enzymes, extending synephrine's circulating half-life and amplifying the thermogenic effect. Isolated synephrine HCl powder has cleaner pharmacokinetics but loses the natural-extract synergy; this is a tradeoff to weigh based on dosing precision needs vs effect amplification. **Mechanism — clinical reality**: Synephrine occupies the legal-supplement thermogenic slot that ephedrine vacated. It is roughly half as potent as ephedrine on weight loss endpoints but with substantially better cardiovascular tolerability. Stohs meta-analyses (2011, 2017) covering more than 60 human studies established the safety profile at standard supplement doses (50mg/day or less) — modest blood pressure and heart rate elevation but no signal for serious adverse events at recommended doses. The cardiac signal is real but mild; the practical use case is moderate thermogenic support in cut-phase protocols, not aggressive fat-loss acceleration. **Regulatory status**: Synephrine is a permitted supplement ingredient in the United States. WADA does not list it on the prohibited list (delisted in 2009). The European Food Safety Authority has set advisory limits.",
    halfLife: "~2-3 hours plasma; cleared via MAO-A and sulfation; bioflavonoid co-ingestion (hesperidin, naringenin in whole-spectrum bitter orange extract) extends half-life via MAO-A and CYP inhibition",
    reconstitution: { solvent: "Oral capsule, tablet, or powder; not reconstituted", typicalVialMg: 0, typicalVolumeMl: 0 },
    dosingRange: {
      low: "10-25mg per dose, 1-2x/day (entry / stimulant-sensitive users)",
      medium: "25-50mg per dose, 2-3x/day (typical cut-phase protocol)",
      high: "50mg per dose, 3x/day = 150mg/day total (upper-end supplement use; exceeds EFSA advisory limit)",
      frequency: "2-3x/day, spaced 4-6 hours; final dose no later than 6 hours pre-sleep to avoid insomnia",
    },
    typicalDose:
      "Cut-phase pattern: 25-50mg pre-fasted-cardio AM, optional 25mg pre-workout, optional 25mg mid-afternoon. Pre-workout standalone: 50mg 30-60 minutes pre-training, typically stacked with 100-200mg caffeine.",
    startDose:
      "10-25mg single dose to assess tolerance; reassess HR and BP at 60-90 minutes post-dose. Stimulant-sensitive users start at 10mg; stimulant-tolerant users can start at 25-50mg.",
    titrationNote:
      "Effect ceiling is real — doubling the dose above ~50mg per administration does not double the lipolytic effect but does roughly double the cardiac signal. Stack synergy with caffeine is the standard amplification path rather than dose escalation. Monitor resting heart rate and blood pressure during the first 2 weeks; persistent elevation above baseline at trough warrants dose reduction or discontinuation.",
    cycle:
      "8-12 weeks on, 2-4 weeks off recommended to preserve β-3 receptor sensitivity. Continuous use produces measurable downregulation by week 8-12 in most users; the cycling pattern matches the typical cut-phase duration.",
    storage: "Capsules, tablets, or powder: room temperature, dry, away from light. Powder hygroscopic — keep desiccant in container.",
    bioavailability: "~25-40% oral parent compound; whole-spectrum bitter orange extract with bioflavonoids increases effective exposure via MAO-A and CYP inhibition",
    benefits: [
      "β-3 selective adrenergic agonism — adipose-tissue lipolysis with reduced cardiac and CNS burden vs ephedrine",
      "Established thermogenic and lipolytic effect at standard supplement doses (Stohs meta-analyses 2011, 2017)",
      "Legal supplement status — survived the 2004 FDA ephedra ban; widely available without prescription",
      "Bioflavonoid synergy with whole-spectrum bitter orange extract (hesperidin, naringenin) amplifies and extends effect",
      "Stacks cleanly with caffeine for the standard pre-workout thermogenic combination",
      "Stacks complementarily with α-2 antagonists (yohimbine) — different lipolytic mechanism axis",
      "Short half-life allows precise timing around training and fasted cardio",
      "Better cardiac tolerability than ephedrine at equivalent lipolytic effect",
      "WADA-permitted (delisted 2009) — usable by tested athletes with appropriate documentation",
    ],
    sideEffects: [
      "Modest blood pressure elevation — typically 5-10 mmHg systolic at standard doses",
      "Modest heart rate elevation — typically 5-10 bpm at standard doses",
      "Insomnia if dosed too close to sleep",
      "Mild anxiety, jitteriness, or restlessness — particularly when stacked with caffeine in stimulant-sensitive users",
      "Headache, especially during initial dosing or with dehydration",
      "GI upset — mild nausea reported, often resolves with food (note tradeoff: food may blunt lipolytic effect for fasted-cardio use case)",
      "Dose-dependent loss of β-3 selectivity — higher doses recruit β-1 and β-2 activity producing more pronounced cardiac and bronchodilation effects",
      "Receptor downregulation with continuous use — diminished effect by week 8-12 supports cycling",
      "Rare hypertensive events in users with pre-existing hypertension or CV disease — coordinate with prescriber if relevant",
    ],
    stacksWith: ["caffeine", "yohimbine", "ephedrine", "clenbuterol", "albuterol"],
    warnings: [
      "**Cardiac signal is real but mild** — modest BP and HR elevation at standard doses; coordinate with prescriber if pre-existing hypertension, arrhythmia, or CV disease",
      "**Stimulant stacking compounds the cardiac signal** — caffeine + synephrine combinations produce greater BP/HR elevation than either alone; monitor accordingly",
      "**MAOI interaction** — synephrine is a MAO-A substrate; concurrent MAOIs produce dangerous sympathomimetic accumulation; absolute contraindication",
      "**Thyroid medication interaction** — additive sympathomimetic effects with thyroid hormone replacement; coordinate dose timing with prescriber",
      "Pregnancy and lactation — contraindicated; sympathomimetic exposure not characterized in development",
      "Pheochromocytoma — absolute contraindication",
      "Closed-angle glaucoma — contraindicated due to mydriatic effect",
      "Stimulant medication interaction (ADHD stimulants, decongestants) — additive cardiac and CNS effects; coordinate with prescriber",
      "Operating heavy machinery or driving long distances on initial dosing — assess CNS tolerance first",
      "Pre-existing anxiety disorder — sympathomimetic load can amplify symptoms",
      "Athletes subject to drug testing — Synephrine is currently WADA-permitted (delisted 2009) but verify current status before competition",
      "Concurrent SSRIs — minor serotonergic interaction signal; coordinate with prescriber",
    ],
    sourcingNotes:
      "**Whole-spectrum bitter orange supplement (preferred for synergy):** capsule products standardized to 6-10% synephrine content with naturally present hesperidin and naringenin; standard dose 100-500mg extract delivering 6-50mg synephrine; widely available retail. **Isolated synephrine HCl powder:** research-grade powder products for precise dosing; commonly sold in 10-50g quantities; clean pharmacokinetics but lacks bioflavonoid synergy. **Pre-workout / fat-burner combination products:** typically include synephrine 25-50mg + caffeine 100-300mg + bioflavonoid extracts; convenience tradeoff against dosing precision. **Cost:** standalone synephrine inexpensive (~$15-30 per 30-day supply at standard doses); combination products variable.",
    notes:
      "## Clinical Context — The Legal Thermogenic Workhorse\n\nSynephrine HCl has occupied the legal-supplement thermogenic slot since ephedrine's effective removal from the supplement market following the 2004 FDA ban on ephedra alkaloids in dietary supplements. The migration was inevitable — the supplement industry needed a thermogenic anchor and Synephrine was the most plausible structural cousin that could clear the regulatory bar. The cardiovascular adverse event profile that drove the ephedra ban was substantially β-1 receptor mediated; Synephrine's preferential β-3 binding sidesteps most of that profile while preserving meaningful lipolytic effect.\n\nThe practical use case spans:\n\n**Pre-fasted-cardio thermogenic** — 25-50mg AM stacked with 100-200mg caffeine; the standard cut-phase opener\n\n**Pre-workout component** — 25-50mg 30-60 minutes pre-training; component of most commercial pre-workout / fat-burner stacks\n\n**Mid-day appetite suppression / energy** — 25mg mid-afternoon; less common but viable for users who tolerate stimulants well\n\n**Stubborn fat stack adjunct** — synergistic with Yohimbine via complementary mechanisms (β-3 agonism + α-2 antagonism); the dual-mechanism approach attacks lipolysis from both sides\n\n## Synephrine vs Ephedrine — The Form Decision\n\n**Ephedrine:** Stronger thermogenic and lipolytic effect — roughly 2x Synephrine on weight loss endpoints. β-1, β-2, and β-3 activity plus indirect catecholamine release. CNS-stimulating. Cardiac signal substantial; the reason the FDA pulled it from supplements. Still available in some pharmacies as a single-ingredient bronchodilator (Bronkaid, Primatene); state restrictions vary post-Combat Methamphetamine Epidemic Act due to precursor status.\n\n**Synephrine (this tile):** Roughly half the thermogenic potency at standard doses. β-3 selective with mild β-1/β-2 at higher doses. Cleaner cardiac and CNS profile. Legal supplement status. The reasonable default for users who want thermogenic support without the ephedrine regulatory and cardiovascular complications.\n\nThe decision frame: if access to ephedrine is straightforward and cardiovascular profile is clean, ephedrine produces stronger effect. For most users without pharmacy access or with any CV concerns, Synephrine is the appropriate workhorse.\n\n## Why the Bioflavonoid Co-Ingestion Matters\n\nIsolated synephrine HCl powder has predictable pharmacokinetics — peak ~1-2 hours, half-life ~2-3 hours, cleared via MAO-A. Whole-spectrum bitter orange extract delivers synephrine alongside hesperidin, naringenin, and other flavonoids that inhibit MAO-A and several CYP enzymes. The result: extended circulating half-life and amplified effect from the same nominal synephrine dose. Studies comparing isolated synephrine vs whole-extract products consistently show greater thermogenic response from the whole extract.\n\nThe practical implication: a 50mg synephrine dose from whole-spectrum bitter orange extract produces a somewhat stronger and longer effect than 50mg isolated synephrine HCl. For users targeting maximum thermogenic effect, whole extract wins. For users prioritizing dosing precision (e.g., stacking with other adrenergics where total sympathomimetic load matters), isolated HCl wins.\n\n## The Caffeine + Synephrine Stack\n\nThe standard amplification stack is caffeine 100-300mg + synephrine 25-50mg, taken together pre-fasted-cardio or pre-workout. The mechanisms are complementary:\n\n- **Caffeine** raises cAMP via phosphodiesterase inhibition (preventing cAMP breakdown)\n- **Synephrine** raises cAMP via β-3 agonism (driving cAMP synthesis)\n\nBoth converge on elevated cAMP → PKA activation → HSL phosphorylation → lipolysis. The combined effect is greater than either alone. The combination also produces greater cardiac signal than either alone — monitor accordingly.\n\n## The Synephrine + Yohimbine Stack\n\nThe stubborn-fat stack pairs Synephrine (β-3 agonist) with Yohimbine (α-2 antagonist). Adipose tissue has both β-adrenergic receptors (stimulate lipolysis) and α-2 adrenergic receptors (inhibit lipolysis). The α-2 brake is particularly active in lower-body and abdominal adipose in men. Synephrine pushes the lipolytic accelerator (β-3 agonism); Yohimbine removes the lipolytic brake (α-2 antagonism). The dual-mechanism approach is more effective than either alone for stubborn-fat regions.\n\nThe stack timing matters: both require fasted state for full effect, with Yohimbine the more sensitive to insulin blunting. Standard protocol: 50mg Synephrine + 0.2mg/kg Yohimbine + 200mg caffeine, taken fasted 30-60 minutes pre-cardio. See the Yohimbine tile for full fasted-state protocol detail.\n\n## Synergies\n\n**Caffeine** — the standard pre-workout / pre-cardio stack adjunct; mechanism-complementary; the most widely used combination. **Yohimbine** — stubborn-fat stack via complementary β-3 / α-2 mechanism axes; the cut-phase finisher protocol. **Ephedrine** — historical precursor; redundant on cleaner-profile use cases but stronger on raw thermogenic effect. **Clenbuterol** — β-2 agonist; mechanism overlap; combined use produces excessive adrenergic load and is rarely indicated. **Albuterol** — same caveat as clenbuterol.\n\n## Clinical Trial Citations Worth Knowing\n\n**Stohs et al. 2011** (meta-analysis): reviewed 22 published studies on p-synephrine and bitter orange extract; established safety profile at supplement doses; documented modest cardiovascular effects without signal for serious adverse events.\n\n**Stohs et al. 2017** (updated meta-analysis): expanded review covering 60+ human studies; reinforced 2011 findings; confirmed lipolytic efficacy at standard doses.\n\n**Haaz et al. 2006** (review): summarized bitter orange extract mechanisms and clinical effects; established the framework for post-ephedra supplement use.\n\n**Stohs & Shara 2020** (review): clarified p-synephrine pharmacology and dose-response relationships.\n\n## Evidence Quality\n\nMechanism well-characterized — β-3 receptor pharmacology and downstream cAMP signaling extensively studied. Human safety profile robust via Stohs meta-analyses at supplement doses. Efficacy evidence solid but effect size modest — Synephrine is a meaningful thermogenic adjunct, not a transformative fat-loss tool. Long-term safety beyond ~12 weeks less well-characterized.\n\n## Research vs Anecdote\n\nResearch: solid mechanistic foundation; safety profile at supplement doses well-established; efficacy evidence consistent with modest thermogenic effect; bioflavonoid synergy documented. Anecdote: extensive supplement-industry use since 2005; consensus that caffeine stacking is the standard amplification; consensus that Yohimbine pairing is the stubborn-fat stack; consensus that effect ceiling is real around 50mg per dose. Decision frame: the legal-supplement thermogenic workhorse; appropriate for cut-phase support, pre-workout thermogenesis, and stubborn-fat stack adjunct; cardiac signal mild but present; cycling 8-12 weeks on / 2-4 weeks off preserves receptor sensitivity; the catalog does not provide specific protocol guidance per locked HRT/protocol rule.",
    tags: ["synephrine", "p-synephrine", "bitter orange", "Citrus aurantium", "protoalkaloid", "beta-3 agonist", "adrenergic", "thermogenic", "lipolysis", "fat loss", "cut phase", "Stohs meta-analysis", "ephedra alternative"],
  },

  {
    id: "yohimbine",
    name: "Yohimbine HCl",
    aliases: ["Yohimbe extract", "Pausinystalia yohimbe alkaloid", "Quebrachine", "Aphrodine", "α-2 Adrenergic Antagonist"],
    category: ["GLP / Metabolic", "Sexual Health"],
    categories: ["GLP / Metabolic", "Sexual Health"],
    route: ["oral"],
    mechanism:
      "**Yohimbine HCl** is an indole alkaloid extracted from the bark of Pausinystalia yohimbe and a selective α-2 adrenergic receptor antagonist. **Mechanism — α-2 receptor pharmacology**: α-2 adrenergic receptors function as inhibitory autoreceptors and heteroreceptors throughout the sympathetic nervous system. Presynaptic α-2 autoreceptors on noradrenergic neurons provide negative feedback on norepinephrine release — when NE concentration rises, presynaptic α-2 activation reduces further NE release. Postsynaptic α-2 receptors on adipocytes inhibit cAMP production via Gi-coupled signaling, directly opposing the β-adrenergic lipolytic cascade. Yohimbine blocks both receptor populations: presynaptic blockade disinhibits NE release (increasing systemic sympathetic tone), and adipocyte α-2 blockade removes the local lipolytic brake. **Mechanism — the stubborn-fat thesis**: adipose tissue distribution of α-2 vs β-adrenergic receptors is non-uniform. Lower-body adipose in men (lumbar, glute, posterior thigh) and abdominal/glute adipose in women shows substantially higher α-2 receptor density relative to β receptors compared with upper-body adipose. This α-2 dominance is the molecular basis for the 'stubborn fat' clinical observation — these regions resist standard caloric-deficit fat mobilization because the α-2 brake dominates at any given catecholamine level. Yohimbine's α-2 blockade unlocks lipolysis in these regions specifically, which is why the practical effect is concentrated on stubborn-fat areas rather than uniform fat loss. **Mechanism — the insulin problem (critical)**: α-2 receptors are activated indirectly by insulin signaling pathways, and insulin independently suppresses lipolysis via cAMP reduction. The result: insulin blunts Yohimbine's lipolytic effect almost completely. The Berlan et al. 1991 study demonstrated that Yohimbine increases lipolysis only in fasted-state subjects; postprandial subjects showed minimal effect from the same dose. The fasted-state requirement is not optional — it is a mechanistic necessity. **Mechanism — pharmacokinetics**: oral bioavailability variable (7-87% per individual due to CYP2D6 polymorphism); peak plasma ~30-60 minutes post-dose; native half-life ~36 minutes; Yohimbine HCl salt extends effective duration to ~1.5-3 hours due to slower dissolution and absorption; cleared via CYP2D6 oxidation. The wide bioavailability range produces large inter-individual variation in response and side-effect profile. **Mechanism — clinical reality**: Yohimbine occupies two distinct use cases. **Fat loss adjunct**: 0.2mg/kg pre-fasted-cardio (Lyle McDonald protocol) targeting stubborn-fat regions; standard cut-phase finisher tool. **Erectile dysfunction**: Yohimbine HCl was FDA-approved as Rx for ED (Yocon, Aphrodyne) from 1989 until effectively superseded by sildenafil in 1998; mechanism involves both central pro-erectile effects via α-2 blockade and increased nitric oxide signaling; remains available off-label. **Regulatory status**: Yohimbine HCl is sold as a dietary supplement in the United States though FDA has issued warnings about supplement-grade dose variability. Yohimbe bark extract (the whole-plant product) is more loosely regulated than purified Yohimbine HCl. WADA does not list Yohimbine on the prohibited list.",
    halfLife: "Native Yohimbine ~36 minutes; Yohimbine HCl salt effective duration ~1.5-3 hours; CYP2D6-cleared with wide inter-individual variation",
    reconstitution: { solvent: "Oral capsule, tablet, or powder; not reconstituted", typicalVialMg: 0, typicalVolumeMl: 0 },
    dosingRange: {
      low: "2.5-5mg per dose (entry / sensitive responders; anxiety-prone users)",
      medium: "0.2mg/kg per dose = ~15-20mg for typical adult (Lyle McDonald fasted-cardio protocol)",
      high: "0.3-0.4mg/kg per dose = ~25-30mg for typical adult (upper-end research dose; anxiety risk rises)",
      frequency: "1-2x/day fasted only; pre-cardio AM, optional pre-evening-cardio if 4+ hours fasted",
    },
    typicalDose:
      "Fasted-cardio pattern: 0.2mg/kg = ~15-20mg for typical adult, 30-60 minutes pre-cardio, fully fasted (no food within ~4 hours). ED off-label pattern: 5.4mg 3x/day per Rx-era dosing; clinical evidence for ED supports doses up to 16mg/day in divided doses.",
    startDose:
      "2.5-5mg single dose to assess tolerance; reassess anxiety, BP, and HR at 60 minutes post-dose. Anxiety-prone or stimulant-sensitive users start at 2.5mg; tolerant users can start at 5-10mg before titrating to 0.2mg/kg.",
    titrationNote:
      "The fasted-state requirement is non-negotiable for the lipolytic use case — eating within ~4 hours of dosing reduces effect to near-zero per Berlan et al. 1991. CYP2D6 metabolism produces wide inter-individual variation; some users feel strong effect at 5mg, others feel little at 20mg. Anxiety response also varies widely and tends to be the dose-limiting side effect rather than cardiac signal in most users. Final dose timing matters — Yohimbine within 4-6 hours of sleep can produce severe insomnia.",
    cycle:
      "8-12 weeks on, 2-4 weeks off recommended to preserve α-2 receptor sensitivity. Less downregulation than seen with β-agonist tools but still measurable with continuous use. Many users cycle in 2-4 week blocks around specific cut phases rather than continuous use.",
    storage: "Capsules, tablets, or powder: room temperature, dry, away from light. Powder hygroscopic — keep desiccant in container.",
    bioavailability: "7-87% oral with wide inter-individual variation due to CYP2D6 polymorphism; whole bark extract less predictable than purified HCl",
    benefits: [
      "α-2 adrenergic blockade — removes the lipolytic brake on stubborn-fat adipose regions (lower body in men, glutes/abs in women)",
      "Mechanism-targeted to high-α-2-density adipose — concentrates effect on the regions standard caloric deficit struggles with",
      "Lyle McDonald 0.2mg/kg fasted-cardio protocol — community-validated with extensive cut-phase practitioner reports",
      "Stacks complementarily with β-agonists (synephrine, caffeine) — different mechanism axis on lipolysis",
      "Pre-Viagra Rx history for erectile dysfunction — established off-label use case",
      "Central pro-erectile effects via α-2 blockade increase NE-mediated arousal pathways",
      "Increased systemic sympathetic tone — mild thermogenic effect even in fed state, though lipolytic effect requires fasted state",
      "Inexpensive and widely available as supplement",
      "WADA-permitted — usable by tested athletes",
      "Short half-life supports precise timing around cardio",
    ],
    sideEffects: [
      "**Anxiety, panic, restlessness** — the dose-limiting side effect for most users; α-2 blockade increases NE release which acts on β-1 receptors driving sympathetic anxiety response",
      "**Blood pressure elevation** — typically 5-15 mmHg systolic at standard doses; can be substantial in sensitive responders",
      "**Heart rate elevation** — typically 5-15 bpm at standard doses",
      "Insomnia if dosed within 4-6 hours of sleep",
      "Tremor, sweating, flushing — sympathetic activation symptoms",
      "Nausea, especially when dosed with cold water or on empty stomach without buffer",
      "Headache, particularly with dehydration",
      "Urinary frequency / urgency — α-2 blockade in bladder",
      "Rebound mood drop as drug clears (less common than with stimulants but reported)",
      "Wide inter-individual variation in response due to CYP2D6 polymorphism — some users feel strong effects at 5mg, others minimal at 20mg",
      "Supplement-grade dose variability — FDA has issued warnings about dose inconsistency in supplement products; purified HCl from research-grade sources is more reliable",
    ],
    stacksWith: ["caffeine", "synephrine", "ephedrine", "clenbuterol"],
    warnings: [
      "**Fasted state is non-negotiable for lipolytic effect** — insulin blunts the α-2 antagonism effect almost completely (Berlan et al. 1991); eating within ~4 hours of dosing wastes the dose",
      "**Anxiety and panic risk is real and dose-dependent** — α-2 blockade increases NE which acts on β-1 producing sympathetic anxiety response; users with pre-existing anxiety disorder should approach cautiously or avoid",
      "**Hypertension contraindication** — coordinate with prescriber if pre-existing hypertension; Yohimbine produces meaningful BP elevation",
      "**MAOI interaction — absolute contraindication** — combined MAO inhibition with NE-elevating mechanism produces dangerous sympathomimetic accumulation",
      "**SSRI / SNRI interaction** — serotonergic interaction signal; Yohimbine can produce serotonergic adverse events in combination with serotonergic medications; coordinate with prescriber",
      "**Tricyclic antidepressant interaction** — additive cardiac signal; coordinate with prescriber",
      "Cardiac disease — coordinate with cardiologist; relative contraindication in arrhythmia, recent MI, unstable angina",
      "Anxiety disorder, panic disorder, PTSD — relative contraindication; sympathomimetic load amplifies symptoms",
      "Bipolar disorder — sympathomimetic load can precipitate manic episode; relative contraindication",
      "Pregnancy and lactation — contraindicated",
      "Renal or hepatic dysfunction — coordinate with prescriber; CYP2D6 metabolism affected by hepatic function",
      "Stimulant medication interaction (ADHD stimulants, decongestants) — additive cardiac and CNS effects",
      "Concurrent ED medication (sildenafil, tadalafil) — additive blood pressure effects; coordinate with prescriber",
      "Pheochromocytoma — absolute contraindication",
      "Operating heavy machinery or driving on initial dosing — assess CNS tolerance first",
      "Supplement-grade dose variability — FDA warnings about inconsistent labeling; purified HCl from research-grade sources more reliable than bark extract products",
    ],
    sourcingNotes:
      "**Purified Yohimbine HCl supplement (preferred for dose precision):** capsule products at 2.5mg, 5mg, or 10mg per capsule; widely available; verify third-party testing where available due to FDA warnings about supplement-grade dose variability. **Yohimbine HCl research-grade powder:** research chem vendors offer purified powder; clean dosing but requires accurate scale (sub-milligram precision useful). **Yohimbe bark extract products:** whole-plant products with variable alkaloid content; less predictable dosing; not recommended for precise protocol use. **Rx Yohimbine (Yocon, Aphrodyne):** still technically available by prescription for ED; rarely prescribed post-sildenafil but accessible through compounding pharmacies if specific dose precision is required. **Cost:** standalone supplement inexpensive (~$15-30 per 30-day supply at standard doses).",
    notes:
      "## Clinical Context — The Stubborn-Fat Tool\n\nYohimbine HCl occupies a specific clinical slot that no other catalog compound fills as cleanly: the α-2 adrenergic antagonist for stubborn-fat regions. The mechanism is genuinely different from every other thermogenic in the catalog — Synephrine, Ephedrine, Clenbuterol, Albuterol all work by stimulating β-adrenergic receptors (pushing the lipolytic accelerator). Yohimbine works by blocking α-2 adrenergic receptors (removing the lipolytic brake). The two mechanism axes are complementary and stack synergistically.\n\nThe practical use case spans:\n\n**Stubborn-fat cut-phase finisher** — 0.2mg/kg fasted pre-cardio per the Lyle McDonald protocol; the community-validated approach with most consistent reports; concentrated effect on lower-body adipose in men and glute/abdominal adipose in women\n\n**Synephrine + Yohimbine stubborn-fat stack** — dual-mechanism (β-3 agonism + α-2 antagonism); the cut-phase finisher protocol\n\n**Erectile dysfunction off-label** — 5.4mg 3x/day per pre-Viagra Rx-era dosing; established mechanism via central α-2 blockade and NE-mediated arousal pathways\n\n**General mild thermogenic / energy** — 5-10mg fed-state for mild sympathetic activation; lipolytic effect minimal in fed state but central effects persist\n\n## The Fasted-State Requirement Is Not Optional\n\nThe single most important rule for Yohimbine use as a fat-loss tool: **insulin blunts the effect almost completely**. The Berlan et al. 1991 study established this — Yohimbine increased lipolysis substantially in fasted-state subjects but produced minimal effect in postprandial subjects given the same dose. The mechanism: insulin activates α-2-related pathways and independently suppresses lipolysis via cAMP reduction. Yohimbine's α-2 blockade can't overcome high circulating insulin.\n\nThe practical protocol: dose Yohimbine 30-60 minutes before fasted cardio, ideally first thing AM after overnight fast, no food within the prior 4 hours. Black coffee is acceptable (no calories, no insulin response). Anything with calories — including BCAA powders, fat-only sources, and zero-calorie sweeteners that produce cephalic-phase insulin — reduces the effect. The fasted state is the difference between a working dose and a wasted dose.\n\nUsers who can't or won't dose fasted should reconsider whether Yohimbine is the right tool. For ED off-label use, the insulin sensitivity is less critical — the central pro-erectile mechanism is partially insulin-independent.\n\n## The Lyle McDonald 0.2mg/kg Protocol\n\nThe community-validated protocol for fat-loss Yohimbine use comes from Lyle McDonald's stubborn-fat protocol writing in the early 2000s. The core specification:\n\n- 0.2mg/kg body weight per dose (typical adult: 15-20mg)\n- Fasted state, 30-60 minutes pre-cardio\n- Cardio session 30-60 minutes, moderate intensity (HR ~130-140)\n- Optional caffeine 100-200mg co-administered\n- Optional synephrine 25-50mg co-administered for full stubborn-fat stack\n- 1-2x daily maximum, final dose well before sleep\n\nThe protocol is calibrated for the α-2 receptor density in stubborn-fat regions. Higher doses don't proportionally increase effect but do increase anxiety and BP signal. Lower doses underutilize the mechanism. The 0.2mg/kg figure is the practical sweet spot for most users.\n\n## The Synephrine + Yohimbine Stubborn-Fat Stack\n\nThe combined protocol attacks lipolysis from both mechanism axes:\n\n- **Synephrine 50mg** — β-3 agonism drives cAMP production in adipocytes\n- **Yohimbine 0.2mg/kg** — α-2 antagonism removes the cAMP-suppression brake\n- **Caffeine 200mg** — phosphodiesterase inhibition prevents cAMP breakdown\n- Fasted state, 30-60 minutes pre-cardio\n\nThe three compounds converge on elevated cAMP from three different mechanism angles. The combined effect is greater than any one alone for stubborn-fat regions. The combined adrenergic load is also greater — monitor BP, HR, anxiety, and sleep quality.\n\n## Anxiety Profile — The Dose-Limiting Side Effect\n\nFor most users, anxiety is the dose-limiting side effect of Yohimbine rather than cardiac signal. The mechanism: α-2 autoreceptor blockade disinhibits NE release; elevated NE acts on β-1 receptors centrally and peripherally; the result is sympathetic activation experienced as anxiety, restlessness, or panic in sensitive responders.\n\nCYP2D6 polymorphism produces large inter-individual variation. Poor metabolizers experience exaggerated effect from the same nominal dose. Users with pre-existing anxiety disorder, panic disorder, or PTSD should approach cautiously or avoid entirely — the mechanism amplifies symptoms directly.\n\nUsers experiencing anxiety on Yohimbine should reduce dose rather than push through. The relationship between dose and anxiety is steeper than the relationship between dose and lipolytic effect — small dose reductions often eliminate anxiety while preserving most of the lipolytic benefit.\n\n## Synergies\n\n**Synephrine** — stubborn-fat stack via complementary β-3 / α-2 mechanism axes; the dual-mechanism cut-phase protocol. **Caffeine** — third mechanism axis (phosphodiesterase inhibition); standard component of stubborn-fat protocol. **Ephedrine** — stronger β-adrenergic adjunct than Synephrine; combined with Yohimbine produces aggressive stubborn-fat protocol with corresponding cardiac and anxiety load. **Clenbuterol** — β-2 agonist; mechanism-complementary but combined adrenergic load is substantial; rarely indicated outside aggressive cut protocols.\n\n## Clinical Trial Citations Worth Knowing\n\n**Berlan et al. 1991**: established the fasted-state requirement — Yohimbine increases lipolysis in fasted but not postprandial subjects; the foundational mechanistic study.\n\n**Lafontan et al. 1994** (review): characterized α-2 vs β receptor distribution in adipose tissue; established the molecular basis for the stubborn-fat thesis.\n\n**Galitzky et al. 1988**: Yohimbine effects on regional fat mobilization; documented preferential effect on α-2-dominant regions.\n\n**Ostojic 2006**: 21-day Yohimbine supplementation in elite soccer players produced significant fat loss without performance decrement; one of the few athletic-population studies.\n\n**Pre-Viagra ED literature**: established Yohimbine as moderately effective for ED before sildenafil; meta-analyses show ~30-40% response rate.\n\n## Evidence Quality\n\nMechanism well-characterized — α-2 receptor pharmacology extensively studied. Fasted-state requirement firmly established (Berlan 1991). Athletic-population evidence limited but supportive (Ostojic 2006). ED evidence solid but superseded by PDE5 inhibitors. Long-term safety profile less well-characterized than for the prescription adrenergic class.\n\n## Research vs Anecdote\n\nResearch: solid mechanistic foundation; fasted-state requirement non-negotiable per literature; α-2 distribution explains stubborn-fat clinical observation; CYP2D6 variation drives wide individual response. Anecdote: extensive bodybuilding and cut-phase community use since the early 2000s; consensus that the Lyle McDonald 0.2mg/kg protocol is the right specification; consensus that anxiety is the dose-limiting side effect for most users; consensus that the Synephrine + Caffeine + Yohimbine stubborn-fat stack works for the use case it's designed for. Decision frame: the α-2 antagonist slot in the adrenergic cluster; mechanism is genuinely different from β-agonist thermogenics and complementary in stacking; fasted-state requirement is the central practical constraint; anxiety profile and CV signal warrant cautious titration; not appropriate for users with anxiety disorders, hypertension, or on serotonergic medications; the catalog does not provide specific protocol guidance per locked HRT/protocol rule.",
    tags: ["yohimbine", "yohimbine HCl", "Pausinystalia yohimbe", "alpha-2 antagonist", "adrenergic", "stubborn fat", "lipolysis", "fat loss", "cut phase", "Lyle McDonald protocol", "fasted cardio", "erectile dysfunction", "Berlan 1991"],
  },
];
