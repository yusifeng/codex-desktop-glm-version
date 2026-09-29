// Hardy-Weinberg-equilibrium learning model.
import "@rchunk/rolldown-runtime";

type Genotype = "AA" | "Aa" | "aa";
interface HardyWeinbergValues { allele_frequency_p?: number | null }

const hardyWeinbergType = "HARDY_WEINBERG_EQUILIBRIUM";
const hardyWeinbergThumbnail = "hardy-weinberg-equilibrium-v2";
const hardyWeinbergFormula = "p^2 + 2pq + q^2 = 1";
const hardyWeinbergParameters = { allele_frequency_p: { kind: "number", defaultValue: 0.5, min: 0, max: 1 } };
const hardyWeinbergDefinition = { type: hardyWeinbergType, version: 2, thumbnailAssetKey: hardyWeinbergThumbnail, canonicalFormula: hardyWeinbergFormula, parameters: hardyWeinbergParameters };
const alleleFrequencyParameter = hardyWeinbergDefinition.parameters.allele_frequency_p;
const alleleFrequencyControl = { defaultValue: alleleFrequencyParameter.defaultValue, min: alleleFrequencyParameter.min, max: alleleFrequencyParameter.max, step: 0.01 };

function normalizeHardyWeinbergValues(values: HardyWeinbergValues) {
  const frequency = values.allele_frequency_p;
  return {
    allele_frequency_p: Number.isFinite(frequency)
      ? Math.min(alleleFrequencyControl.max, Math.max(alleleFrequencyControl.min, frequency ?? alleleFrequencyParameter.defaultValue))
      : alleleFrequencyParameter.defaultValue,
  };
}

function calculateHardyWeinbergEquilibrium(values: HardyWeinbergValues) {
  const normalized = normalizeHardyWeinbergValues(values);
  const p = normalized.allele_frequency_p;
  const q = 1 - p;
  const pq = p * q;
  const aaDominant = p * p;
  const heterozygous = 2 * pq;
  const aaRecessive = q * q;
  return { ...normalized, q, aaDominant, heterozygous, aaRecessive, pq, total: aaDominant + heterozygous + aaRecessive };
}

const buildGenotypeFrequencySeries = (genotype: Genotype) =>
  Array.from({ length: 101 }, (_unused, index) => {
    const p = index / 100;
    const q = 1 - p;
    return { x: p, y: genotype === "AA" ? p * p : genotype === "Aa" ? 2 * p * q : q * q };
  });

function initializeHardyWeinbergSchema(): void {}
function initializeHardyWeinbergModel(): void {}

export {
  normalizeHardyWeinbergValues as a,
  initializeHardyWeinbergModel as i,
  calculateHardyWeinbergEquilibrium as n,
  initializeHardyWeinbergSchema as o,
  buildGenotypeFrequencySeries as r,
  hardyWeinbergDefinition as s,
  alleleFrequencyControl as t,
};
