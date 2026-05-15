-- ─────────────────────────────────────────────────────────────
-- 20260515000100_conditions_seed
-- 61 conditions derived from the 277-compound catalog.
-- Covers: Metabolic, Hormonal, Cognitive, Musculoskeletal,
--         Cardiovascular, Immune, Sexual Health, Longevity,
--         Skin & Hair, Psychiatric
-- ─────────────────────────────────────────────────────────────

insert into public.conditions
  (slug, name, aliases, description, category, sex_flag, icd10_code, sort_order)
values

-- ── METABOLIC (8) ─────────────────────────────────────────────
('insulin-resistance',
 'Insulin Resistance',
 '["Pre-diabetes","IR","Impaired glucose tolerance"]',
 'Reduced cellular response to insulin drives compensatory hyperinsulinemia, weight gain, inflammation, and progressive metabolic dysfunction. Root driver of multiple downstream conditions.',
 'Metabolic', 'both', 'R73.09', 10),

('type-2-diabetes',
 'Type 2 Diabetes',
 '["T2D","T2DM","Diabetes mellitus type 2"]',
 'Chronic hyperglycemia resulting from combined insulin resistance and beta-cell dysfunction. Linked to cardiovascular, neurological, and renal complications.',
 'Metabolic', 'both', 'E11', 20),

('obesity',
 'Obesity',
 '["Overweight","Adiposity","Weight management"]',
 'Excess adipose accumulation driven by energy dysregulation, hormonal imbalance, and metabolic adaptation. Amplifies risk for nearly every downstream chronic condition.',
 'Metabolic', 'both', 'E66', 30),

('metabolic-syndrome',
 'Metabolic Syndrome',
 '["MetSyn","Syndrome X","Dysmetabolic syndrome"]',
 'Cluster of insulin resistance, central obesity, dyslipidemia, and elevated blood pressure that dramatically multiplies cardiovascular and diabetes risk.',
 'Metabolic', 'both', 'E88.81', 40),

('pmos',
 'PMOS (Polyendocrine Metabolic Ovarian Syndrome)',
 '["PCOS","Polycystic ovary syndrome","Polycystic ovarian syndrome"]',
 'Complex multisystem endocrine disorder driven by insulin resistance, hyperandrogenism, and HPA dysregulation. Renamed from PCOS in May 2026 to reflect true multisystem pathophysiology.',
 'Metabolic', 'female', 'E28.2', 50),

('nafld',
 'Non-Alcoholic Fatty Liver Disease',
 '["NAFLD","NASH","Fatty liver","MAFLD","Metabolic-associated fatty liver disease"]',
 'Hepatic fat accumulation in the absence of excessive alcohol use, driven by insulin resistance and metabolic dysfunction. Ranges from simple steatosis to NASH and cirrhosis.',
 'Metabolic', 'both', 'K76.0', 60),

('dyslipidemia',
 'Dyslipidemia',
 '["High cholesterol","Hyperlipidemia","High triglycerides","Low HDL"]',
 'Pathological lipid profile including elevated LDL, triglycerides, Lp(a), or ApoB, and/or low HDL. Major modifiable cardiovascular risk factor.',
 'Metabolic', 'both', 'E78.5', 70),

('liver-health',
 'Liver Health & Detoxification',
 '["Liver support","Hepatoprotection","Elevated liver enzymes","ALT","AST"]',
 'Support of hepatic function, detoxification capacity, and protection against hepatotoxic compounds, alcohol, or metabolic stress.',
 'Metabolic', 'both', 'K76.9', 80),

-- ── HORMONAL (11) ─────────────────────────────────────────────
('hypogonadism',
 'Hypogonadism / Low Testosterone',
 '["Low T","Low testosterone","Male hypogonadism","Testosterone deficiency"]',
 'Insufficient androgen production resulting in fatigue, reduced libido, muscle loss, mood disturbance, and metabolic dysfunction. Primary or secondary origin.',
 'Hormonal', 'male', 'E29.1', 10),

