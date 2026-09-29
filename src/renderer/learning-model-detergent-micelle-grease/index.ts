// Detergent micelle and grease-removal learning model. Release chunk: model-ee7c309af38a.js.
import "@rchunk/rolldown-runtime";

type MicelleStage = "grease" | "attaching" | "forming" | "dispersed";
interface DetergentValues { relativeDetergentAmountPercent?: number | null }
interface DetergentManifest {
  type: string; version: number; thumbnailAssetKey: string;
  parameters: { relativeDetergentAmountPercent: { kind: "number"; defaultValue: number; min: number; max: number } };
}
interface MessageFormatter { formatMessage(message: { id: string; defaultMessage: string }): string }

let detergentManifest: DetergentManifest;
let detergentAmountControl: { min: number; max: number; step: number; defaultValue: number };
let normalizeDetergentValues: (values: DetergentValues) => { relativeDetergentAmountPercent: number };
let calculateMicelleState: (values: DetergentValues) => {
  concentration: number; stage: MicelleStage; moleculeCount: number; freeMoleculeCount: number; centerY: number;
  greaseRadiusX: number; greaseRadiusY: number; liftProgress: number; dispersionProgress: number;
};
let localizedMicelleStageTitle: (stage: MicelleStage, formatter: MessageFormatter) => string;
let manifestInitialized = false;
let modelInitialized = false;

function initializeDetergentManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  detergentManifest = {
    type: "DETERGENT_MICELLE_GREASE", version: 2, thumbnailAssetKey: "detergent-micelle-grease-v2",
    parameters: { relativeDetergentAmountPercent: { kind: "number", defaultValue: 40, min: 0, max: 100 } },
  };
}

function initializeDetergentMicelleGreaseModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializeDetergentManifest();
  detergentAmountControl = {
    min: detergentManifest.parameters.relativeDetergentAmountPercent.min,
    max: detergentManifest.parameters.relativeDetergentAmountPercent.max, step: 5,
    defaultValue: detergentManifest.parameters.relativeDetergentAmountPercent.defaultValue,
  };
  const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
  const progressBetween = (value: number, start: number, end: number): number => clamp((value - start) / (end - start), 0, 1);
  normalizeDetergentValues = values => ({
    relativeDetergentAmountPercent: clamp(
      typeof values.relativeDetergentAmountPercent === "number" && Number.isFinite(values.relativeDetergentAmountPercent)
        ? Number(values.relativeDetergentAmountPercent)
        : detergentAmountControl.defaultValue,
      detergentAmountControl.min, detergentAmountControl.max,
    ),
  });
  const stageFor = (concentration: number): MicelleStage => concentration < 25 ? "grease" : concentration < 55 ? "attaching" : concentration < 80 ? "forming" : "dispersed";
  calculateMicelleState = values => {
    const { relativeDetergentAmountPercent: concentration } = normalizeDetergentValues(values);
    const liftProgress = progressBetween(concentration, 50, 80);
    const dispersionProgress = progressBetween(concentration, 80, 100);
    const moleculeStep = clamp(Math.floor(concentration / 12.5), 0, 7);
    return {
      concentration, stage: stageFor(concentration),
      moleculeCount: concentration === 0 ? 0 : concentration >= 80 ? 16 : 1 + moleculeStep * 2,
      freeMoleculeCount: clamp(Math.floor(concentration / 25) * 2, 0, 4),
      centerY: 240 - 64 * liftProgress, greaseRadiusX: 56 - 16 * liftProgress, greaseRadiusY: 24 + 16 * liftProgress,
      liftProgress, dispersionProgress,
    };
  };
  localizedMicelleStageTitle = (stage, formatter) => {
    switch (stage) {
      case "grease": return formatter.formatMessage({ id: "learningBlock.detergentMicelleGrease.stage.grease.title", defaultMessage: "Grease remains on the surface" });
      case "attaching": return formatter.formatMessage({ id: "learningBlock.detergentMicelleGrease.stage.attaching.title", defaultMessage: "Hydrophobic tails enter the grease" });
      case "forming": return formatter.formatMessage({ id: "learningBlock.detergentMicelleGrease.stage.forming.title", defaultMessage: "Surfactant surrounds the grease" });
      case "dispersed": return formatter.formatMessage({ id: "learningBlock.detergentMicelleGrease.stage.dispersed.title", defaultMessage: "A grease-filled micelle is suspended" });
    }
  };
}

export {
  normalizeDetergentValues as a, initializeDetergentMicelleGreaseModel as i, calculateMicelleState as n,
  initializeDetergentManifest as o, localizedMicelleStageTitle as r, detergentManifest as s, detergentAmountControl as t,
};
