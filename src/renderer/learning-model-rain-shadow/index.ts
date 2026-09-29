// Sequential physical stages that create a mountain rain shadow.
import "@rchunk/rolldown-runtime";

type RainShadowStage = "moist-air-rises" | "clouds-form" | "rain-falls" | "dry-air-descends";
interface RainShadowValues { stageIndex?: number | null }
interface OptionalMessageFormatter { formatMessage(descriptor: { id: string; defaultMessage: string }): string }

const rainShadowStages: RainShadowStage[] = ["moist-air-rises", "clouds-form", "rain-falls", "dry-air-descends"];
const stageIndexControl = { min: 0, max: 3, step: 1, defaultValue: 0 };
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const normalizeRainShadowValues = (values: RainShadowValues) => ({
  stageIndex: clamp(typeof values.stageIndex === "number" && Number.isFinite(values.stageIndex) ? Math.round(values.stageIndex) : stageIndexControl.defaultValue, stageIndexControl.min, stageIndexControl.max),
});
const currentRainShadowStage = (values: RainShadowValues): RainShadowStage => rainShadowStages[normalizeRainShadowValues(values).stageIndex] ?? rainShadowStages[0];
const formatOptional = (formatter: OptionalMessageFormatter | undefined, id: string, defaultMessage: string): string => formatter ? formatter.formatMessage({ id, defaultMessage }) : defaultMessage;
const rainShadowStageTitle = (stage: RainShadowStage, formatter?: OptionalMessageFormatter): string => {
  switch (stage) {
    case "moist-air-rises": return formatOptional(formatter, "learningBlock.rainShadow.stage.moistAirRises.title", "Moist air rises");
    case "clouds-form": return formatOptional(formatter, "learningBlock.rainShadow.stage.cloudsForm.title", "Clouds form");
    case "rain-falls": return formatOptional(formatter, "learningBlock.rainShadow.stage.rainFalls.title", "Rain falls");
    case "dry-air-descends": return formatOptional(formatter, "learningBlock.rainShadow.stage.dryAirDescends.title", "Dry air descends");
  }
};
const rainShadowCaption = (values: RainShadowValues, formatter?: OptionalMessageFormatter): string => {
  switch (currentRainShadowStage(values)) {
    case "moist-air-rises": return formatOptional(formatter, "learningBlock.rainShadow.stage.moistAirRises.caption", "Moist ocean air rises up the windward slope.");
    case "clouds-form": return formatOptional(formatter, "learningBlock.rainShadow.stage.cloudsForm.caption", "Rising air cools and condenses into clouds.");
    case "rain-falls": return formatOptional(formatter, "learningBlock.rainShadow.stage.rainFalls.caption", "Rain falls on the windward slope, drying the air.");
    case "dry-air-descends": return formatOptional(formatter, "learningBlock.rainShadow.stage.dryAirDescends.caption", "Descending dry air warms, creating a rain shadow.");
  }
};

function initializeRainShadowModel(): void {}

export { rainShadowStageTitle as a, rainShadowCaption as i, stageIndexControl as n, initializeRainShadowModel as o, currentRainShadowStage as r, normalizeRainShadowValues as s, rainShadowStages as t };