('estrogen-dominance',
 'Estrogen Dominance',
 '["High estrogen","Excess estrogen","Hyperestrogenism","Gynecomastia"]',
 'Relative or absolute excess of estrogen versus progesterone. Manifests as fat gain, gynecomastia, mood changes, and increased cancer risk.',
 'Hormonal', 'both', 'E28.0', 20),

('gh-deficiency',
 'Growth Hormone Deficiency / Optimization',
 '["GHD","Low GH","Growth hormone deficiency","GH optimization"]',
 'Inadequate GH secretion driving reduced lean mass, increased visceral fat, poor recovery, and accelerated aging. Optimization also pursued in non-deficient individuals for performance.',
 'Hormonal', 'both', 'E23.0', 30),

('hypothyroidism',
 'Hypothyroidism',
 '["Low thyroid","Underactive thyroid","Hashimoto''s thyroiditis","Thyroid dysfunction"]',
 'Insufficient thyroid hormone production driving fatigue, weight gain, cold intolerance, cognitive slowing, and cardiovascular risk.',
 'Hormonal', 'both', 'E03.9', 40),

('hpa-dysregulation',
 'HPA Axis Dysregulation',
 '["Cortisol dysregulation","Stress response dysfunction","HPA dysfunction","Burnout"]',
 'Dysregulated cortisol secretion patterns and blunted or exaggerated stress response. Underlies chronic stress, burnout, sleep disruption, and immune dysfunction.',
 'Hormonal', 'both', null, 50),

('adrenal-fatigue',
 'Adrenal Fatigue / Insufficiency',
 '["Adrenal exhaustion","Adrenal burnout","HPA fatigue","Low cortisol"]',
 'Functional reduction in adrenal output, often following chronic stress or infection. Presents as persistent fatigue, salt craving, orthostatic symptoms, and poor stress tolerance.',
 'Hormonal', 'both', 'E27.49', 60),

('male-fertility',
 'Male Fertility / Hypogonadotropic Hypogonadism',
 '["Male infertility","Low sperm count","Hypogonadotropic hypogonadism","HH"]',
 'Impaired spermatogenesis or testosterone production due to inadequate LH/FSH signaling. Treatable with gonadotropin-stimulating protocols.',
 'Hormonal', 'male', 'N46', 70),

('menopause',
 'Menopause / Perimenopause',
 '["Perimenopause","Surgical menopause","Climacteric","Menopausal transition"]',
 'Endogenous estrogen and progesterone decline causing vasomotor symptoms, mood instability, bone loss, cardiovascular risk, and cognitive changes.',
 'Hormonal', 'female', 'N95.1', 80),

('endometriosis',
 'Endometriosis',
 '["Pelvic pain","Uterine endometriosis","Adenomyosis"]',
 'Ectopic endometrial tissue driving chronic pelvic inflammation, pain, and infertility. Strongly linked to estrogen dominance and immune dysregulation.',
 'Hormonal', 'female', 'N80.9', 90),

('bph',
 'Benign Prostatic Hyperplasia',
 '["BPH","Enlarged prostate","LUTS","Lower urinary tract symptoms","Prostate enlargement"]',
 'Non-malignant prostate gland enlargement producing urinary flow obstruction. Driven by DHT accumulation and age-related hormonal shifts.',
 'Hormonal', 'male', 'N40.0', 100),

('overactive-bladder',
 'Overactive Bladder / Urinary Urgency',
 '["Overactive bladder","OAB","Urinary urgency","Nocturia","Bladder dysfunction"]',
 'Involuntary detrusor contractions producing urgency, frequency, and nocturia. Responsive to beta-3 adrenergic agonism.',
 'Hormonal', 'both', 'N32.81', 110),

