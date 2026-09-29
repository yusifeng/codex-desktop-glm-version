// Carbonate-equilibrium approximation for an ocean-acidification teaching model.
import "@rchunk/rolldown-runtime";

interface OceanAcidificationValues { co2Ppm?: number | null }

const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
const normalizeOceanAcidificationValues = (values: OceanAcidificationValues) => ({
  co2Ppm:
    typeof values.co2Ppm === "number" && Number.isFinite(values.co2Ppm)
      ? clamp(values.co2Ppm, 280, 840)
      : 420,
});

const henryCoefficient = 0.0284;
const firstDissociationConstant = 10 ** -5.85;
const secondDissociationConstant = 10 ** -8.96;
const dissolvedCalcium = 416e-6;
const calciumBicarbonateConstant = 10 ** -8.6;
const waterIonProduct = 10 ** -13.22;
const totalAlkalinity = 23e-4;

function solveCarbonateEquilibrium(co2Ppm: number) {
  const dissolved = henryCoefficient * co2Ppm * 1e-6;
  let lowerPh = 6;
  let upperPh = 9;
  for (let iteration = 0; iteration < 56; iteration += 1) {
    const ph = (lowerPh + upperPh) / 2;
    const hydrogen = 10 ** -ph;
    const bicarbonate = firstDissociationConstant * dissolved / hydrogen;
    const carbonate = secondDissociationConstant * bicarbonate / hydrogen;
    const calciumContribution = dissolvedCalcium * calciumBicarbonateConstant / (calciumBicarbonateConstant + hydrogen);
    const hydroxide = waterIonProduct / hydrogen;
    if (bicarbonate + 2 * carbonate + calciumContribution + hydroxide - hydrogen > totalAlkalinity) {
      upperPh = ph;
    } else {
      lowerPh = ph;
    }
  }
  const ph = (lowerPh + upperPh) / 2;
  const hydrogen = 10 ** -ph;
  const bicarbonate = firstDissociationConstant * dissolved / hydrogen;
  return { dissolved, ph, hydrogen, bicarbonate, carbonate: secondDissociationConstant * bicarbonate / hydrogen };
}

const preindustrialBaseline = solveCarbonateEquilibrium(280);

function calculateOceanAcidification(values: OceanAcidificationValues) {
  const normalized = normalizeOceanAcidificationValues(values);
  const equilibrium = solveCarbonateEquilibrium(normalized.co2Ppm);
  return {
    ...normalized,
    fraction: (normalized.co2Ppm - 280) / 560,
    ph: equilibrium.ph,
    dissolvedFactor: equilibrium.dissolved / preindustrialBaseline.dissolved,
    hydrogenFactor: equilibrium.hydrogen / preindustrialBaseline.hydrogen,
    bicarbonateFactor: equilibrium.bicarbonate / preindustrialBaseline.bicarbonate,
    carbonateFactor: equilibrium.carbonate / preindustrialBaseline.carbonate,
  };
}

function initializeOceanAcidificationModel(): void {}

export { initializeOceanAcidificationModel as n, calculateOceanAcidification as t };
