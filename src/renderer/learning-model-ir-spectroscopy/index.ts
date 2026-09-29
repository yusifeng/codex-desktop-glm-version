// Infrared-spectroscopy learning model with diagnostic and fingerprint bands.
import "@rchunk/rolldown-runtime";

type MolecularClass = "alkane" | "alcohol" | "ketone" | "carboxylic acid" | "nitrile";
interface IrSpectrumValues { initial_molecular_class?: unknown }
interface AbsorptionBand { center: number; depth: number; width: number }

const irSpectroscopyType = "IR_SPECTROSCOPY";
const irSpectroscopyThumbnail = "ir-spectroscopy-v1";
const irSpectroscopyParameters = { initial_molecular_class: { kind: "enum", defaultValue: "alcohol" as MolecularClass, allowedValues: ["alkane", "alcohol", "ketone", "carboxylic acid", "nitrile"] as MolecularClass[] } };
const irSpectroscopyDefinition = { type: irSpectroscopyType, version: 1, thumbnailAssetKey: irSpectroscopyThumbnail, parameters: irSpectroscopyParameters };
const maximumWavenumber = 4000;
const fingerprintThreshold = 1500;
const molecularClassParameter = irSpectroscopyDefinition.parameters.initial_molecular_class;
const isMolecularClass = (value: unknown): value is MolecularClass => value === "alkane" || value === "alcohol" || value === "ketone" || value === "carboxylic acid" || value === "nitrile";
const molecularClassControl = {
  defaultValue: isMolecularClass(molecularClassParameter.defaultValue) ? molecularClassParameter.defaultValue : "alcohol",
  allowedValues: molecularClassParameter.allowedValues.filter(isMolecularClass),
};
const alkaneStretchBands: AbsorptionBand[] = [{ center: 2960, depth: 20, width: 20 }, { center: 2925, depth: 28, width: 18 }, { center: 2860, depth: 18, width: 21 }];
const diagnosticBands: Record<MolecularClass, AbsorptionBand[]> = {
  alkane: [], alcohol: [{ center: 3370, depth: 70, width: 175 }], ketone: [{ center: 1715, depth: 88, width: 25 }],
  "carboxylic acid": [{ center: 2970, depth: 46, width: 350 }, { center: 1710, depth: 88, width: 27 }], nitrile: [{ center: 2240, depth: 70, width: 19 }],
};
const fingerprintCenters: Record<MolecularClass, number[]> = {
  alkane: [1460, 1375, 1280, 1180, 1120, 1050, 970, 905, 835, 760, 720, 650],
  alcohol: [1450, 1380, 1260, 1185, 1125, 1060, 1020, 945, 880, 810, 740, 670],
  ketone: [1465, 1410, 1360, 1285, 1215, 1160, 1090, 1035, 975, 890, 815, 735],
  "carboxylic acid": [1450, 1400, 1320, 1265, 1210, 1160, 1105, 1030, 960, 875, 795, 710],
  nitrile: [1470, 1415, 1365, 1295, 1220, 1160, 1095, 1025, 955, 880, 810, 735],
};
const buildFingerprintBands = (molecularClass: MolecularClass): AbsorptionBand[] => fingerprintCenters[molecularClass].map((center, index) => ({ center, depth: 18 + (index * 17 + center) % 55, width: 8 + (index * 7 + center) % 17 }));
const absorptionAt = (wavenumber: number, band: AbsorptionBand): number => band.depth * Math.exp(-0.5 * ((wavenumber - band.center) / band.width) ** 2);

function deriveIrSpectrum(values: IrSpectrumValues) {
  const molecularClass = isMolecularClass(values.initial_molecular_class) ? values.initial_molecular_class : molecularClassControl.defaultValue;
  const classDiagnosticBands = diagnosticBands[molecularClass];
  const bands = [...alkaneStretchBands, ...classDiagnosticBands, ...buildFingerprintBands(molecularClass)];
  return {
    molecularClass, bands, diagnosticBands: classDiagnosticBands,
    transmittanceAt: (wavenumber: number): number => {
      const baseline = 96 - 1.4 * Math.sin(wavenumber / 127) - 0.8 * Math.sin(wavenumber / 39);
      const absorption = bands.reduce((total, band) => total + absorptionAt(wavenumber, band), 0);
      return Math.max(2, Math.min(100, baseline - absorption));
    },
  };
}

function initializeIrSpectroscopySchema(): void {}
function initializeIrSpectroscopyModel(): void {}

export {
  initializeIrSpectroscopyModel as a,
  deriveIrSpectrum as i,
  molecularClassControl as n,
  initializeIrSpectroscopySchema as o,
  maximumWavenumber as r,
  irSpectroscopyDefinition as s,
  fingerprintThreshold as t,
};