-- ── COGNITIVE (11) ────────────────────────────────────────────
('cognitive-decline',
 'Cognitive Decline / MCI',
 '["Brain fog","Mild cognitive impairment","Age-related cognitive decline","Memory loss"]',
 'Progressive deterioration of memory, processing speed, and executive function. Ranges from subjective cognitive complaints to mild cognitive impairment preceding dementia.',
 'Cognitive', 'both', 'G31.84', 10),

('alzheimers',
 'Alzheimer''s Disease / Dementia',
 '["Alzheimer disease","AD","Senile dementia","Vascular dementia"]',
 'Neurodegenerative condition characterized by amyloid plaques, tau tangles, and progressive memory and functional decline.',
 'Cognitive', 'both', 'G30.9', 20),

('neurodegeneration',
 'Neurodegeneration',
 '["Parkinson''s disease","ALS","Neurodegenerative disease","Motor neuron disease","Dopamine deficiency"]',
 'Progressive loss of neuronal structure and function. Includes Parkinson''s, ALS, and related disorders with dopaminergic, mitochondrial, or proteostatic drivers.',
 'Cognitive', 'both', 'G31.9', 30),

('tbi',
 'Traumatic Brain Injury / Post-Concussion',
 '["TBI","Concussion","Post-concussion syndrome","Brain injury recovery"]',
 'Acute brain trauma followed by neuroinflammation, axonal injury, and impaired neuroplasticity. Chronic symptoms include cognitive impairment, mood changes, and headaches.',
 'Cognitive', 'both', 'S09.90', 40),

('adhd',
 'ADHD / Attention Deficit',
 '["ADHD","ADD","Attention deficit hyperactivity disorder","Executive dysfunction"]',
 'Dysregulation of dopaminergic and noradrenergic pathways producing inattention, hyperactivity, and executive dysfunction.',
 'Cognitive', 'both', 'F90.0', 50),

('depression',
 'Depression',
 '["Major depressive disorder","MDD","Treatment-resistant depression","Anhedonia","Low mood"]',
 'Persistent low mood, anhedonia, and neurobiological changes involving serotonin, dopamine, BDNF, and neuroplasticity pathways.',
 'Cognitive', 'both', 'F32.9', 60),

('anxiety',
 'Anxiety',
 '["Generalized anxiety disorder","GAD","Social anxiety","Panic disorder","Stress"]',
 'Chronic overactivation of threat-detection pathways producing worry, physical tension, and avoidance. Often comorbid with HPA dysregulation.',
 'Cognitive', 'both', 'F41.1', 70),

('ptsd',
 'PTSD / Trauma',
 '["Post-traumatic stress disorder","Complex PTSD","C-PTSD","Trauma recovery"]',
 'Dysregulated fear memory consolidation and HPA response following trauma. Marked by hyperarousal, intrusive memories, avoidance, and emotional numbing.',
 'Cognitive', 'both', 'F43.10', 80),

('insomnia',
 'Sleep Disorders / Insomnia',
 '["Insomnia","Poor sleep","Non-restorative sleep","Circadian disruption","Sleep dysfunction"]',
 'Difficulty initiating or maintaining sleep, or non-restorative sleep, with downstream effects on cognition, mood, metabolic health, and recovery.',
 'Cognitive', 'both', 'G47.00', 90),

('neuroprotection',
 'Neuroprotection / Brain Optimization',
 '["Neuroprotection","Cognitive enhancement","Nootropics","Brain health optimization"]',
 'Proactive support of neuronal integrity, mitochondrial function, and synaptic plasticity to preserve and enhance cognitive performance.',
 'Cognitive', 'both', null, 100),

('neuropathy',
 'Peripheral Neuropathy',
 '["Diabetic neuropathy","Nerve damage","Peripheral nerve injury","Tingling","Numbness"]',
 'Damage to peripheral nerves producing pain, tingling, numbness, and motor weakness. Common in diabetes, autoimmune conditions, and chemotherapy.',
 'Cognitive', 'both', 'G62.9', 110),

