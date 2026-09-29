// Chloroplast overview connecting light reactions and the Calvin cycle.
import "@rchunk/rolldown-runtime";

type PhotosynthesisFocus = "whole process" | "light reactions" | "Calvin cycle";
interface PhotosynthesisValues { initial_focus?: unknown }
interface MessageFormatter { formatMessage(descriptor: { id: string; defaultMessage: string }, values?: Record<string, string>): string }

const photosynthesisSpecification = {
  type: "PHOTOSYNTHESIS_OVERVIEW",
  version: 1,
  thumbnailAssetKey: "photosynthesis-overview-v2",
  canonicalFormula: "6CO_2 + 6H_2O + \\text{light energy} \\rightarrow C_6H_{12}O_6 + 6O_2",
  parameters: { initial_focus: { kind: "enum" as const, defaultValue: "whole process" as PhotosynthesisFocus, allowedValues: ["whole process", "light reactions", "Calvin cycle"] as PhotosynthesisFocus[] } },
};
const focusParameter = photosynthesisSpecification.parameters.initial_focus;
const photosynthesisFocuses = focusParameter.allowedValues;
const focusControl = { min: 0, max: photosynthesisFocuses.length - 1, step: 1, defaultValue: focusParameter.defaultValue };
const photosynthesisFocusIndex = (focus: PhotosynthesisFocus): number => Math.max(0, photosynthesisFocuses.indexOf(focus));
const photosynthesisFocusForIndex = (index: number): PhotosynthesisFocus => photosynthesisFocuses[Math.min(Math.max(Math.round(index), 0), photosynthesisFocuses.length - 1)] ?? focusControl.defaultValue;
const normalizePhotosynthesisValues = (values: PhotosynthesisValues) => ({ initial_focus: typeof values.initial_focus === "string" && photosynthesisFocuses.some((focus) => focus === values.initial_focus) ? values.initial_focus as PhotosynthesisFocus : focusControl.defaultValue });
const photosynthesisCaption = (formatter: MessageFormatter, focus: PhotosynthesisFocus): string => focus === "light reactions"
  ? formatter.formatMessage({ id: "learningBlock.photosynthesisOverview.caption.light", defaultMessage: "Light splits water at the thylakoid, releasing O₂ and loading ATP and NADPH for the Calvin cycle" })
  : focus === "Calvin cycle"
    ? formatter.formatMessage({ id: "learningBlock.photosynthesisOverview.caption.calvin", defaultMessage: "The Calvin cycle fixes CO₂ into G3P using ATP and NADPH, then returns ADP + phosphate and NADP⁺" })
    : formatter.formatMessage({ id: "learningBlock.photosynthesisOverview.caption.whole", defaultMessage: "Light and water power the thylakoid reactions; their energy carriers drive CO₂ fixation into G3P in the stroma" });
const photosynthesisAriaDescription = (formatter: MessageFormatter, focus: PhotosynthesisFocus): string => {
  const focusMessage = focus === "light reactions"
    ? formatter.formatMessage({ id: "learningBlock.photosynthesisOverview.aria.focusLight", defaultMessage: "The light reactions are emphasized." })
    : focus === "Calvin cycle"
      ? formatter.formatMessage({ id: "learningBlock.photosynthesisOverview.aria.focusCalvin", defaultMessage: "The Calvin cycle is emphasized." })
      : formatter.formatMessage({ id: "learningBlock.photosynthesisOverview.aria.focusWhole", defaultMessage: "The whole photosynthesis process is emphasized." });
  return formatter.formatMessage({ id: "learningBlock.photosynthesisOverview.aria.diagram", defaultMessage: "Chloroplast overview. {focus} Light and water enter the thylakoid light reactions and oxygen leaves. ATP and NADPH travel to the Calvin cycle in the stroma; ADP, phosphate, and NADP⁺ return. Carbon dioxide enters the Calvin cycle and three-carbon sugar, G3P, leaves." }, { focus: focusMessage });
};

function initializePhotosynthesisSpecification(): void {}
function initializePhotosynthesisModel(): void {}

export { photosynthesisCaption as a, initializePhotosynthesisSpecification as c, photosynthesisAriaDescription as i, photosynthesisSpecification as l, photosynthesisFocusForIndex as n, initializePhotosynthesisModel as o, photosynthesisFocusIndex as r, normalizePhotosynthesisValues as s, focusControl as t };
