-- ─────────────────────────────────────────────────────────────
-- 20260515000101_compound_conditions_seed
-- Junction seed: 277 catalog compounds → 61 conditions.
-- Uses slug-based join so no hardcoded UUIDs.
-- on conflict do nothing = safe to re-run.
-- ─────────────────────────────────────────────────────────────

insert into public.compound_conditions
  (compound_id, condition_id, mechanism, evidence_strength, is_primary)
select
  v.compound_id,
  c.id,
  v.mechanism,
  v.evidence_strength,
  v.is_primary
from (values

-- ── BATCH 1 ───────────────────────────────────────────────────
('semax',              'cognitive-decline',    'BDNF upregulation, ACTH analog',              'clinical',    true),
('semax',              'adhd',                 'dopamine/norepinephrine modulation',           'preclinical', true),
('semax',              'depression',           'BDNF, serotonin pathway support',              'preclinical', false),
('semax',              'neuroprotection',      'neurotrophic factor induction',                'preclinical', false),
('semax',              'tbi',                  'neuroprotection, neuroinflammation reduction',  'preclinical', false),
('semax',              'anxiety',              'HPA normalization, anxiolytic effect',         'preclinical', false),
('semax',              'post-viral',           'immune-neurological axis support',             'anecdotal',   false),

('selank',             'anxiety',              'GABAergic modulation, anxiolytic peptide',     'clinical',    true),
('selank',             'depression',           'serotonin/dopamine balance',                  'preclinical', false),
('selank',             'hpa-dysregulation',    'cortisol normalization',                      'preclinical', false),
('selank',             'immune-deficiency',    'IL-6/interferon modulation',                  'preclinical', false),
('selank',             'cognitive-decline',    'memory consolidation support',                'preclinical', false),
('selank',             'ptsd',                 'fear extinction, anxiolytic',                 'anecdotal',   false),

('n-acetyl-epitalon-amidate', 'longevity',     'telomerase activation, epigenetic reset',     'clinical',    true),
('n-acetyl-epitalon-amidate', 'insomnia',      'pineal melatonin restoration',                'clinical',    true),
('n-acetyl-epitalon-amidate', 'cellular-senescence', 'telomere elongation',                  'clinical',    false),
('n-acetyl-epitalon-amidate', 'immune-deficiency', 'thymic peptide restoration',             'clinical',    false),

('bpc-157-arginine',   'wound-healing',        'angiogenesis, growth factor induction',       'preclinical', true),
('bpc-157-arginine',   'gut-health',           'mucosal healing, VIP upregulation',           'preclinical', true),
('bpc-157-arginine',   'joint-pain',           'collagen synthesis, anti-inflammatory',       'preclinical', false),
('bpc-157-arginine',   'tendon-ligament',      'tendon fibroblast proliferation',             'preclinical', false),
('bpc-157-arginine',   'chronic-inflammation', 'COX inhibition, cytokine reduction',          'preclinical', false),

('wolverine-blend',    'wound-healing',        'multi-peptide regenerative stack',            'anecdotal',   true),
('wolverine-blend',    'joint-pain',           'connective tissue repair blend',              'anecdotal',   false),
('wolverine-blend',    'tendon-ligament',      'tendon/ligament repair blend',                'anecdotal',   false),
('wolverine-blend',    'athletic-performance', 'recovery acceleration blend',                 'anecdotal',   false),

('glow',               'skin-aging',           'peptide blend collagen stimulation',          'anecdotal',   true),
('glow',               'hair-loss',            'scalp peptide delivery blend',                'anecdotal',   false),

('klow',               'skin-aging',           'KLOW peptide collagen support',               'anecdotal',   true),
('klow',               'hair-loss',            'follicle peptide stimulation blend',          'anecdotal',   false),

('glp-1-cs',           'obesity',              'GLP-1 receptor agonism, appetite suppression','preclinical', true),
('glp-1-cs',           'insulin-resistance',   'incretin effect, glucose regulation',         'preclinical', true),
('glp-1-cs',           'type-2-diabetes',      'GLP-1 mediated insulin secretion',            'preclinical', false),

('mazdutide',          'obesity',              'GLP-1/GCGR dual agonism',                    'clinical',    true),
('mazdutide',          'insulin-resistance',   'dual receptor glucose lowering',              'clinical',    true),
('mazdutide',          'nafld',                'hepatic fat reduction via GCGR',              'clinical',    false),

('cjc-ipa-combo',      'gh-deficiency',        'GHRH analog + ghrelin receptor agonism',      'clinical',    true),
('cjc-ipa-combo',      'sarcopenia',           'GH/IGF-1 axis lean mass support',             'clinical',    false),
('cjc-ipa-combo',      'athletic-performance', 'GH pulse amplification',                      'clinical',    false),

('survodutide',        'obesity',              'GLP-1/GCGR dual agonism, appetite control',   'clinical',    true),
('survodutide',        'metabolic-syndrome',   'lipid/glucose dual improvement',              'clinical',    false),
('survodutide',        'nafld',                'hepatic steatosis reduction',                 'clinical',    false),

('orforglipron',       'obesity',              'oral GLP-1RA, non-peptide small molecule',    'clinical',    true),
('orforglipron',       'type-2-diabetes',      'GLP-1 receptor agonism, oral dosing',         'clinical',    true),
('orforglipron',       'insulin-resistance',   'incretin-driven glucose lowering',            'clinical',    false),
('orforglipron',       'cardiovascular-disease','GLP-1 cardioprotective signaling',           'clinical',    false),

-- ── BATCH 2 ───────────────────────────────────────────────────
('ghrp-6',             'gh-deficiency',        'ghrelin receptor agonism, GH pulse',          'clinical',    true),
('ghrp-6',             'sarcopenia',           'IGF-1 mediated muscle anabolism',             'clinical',    false),
('ghrp-6',             'athletic-performance', 'GH-driven recovery enhancement',              'clinical',    false),

('igf-1-des',          'sarcopenia',           'local IGF-1 isoform, muscle fiber growth',    'preclinical', true),
('igf-1-des',          'athletic-performance', 'satellite cell activation',                   'preclinical', false),
('igf-1-des',          'wound-healing',        'local tissue repair signaling',               'preclinical', false),

('peg-mgf',            'sarcopenia',           'pegylated MGF, sustained muscle repair',      'preclinical', true),
('peg-mgf',            'athletic-performance', 'muscle fiber hypertrophy signaling',          'preclinical', false),
('peg-mgf',            'wound-healing',        'stem cell recruitment, repair',               'preclinical', false),

('mgf',                'sarcopenia',           'mechano growth factor, satellite cell cue',   'preclinical', true),
('mgf',                'athletic-performance', 'post-exercise muscle repair signal',          'preclinical', false),

('gonadorelin',        'male-fertility',       'GnRH pulse, LH/FSH stimulation',             'clinical',    true),
('gonadorelin',        'hypogonadism',         'HPG axis stimulation',                        'clinical',    true),

('triptorelin',        'male-fertility',       'GnRH agonist, pulsatile LH induction',       'clinical',    true),
('triptorelin',        'hypogonadism',         'HPG axis restart protocol',                   'clinical',    false),

('follistatin-344',    'sarcopenia',           'myostatin inhibition, muscle hypertrophy',    'preclinical', true),
('follistatin-344',    'athletic-performance', 'myostatin antagonism, strength gains',        'preclinical', false),

('ace-031',            'sarcopenia',           'activin receptor blockade, anti-myostatin',   'clinical',    true),

-- ── BATCH 3 — KHAVINSON BIOREGULATORS ────────────────────────
('vilon',              'longevity',            'dipeptide, thymic bioregulation',             'clinical',    true),
('vilon',              'immune-deficiency',    'T-cell maturation support',                   'clinical',    false),
('vilon',              'cellular-senescence',  'telomere/cell cycle peptide signaling',       'clinical',    false),

('livagen',            'longevity',            'cardiac tissue bioregulator peptide',         'clinical',    true),
('livagen',            'cardiovascular-disease','myocardial cell function support',           'clinical',    false),

('bronchogen',         'longevity',            'lung tissue bioregulator',                    'clinical',    true),
('bronchogen',         'post-viral',           'pulmonary epithelial repair',                 'clinical',    false),
('bronchogen',         'immune-deficiency',    'bronchial immune peptide support',            'clinical',    false),

('thymogen',           'immune-deficiency',    'thymic dipeptide, T-cell support',            'clinical',    true),
('thymogen',           'longevity',            'thymic peptide immunosenescence reversal',    'clinical',    false),

('vesilute',           'longevity',            'bladder tissue bioregulator',                 'clinical',    true),
('vesilute',           'overactive-bladder',   'detrusor peptide normalization',              'clinical',    true),

('ovagen',             'longevity',            'ovarian/eye tissue bioregulator',             'clinical',    true),
('ovagen',             'menopause',            'ovarian function peptide support',            'clinical',    false),

('pancragen',          'longevity',            'pancreatic tissue bioregulator',              'clinical',    true),
('pancragen',          'insulin-resistance',   'beta-cell function support',                  'clinical',    false),
('pancragen',          'type-2-diabetes',      'pancreatic bioregulation',                    'clinical',    false),

('chonluten',          'longevity',            'lung/bronchial bioregulator peptide',         'clinical',    true),
('chonluten',          'post-viral',           'respiratory mucosa support',                  'clinical',    false),

('prostamax',          'bph',                  'prostate tissue bioregulator',                'clinical',    true),
('prostamax',          'longevity',            'prostate cell function normalization',         'clinical',    false),

('cartalax',           'joint-pain',           'cartilage/bone bioregulator peptide',         'clinical',    true),
('cartalax',           'osteoporosis',         'bone matrix peptide support',                 'clinical',    false),
('cartalax',           'longevity',            'connective tissue bioregulation',             'clinical',    false),

('testagen',           'hypogonadism',         'testicular tissue bioregulator',              'clinical',    true),
('testagen',           'longevity',            'gonadal peptide normalization',               'clinical',    false),

('thyreogen',          'hypothyroidism',       'thyroid tissue bioregulator peptide',         'clinical',    true),
('thyreogen',          'longevity',            'thyroid cell function support',               'clinical',    false),

('visoluten',          'longevity',            'retinal tissue bioregulator',                 'clinical',    true),
('visoluten',          'neuroprotection',      'optic nerve peptide support',                 'clinical',    false),

('stamakort',          'gut-health',           'gastric mucosal bioregulator',                'clinical',    true),
('stamakort',          'longevity',            'stomach tissue peptide normalization',         'clinical',    false),

('gotratix',           'sarcopenia',           'muscle tissue bioregulator peptide',          'clinical',    true),
('gotratix',           'longevity',            'skeletal muscle peptide support',             'clinical',    false),

('sigumir',            'joint-pain',           'cartilage bioregulator, chondrocyte support', 'clinical',    true),
('sigumir',            'osteoporosis',         'bone/cartilage peptide support',              'clinical',    false),
('sigumir',            'longevity',            'connective tissue peptide bioregulation',     'clinical',    false),

('cerluten',           'cognitive-decline',    'brain cortex bioregulator peptide',           'clinical',    true),
('cerluten',           'neuroprotection',      'neuronal peptide support',                    'clinical',    true),
('cerluten',           'longevity',            'cortical tissue bioregulation',               'clinical',    false),

-- ── BATCH 4 ───────────────────────────────────────────────────
('eutropoflavin',      'neuroprotection',      'NAD+ precursor, mitochondrial support',       'preclinical', true),
('eutropoflavin',      'cognitive-decline',    'cerebral energy metabolism',                  'preclinical', false),
('eutropoflavin',      'longevity',            'flavin-NAD cofactor restoration',             'preclinical', false),

('78-dhf',             'cognitive-decline',    'TrkB agonist, BDNF mimetic',                  'preclinical', true),
('78-dhf',             'alzheimers',           'BDNF pathway activation',                     'preclinical', true),
('78-dhf',             'neuroprotection',      'neurotrophic receptor signaling',             'preclinical', false),
('78-dhf',             'depression',           'TrkB-mediated antidepressant signaling',      'preclinical', false),

('c60-fullerene',      'longevity',            'free radical scavenging, lifespan extension', 'preclinical', true),
('c60-fullerene',      'neuroprotection',      'antioxidant neuroprotection',                 'preclinical', false),
('c60-fullerene',      'cellular-senescence',  'ROS reduction, senescence mitigation',        'preclinical', false),
('c60-fullerene',      'athletic-performance', 'oxidative stress reduction',                  'anecdotal',   false),

('ftpp',               'longevity',            'mitochondrial-targeted antioxidant',          'preclinical', true),
('ftpp',               'cardiac-support',      'cardiomyocyte mitochondrial protection',      'preclinical', true),
('ftpp',               'neuroprotection',      'neuronal ROS scavenging',                     'preclinical', false),

('trevogrumab',        'sarcopenia',           'anti-myostatin antibody, muscle mass',        'clinical',    true),
('trevogrumab',        'athletic-performance', 'myostatin inhibition, strength',              'clinical',    false),

('os-01',              'skin-aging',           'senolytic topical, p53 pathway',              'clinical',    true),
('os-01',              'longevity',            'cellular senescence clearance topically',      'clinical',    false),
('os-01',              'cellular-senescence',  'topical senolytic action',                    'clinical',    false),

('9-me-bc',            'cognitive-decline',    'dopamine/BDNF upregulation',                  'preclinical', true),
('9-me-bc',            'depression',           'dopaminergic antidepressant effect',          'preclinical', true),
('9-me-bc',            'neurodegeneration',    'dopaminergic neuroprotection',                'preclinical', false),
('9-me-bc',            'adhd',                 'catecholamine pathway enhancement',           'preclinical', false),

('noopept',            'cognitive-decline',    'NGF/BDNF upregulation, memory',               'preclinical', true),
('noopept',            'adhd',                 'acetylcholine system potentiation',           'preclinical', false),
('noopept',            'neuroprotection',      'glutamate excitotoxicity protection',         'preclinical', false),
('noopept',            'anxiety',              'anxiolytic at moderate doses',                'anecdotal',   false),
('noopept',            'alzheimers',           'amyloid-beta inhibition, preclinical',        'preclinical', false),

('nsi-189',            'depression',           'hippocampal neurogenesis induction',          'clinical',    true),
('nsi-189',            'cognitive-decline',    'hippocampal volume restoration',              'clinical',    true),
('nsi-189',            'tbi',                  'neuroregeneration post-injury',               'preclinical', false),

('phenibut',           'anxiety',              'GABA-B agonism, anxiolytic',                  'clinical',    true),
('phenibut',           'insomnia',             'GABAergic sleep induction',                   'clinical',    false),
('phenibut',           'ptsd',                 'fear circuit dampening',                      'anecdotal',   false),
('phenibut',           'addiction',            'benzo withdrawal adjunct (caution)',           'anecdotal',   false),

('bam-15',             'obesity',              'mitochondrial uncoupling, fat oxidation',     'preclinical', true),
('bam-15',             'metabolic-syndrome',   'insulin sensitization via uncoupling',        'preclinical', false),
('bam-15',             'insulin-resistance',   'AMPK activation, glucose uptake',             'preclinical', false),

('methylene-blue',     'cognitive-decline',    'mitochondrial electron transport support',    'clinical',    true),
('methylene-blue',     'neuroprotection',      'ROS scavenging, Complex IV support',          'clinical',    false),
('methylene-blue',     'alzheimers',           'tau aggregation inhibition',                  'preclinical', false),
('methylene-blue',     'neurodegeneration',    'dopaminergic cell protection',                'preclinical', false),
('methylene-blue',     'depression',           'MAO inhibition, monoamine support',           'preclinical', false),

('pramipexole',        'neurodegeneration',    'D2/D3 dopamine receptor agonism',             'clinical',    true),
('pramipexole',        'depression',           'dopaminergic antidepressant effect',          'clinical',    false),
('pramipexole',        'insomnia',             'restless legs / sleep quality',               'clinical',    false),

-- ── BATCH 5 — SARMs / PPAR ────────────────────────────────────
('mk-677',             'gh-deficiency',        'ghrelin receptor agonism, GH pulse',          'clinical',    true),
('mk-677',             'sarcopenia',           'IGF-1 elevation, lean mass retention',        'clinical',    true),
('mk-677',             'athletic-performance', 'GH-driven recovery and adaptation',           'clinical',    false),
('mk-677',             'insomnia',             'slow-wave sleep enhancement',                 'clinical',    false),
('mk-677',             'osteoporosis',         'GH/IGF-1 bone density support',               'clinical',    false),

('rad-140',            'sarcopenia',           'selective androgen receptor, muscle anabolism','preclinical', true),
('rad-140',            'athletic-performance', 'AR-mediated strength and recovery',           'preclinical', false),
('rad-140',            'neuroprotection',      'AR neuroprotective signaling',                'preclinical', false),

('gw-501516',          'athletic-performance', 'PPAR-delta, fatty acid oxidation endurance',  'preclinical', true),
('gw-501516',          'dyslipidemia',         'HDL elevation, triglyceride reduction',       'preclinical', false),
('gw-501516',          'obesity',              'mitochondrial biogenesis, fat burn',          'preclinical', false),
('gw-501516',          'insulin-resistance',   'PPAR-delta glucose regulation',               'preclinical', false),

('yk-11',              'sarcopenia',           'myostatin inhibition + AR partial agonism',   'preclinical', true),
('yk-11',              'athletic-performance', 'follistatin induction, hypertrophy',          'preclinical', false),

('s4',                 'sarcopenia',           'selective AR agonism, muscle/bone',           'preclinical', true),
('s4',                 'osteoporosis',         'AR bone density signaling',                   'preclinical', false),

('s23',                'sarcopenia',           'potent AR agonism, lean mass',                'preclinical', true),
('s23',                'male-fertility',       'hormonal male contraceptive research',        'preclinical', false),

('rad-150',            'sarcopenia',           'esterified RAD-140, sustained AR agonism',    'preclinical', true),
('rad-150',            'athletic-performance', 'prolonged AR-mediated recovery',              'preclinical', false),

('sr-9011',            'obesity',              'Rev-Erb agonism, circadian metabolism',       'preclinical', true),
('sr-9011',            'metabolic-syndrome',   'lipid/glucose circadian normalization',       'preclinical', false),
('sr-9011',            'athletic-performance', 'mitochondrial biogenesis',                    'preclinical', false),

('ac-262',             'sarcopenia',           'selective AR agonism, muscle sparing',        'preclinical', true),
('ac-262',             'neuroprotection',      'AR-driven neuronal support',                  'preclinical', false),

('slu-pp-332',         'athletic-performance', 'ERR agonism, mitochondrial biogenesis',       'preclinical', true),
('slu-pp-332',         'obesity',              'energy expenditure increase',                 'preclinical', false),
('slu-pp-332',         'metabolic-syndrome',   'oxidative metabolism enhancement',            'preclinical', false),

-- ── BATCH 6 ───────────────────────────────────────────────────
('dim',                'estrogen-dominance',   '2-hydroxy estrogen conversion',               'clinical',    true),
('dim',                'pmos',                 'estrogen metabolism, androgen balance',       'clinical',    true),
('dim',                'hormonal-acne',        'estrogen/androgen ratio improvement',         'clinical',    false),
('dim',                'cancer-support',       'anti-estrogenic, anti-proliferative',         'preclinical', false),

('calcium-d-glucarate', 'estrogen-dominance',  'beta-glucuronidase inhibition, estrogen excretion', 'clinical', true),
('calcium-d-glucarate', 'liver-health',        'hepatic detoxification support',              'clinical',    false),
('calcium-d-glucarate', 'cancer-support',      'estrogen-dependent cancer risk reduction',   'preclinical', false),

('liothyronine-t3',    'hypothyroidism',       'direct T3 thyroid hormone replacement',       'clinical',    true),
('liothyronine-t3',    'obesity',              'metabolic rate restoration via T3',           'clinical',    false),

('levothyroxine-t4',   'hypothyroidism',       'T4 thyroid hormone replacement standard',     'clinical',    true),
('levothyroxine-t4',   'cardiovascular-disease','thyroid normalization, cardiac risk',        'clinical',    false),

('tesofensine',        'obesity',              'triple monoamine reuptake inhibition',        'clinical',    true),

('mirabegron',         'overactive-bladder',   'beta-3 adrenergic agonism, detrusor relaxation','clinical',  true),

('telmisartan',        'hypertension',         'ARB, angiotensin II receptor blockade',       'clinical',    true),
('telmisartan',        'cardiovascular-disease','PPAR-gamma partial agonism, cardioprotection','clinical',  false),
('telmisartan',        'insulin-resistance',   'PPAR-gamma metabolic benefit',                'clinical',    false),
('telmisartan',        'metabolic-syndrome',   'blood pressure + metabolic dual benefit',     'clinical',    false),

('oea',                'obesity',              'PPAR-alpha satiety signaling',                'clinical',    true),
('oea',                'insulin-resistance',   'fatty acid receptor modulation',              'preclinical', false),
('oea',                'gut-health',           'intestinal barrier, lipid sensing',           'preclinical', false),

('ru58841',            'hair-loss',            'topical AR antagonist, DHT blockade',         'preclinical', true),

('tesofensine-ipamorelin', 'obesity',          'monoamine inhibition + GH secretagogue',      'anecdotal',   true),
('tesofensine-ipamorelin', 'gh-deficiency',    'ipamorelin GH pulse component',               'anecdotal',   false),

('triple-gh-cjc-ipa-ghrp', 'gh-deficiency',   'triple secretagogue GH pulse stack',          'anecdotal',   true),
('triple-gh-cjc-ipa-ghrp', 'sarcopenia',       'maximal GH/IGF-1 lean mass support',          'anecdotal',   false),
('triple-gh-cjc-ipa-ghrp', 'athletic-performance', 'amplified recovery via GH axis',         'anecdotal',   false),

('tesa-ipa',           'gh-deficiency',        'tesamorelin + ipamorelin GH axis support',    'clinical',    true),
('tesa-ipa',           'athletic-performance', 'GH pulse for recovery',                       'clinical',    false),
('tesa-ipa',           'nafld',                'tesamorelin visceral fat reduction',           'clinical',    false),

('tesa-ipa-cjc',       'gh-deficiency',        'triple GHRH/ghrelin stack',                   'anecdotal',   true),
('tesa-ipa-cjc',       'sarcopenia',           'sustained GH/IGF-1 lean mass support',        'anecdotal',   false),

-- ── BATCH 7 ───────────────────────────────────────────────────
('ghrp-2',             'gh-deficiency',        'ghrelin receptor agonism, potent GH release', 'clinical',    true),
('ghrp-2',             'sarcopenia',           'IGF-1 mediated muscle anabolism',             'clinical',    false),
('ghrp-2',             'athletic-performance', 'GH pulse amplification',                      'clinical',    false),

('follistatin-315',    'sarcopenia',           'myostatin inhibition, local isoform',         'preclinical', true),
('follistatin-315',    'athletic-performance', 'muscle hypertrophy via myostatin block',      'preclinical', false),

('liraglutide',        'obesity',              'GLP-1 agonism, appetite and energy balance',  'clinical',    true),
('liraglutide',        'type-2-diabetes',      'incretin effect, insulin secretion',          'clinical',    true),
('liraglutide',        'cardiovascular-disease','GLP-1 CVOT benefit, MACE reduction',         'clinical',    false),

('clenbuterol',        'athletic-performance', 'beta-2 agonism, anabolic/anti-catabolic',     'clinical',    true),
('clenbuterol',        'obesity',              'thermogenesis, fat oxidation',                'clinical',    false),
('clenbuterol',        'sarcopenia',           'muscle-sparing beta-2 mechanism',             'preclinical', false),

('albuterol',          'athletic-performance', 'beta-2 agonism, muscle anabolic effect',      'clinical',    true),
('albuterol',          'sarcopenia',           'muscle-sparing beta-2 signaling',             'preclinical', false),

('gdf-15',             'obesity',              'GDNF receptor agonism, anorexigenic signal',  'clinical',    true),
('gdf-15',             'metabolic-syndrome',   'energy balance, anti-obesity hormone',        'clinical',    false),

('fgf-21',             'obesity',              'fibroblast growth factor, fat metabolism',    'preclinical', true),
('fgf-21',             'nafld',                'hepatic steatosis reduction',                 'clinical',    true),
('fgf-21',             'dyslipidemia',         'triglyceride and LDL reduction',              'clinical',    false),
('fgf-21',             'insulin-resistance',   'adiponectin upregulation',                    'preclinical', false),

('p21-peptide',        'cancer-support',       'CDKN1A/p21 senolytic pathway',                'preclinical', true),
('p21-peptide',        'cellular-senescence',  'cell cycle arrest modulation',                'preclinical', false),

('gdf-11',             'longevity',            'rejuvenation parabiosis factor, muscle/brain', 'preclinical', true),
('gdf-11',             'sarcopenia',           'circulating rejuvenation factor',             'preclinical', false),
('gdf-11',             'cognitive-decline',    'neurogenesis, olfactory restoration',         'preclinical', false),

('klotho',             'longevity',            'anti-aging hormone, mTOR/Wnt modulation',     'preclinical', true),
('klotho',             'neuroprotection',      'synaptic plasticity, cognitive aging',        'preclinical', false),
('klotho',             'cardiovascular-disease','vascular aging attenuation',                 'preclinical', false),
('klotho',             'osteoporosis',         'Wnt signaling, bone formation',               'preclinical', false),

('svetinorm',          'longevity',            'liver tissue bioregulator peptide',           'clinical',    true),
('svetinorm',          'liver-health',         'hepatocyte function normalization',           'clinical',    true),

('endoluten',          'longevity',            'pineal bioregulator, epiphysis function',     'clinical',    true),
('endoluten',          'insomnia',             'melatonin rhythm restoration',                'clinical',    true),
('endoluten',          'cellular-senescence',  'pineal aging reversal',                       'clinical',    false),

('bonomarlot',         'longevity',            'bone marrow bioregulator, hematopoiesis',     'clinical',    true),
('bonomarlot',         'immune-deficiency',    'bone marrow immune cell support',             'clinical',    false),

-- ── BATCH 8 ───────────────────────────────────────────────────
('foxo4-dri',          'cellular-senescence',  'FOXO4-p53 apoptosis induction in senescent cells', 'preclinical', true),
('foxo4-dri',          'longevity',            'senolytic clearance of zombie cells',         'preclinical', true),
('foxo4-dri',          'cancer-support',       'pro-apoptotic senolytic research',            'preclinical', false),

('semax-selank-blend', 'cognitive-decline',    'BDNF + GABAergic dual nootropic',            'anecdotal',   true),
('semax-selank-blend', 'anxiety',              'anxiolytic + cognitive stack',                'anecdotal',   true),
('semax-selank-blend', 'depression',           'monoamine + peptide antidepressant blend',   'anecdotal',   false),

('vardenafil',         'erectile-dysfunction', 'PDE5 inhibition, penile vasodilation',       'clinical',    true),

('avanafil',           'erectile-dysfunction', 'selective PDE5 inhibitor, rapid onset',      'clinical',    true),

('oxytocin',           'low-libido-female',    'bonding hormone, arousal and lubrication',   'clinical',    true),
('oxytocin',           'female-sexual-dysfunction', 'central arousal and attachment',        'clinical',    false),
('oxytocin',           'anxiety',              'HPA dampening, social anxiety reduction',    'clinical',    false),
('oxytocin',           'autism',               'social cognition, bonding behavior',         'clinical',    false),
('oxytocin',           'ptsd',                 'fear extinction, trust restoration',         'clinical',    false),

-- ── BATCH 9 ───────────────────────────────────────────────────
('aicar',              'insulin-resistance',   'AMPK activation, glucose transporter upregulation', 'preclinical', true),
('aicar',              'athletic-performance', 'AMPK endurance mimetic',                     'preclinical', true),
('aicar',              'metabolic-syndrome',   'mitochondrial biogenesis via AMPK',          'preclinical', false),
('aicar',              'cardiovascular-disease','AMPK cardioprotective signaling',            'preclinical', false),

('adamax',             'cognitive-decline',    'V1b receptor, memory consolidation',         'preclinical', true),
('adamax',             'neuroprotection',      'vasopressin analog neuroprotection',          'preclinical', false),

('crystagen',          'longevity',            'connective tissue bioregulator tripeptide',   'clinical',    true),
('crystagen',          'joint-pain',           'cartilage peptide support',                   'clinical',    false),

('tri-heal',           'wound-healing',        'BPC-157 + TB-500 + PDA healing stack',       'anecdotal',   true),
('tri-heal',           'joint-pain',           'multi-peptide connective tissue repair',      'anecdotal',   false),
('tri-heal',           'tendon-ligament',      'triple peptide tendon repair stack',          'anecdotal',   false),

('aod-cjc-ipa-blend',  'obesity',              'AOD9604 fat + CJC/IPA GH secretion',         'anecdotal',   true),
('aod-cjc-ipa-blend',  'gh-deficiency',        'GH secretagogue component',                   'anecdotal',   false),

('pnc-27',             'cancer-support',       'HDM-2 inhibitor, p53-mediated tumor apoptosis', 'preclinical', true),

('pe-22-28',           'depression',           'FKBP5 inhibition, synaptic plasticity',      'preclinical', true),
('pe-22-28',           'cognitive-decline',    'spermidine pathway, memory enhancement',     'preclinical', false),
('pe-22-28',           'tbi',                  'neuroplasticity restoration post-TBI',       'preclinical', false),

('adipotide',          'obesity',              'PROHIBITIN targeting, fat vasculature apoptosis', 'preclinical', true),
('adipotide',          'cancer-support',       'vascular targeting research compound',        'preclinical', false),

-- ── BATCH 10 — BIOREGULATOR PROTOCOLS ────────────────────────
('pielotax',           'longevity',            'kidney tissue bioregulator peptide',          'clinical',    true),

('chitomur',           'longevity',            'bladder/urinary tract bioregulator',          'clinical',    true),
('chitomur',           'overactive-bladder',   'bladder tissue peptide normalization',        'clinical',    true),

('zhenoluten',         'menopause',            'ovarian bioregulator, estradiol support',     'clinical',    true),
('zhenoluten',         'longevity',            'ovarian tissue peptide bioregulation',        'clinical',    false),
('zhenoluten',         'low-libido-female',    'ovarian hormone support',                     'clinical',    false),

('glandokort',         'adrenal-fatigue',      'adrenal cortex bioregulator peptide',         'clinical',    true),
('glandokort',         'hpa-dysregulation',    'cortisol pattern normalization',              'clinical',    true),
('glandokort',         'longevity',            'adrenal bioregulation, stress resilience',   'clinical',    false),

('bonothyrk',          'hypothyroidism',       'thyroid tissue bioregulator peptide',         'clinical',    true),
('bonothyrk',          'longevity',            'thyroid cell peptide normalization',          'clinical',    false),

('endocrine-triad-protocol', 'hypogonadism',   'combined gonadal/adrenal/thyroid bioregulation', 'clinical', true),
('endocrine-triad-protocol', 'hpa-dysregulation', 'adrenal peptide component',               'clinical',    false),
('endocrine-triad-protocol', 'hypothyroidism', 'thyroid bioregulator component',             'clinical',    false),

('cv-bioregulator-protocol', 'cardiovascular-disease', 'multi-peptide cardiac/vascular support', 'clinical', true),
('cv-bioregulator-protocol', 'longevity',       'vascular bioregulation stack',               'clinical',    false),

('cognitive-bioregulator-protocol', 'cognitive-decline', 'multi-peptide brain bioregulator stack', 'clinical', true),
('cognitive-bioregulator-protocol', 'neuroprotection',   'combined cortical bioregulation',   'clinical',    false),
('cognitive-bioregulator-protocol', 'longevity',         'brain aging peptide protocol',      'clinical',    false),

-- ── BATCH 11 ──────────────────────────────────────────────────
('testosterone-pellets', 'hypogonadism',       'sustained-release androgen replacement',     'clinical',    true),
('testosterone-pellets', 'sarcopenia',         'anabolic androgen, lean mass',               'clinical',    false),
('testosterone-pellets', 'low-libido-male',    'androgen restoration, libido',               'clinical',    false),

('testosterone-undecanoate-oral', 'hypogonadism', 'oral androgen replacement, lymphatic absorption', 'clinical', true),
('testosterone-undecanoate-oral', 'sarcopenia', 'anabolic androgen support',                 'clinical',    false),

('trimix',             'erectile-dysfunction', 'alprostadil/phentolamine/papaverine vasodilation', 'clinical', true),

('phentermine',        'obesity',              'sympathomimetic appetite suppression',        'clinical',    true),

('tri-amino-injection', 'athletic-performance','arginine/ornithine/lysine GH secretion',     'clinical',    true),
('tri-amino-injection', 'sarcopenia',          'anabolic amino acid GH stimulus',            'clinical',    false),
('tri-amino-injection', 'wound-healing',       'collagen synthesis substrate',               'clinical',    false),

('b-complex-injection', 'neuropathy',          'B1/B6/B12 nerve conduction support',         'clinical',    true),
('b-complex-injection', 'cognitive-decline',   'homocysteine lowering, myelin support',      'clinical',    false),
('b-complex-injection', 'chronic-fatigue',     'mitochondrial cofactor support',             'clinical',    false),

('vitamin-c-injection', 'immune-deficiency',   'high-dose IV ascorbate immune activation',   'clinical',    true),
('vitamin-c-injection', 'chronic-inflammation','antioxidant, pro-oxidant at high dose',      'clinical',    false),
('vitamin-c-injection', 'wound-healing',       'collagen synthesis cofactor',                'clinical',    false),
('vitamin-c-injection', 'cancer-support',      'high-dose IV oncology adjunct research',     'preclinical', false),

('minoxidil',          'hair-loss',            'KATP channel opener, follicle vasodilation', 'clinical',    true),

-- ── BATCH 12 + 13 — INSULINS ──────────────────────────────────
('insulin-lispro',     'type-2-diabetes',      'rapid-acting insulin analog, mealtime glucose', 'clinical',  true),
('insulin-lispro',     'athletic-performance', 'nutrient partitioning, glycogen synthesis',  'anecdotal',   false),

('insulin-aspart',     'type-2-diabetes',      'rapid-acting insulin analog',                'clinical',    true),

('regular-insulin',    'type-2-diabetes',      'short-acting human insulin standard',        'clinical',    true),

('insulin-glargine',   'type-2-diabetes',      'basal insulin analog, 24h coverage',         'clinical',    true),

('nph-insulin',        'type-2-diabetes',      'intermediate-acting basal insulin',          'clinical',    true),

('insulin-detemir',    'type-2-diabetes',      'long-acting basal insulin analog',           'clinical',    true),

('insulin-degludec',   'type-2-diabetes',      'ultra-long-acting basal insulin, flat profile', 'clinical', true),
('insulin-degludec',   'insulin-resistance',   'basal insulin normalization',                'clinical',    false),

-- ── BATCH 14 ──────────────────────────────────────────────────
('oxandrolone',        'sarcopenia',           'anabolic steroid, nitrogen retention',       'clinical',    true),
('oxandrolone',        'athletic-performance', 'lean mass, strength without water retention','clinical',    false),

('oxymetholone',       'sarcopenia',           'potent anabolic, red blood cell production', 'clinical',    true),
('oxymetholone',       'chronic-fatigue',      'hematopoietic support in wasting',           'clinical',    false),

('stanozolol',         'athletic-performance', 'anabolic steroid, SHBG reduction',          'clinical',    true),
('stanozolol',         'sarcopenia',           'anabolic lean mass support',                 'clinical',    false),

('rapamycin',          'longevity',            'mTOR inhibition, autophagy induction',       'clinical',    true),
('rapamycin',          'cellular-senescence',  'senescence prevention via mTOR',             'preclinical', true),
('rapamycin',          'autoimmune',           'mTOR immunosuppression',                     'clinical',    false),
('rapamycin',          'cancer-support',       'mTOR anti-proliferative signaling',          'preclinical', false),

('metformin',          'insulin-resistance',   'AMPK activation, hepatic glucose output',    'clinical',    true),
('metformin',          'type-2-diabetes',      'first-line biguanide, glucose lowering',     'clinical',    true),
('metformin',          'longevity',            'mTOR/AMPK, epigenetic aging delay',          'clinical',    false),
('metformin',          'pmos',                 'insulin sensitization in PMOS',              'clinical',    true),
('metformin',          'cancer-support',       'mTOR inhibition, anti-proliferative',        'preclinical', false),
('metformin',          'nafld',                'hepatic fat reduction',                      'clinical',    false),

('mic-injection',      'obesity',              'lipotropic factors, hepatic fat mobilization','clinical',   true),
('mic-injection',      'liver-health',         'methionine/inositol/choline liver support',  'clinical',    true),
('mic-injection',      'nafld',                'lipotropic hepatic detox support',           'clinical',    false),

('b12-injection',      'neuropathy',           'myelin sheath regeneration support',         'clinical',    true),
('b12-injection',      'cognitive-decline',    'homocysteine reduction, methylation',        'clinical',    false),
('b12-injection',      'chronic-fatigue',      'mitochondrial energy cofactor',              'clinical',    false),
('b12-injection',      'depression',           'methylation pathway, monoamine synthesis',   'clinical',    false),

-- ── BATCH 15 ──────────────────────────────────────────────────
('caffeine',           'athletic-performance', 'adenosine blockade, CNS stimulation',        'clinical',    true),
('caffeine',           'cognitive-decline',    'adenosine receptor neuroprotection',         'clinical',    false),
('caffeine',           'neuroprotection',      'inverse association with Parkinson disease',  'clinical',    false),

('nicotine',           'cognitive-decline',    'nicotinic ACh receptor, attention/memory',   'clinical',    false),
('nicotine',           'neuroprotection',      'nAChR-mediated neuroprotection',             'preclinical', false),
('nicotine',           'adhd',                 'cholinergic attention enhancement',          'clinical',    false),

('creatine',           'athletic-performance', 'phosphocreatine resynthesis, power output',  'clinical',    true),
('creatine',           'sarcopenia',           'muscle mass and strength in aging',           'clinical',    true),
('creatine',           'cognitive-decline',    'cerebral phosphocreatine, brain energy',     'clinical',    false),
('creatine',           'neuroprotection',      'mitochondrial neuroprotection',               'preclinical', false),
('creatine',           'depression',           'prefrontal cortex energy metabolism',        'preclinical', false),

('trigonelline',       'insulin-resistance',   'NAD+ precursor, AMPK-like metabolic benefit','preclinical', true),
('trigonelline',       'cognitive-decline',    'NAD+ brain energy support',                  'preclinical', false),
('trigonelline',       'longevity',            'NAD+ pathway longevity signaling',            'preclinical', false),

('pentadeca-arginate', 'wound-healing',        'NO synthesis, enhanced BPC-157 analog',      'preclinical', true),
('pentadeca-arginate', 'gut-health',           'mucosal regeneration, barrier support',      'preclinical', true),
('pentadeca-arginate', 'joint-pain',           'connective tissue repair, arginate bridge',  'preclinical', false),
('pentadeca-arginate', 'tendon-ligament',      'enhanced tendon repair signaling',            'preclinical', false),
('pentadeca-arginate', 'chronic-inflammation', 'anti-inflammatory cytokine reduction',       'preclinical', false),

('ostarine',           'sarcopenia',           'selective AR agonism, lean mass in aging',   'clinical',    true),
('ostarine',           'athletic-performance', 'AR-mediated muscle preservation',            'clinical',    false),
('ostarine',           'osteoporosis',         'bone mineral density via AR signaling',       'clinical',    false),

('ligandrol',          'sarcopenia',           'potent selective AR agonism, lean mass',     'clinical',    true),
('ligandrol',          'athletic-performance', 'strength and recovery via AR',               'clinical',    false),
('ligandrol',          'osteoporosis',         'AR bone density signaling',                   'clinical',    false),

('sr-9009',            'obesity',              'Rev-Erb agonism, metabolic rate increase',   'preclinical', true),
('sr-9009',            'metabolic-syndrome',   'circadian metabolic normalization',          'preclinical', false),
('sr-9009',            'athletic-performance', 'mitochondrial biogenesis, endurance',        'preclinical', false),

-- ── BATCH 16 — ADAPTOGENS / HERBALS ──────────────────────────
('ashwagandha',        'anxiety',              'cortisol reduction, GABAergic modulation',   'clinical',    true),
('ashwagandha',        'hpa-dysregulation',    'HPA axis normalization, adaptogen',          'clinical',    true),
('ashwagandha',        'hypogonadism',         'testosterone elevation, LH support',         'clinical',    false),
('ashwagandha',        'insomnia',             'sleep latency reduction, GABA support',      'clinical',    false),
('ashwagandha',        'athletic-performance', 'cortisol reduction, recovery',               'clinical',    false),

('rhodiola',           'hpa-dysregulation',    'adaptogen, cortisol/stress modulation',      'clinical',    true),
('rhodiola',           'depression',           'MAO inhibition, monoamine support',          'clinical',    false),
('rhodiola',           'chronic-fatigue',      'anti-fatigue adaptogen effect',              'clinical',    true),
('rhodiola',           'athletic-performance', 'endurance, anti-fatigue',                    'clinical',    false),

('cordyceps',          'athletic-performance', 'ATP synthesis, VO2 max support',             'clinical',    true),
('cordyceps',          'immune-deficiency',    'NK cell activation, immune modulation',      'clinical',    false),
('cordyceps',          'chronic-fatigue',      'mitochondrial energy, anti-fatigue',         'clinical',    false),

('lions-mane',         'cognitive-decline',    'NGF synthesis, neuroplasticity',             'clinical',    true),
('lions-mane',         'neuroprotection',      'hericenone/erinacine NGF induction',         'clinical',    false),
('lions-mane',         'alzheimers',           'amyloid plaque reduction, NGF',              'preclinical', false),
('lions-mane',         'depression',           'neurogenesis, gut-brain axis',               'clinical',    false),

('reishi',             'immune-deficiency',    'beta-glucan, NK cell activation',            'clinical',    true),
('reishi',             'chronic-inflammation', 'triterpene anti-inflammatory',               'clinical',    false),
('reishi',             'insomnia',             'CNS calming, sleep quality',                 'clinical',    false),
('reishi',             'longevity',            'adaptogen, immune senescence support',       'clinical',    false),

('cistanche',          'hypogonadism',         'phenylethanoid glycosides, testosterone',    'preclinical', false),
('cistanche',          'cognitive-decline',    'neuroprotective phenylethanoids',            'preclinical', true),
('cistanche',          'longevity',            'kidney yang tonic, mTOR modulation',         'preclinical', false),

('tongkat-ali',        'hypogonadism',         'SHBG reduction, free testosterone elevation','clinical',    true),
('tongkat-ali',        'low-libido-male',      'androgen support, libido enhancement',       'clinical',    true),
('tongkat-ali',        'athletic-performance', 'testosterone-mediated performance',          'clinical',    false),

('fadogia-agrestis',   'hypogonadism',         'LH mimicry, testosterone stimulation',       'anecdotal',   true),
('fadogia-agrestis',   'low-libido-male',      'androgen/libido support',                    'anecdotal',   true),

('eleuthero',          'hpa-dysregulation',    'adaptogen, adrenal stress modulation',       'clinical',    true),
('eleuthero',          'chronic-fatigue',      'anti-fatigue adaptogen',                     'clinical',    false),
('eleuthero',          'adrenal-fatigue',      'adrenal support, energy restoration',        'clinical',    false),

('schisandra',         'liver-health',         'hepatoprotective lignans',                   'clinical',    true),
('schisandra',         'hpa-dysregulation',    'adaptogen, cortisol balance',                'clinical',    false),
('schisandra',         'adrenal-fatigue',      'adrenal adaptogen, stress resilience',       'clinical',    false),

('holy-basil',         'anxiety',              'anxiolytic adaptogen, COX inhibition',       'clinical',    true),
('holy-basil',         'hpa-dysregulation',    'cortisol modulation, stress reduction',      'clinical',    false),
('holy-basil',         'adrenal-fatigue',      'adrenal tonic, HPA support',                 'clinical',    false),

('maca',               'low-libido-male',      'aphrodisiac effect, independent of T',       'clinical',    true),
('maca',               'low-libido-female',    'sexual desire enhancement in women',         'clinical',    true),
('maca',               'menopause',            'menopausal symptom reduction, non-estrogenic','clinical',  false),
('maca',               'hypogonadism',         'androgen precursor alkaloid support',        'preclinical', false),

-- ── BATCH 17 ──────────────────────────────────────────────────
('berberine',          'insulin-resistance',   'AMPK activation, GLUT4 upregulation',        'clinical',    true),
('berberine',          'type-2-diabetes',      'glucose lowering comparable to metformin',   'clinical',    true),
('berberine',          'dyslipidemia',         'LDL/triglyceride reduction, LDLr upregulation','clinical', false),
('berberine',          'pmos',                 'insulin sensitization, androgen modulation', 'clinical',    true),
('berberine',          'nafld',                'hepatic lipid reduction, AMPK',              'clinical',    false),
('berberine',          'gut-health',           'microbiome modulation, barrier support',     'clinical',    false),

('urolithin-a',        'longevity',            'mitophagy induction, NAD+ support',          'clinical',    true),
('urolithin-a',        'cellular-senescence',  'mitochondrial quality control',              'clinical',    false),
('urolithin-a',        'athletic-performance', 'mitochondrial biogenesis, endurance',        'clinical',    false),
('urolithin-a',        'sarcopenia',           'mitophagy-driven muscle quality',            'clinical',    false),

('ephedrine',          'obesity',              'sympathomimetic thermogenesis, lipolysis',   'clinical',    true),
('ephedrine',          'athletic-performance', 'norepinephrine release, CNS stimulation',    'clinical',    false),

-- ── BATCH 18 — NAD+ / LONGEVITY ───────────────────────────────
('nmn',                'longevity',            'NAD+ precursor, sirtuin activation',         'clinical',    true),
('nmn',                'neuroprotection',      'NAD+ brain energy, axon protection',         'clinical',    false),
('nmn',                'cardiovascular-disease','NAD+ vascular protection',                  'preclinical', false),
('nmn',                'insulin-resistance',   'NAD+/SIRT1 insulin sensitivity',             'preclinical', false),
('nmn',                'cellular-senescence',  'NAD+ senescence attenuation',                'preclinical', false),

('nr',                 'longevity',            'NAD+ precursor, mitochondrial biogenesis',   'clinical',    true),
('nr',                 'neuroprotection',      'NAD+ axon protection, neuronal energy',      'preclinical', false),
('nr',                 'cellular-senescence',  'sirtuin-driven senescence reduction',        'preclinical', false),
('nr',                 'chronic-fatigue',      'mitochondrial NAD+ restoration',             'clinical',    false),

('tmg',                'cardiovascular-disease','homocysteine reduction via methylation',     'clinical',    true),
('tmg',                'liver-health',         'methyl donor, hepatic fat metabolism',       'clinical',    false),
('tmg',                'depression',           'methylation support, monoamine synthesis',   'preclinical', false),
('tmg',                'athletic-performance', 'creatine synthesis, power output',           'clinical',    false),

('resveratrol',        'longevity',            'SIRT1 activation, mTOR inhibition',          'clinical',    true),
('resveratrol',        'cardiovascular-disease','NO production, endothelial protection',      'clinical',    false),
('resveratrol',        'insulin-resistance',   'SIRT1/AMPK insulin pathway',                 'preclinical', false),
('resveratrol',        'cellular-senescence',  'senescence pathway modulation',              'preclinical', false),

('spermidine',         'longevity',            'autophagy induction, epigenetic aging',      'clinical',    true),
('spermidine',         'cellular-senescence',  'autophagy-driven senescence clearance',      'preclinical', false),
('spermidine',         'cardiovascular-disease','autophagy, cardioprotection',               'clinical',    false),
('spermidine',         'cognitive-decline',    'autophagy, brain protein quality',           'preclinical', false),

-- ── BATCH 19 ──────────────────────────────────────────────────
('pterostilbene',      'longevity',            'SIRT1/AMPK, superior resveratrol analog',    'preclinical', true),
('pterostilbene',      'cognitive-decline',    'antioxidant neuroprotection, BDNF',          'preclinical', false),
('pterostilbene',      'dyslipidemia',         'LDL/total cholesterol reduction',            'clinical',    false),

('fisetin',            'cellular-senescence',  'potent senolytic, p21/p16 pathway',          'clinical',    true),
('fisetin',            'longevity',            'senolytic lifespan extension in mice',       'preclinical', true),
('fisetin',            'neuroprotection',      'SIRT1, hippocampal memory protection',       'preclinical', false),
('fisetin',            'alzheimers',           'amyloid/tau reduction, senolytic',           'preclinical', false),

('quercetin',          'cellular-senescence',  'senolytic, Bcl-2 family inhibition',         'preclinical', true),
('quercetin',          'chronic-inflammation', 'NF-kB, MAPK anti-inflammatory',              'clinical',    false),
('quercetin',          'immune-deficiency',    'mast cell stabilization, antiviral',         'clinical',    false),
('quercetin',          'longevity',            'senolytic clearing of senescent burden',      'preclinical', false),
('quercetin',          'cardiovascular-disease','endothelial function, blood pressure',       'clinical',    false),

('apigenin',           'insomnia',             'GABA-A potentiation, sleep induction',       'preclinical', true),
('apigenin',           'anxiety',              'anxiolytic flavonoid, GABA-A',               'preclinical', false),
('apigenin',           'longevity',            'CD38 inhibition, NAD+ preservation',         'preclinical', true),
('apigenin',           'cellular-senescence',  'SASP reduction, senomorphic',                'preclinical', false),

('sulforaphane',       'chronic-inflammation', 'Nrf2 activation, ARE gene induction',        'clinical',    true),
('sulforaphane',       'cancer-support',       'Nrf2/phase II enzyme anti-carcinogenic',     'clinical',    true),
('sulforaphane',       'dyslipidemia',         'Nrf2 hepatic lipid protection',              'preclinical', false),
('sulforaphane',       'neuroprotection',      'BBB Nrf2 anti-neuroinflammatory',            'preclinical', false),
('sulforaphane',       'autism',               'Nrf2, gut-brain, oxidative stress',          'clinical',    false),

-- ── BATCH 20 — COSMETIC PEPTIDES ─────────────────────────────
('decapeptide-18',     'skin-aging',           'melanin synthesis inhibition, brightening',  'clinical',    true),
('oligopeptide-54',    'skin-aging',           'collagen-I stimulation, wrinkle reduction',  'clinical',    true),
('redensyl',           'hair-loss',            'DHQG/EGCG, stem cell follicle activation',   'clinical',    true),
('acetyl-tetrapeptide-3', 'hair-loss',         'ECM/follicle anchoring peptide',             'clinical',    true),
('biotinoyl-tripeptide-1', 'hair-loss',        'biotin peptide, keratin strengthening',      'clinical',    true),

-- ── BATCH 21 ──────────────────────────────────────────────────
('dhea',               'adrenal-fatigue',      'adrenal precursor hormone replacement',      'clinical',    true),
('dhea',               'menopause',            'estrogen/testosterone precursor support',    'clinical',    true),
('dhea',               'low-libido-female',    'androgen precursor, desire support',         'clinical',    false),
('dhea',               'immune-deficiency',    'immunomodulatory adrenal hormone',           'clinical',    false),
('dhea',               'cognitive-decline',    'neurosteroid neuroprotection',               'preclinical', false),

('pregnenolone',       'cognitive-decline',    'neurosteroid, memory enhancement',           'preclinical', true),
('pregnenolone',       'menopause',            'steroid precursor hormone support',          'preclinical', false),
('pregnenolone',       'hpa-dysregulation',    'upstream cortisol precursor support',        'preclinical', false),
('pregnenolone',       'depression',           'neurosteroid mood support',                  'preclinical', false),

('curcumin',           'chronic-inflammation', 'NF-kB inhibition, COX-2 suppression',        'clinical',    true),
('curcumin',           'joint-pain',           'arthritis anti-inflammatory comparable NSAIDs','clinical',  true),
('curcumin',           'cognitive-decline',    'amyloid clearance, BDNF support',            'clinical',    false),
('curcumin',           'cancer-support',       'apoptosis induction, anti-proliferative',   'preclinical', false),
('curcumin',           'gut-health',           'mucosal anti-inflammatory, microbiome',      'clinical',    false),

('7-keto-dhea',        'obesity',              'thermogenic DHEA metabolite, cortisol blocking','clinical', true),
('7-keto-dhea',        'adrenal-fatigue',      'non-androgenic adrenal hormone support',     'clinical',    false),

('melatonin',          'insomnia',             'circadian rhythm entrainment, sleep onset',  'clinical',    true),
('melatonin',          'longevity',            'antioxidant, mitochondrial protection',      'preclinical', false),
('melatonin',          'immune-deficiency',    'NK cell and T-cell immune modulation',       'preclinical', false),
('melatonin',          'cellular-senescence',  'anti-aging antioxidant signaling',           'preclinical', false),

-- ── BATCH 22 — MITOCHONDRIAL ──────────────────────────────────
('ss-31',              'longevity',            'cardiolipin targeting, cristae preservation', 'clinical',    true),
('ss-31',              'cardiac-support',      'mitochondrial inner membrane protection',    'clinical',    true),
('ss-31',              'neuroprotection',      'neuronal mitochondrial protection',           'preclinical', false),
('ss-31',              'cellular-senescence',  'ROS-driven senescence attenuation',          'preclinical', false),

('humanin',            'longevity',            'mitochondrial peptide, apoptosis resistance', 'preclinical', true),
('humanin',            'neuroprotection',      'amyloid-beta resistance, neuronal survival', 'preclinical', false),
('humanin',            'cardiac-support',      'cardiomyocyte protection',                   'preclinical', false),
('humanin',            'insulin-resistance',   'STAT3-mediated insulin sensitization',       'preclinical', false),

('pqq',                'cognitive-decline',    'mitochondrial biogenesis, NGF support',      'clinical',    true),
('pqq',                'neuroprotection',      'antioxidant, mitochondrial biogenesis',      'clinical',    false),
('pqq',                'cardiac-support',      'cardioprotective mitochondrial support',     'preclinical', false),
('pqq',                'longevity',            'mitochondrial quality, cellular energy',     'preclinical', false),

('coq10',              'cardiac-support',      'mitochondrial electron transport, ATP',      'clinical',    true),
('coq10',              'longevity',            'antioxidant, mitochondrial decline attenuation','clinical', false),
('coq10',              'athletic-performance', 'cellular energy, exercise performance',      'clinical',    false),
('coq10',              'chronic-fatigue',      'mitochondrial ATP restoration',              'clinical',    false),
('coq10',              'cardiovascular-disease','statin-induced CoQ10 depletion reversal',   'clinical',    false),

-- ── BATCH 23 — CHOLINERGICS / RACETAMS ───────────────────────
('alpha-gpc',          'cognitive-decline',    'acetylcholine precursor, memory formation',  'clinical',    true),
('alpha-gpc',          'adhd',                 'cholinergic attention enhancement',          'clinical',    false),
('alpha-gpc',          'alzheimers',           'ACh deficit restoration',                    'clinical',    false),
('alpha-gpc',          'athletic-performance', 'growth hormone secretion, power output',     'clinical',    false),

('cdp-choline',        'cognitive-decline',    'uridine + choline, synaptic membrane repair','clinical',   true),
('cdp-choline',        'adhd',                 'dopamine + ACh dual mechanism',              'clinical',    false),
('cdp-choline',        'tbi',                  'neuroprotection, membrane repair post-TBI',  'clinical',    false),

('aniracetam',         'cognitive-decline',    'AMPA potentiation, memory consolidation',    'preclinical', true),
('aniracetam',         'anxiety',              'AMPA/D2 anxiolytic mechanism',               'preclinical', false),
('aniracetam',         'depression',           'dopaminergic/serotonergic support',          'preclinical', false),

('phenylpiracetam',    'cognitive-decline',    'norepinephrine/dopamine, cold and focus',    'preclinical', true),
('phenylpiracetam',    'adhd',                 'catecholamine enhancement, task performance', 'preclinical', false),
('phenylpiracetam',    'depression',           'stimulant-adjacent antidepressant effect',   'preclinical', false),
('phenylpiracetam',    'athletic-performance', 'cold resistance, anti-fatigue',              'anecdotal',   false),

('huperzine-a',        'alzheimers',           'AChE inhibition, ACh preservation',          'clinical',    true),
('huperzine-a',        'cognitive-decline',    'cholinergic memory support',                 'clinical',    false),

-- ── BATCH 24 ──────────────────────────────────────────────────
('epitalon',           'longevity',            'telomerase activation, Khavinson peptide',   'clinical',    true),
('epitalon',           'insomnia',             'melatonin/circadian cycle normalization',    'clinical',    true),
('epitalon',           'cellular-senescence',  'telomere elongation, senescence attenuation','clinical',   true),
('epitalon',           'immune-deficiency',    'thymic function restoration',                'clinical',    false),

('pinealon',           'insomnia',             'pineal bioregulator, sleep cycle support',   'clinical',    true),
('pinealon',           'neuroprotection',      'retinal/brain peptide neuroprotection',      'clinical',    false),
('pinealon',           'longevity',            'pineal aging bioregulation',                 'clinical',    false),

('vesugen',            'cardiovascular-disease','vascular tissue bioregulator peptide',       'clinical',    true),
('vesugen',            'longevity',            'endothelial peptide bioregulation',          'clinical',    false),

('cardiogen',          'cardiac-support',      'cardiac tissue bioregulator peptide',        'clinical',    true),
('cardiogen',          'longevity',            'myocardial cell peptide normalization',      'clinical',    false),

('cortagen',           'cognitive-decline',    'cortex bioregulator, neural activity',       'clinical',    true),
('cortagen',           'neuroprotection',      'cortical peptide neuroprotection',           'clinical',    false),
('cortagen',           'longevity',            'brain cortex bioregulation',                 'clinical',    false),

-- ── BATCH 25 — FOUNDATIONAL ───────────────────────────────────
('magnesium',          'insomnia',             'NMDA antagonism, GABA support, sleep',       'clinical',    true),
('magnesium',          'anxiety',              'HPA calming, GABA-A modulation',             'clinical',    true),
('magnesium',          'hypertension',         'vascular smooth muscle relaxation',          'clinical',    false),
('magnesium',          'cognitive-decline',    'NMDA/synaptic plasticity support',           'clinical',    false),
('magnesium',          'athletic-performance', 'muscle contraction, ATP synthesis',          'clinical',    false),
('magnesium',          'insulin-resistance',   'glucose transporter, insulin receptor',      'clinical',    false),

('glycine',            'insomnia',             'core body temp reduction, sleep quality',    'clinical',    true),
('glycine',            'joint-pain',           'collagen synthesis substrate',               'clinical',    false),
('glycine',            'neuroprotection',      'inhibitory neurotransmitter support',        'preclinical', false),
('glycine',            'longevity',            'methionine restriction mimicry',             'preclinical', false),

('l-theanine',         'anxiety',              'GABA/glutamate balance, alpha wave induction','clinical',  true),
('l-theanine',         'insomnia',             'relaxation without sedation, sleep quality', 'clinical',   false),
('l-theanine',         'cognitive-decline',    'caffeine synergy, focused attention',        'clinical',    false),

('nac',                'liver-health',         'glutathione precursor, hepatoprotection',    'clinical',    true),
('nac',                'chronic-inflammation', 'ROS scavenging, Nrf2 pathway',              'clinical',    false),
('nac',                'addiction',            'glutamate modulation, craving reduction',    'clinical',    false),
('nac',                'nafld',                'hepatic oxidative stress reduction',         'clinical',    false),
('nac',                'chronic-fatigue',      'mitochondrial glutathione support',          'clinical',    false),
('nac',                'pmos',                 'insulin sensitization, ovarian oxidative stress','clinical',false),

('taurine',            'cardiac-support',      'cardiac calcium handling, electrolyte balance','clinical',  true),
('taurine',            'athletic-performance', 'endurance, bile acid conjugation',           'clinical',    false),
('taurine',            'cognitive-decline',    'inhibitory neuromodulator support',          'preclinical', false),
('taurine',            'longevity',            'mitochondrial antioxidant, taurine decline', 'clinical',    false),
('taurine',            'insomnia',             'GABA-like calming, sleep quality',           'preclinical', false),

-- ── BATCH 26 ──────────────────────────────────────────────────
('n-acetyl-semax-amidate', 'cognitive-decline','BDNF/NGF amplified analog, memory focus',   'clinical',    true),
('n-acetyl-semax-amidate', 'adhd',             'dopamine/norepinephrine potentiation',       'clinical',    false),
('n-acetyl-semax-amidate', 'neuroprotection',  'enhanced neurotrophic signaling',            'clinical',    false),
('n-acetyl-semax-amidate', 'tbi',              'neuroregeneration, inflammation reduction',  'preclinical', false),

('n-acetyl-selank-amidate', 'anxiety',         'enhanced GABAergic anxiolytic potency',      'clinical',    true),
('n-acetyl-selank-amidate', 'depression',      'serotonin/BDNF enhancement',                'preclinical', false),
('n-acetyl-selank-amidate', 'hpa-dysregulation','cortisol normalization, analog potency',   'preclinical', false),

('bromantane',         'adhd',                 'dopamine/serotonin synthesis induction',     'clinical',    true),
('bromantane',         'depression',           'dopaminergic antidepressant, actoprotector', 'clinical',    false),
('bromantane',         'chronic-fatigue',      'actoprotector, anti-fatigue adaptation',     'clinical',    true),
('bromantane',         'athletic-performance', 'heat resistance, physical endurance',        'clinical',    false),

('dihexa',             'alzheimers',           'HGF/c-Met agonist, synaptogenesis',          'preclinical', true),
('dihexa',             'cognitive-decline',    'synaptic repair, memory enhancement',        'preclinical', true),
('dihexa',             'tbi',                  'HGF-driven neuroregeneration',               'preclinical', false),

('bemethyl',           'athletic-performance', 'actoprotector, hypoxia resistance',          'clinical',    true),
('bemethyl',           'chronic-fatigue',      'anti-asthenic, mitochondrial support',       'clinical',    true),
('bemethyl',           'adhd',                 'CNS energizer, attention support',           'clinical',    false),
('bemethyl',           'hpa-dysregulation',    'stress resistance, HPA resilience',          'clinical',    false),

-- ── BATCH 27 — GH SECRETAGOGUES ──────────────────────────────
('cjc-1295-dac',       'gh-deficiency',        'long-acting GHRH analog, sustained GH pulse','clinical',   true),
('cjc-1295-dac',       'sarcopenia',           'sustained IGF-1 elevation, lean mass',       'clinical',   false),
('cjc-1295-dac',       'athletic-performance', 'GH-driven recovery and adaptation',          'clinical',   false),

('cjc-1295-no-dac',    'gh-deficiency',        'GHRH analog, pulsatile GH release',          'clinical',   true),
('cjc-1295-no-dac',    'sarcopenia',           'IGF-1 mediated muscle support',              'clinical',   false),
('cjc-1295-no-dac',    'athletic-performance', 'recovery, fat metabolism via GH',            'clinical',   false),

('ipamorelin',         'gh-deficiency',        'selective ghrelin receptor, clean GH pulse', 'clinical',   true),
('ipamorelin',         'sarcopenia',           'lean mass via IGF-1 without cortisol spike', 'clinical',   false),
('ipamorelin',         'insomnia',             'slow-wave sleep GH pulse enhancement',       'clinical',   false),
('ipamorelin',         'athletic-performance', 'recovery acceleration, body composition',    'clinical',   false),

('sermorelin',         'gh-deficiency',        'GHRH 1-29 analog, physiologic GH release',  'clinical',   true),
('sermorelin',         'sarcopenia',           'GH/IGF-1 lean mass support',                 'clinical',   false),
('sermorelin',         'insomnia',             'GH pulse restoration, sleep architecture',   'clinical',   false),

('hexarelin',          'gh-deficiency',        'potent ghrelin receptor agonism',            'clinical',   true),
('hexarelin',          'cardiac-support',      'GH-independent cardioprotective signaling',  'preclinical',false),
('hexarelin',          'sarcopenia',           'IGF-1 mediated muscle anabolism',            'clinical',   false),

('tesamorelin',        'gh-deficiency',        'GHRH analog, visceral adiposity reduction',  'clinical',   true),
('tesamorelin',        'nafld',                'GH-driven hepatic fat reduction',             'clinical',   true),
('tesamorelin',        'athletic-performance', 'body composition, GH axis support',          'clinical',   false),
('tesamorelin',        'cognitive-decline',    'IGF-1 neuroprotective effect',               'clinical',   false),

-- ── BATCH 28 — CORE HEALING PEPTIDES ─────────────────────────
('bpc-157',            'wound-healing',        'angiogenesis, EGF receptor activation',      'preclinical', true),
('bpc-157',            'gut-health',           'mucosal repair, VIP upregulation',            'preclinical', true),
('bpc-157',            'joint-pain',           'collagen synthesis, anti-inflammatory',       'preclinical', false),
('bpc-157',            'tendon-ligament',      'tendon fibroblast proliferation',             'preclinical', false),
('bpc-157',            'chronic-inflammation', 'NO system modulation, cytokine reduction',   'preclinical', false),
('bpc-157',            'tbi',                  'neuroplasticity, neuroinflammation reduction','preclinical', false),
('bpc-157',            'depression',           'dopamine system stabilization',               'preclinical', false),

('tb-500',             'wound-healing',        'actin sequestration, cell migration',         'preclinical', true),
('tb-500',             'athletic-performance', 'muscle repair, reduced DOMS',                'preclinical', true),
('tb-500',             'joint-pain',           'anti-inflammatory tissue repair',             'preclinical', false),
('tb-500',             'tendon-ligament',      'systemic connective tissue repair',           'preclinical', false),
('tb-500',             'cardiac-support',      'cardiomyocyte regeneration research',        'preclinical', false),

('ara-290',            'neuropathy',           'EPOR agonism, nerve fiber regeneration',     'clinical',    true),
('ara-290',            'chronic-inflammation', 'innate repair receptor, anti-inflammatory',  'clinical',    false),
('ara-290',            'post-viral',           'tissue repair, inflammation resolution',     'preclinical', false),
('ara-290',            'autoimmune',           'EPOR anti-inflammatory signaling',           'preclinical', false),

('thymosin-alpha-1',   'immune-deficiency',    'thymic T-cell maturation, NK activation',    'clinical',    true),
('thymosin-alpha-1',   'autoimmune',           'regulatory T-cell balance',                  'clinical',    false),
('thymosin-alpha-1',   'cancer-support',       'immune surveillance enhancement',            'clinical',    false),
('thymosin-alpha-1',   'post-viral',           'antiviral immune activation',                'clinical',    true),
('thymosin-alpha-1',   'chronic-fatigue',      'immune-driven fatigue resolution',           'clinical',    false),

('kpv',                'gut-health',           'MC1R/MC3R anti-inflammatory, mucosal repair','preclinical', true),
('kpv',                'chronic-inflammation', 'melanocortin receptor anti-inflammatory',   'preclinical', true),
('kpv',                'eczema-psoriasis',     'skin MC1R anti-inflammatory pathway',        'preclinical', false),
('kpv',                'wound-healing',        'antimicrobial, epithelial repair',            'preclinical', false),
('kpv',                'autoimmune',           'melanocortin immune modulation',             'preclinical', false),

-- ── BATCH 29 — TESTOSTERONE ESTERS ───────────────────────────
('testosterone-cypionate', 'hypogonadism',     'exogenous androgen replacement, TRT standard','clinical',  true),
('testosterone-cypionate', 'low-libido-male',  'androgen restoration, libido',               'clinical',   false),
('testosterone-cypionate', 'sarcopenia',        'anabolic, lean mass, nitrogen retention',    'clinical',   false),
('testosterone-cypionate', 'athletic-performance','androgen-driven strength and recovery',    'clinical',   false),

('testosterone-enanthate', 'hypogonadism',     'long-acting exogenous androgen replacement', 'clinical',   true),
('testosterone-enanthate', 'low-libido-male',  'androgen restoration',                       'clinical',   false),
('testosterone-enanthate', 'sarcopenia',        'lean mass support',                          'clinical',   false),

('testosterone-propionate', 'hypogonadism',    'short-acting androgen, frequent dosing',     'clinical',   true),
('testosterone-propionate', 'athletic-performance','rapid androgen activity',                 'clinical',   false),

('testosterone-undecanoate', 'hypogonadism',   'injectable long-acting androgen (Aveed)',     'clinical',   true),
('testosterone-undecanoate', 'sarcopenia',      'sustained androgen muscle support',          'clinical',   false),

('testosterone-topical', 'hypogonadism',       'transdermal androgen, stable levels',         'clinical',   true),
('testosterone-topical', 'low-libido-female',  'androgen restoration, female desire',        'clinical',   false),
('testosterone-topical', 'menopause',          'androgen component menopausal support',       'clinical',   false),

-- ── BATCH 30 — GLP/METABOLIC ──────────────────────────────────
('semaglutide',        'obesity',              'GLP-1 agonism, appetite, gastric emptying',  'clinical',    true),
('semaglutide',        'type-2-diabetes',      'incretin effect, glucose-dependent insulin', 'clinical',   true),
('semaglutide',        'cardiovascular-disease','MACE reduction, GLP-1 CVOT benefit',        'clinical',   false),
('semaglutide',        'nafld',                'hepatic steatosis improvement',               'clinical',   false),

('tirzepatide',        'obesity',              'GLP-1/GIP dual agonism, superior weight loss','clinical',  true),
('tirzepatide',        'type-2-diabetes',      'dual incretin, superior HbA1c reduction',    'clinical',   true),
('tirzepatide',        'insulin-resistance',   'GIP-mediated insulin sensitization',         'clinical',   false),
('tirzepatide',        'nafld',                'hepatic fat and inflammation reduction',      'clinical',   false),

('retatrutide',        'obesity',              'GLP-1/GIP/glucagon triple agonism',          'clinical',   true),
('retatrutide',        'type-2-diabetes',      'triple incretin glucose control',             'clinical',   false),
('retatrutide',        'cancer-support',       'anti-tumor activity, Marathe 2025',          'preclinical', false),
('retatrutide',        'nafld',                'superior hepatic steatosis reduction',        'clinical',   false),
('retatrutide',        'metabolic-syndrome',   'lipid + glucose + weight triple benefit',    'clinical',   false),

('cagrilintide',       'obesity',              'amylin analog, satiety and adiposity',       'clinical',   true),
('cagrilintide',       'metabolic-syndrome',   'adiposity, insulin and lipid benefit',       'clinical',   false),

('glp3-rc',            'obesity',              'GLP-1/2/GCG receptor combination agonism',   'preclinical', true),
('glp3-rc',            'insulin-resistance',   'triple receptor metabolic signaling',        'preclinical', false),

('aod9604',            'obesity',              'GH C-terminus, lipolysis without IGF-1',     'clinical',   true),
('aod9604',            'athletic-performance', 'fat loss without anabolic IGF-1 effect',     'clinical',   false),

('5-amino-1mq',        'obesity',              'NNMT inhibition, fat cell metabolism',       'preclinical', true),
('5-amino-1mq',        'insulin-resistance',   'NNMT/SAM methylation metabolic shift',       'preclinical', false),
('5-amino-1mq',        'sarcopenia',           'muscle fiber regeneration, satellite cells', 'preclinical', false),

-- ── BATCH 31 ──────────────────────────────────────────────────
('hcg',                'male-fertility',       'LH analog, spermatogenesis and T production','clinical',   true),
('hcg',                'hypogonadism',         'testicular T production, testicular volume',  'clinical',  false),

('hmg',                'male-fertility',       'LH+FSH activity, spermatogenesis support',   'clinical',  true),

('kisspeptin',         'male-fertility',       'GnRH pulse trigger, HPG axis activation',    'clinical',  true),
('kisspeptin',         'hypogonadism',         'HPG axis upstream activator',                'clinical',  false),
('kisspeptin',         'low-libido-male',      'central sexual motivation pathway',           'clinical',  false),

('hgh-191aa',          'gh-deficiency',        '191 amino acid somatropin, GH replacement',  'clinical',  true),
('hgh-191aa',          'sarcopenia',           'IGF-1 lean mass and muscle recovery',        'clinical',  false),
('hgh-191aa',          'athletic-performance', 'GH axis performance and recovery',           'clinical',  false),
('hgh-191aa',          'longevity',            'GH decline reversal, body composition',      'clinical',  false),

('igf-1-lr3',          'sarcopenia',           'long-acting IGF-1, systemic muscle anabolism','preclinical',true),
('igf-1-lr3',          'athletic-performance', 'satellite cell activation, hypertrophy',     'preclinical',false),
('igf-1-lr3',          'wound-healing',        'tissue repair IGF-1 signaling',              'preclinical',false),

('nandrolone-decanoate', 'sarcopenia',         'anabolic steroid, lean mass in wasting',     'clinical',  true),
('nandrolone-decanoate', 'osteoporosis',       'AR-driven bone mineral density',             'clinical',  false),
('nandrolone-decanoate', 'joint-pain',         'synovial fluid, collagen II support',         'clinical',  false),

-- ── BATCH 32 — COPPER PEPTIDES / THYMALIN ────────────────────
('ghk-cu',             'wound-healing',        'copper peptide, angiogenesis and collagen',   'clinical',  true),
('ghk-cu',             'hair-loss',            'follicle stem cell activation',               'clinical',  true),
('ghk-cu',             'skin-aging',           'collagen/elastin synthesis stimulation',      'clinical',  false),
('ghk-cu',             'chronic-inflammation', 'TGF-beta, anti-inflammatory remodeling',     'preclinical',false),
('ghk-cu',             'longevity',            'gene expression reset, anti-aging peptide',  'preclinical',false),

('ghk-cu-skin',        'skin-aging',           'topical copper peptide, collagen support',    'clinical',  true),
('ghk-cu-skin',        'wound-healing',        'topical tissue repair application',           'clinical',  false),
('ghk-cu-skin',        'hair-loss',            'scalp copper peptide delivery',               'clinical',  false),

('ll37',               'immune-deficiency',    'cathelicidin AMP, innate immune defense',    'clinical',  true),
('ll37',               'wound-healing',        'antimicrobial, epithelial regeneration',      'clinical',  false),
('ll37',               'eczema-psoriasis',     'skin barrier, antimicrobial peptide',        'preclinical',false),
('ll37',               'chronic-inflammation', 'immune-modulating defensin peptide',         'preclinical',false),

('thymalin',           'immune-deficiency',    'thymic peptide complex, T-cell restoration', 'clinical',  true),
('thymalin',           'longevity',            'thymic involution reversal',                  'clinical',  false),
('thymalin',           'cellular-senescence',  'immune senescence attenuation',               'clinical',  false),

('snap-8',             'skin-aging',           'SNAP-25 inhibitor, expression wrinkle reduction','clinical',true),

-- ── BATCH 33 ──────────────────────────────────────────────────
('glutathione',        'chronic-inflammation', 'master antioxidant, ROS neutralization',      'clinical',  true),
('glutathione',        'liver-health',         'hepatic detoxification, phase II enzyme',     'clinical',  true),
('glutathione',        'immune-deficiency',    'lymphocyte function, NK cell support',        'clinical',  false),
('glutathione',        'nafld',                'hepatic oxidative stress reduction',          'clinical',  false),
('glutathione',        'neuroprotection',      'GSH brain antioxidant defense',               'clinical',  false),

('nad-plus',           'longevity',            'NAD+ direct infusion, sirtuin activation',   'clinical',  true),
('nad-plus',           'neuroprotection',      'brain NAD+ restoration, axon repair',         'clinical',  false),
('nad-plus',           'chronic-fatigue',      'mitochondrial energy restoration',            'clinical',  true),
('nad-plus',           'cardiac-support',      'SIRT3 cardiac mitochondrial protection',     'preclinical',false),
('nad-plus',           'addiction',            'NAD+ neurological repair in recovery',        'clinical',  false),

('vip',                'gut-health',           'vasoactive intestinal peptide, IBD modulation','clinical', true),
('vip',                'autoimmune',           'VIP anti-inflammatory immune regulation',    'clinical',  false),
('vip',                'post-viral',           'pulmonary and systemic VIP restoration',     'preclinical',false),
('vip',                'chronic-inflammation', 'neuropeptide anti-inflammatory signaling',   'clinical',  false),

('dsip',               'insomnia',             'delta sleep inducing peptide, NREM sleep',   'clinical',  true),
('dsip',               'hpa-dysregulation',    'cortisol/ACTH normalization',                'clinical',  false),
('dsip',               'longevity',            'sleep-mediated repair and restoration',       'preclinical',false),

-- ── BATCH 34 ──────────────────────────────────────────────────
('lipo-c',             'obesity',              'lipotropic injection, hepatic fat mobilization','clinical', true),
('lipo-c',             'liver-health',         'choline/methionine/carnitine liver support',  'clinical',  true),
('lipo-c',             'nafld',                'lipotropic hepatic steatosis reduction',      'clinical',  false),

('l-carnitine',        'obesity',              'mitochondrial fatty acid transport, beta-ox', 'clinical',  true),
('l-carnitine',        'athletic-performance', 'fat oxidation, lactate buffering',            'clinical',  false),
('l-carnitine',        'cardiac-support',      'cardiomyocyte energy substrate transport',   'clinical',  false),
('l-carnitine',        'insulin-resistance',   'glucose/lipid metabolic improvement',        'clinical',  false),

('mt-1',               'tanning',              'melanocyte stimulating hormone, pigmentation','clinical',  true),

('mt-2',               'tanning',              'MC1R agonism, melanogenesis',                'clinical',  true),
('mt-2',               'low-libido-male',      'central melanocortin libido pathway',        'clinical',  false),
('mt-2',               'low-libido-female',    'MC4R-mediated sexual desire',                'clinical',  false),
('mt-2',               'erectile-dysfunction', 'central melanocortin erection pathway',      'clinical',  false),

('pt-141',             'low-libido-female',    'MC4R agonism, central arousal and desire',   'clinical',  true),
('pt-141',             'low-libido-male',      'melanocortin sexual motivation pathway',     'clinical',  true),
('pt-141',             'female-sexual-dysfunction','central arousal, lubrication support',    'clinical',  false),
('pt-141',             'erectile-dysfunction', 'MC4R-mediated erection independent of PDE5', 'clinical',  false),

-- ── BATCH 35 — VITAMINS / MINERALS ───────────────────────────
('vitamin-d3',         'immune-deficiency',    'VDR-mediated innate/adaptive immunity',       'clinical',  true),
('vitamin-d3',         'osteoporosis',         'calcium absorption, osteoblast activation',   'clinical',  true),
('vitamin-d3',         'cardiovascular-disease','VDR cardioprotection, blood pressure',       'clinical',  false),
('vitamin-d3',         'depression',           'serotonin synthesis cofactor',               'clinical',  false),
('vitamin-d3',         'autoimmune',           'regulatory T-cell modulation',               'clinical',  false),

('vitamin-k2',         'osteoporosis',         'osteocalcin carboxylation, bone matrix',      'clinical',  true),
('vitamin-k2',         'cardiovascular-disease','MGP carboxylation, arterial calcification',  'clinical',  true),
('vitamin-k2',         'longevity',            'vascular calcification prevention',           'clinical',  false),

('vitamin-c',          'immune-deficiency',    'leukocyte function, antioxidant defense',     'clinical',  true),
('vitamin-c',          'chronic-inflammation', 'antioxidant, pro-resolving immune signal',   'clinical',  false),
('vitamin-c',          'wound-healing',        'collagen hydroxylation, synthesis',           'clinical',  false),
('vitamin-c',          'skin-aging',           'melanin inhibition, collagen synthesis',      'clinical',  false),

('selenium',           'hypothyroidism',       'selenoprotein, T4→T3 deiodinase activity',   'clinical',  true),
('selenium',           'immune-deficiency',    'selenoprotein, NK/T-cell function',           'clinical',  false),
('selenium',           'cancer-support',       'selenoprotein antioxidant, anti-carcinogenic','clinical',  false),

('b-complex-methylated', 'cognitive-decline',  'methylation, homocysteine, myelin support',  'clinical',  true),
('b-complex-methylated', 'depression',         'methylated B6/B12/folate monoamine synthesis','clinical', false),
('b-complex-methylated', 'neuropathy',         'B1/B6/B12 nerve conduction repair',          'clinical',  false),
('b-complex-methylated', 'chronic-fatigue',    'mitochondrial cofactor support',              'clinical',  false),
('b-complex-methylated', 'cardiovascular-disease','homocysteine MTHFR support',              'clinical',  false),

-- ── BATCH 36 — OMEGAS ─────────────────────────────────────────
('omega-3',            'cardiovascular-disease','TG reduction, anti-inflammatory EPA/DHA',    'clinical',  true),
('omega-3',            'dyslipidemia',          'triglyceride reduction, HDL support',        'clinical',  true),
('omega-3',            'chronic-inflammation', 'EPA/DHA resolvin/protectin synthesis',        'clinical',  false),
('omega-3',            'depression',           'EPA anti-inflammatory antidepressant effect', 'clinical',  false),
('omega-3',            'cognitive-decline',    'DHA neuronal membrane integrity',             'clinical',  false),
('omega-3',            'insulin-resistance',   'membrane fluidity, insulin receptor',         'clinical',  false),

('omega-6',            'chronic-inflammation', 'arachidonic acid precursor, complex role',    'clinical',  false),
('omega-6',            'skin-aging',           'linoleic acid skin barrier support',          'clinical',  false),

('omega-7',            'gut-health',           'palmitoleic acid, mucosal support',           'preclinical',false),
('omega-7',            'metabolic-syndrome',   'lipokine, insulin sensitization signal',     'preclinical',false),
('omega-7',            'skin-aging',           'sebum regulation, skin barrier',              'preclinical',false),

('omega-9',            'cardiovascular-disease','oleic acid, endothelial anti-inflammatory', 'clinical',  false),
('omega-9',            'insulin-resistance',   'monounsaturated fat insulin sensitivity',    'clinical',  false),

('vitamin-e',          'skin-aging',           'tocopherol antioxidant, UV protection',       'clinical',  true),
('vitamin-e',          'cardiovascular-disease','antioxidant, LDL oxidation prevention',      'clinical',  false),
('vitamin-e',          'immune-deficiency',    'tocopherol T-cell function support',          'clinical',  false),

-- ── BATCH 37 ──────────────────────────────────────────────────
('boron',              'hypogonadism',         'SHBG reduction, free testosterone elevation', 'clinical',  true),
('boron',              'osteoporosis',         'calcium/magnesium retention, bone density',   'clinical',  false),
('boron',              'cognitive-decline',    'boron brain function, electrophysiology',     'preclinical',false),

('zinc',               'hypogonadism',         'aromatase inhibition, LH support, T synthesis','clinical', true),
('zinc',               'immune-deficiency',    'thymulin, T-cell maturation cofactor',       'clinical',  false),
('zinc',               'wound-healing',        'metalloprotease, collagen synthesis',         'clinical',  false),
('zinc',               'hormonal-acne',        'sebum reduction, antimicrobial, androgen',   'clinical',  false),
('zinc',               'gut-health',           'intestinal barrier integrity',                'clinical',  false),

('vitamin-a',          'skin-aging',           'retinol/retinoic acid collagen, turnover',    'clinical',  true),
('vitamin-a',          'immune-deficiency',    'mucosal immunity, epithelial barrier',        'clinical',  false),
('vitamin-a',          'hair-loss',            'follicle differentiation, keratin support',   'clinical',  false),

('lithium-orotate',    'neuroprotection',      'GSK-3 inhibition, neuroprotective signaling', 'clinical',  true),
('lithium-orotate',    'depression',           'mood stabilization at micro-dose',            'clinical',  false),
('lithium-orotate',    'cognitive-decline',    'tau phosphorylation inhibition',              'preclinical',false),
('lithium-orotate',    'longevity',            'epidemiological longevity association',       'clinical',  false),

('tudca',              'liver-health',         'bile acid chaperone, ER stress reduction',    'clinical',  true),
('tudca',              'nafld',                'hepatic steatosis, ER stress protection',     'clinical',  true),
('tudca',              'gut-health',           'bile acid modulation, mucosal protection',    'clinical',  false),
('tudca',              'neuroprotection',      'ER stress/apoptosis neuronal protection',    'preclinical',false),

-- ── BATCH 38 — AROMATASE INHIBITORS / SERMs ──────────────────
('anastrozole',        'estrogen-dominance',   'aromatase inhibition, estrogen suppression',  'clinical',  true),
('anastrozole',        'hypogonadism',         'TRT adjunct, estrogen control',               'clinical',  false),

('letrozole',          'estrogen-dominance',   'potent aromatase inhibition',                 'clinical',  true),
('letrozole',          'male-fertility',       'FSH elevation via estrogen suppression',      'clinical',  false),

('exemestane',         'estrogen-dominance',   'steroidal irreversible aromatase inhibitor',  'clinical',  true),

('tamoxifen',          'estrogen-dominance',   'SERM, ER antagonism in breast tissue',        'clinical',  true),
('tamoxifen',          'cancer-support',       'ER+ breast cancer prevention/treatment',      'clinical',  true),

('clomiphene',         'male-fertility',       'ER antagonism, LH/FSH elevation, T increase', 'clinical', true),
('clomiphene',         'hypogonadism',         'central ER block, HPG axis stimulation',      'clinical', false),

-- ── BATCH 39 ──────────────────────────────────────────────────
('raloxifene',         'estrogen-dominance',   'SERM, selective ER modulation',               'clinical',  true),
('raloxifene',         'osteoporosis',         'ER bone agonism, bone density preservation',  'clinical',  true),
('raloxifene',         'cancer-support',       'breast ER antagonism, risk reduction',        'clinical',  false),

('enclomiphene',       'hypogonadism',         'pure ER antagonist, LH/FSH/T restoration',   'clinical',  true),
('enclomiphene',       'male-fertility',       'HPG axis restart, fertility preservation',    'clinical',  true),

('cerebrolysin',       'cognitive-decline',    'BDNF/NGF neuropeptide mixture, neuroplasticity','clinical',true),
('cerebrolysin',       'alzheimers',           'neurotrophic peptide mixture, clinical data', 'clinical', true),
('cerebrolysin',       'tbi',                  'neuroregeneration post-TBI',                  'clinical', true),
('cerebrolysin',       'neuroprotection',      'neurotrophic mixture neuroprotection',        'clinical', false),
('cerebrolysin',       'neurodegeneration',    'dopaminergic and cholinergic support',        'clinical', false),

('tadalafil',          'erectile-dysfunction', 'long-acting PDE5 inhibitor, daily use',       'clinical', true),
('tadalafil',          'bph',                  'smooth muscle relaxation, LUTS improvement',  'clinical', true),
('tadalafil',          'cardiovascular-disease','pulmonary arterial hypertension benefit',     'clinical', false),

('sildenafil',         'erectile-dysfunction', 'PDE5 inhibitor, cGMP/NO vasodilation',       'clinical', true),
('sildenafil',         'cardiovascular-disease','pulmonary hypertension, PAH indication',     'clinical', false),
('sildenafil',         'athletic-performance', 'altitude/hypoxia performance research',      'preclinical',false),

-- ── BATCH 40 ──────────────────────────────────────────────────
('cabergoline',        'hypogonadism',         'dopamine agonist, prolactin suppression',     'clinical', true),
('cabergoline',        'neurodegeneration',    'D2 agonism, dopaminergic support',            'clinical', false),
('cabergoline',        'low-libido-male',      'prolactin normalization, libido support',     'clinical', false),

('finasteride',        'hair-loss',            '5-alpha reductase inhibitor, DHT reduction',  'clinical', true),
('finasteride',        'bph',                  '5-alpha reductase, prostate DHT reduction',   'clinical', true),

('ahk-cu',             'hair-loss',            'copper tripeptide, follicle stimulation',     'clinical', true),
('ahk-cu',             'wound-healing',        'copper peptide tissue repair',                'preclinical',false),

('argireline',         'skin-aging',           'SNAP-25 inhibitor, topical botox-like',       'clinical', true),

('matrixyl',           'skin-aging',           'palmitoyl pentapeptide collagen induction',   'clinical', true),

-- ── BATCH 41 ──────────────────────────────────────────────────
('milk-thistle',       'liver-health',         'silymarin, hepatoprotection and repair',       'clinical', true),
('milk-thistle',       'nafld',                'silymarin anti-inflammatory, steatohepatitis', 'clinical', false),

('copper',             'hair-loss',            'tyrosinase cofactor, melanin, follicle',       'clinical', true),
('copper',             'wound-healing',        'lysyl oxidase, collagen cross-linking',        'clinical', false),
('copper',             'immune-deficiency',    'ceruloplasmin, immune enzyme cofactor',        'clinical', false),

('iodine',             'hypothyroidism',       'thyroid hormone synthesis substrate',          'clinical', true),

('inositol',           'pmos',                 'insulin sensitization, FSH signaling',         'clinical', true),
('inositol',           'insulin-resistance',   'glucose transporter, GLUT4 signaling',        'clinical', true),
('inositol',           'anxiety',              'serotonin second messenger, OCD/anxiety',     'clinical', false),
('inositol',           'metabolic-syndrome',   'insulin pathway, lipid metabolism',           'clinical', false),

('boswellia',          'joint-pain',           '5-LOX inhibition, leukotriene reduction',     'clinical', true),
('boswellia',          'chronic-inflammation', 'boswellic acid anti-inflammatory',            'clinical', false),
('boswellia',          'gut-health',           'IBD mucosal anti-inflammatory',               'clinical', false),

-- ── BATCH 42 ──────────────────────────────────────────────────
('synephrine',         'obesity',              'beta-3 adrenergic thermogenesis, lipolysis',  'clinical', true),
('synephrine',         'athletic-performance', 'sympathomimetic energy, fat oxidation',       'clinical', false),

('yohimbine',          'obesity',              'alpha-2 adrenergic antagonism, lipolysis',    'clinical', true),
('yohimbine',          'erectile-dysfunction', 'alpha-2 blockade, penile blood flow',         'clinical', false),
('yohimbine',          'athletic-performance', 'fat-targeted lipolysis, CNS stimulation',    'clinical', false),

-- ── BATCH 43 ──────────────────────────────────────────────────
('mots-c',             'longevity',            'mitochondrial peptide, AMPK/FOXO signaling',  'preclinical',true),
('mots-c',             'insulin-resistance',   'AMPK glucose metabolism, exercise mimetic',   'preclinical',true),
('mots-c',             'athletic-performance', 'mitochondrial biogenesis, stress adaptation', 'preclinical',false),
('mots-c',             'cardiac-support',      'mitochondrial peptide cardioprotection',      'preclinical',false)

) as v(compound_id, condition_slug, mechanism, evidence_strength, is_primary)
join public.conditions c on c.slug = v.condition_slug
where v.mechanism <> 'skip'
on conflict (compound_id, condition_id) do nothing;