-- ── MUSCULOSKELETAL (6) ───────────────────────────────────────
('sarcopenia',
 'Sarcopenia / Muscle Loss',
 '["Muscle wasting","Age-related muscle loss","Muscle atrophy","Cachexia"]',
 'Progressive loss of skeletal muscle mass and strength with aging or disease. Major driver of frailty, metabolic dysfunction, and reduced quality of life.',
 'Musculoskeletal', 'both', 'M62.84', 10),

('joint-pain',
 'Joint Pain / Osteoarthritis',
 '["Osteoarthritis","OA","Joint degeneration","Arthritis","Cartilage loss"]',
 'Degradation of articular cartilage and synovial inflammation producing chronic joint pain, stiffness, and reduced range of motion.',
 'Musculoskeletal', 'both', 'M17.9', 20),

('tendon-ligament',
 'Tendon & Ligament Injury',
 '["Tendinopathy","Tendinitis","Ligament injury","Rotator cuff","Achilles tendon"]',
 'Structural damage and impaired healing of connective tissue. Driven by overuse, inflammation, or acute trauma. Notoriously slow to heal due to poor vascularity.',
 'Musculoskeletal', 'both', 'M79.9', 30),

('osteoporosis',
 'Osteoporosis / Low Bone Density',
 '["Osteoporosis","Osteopenia","Low BMD","Bone loss","Fracture risk"]',
 'Reduced bone mineral density and microarchitectural deterioration increasing fracture risk. Driven by hormonal changes, aging, and nutritional deficiencies.',
 'Musculoskeletal', 'both', 'M81.0', 40),

('athletic-performance',
 'Athletic Performance & Recovery',
 '["Sports performance","Exercise recovery","Overtraining","Performance optimization","Training adaptation"]',
 'Optimization of training adaptation, recovery speed, and peak output. Includes fatigue resistance, muscle protein synthesis, and injury prevention.',
 'Musculoskeletal', 'both', null, 50),

('fibromyalgia',
 'Fibromyalgia',
 '["Chronic widespread pain","Central sensitization","FMS","Fibromyalgia syndrome"]',
 'Chronic widespread pain amplification via central sensitization, often comorbid with fatigue, sleep disruption, and cognitive dysfunction.',
 'Musculoskeletal', 'both', 'M79.3', 60),

-- ── CARDIOVASCULAR (3) ────────────────────────────────────────
('cardiovascular-disease',
 'Cardiovascular Disease Risk',
 '["CVD","Heart disease","Atherosclerosis","ASCVD","Coronary artery disease"]',
 'Elevated risk of atherosclerotic events driven by inflammation, oxidative stress, dyslipidemia, hypertension, and metabolic dysfunction.',
 'Cardiovascular', 'both', 'I25.10', 10),

('hypertension',
 'Hypertension',
 '["High blood pressure","HTN","Elevated BP","Arterial hypertension"]',
 'Persistently elevated arterial pressure producing progressive end-organ damage to heart, kidneys, brain, and vasculature.',
 'Cardiovascular', 'both', 'I10', 20),

('cardiac-support',
 'Cardiac & Mitochondrial Support',
 '["Heart failure","Cardiomyopathy","Mitochondrial dysfunction","Cardiac optimization"]',
 'Support of myocardial energy production, mitochondrial efficiency, and cardiomyocyte protection. Relevant to heart failure, post-cardiac events, and longevity optimization.',
 'Cardiovascular', 'both', 'I50.9', 30),

-- ── IMMUNE (9) ────────────────────────────────────────────────
('chronic-inflammation',
 'Chronic Inflammation',
 '["Systemic inflammation","Inflammaging","Low-grade inflammation","High CRP","High IL-6"]',
 'Persistent low-grade immune activation driving tissue damage, metabolic dysfunction, accelerated aging, and nearly every chronic disease.',
 'Immune', 'both', null, 10),

