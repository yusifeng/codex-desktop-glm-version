// Carbon-cycle pathway selection and accessible-description learning model.
import "@rchunk/rolldown-runtime";

type CarbonPathway = "biological cycle" | "ocean exchange" | "long-term storage and combustion";
type BurningMode = "ordinary cycling" | "increased fossil-fuel burning";
interface CarbonCycleValues { initial_pathway?: string | null; burning?: string | null }
interface MessageFormatter { formatMessage(descriptor: { id: string; defaultMessage: string }, values?: Record<string, string>): string }

const carbonCycleType = "CARBON_CYCLE"; const carbonCycleThumbnail = "carbon-cycle-v3";
const carbonCycleParameters = { initial_pathway: { kind: "enum", defaultValue: "biological cycle" as CarbonPathway, allowedValues: ["biological cycle", "ocean exchange", "long-term storage and combustion"] as CarbonPathway[] } };
const carbonCycleDefinition = { type: carbonCycleType, version: 2, thumbnailAssetKey: carbonCycleThumbnail, parameters: carbonCycleParameters };
const carbonPathways = carbonCycleDefinition.parameters.initial_pathway.allowedValues; const defaultCarbonPathway = carbonCycleDefinition.parameters.initial_pathway.defaultValue;
const normalizeCarbonCycleValues = (values: CarbonCycleValues) => ({ initial_pathway: carbonPathways.includes(values.initial_pathway as CarbonPathway) ? values.initial_pathway as CarbonPathway : defaultCarbonPathway, burning: values.burning === "increased fossil-fuel burning" ? "increased fossil-fuel burning" as BurningMode : "ordinary cycling" as BurningMode });
const carbonPathwayToIndex = (pathway: CarbonPathway): number => Math.max(0, carbonPathways.indexOf(pathway));
const indexToCarbonPathway = (index: number): CarbonPathway => carbonPathways[Math.min(Math.max(Math.round(index), 0), carbonPathways.length - 1)] ?? defaultCarbonPathway;
const formatCarbonCaption = (formatter: MessageFormatter, values: ReturnType<typeof normalizeCarbonCycleValues>): string => values.burning === "increased fossil-fuel burning" ? formatter.formatMessage({ id: "learningBlock.carbonCycle.caption.increasedBurning", defaultMessage: "Faster combustion adds carbon dioxide faster than natural uptake can remove it" }) : values.initial_pathway === "ocean exchange" ? formatter.formatMessage({ id: "learningBlock.carbonCycle.caption.ocean", defaultMessage: "Carbon dioxide moves both into and out of the ocean" }) : values.initial_pathway === "long-term storage and combustion" ? formatter.formatMessage({ id: "learningBlock.carbonCycle.caption.longTerm", defaultMessage: "Slow burial stores carbon underground; combustion returns it to the atmosphere" }) : formatter.formatMessage({ id: "learningBlock.carbonCycle.caption.biological", defaultMessage: "Carbon moves from air to plants, animals, and soil, then returns to the air" });
const formatCarbonAriaLabel = (formatter: MessageFormatter, values: ReturnType<typeof normalizeCarbonCycleValues>, thumbnail: boolean): string => {
  const pathway = values.initial_pathway === "ocean exchange" ? formatter.formatMessage({ id: "learningBlock.carbonCycle.aria.pathway.ocean", defaultMessage: "Ocean exchange" }) : values.initial_pathway === "long-term storage and combustion" ? formatter.formatMessage({ id: "learningBlock.carbonCycle.aria.pathway.longTerm", defaultMessage: "Long-term storage and combustion" }) : formatter.formatMessage({ id: "learningBlock.carbonCycle.aria.pathway.biological", defaultMessage: "Biological cycle" });
  const burning = values.burning === "increased fossil-fuel burning" ? formatter.formatMessage({ id: "learningBlock.carbonCycle.aria.burning.increased", defaultMessage: "Increased burning adds carbon dioxide to the atmosphere." }) : formatter.formatMessage({ id: "learningBlock.carbonCycle.aria.burning.ordinary", defaultMessage: "Ordinary cycling is shown." });
  const thumbnailText = thumbnail ? formatter.formatMessage({ id: "learningBlock.carbonCycle.aria.thumbnail", defaultMessage: "This is a static thumbnail." }) : "";
  return formatter.formatMessage({ id: "learningBlock.carbonCycle.visualizationAriaLabel", defaultMessage: "Carbon-cycle landscape showing atmosphere, plants and animals, dead organic matter and soil, ocean, and fossil fuels or rock. {pathway} is emphasized. Photosynthesis takes carbon from the atmosphere; feeding and death move it through living things and soil; respiration and decomposition return it. The ocean exchanges carbon dioxide in both directions. Burial stores some carbon slowly and combustion returns it quickly. {burning} {thumbnail}" }, { pathway, burning, thumbnail: thumbnailText });
};
function initializeCarbonCycleSchema(): void {}
function initializeCarbonCycleModel(): void {}
export { carbonPathwayToIndex as a, initializeCarbonCycleSchema as c, indexToCarbonPathway as i, carbonCycleDefinition as l, formatCarbonAriaLabel as n, initializeCarbonCycleModel as o, formatCarbonCaption as r, normalizeCarbonCycleValues as s, defaultCarbonPathway as t };
