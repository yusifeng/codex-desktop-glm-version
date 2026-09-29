// Electrochemical relationship among standard cell potential, delta G, and equilibrium K.
// Release chunk: app/webview/assets/model-f237c900e681.js.
import "@rchunk/rolldown-runtime";

interface ElectrochemicalValues {
  standard_cell_potential_volts?: number | null; electrons_transferred?: number | null; temperature_kelvin?: number | null;
}
interface ElectrochemicalManifest {
  type: string; version: number; thumbnailAssetKey: string;
  parameters: {
    standard_cell_potential_volts: { kind: "number"; defaultValue: number; min: number; max: number };
    electrons_transferred: { kind: "integer"; defaultValue: number; min: number; max: number };
    temperature_kelvin: { kind: "number"; defaultValue: number; min: number; max: number };
  };
}

let electrochemicalManifest: ElectrochemicalManifest;
let standardPotentialControl: ElectrochemicalManifest["parameters"]["standard_cell_potential_volts"] & { step: number; variable: string; unit: string };
let electronCountControl: ElectrochemicalManifest["parameters"]["electrons_transferred"] & { step: number; variable: string };
let temperatureControl: ElectrochemicalManifest["parameters"]["temperature_kelvin"];
let calculateElectrochemicalRelationship: (values: ElectrochemicalValues) => {
  standard_cell_potential_volts: number; electrons_transferred: number; temperature_kelvin: number;
  deltaGKilojoules: number; lnK: number; log10K: number; regime: "forward" | "reverse" | "balanced";
};
let manifestInitialized = false;
let modelInitialized = false;

function initializeElectrochemicalManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  electrochemicalManifest = {
    type: "DELTA_G_K_E_RELATIONSHIP", version: 2, thumbnailAssetKey: "delta-g-k-e-relationship-v1",
    parameters: {
      standard_cell_potential_volts: { kind: "number", defaultValue: 0.12, min: -0.3, max: 0.3 },
      electrons_transferred: { kind: "integer", defaultValue: 2, min: 1, max: 6 },
      temperature_kelvin: { kind: "number", defaultValue: 298.15, min: 250, max: 400 },
    },
  };
}

function initializeElectrochemicalRelationshipModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializeElectrochemicalManifest();
  const parameters = electrochemicalManifest.parameters;
  standardPotentialControl = {
    ...parameters.standard_cell_potential_volts, step: 0.02,
    variable: String.raw`E^\circ_{\mathrm{cell}}`, unit: "V",
  };
  electronCountControl = { ...parameters.electrons_transferred, step: 1, variable: "n" };
  temperatureControl = parameters.temperature_kelvin;
  const faradayConstant = 96_485.33212;
  const gasConstant = 8.314462618;
  const normalizeFinite = (value: number | null | undefined, fallback: number, minimum: number, maximum: number): number =>
    typeof value === "number" && Number.isFinite(value) ? Math.min(maximum, Math.max(minimum, value)) : fallback;
  calculateElectrochemicalRelationship = values => {
    const standardCellPotential = normalizeFinite(
      values.standard_cell_potential_volts, standardPotentialControl.defaultValue, standardPotentialControl.min, standardPotentialControl.max,
    );
    const electronsTransferred = Math.round(normalizeFinite(
      values.electrons_transferred, electronCountControl.defaultValue, electronCountControl.min, electronCountControl.max,
    ));
    const temperatureKelvin = normalizeFinite(
      values.temperature_kelvin, temperatureControl.defaultValue, temperatureControl.min, temperatureControl.max,
    );
    const deltaGKilojoules = -electronsTransferred * faradayConstant * standardCellPotential / 1_000;
    const lnK = electronsTransferred * faradayConstant * standardCellPotential / (gasConstant * temperatureKelvin);
    const log10K = lnK / Math.LN10;
    return {
      standard_cell_potential_volts: standardCellPotential, electrons_transferred: electronsTransferred, temperature_kelvin: temperatureKelvin,
      deltaGKilojoules: standardCellPotential === 0 ? 0 : deltaGKilojoules,
      lnK: standardCellPotential === 0 ? 0 : lnK, log10K: standardCellPotential === 0 ? 0 : log10K,
      regime: standardCellPotential > 0 ? "forward" : standardCellPotential < 0 ? "reverse" : "balanced",
    };
  };
}

export {
  initializeElectrochemicalRelationshipModel as a, calculateElectrochemicalRelationship as i, standardPotentialControl as n,
  initializeElectrochemicalManifest as o, temperatureControl as r, electrochemicalManifest as s, electronCountControl as t,
};