('autoimmune',
 'Autoimmune Conditions',
 '["Autoimmunity","Lupus","Rheumatoid arthritis","Multiple sclerosis","Hashimoto''s","IBD"]',
 'Dysregulated immune attack on self-tissue. Includes a spectrum of conditions from rheumatoid arthritis to MS to Hashimoto''s thyroiditis.',
 'Immune', 'both', 'M35.9', 20),

('gut-health',
 'Gut Health / IBD / Leaky Gut',
 '["Leaky gut","Intestinal permeability","IBD","Crohn disease","Ulcerative colitis","IBS"]',
 'Compromised intestinal barrier integrity and mucosal inflammation driving systemic immune activation, nutrient malabsorption, and chronic symptoms.',
 'Immune', 'both', 'K92.9', 30),

('immune-deficiency',
 'Immune Deficiency / Immunosenescence',
 '["Low immunity","Frequent illness","Immunosenescence","Immune optimization"]',
 'Reduced immune surveillance and response capacity from aging, chronic stress, or disease — increasing susceptibility to infection and cancer.',
 'Immune', 'both', 'D84.9', 40),

('post-viral',
 'Post-Viral Recovery / Long COVID',
 '["Long COVID","Post-COVID","Post-viral syndrome","PASC","Chronic fatigue post-infection"]',
 'Persistent systemic inflammation, immune dysregulation, mitochondrial dysfunction, and autonomic instability following viral infection.',
 'Immune', 'both', 'U09.9', 50),

('chronic-fatigue',
 'Chronic Fatigue Syndrome',
 '["CFS","ME/CFS","Myalgic encephalomyelitis","SEID","Systemic exertion intolerance"]',
 'Debilitating fatigue not relieved by rest, accompanied by post-exertional malaise, cognitive dysfunction, and autonomic instability.',
 'Immune', 'both', 'G93.3', 60),

('eczema-psoriasis',
 'Eczema / Psoriasis / Dermatitis',
 '["Atopic dermatitis","Eczema","Psoriasis","Inflammatory skin disease","Contact dermatitis"]',
 'Chronic inflammatory skin conditions driven by immune dysregulation, barrier dysfunction, and environmental triggers.',
 'Immune', 'both', 'L30.9', 70),

('lyme-chronic',
 'Chronic Lyme / CIRS',
 '["Chronic Lyme disease","CIRS","Biotoxin illness","Mold illness","Post-Lyme syndrome"]',
 'Persistent multi-system symptoms following Borrelia infection or biotoxin exposure. Marked by neurological, immune, and endocrine dysregulation.',
 'Immune', 'both', null, 80),

('wound-healing',
 'Wound Healing & Tissue Repair',
 '["Chronic wounds","Poor healing","Tissue regeneration","Post-surgical recovery","Ulcers"]',
 'Impaired or suboptimal healing of skin, muscle, and connective tissue. Driven by poor vascularity, inflammation, infection, or metabolic dysfunction.',
 'Immune', 'both', 'T14.90', 90),

-- ── SEXUAL HEALTH (4) ─────────────────────────────────────────
('erectile-dysfunction',
 'Erectile Dysfunction',
 '["ED","Impotence","Sexual dysfunction male"]',
 'Inability to achieve or maintain erection sufficient for satisfactory sexual activity. Driven by vascular, neurological, hormonal, or psychological factors.',
 'Sexual Health', 'male', 'N52.9', 10),

('low-libido-male',
 'Low Libido (Male)',
 '["Low sex drive male","Decreased libido male","Hypoactive sexual desire disorder male"]',
 'Reduced or absent sexual desire in men, driven by androgen deficiency, HPA dysregulation, depression, or relationship factors.',
 'Sexual Health', 'male', 'F52.0', 20),

('low-libido-female',
 'Low Libido (Female)',
 '["Low sex drive female","HSDD","Hypoactive sexual desire disorder","Female sexual interest disorder"]',
 'Reduced or absent sexual desire in women, driven by hormonal changes, stress, relationship factors, or medications.',
 'Sexual Health', 'female', 'F52.0', 30),

