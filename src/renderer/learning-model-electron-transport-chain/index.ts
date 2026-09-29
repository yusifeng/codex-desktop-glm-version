// Stages of oxidative phosphorylation in the electron transport chain.
import "@rchunk/rolldown-runtime";

interface ElectronTransportValues { stageIndex?: number | null }

const electronTransportStages = ["location", "electronEntry", "protonPumping", "oxygenReduction", "protonGradient", "atpSynthesis"];
const electronTransportStageControl = { min: 0, max: 5, step: 1, defaultValue: 0, thumbnailDefaultValue: 5 };
const electronTransportStageCount = electronTransportStageControl.max - electronTransportStageControl.min + 1;
const normalizeStageIndex = (value: number | null | undefined): number =>
  Number.isFinite(value)
    ? Math.min(Math.max(Math.round(value ?? electronTransportStageControl.defaultValue), electronTransportStageControl.min), electronTransportStageControl.max)
    : electronTransportStageControl.defaultValue;
const normalizeElectronTransportValues = (values: ElectronTransportValues) => ({ stageIndex: normalizeStageIndex(values.stageIndex ?? electronTransportStageControl.defaultValue) });
const calculateElectronTransportStage = (values: ElectronTransportValues) => {
  const safeValues = normalizeElectronTransportValues(values);
  const stage = electronTransportStages[safeValues.stageIndex];
  return {
    safeValues, stage, stageNumber: safeValues.stageIndex + 1,
    focus: stage === "location" ? "membrane" : stage === "electronEntry" ? "electronDonors" : stage === "protonPumping" ? "protonPumps" : stage === "oxygenReduction" ? "oxygen" : stage === "protonGradient" ? "gradient" : "atpSynthase",
    animation: stage === "location" || stage === "protonGradient" ? "none" : stage,
    highlightLocation: stage === "location", showElectronEntry: safeValues.stageIndex >= 1, showFullElectronPath: safeValues.stageIndex >= 2,
    showPumps: safeValues.stageIndex >= 2, showWaterFormation: safeValues.stageIndex >= 3, showGradient: safeValues.stageIndex >= 4, showAtpSynthesis: safeValues.stageIndex >= 5,
    upperProtonCount: safeValues.stageIndex < 2 ? 2 : safeValues.stageIndex === 2 ? 6 : safeValues.stageIndex === 3 ? 7 : 9,
  };
};

function initializeElectronTransportChainModel(): void {}

export { normalizeElectronTransportValues as a, initializeElectronTransportChainModel as i, electronTransportStageControl as n, calculateElectronTransportStage as r, electronTransportStageCount as t };
