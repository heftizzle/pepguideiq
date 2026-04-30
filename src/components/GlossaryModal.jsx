import { Modal } from "./Modal.jsx";

/** @type {{ term: string; body: string }[]} */
const GLOSSARY_ENTRIES = [
  {
    term: "BAC Water (Bacteriostatic Water)",
    body:
      "Sterile water containing 0.9% benzyl alcohol. The benzyl alcohol prevents bacterial growth, giving an opened vial a shelf life of 28 days. Used to reconstitute lyophilized (freeze-dried) peptides. Do not substitute with tap water or saline.",
  },
  {
    term: "Sterile Water",
    body:
      "Pure water with no additives. No preservative — once opened, use immediately or discard. Some peptides (especially those irritating with BAC water) are reconstituted with sterile water instead.",
  },
  {
    term: "Reconstitution",
    body:
      "The process of adding BAC or sterile water to a freeze-dried peptide powder to create an injectable solution. Inject water slowly down the side of the vial — never directly onto the powder. Swirl gently, never shake.",
  },
  {
    term: "mcg (Microgram)",
    body:
      "One one-thousandth of a milligram (mg). Most peptides are dosed in mcg. Example: 300mcg BPC-157. Getting this wrong by a factor of 1000 is one of the most common beginner errors.",
  },
  {
    term: "mg (Milligram)",
    body:
      "One one-thousandth of a gram. Some compounds (Metformin, Bromantane) are dosed in mg. Always confirm your unit before calculating dose.",
  },
  {
    term: "IU (International Unit)",
    body:
      "A unit of biological activity — not a weight. Used for HGH and some vitamins. Cannot be converted to mg without knowing the specific compound. Example: 2 IU HGH ≠ 2mg HGH.",
  },
  {
    term: "Half-Life",
    body:
      "The time it takes for 50% of a compound to be cleared from your system. Determines dosing frequency. Short half-life = more frequent dosing. Example: BPC-157 has a short half-life — twice daily dosing maximizes effect.",
  },
  {
    term: "SubQ (Subcutaneous)",
    body:
      "Injection into the fatty layer just beneath the skin. Pinch skin, insert needle at 45°. Slower absorption than IM. Most peptides are administered SubQ.",
  },
  {
    term: "IM (Intramuscular)",
    body:
      "Injection directly into muscle tissue. Faster absorption than SubQ. Used for compounds like testosterone cypionate and some peptides (Semax IM produces stronger CNS effect than SubQ).",
  },
  {
    term: "Bioavailability",
    body:
      "The percentage of a compound that actually reaches systemic circulation. Injectable = near 100%. Oral peptides are largely destroyed by digestion — why most peptides must be injected.",
  },
  {
    term: "Titration",
    body:
      "Starting at a low dose and gradually increasing to assess tolerance and find your effective dose. Standard practice with GLP-1 agonists (Retatrutide, Semaglutide) to minimize GI side effects.",
  },
  {
    term: "Loading Dose",
    body:
      "A higher initial dose used to saturate receptors or tissue faster. Some protocols use a loading phase followed by a maintenance dose. Not universally applicable — compound specific.",
  },
  {
    term: "Lyophilized",
    body:
      "Freeze-dried. The standard form peptides are shipped in — a powder or cake in a sealed vial. Stable at room temperature for extended periods. Requires reconstitution before use.",
  },
  {
    term: "GLP-1 (Glucagon-Like Peptide-1)",
    body:
      "An incretin hormone that regulates blood sugar, slows gastric emptying, and suppresses appetite. GLP-1 receptor agonists (Retatrutide, Semaglutide, Tirzepatide) mimic this effect and are used for metabolic health and body composition.",
  },
  {
    term: "GH Peptide (Growth Hormone Peptide)",
    body:
      "A class of peptides that stimulate the pituitary to produce and release growth hormone. Examples: Ipamorelin, CJC-1295, GHRP-2. Different mechanism than injecting exogenous HGH directly.",
  },
  {
    term: "Bioregulator",
    body:
      "Short-chain peptides (2–4 amino acids) that regulate gene expression in specific tissues. Examples: Epitalon (pineal), Thymalin (thymus). Associated with longevity research. Often cycled rather than used continuously.",
  },
  {
    term: "Receptor Downregulation",
    body:
      "The body reducing the number or sensitivity of receptors in response to prolonged stimulation. Reason why cycling compounds matters — continuous use can blunt effect over time.",
  },
  {
    term: "Peptide Bond",
    body:
      "The chemical link between amino acids that forms a peptide chain. What makes peptides susceptible to digestion — stomach acid and enzymes cleave these bonds, destroying oral bioavailability.",
  },
];

const detailStyle = {
  borderBottom: "1px solid var(--color-border-hairline)",
  paddingBottom: 10,
  marginBottom: 10,
};

/** @param {{ onClose: () => void }} props */
export function GlossaryModal({ onClose }) {
  return (
    <Modal onClose={onClose} maxWidth={560} label="Peptide glossary">
      <div style={{ marginBottom: 16 }}>
        <div className="brand" style={{ fontSize: 18, fontWeight: 700, color: "var(--color-accent)", marginBottom: 6 }}>
          Peptide glossary
        </div>
        <div style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
          Quick definitions for common peptide terms. Educational reference only — not medical advice.
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {GLOSSARY_ENTRIES.map(({ term, body }) => (
          <details key={term} style={detailStyle}>
            <summary
              style={{
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
                color: "var(--color-text-primary)",
                lineHeight: 1.4,
                minHeight: 44,
                display: "flex",
                alignItems: "center",
              }}
            >
              {term}
            </summary>
            <p style={{ marginTop: 10, marginBottom: 0, fontSize: 14, lineHeight: 1.55, color: "var(--color-text-secondary)" }}>
              {body}
            </p>
          </details>
        ))}
      </div>
    </Modal>
  );
}