('female-sexual-dysfunction',
 'Female Sexual Dysfunction',
 '["FSD","Female arousal disorder","Anorgasmia","Vaginal dryness","Dyspareunia"]',
 'Broad category encompassing arousal, lubrication, orgasm, and pain disorders in women. Often multifactorial with hormonal, neurological, and psychological contributors.',
 'Sexual Health', 'female', 'F52.9', 40),

-- ── LONGEVITY (3) ─────────────────────────────────────────────
('longevity',
 'Longevity & Anti-Aging',
 '["Anti-aging","Healthspan","Lifespan","Longevity optimization","Biological age reduction"]',
 'Proactive intervention in the hallmarks of aging — senescence, proteostasis, epigenetic drift, mitochondrial dysfunction — to extend healthspan and lifespan.',
 'Longevity', 'both', null, 10),

('cellular-senescence',
 'Cellular Senescence',
 '["Senescent cells","Zombie cells","Senolytics","SASP","Senomorphics"]',
 'Accumulation of non-dividing senescent cells secreting pro-inflammatory SASP factors that damage surrounding tissue and accelerate aging.',
 'Longevity', 'both', null, 20),

('cancer-support',
 'Cancer Support (Research)',
 '["Tumor suppression","Anti-tumor","Oncology support","Research oncology"]',
 'Emerging preclinical and early clinical research into compounds that may inhibit tumor growth or sensitize cancer cells. Not a treatment claim.',
 'Longevity', 'both', null, 30),

-- ── SKIN & HAIR (4) ───────────────────────────────────────────
('skin-aging',
 'Skin Aging / Collagen Loss',
 '["Wrinkles","Skin laxity","Collagen degradation","Photoaging","Skin elasticity"]',
 'Age-related and UV-driven collagen degradation, elastin loss, and reduced cellular turnover producing wrinkles, laxity, and uneven tone.',
 'Skin & Hair', 'both', 'L57.8', 10),

('hair-loss',
 'Hair Loss / Androgenic Alopecia',
 '["Alopecia","Male pattern baldness","Female pattern hair loss","DHT-driven hair loss","Thinning hair"]',
 'Progressive miniaturization of hair follicles driven by DHT sensitivity, inflammation, or nutritional deficiency. Most common cause is androgenic alopecia.',
 'Skin & Hair', 'both', 'L64.9', 20),

('hormonal-acne',
 'Hormonal Acne',
 '["Acne vulgaris","Hormonal breakouts","Androgenic acne","Cystic acne"]',
 'Inflammatory skin condition driven by androgen excess, sebum overproduction, and bacterial colonization. Common in PMOS and androgen dysregulation.',
 'Skin & Hair', 'both', 'L70.0', 30),

('tanning',
 'Tanning & Photoprotection',
 '["Melanogenesis","Sunless tan","Skin darkening","MT-1","MT-2","Photoprotection"]',
 'Stimulation of melanogenesis for cosmetic tanning or photoprotection without UV exposure. Also explored for UV-sensitivity conditions.',
 'Skin & Hair', 'both', null, 40),

-- ── PSYCHIATRIC (2) ───────────────────────────────────────────
('autism',
 'Autism Spectrum / Social Cognition',
 '["ASD","Autism spectrum disorder","Social cognition","Oxytocin deficit"]',
 'Neurodevelopmental condition affecting social communication and flexible behavior. Oxytocin and neuropeptide research explores adjunct support for social cognition.',
 'Psychiatric', 'both', 'F84.0', 10),

('addiction',
 'Addiction & Substance Use Recovery',
 '["Alcohol use disorder","Benzo withdrawal","Opioid use disorder","Substance use","GABA withdrawal"]',
 'Neurobiological dysregulation of reward, motivation, and impulse control pathways. Recovery supported by compounds modulating dopamine, GABA, and stress systems.',
 'Psychiatric', 'both', 'F19.20', 20);
