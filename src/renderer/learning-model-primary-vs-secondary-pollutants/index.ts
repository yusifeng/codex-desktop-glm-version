// Primary emissions and pathways that form secondary air pollutants.
import "@rchunk/rolldown-runtime";

type PollutantPathway = "photochemical-smog" | "secondary-particles";
interface PollutantValues { initial_pathway?: unknown }
interface MessageFormatter { formatMessage(descriptor: { id: string; defaultMessage: string }): string }

const pollutantsType = "PRIMARY_VS_SECONDARY_POLLUTANTS";
const pollutantsThumbnail = "primary-vs-secondary-pollutants-v3";
const pollutantsParameters = { initial_pathway: { kind: "enum" as const, defaultValue: "photochemical-smog" as PollutantPathway, allowedValues: ["photochemical-smog", "secondary-particles"] as PollutantPathway[] } };
const pollutantsSpecification = { type: pollutantsType, version: 3, thumbnailAssetKey: pollutantsThumbnail, parameters: pollutantsParameters };
const pathwayParameter = pollutantsSpecification.parameters.initial_pathway;
const pathways = pathwayParameter.allowedValues;
const pathwayControl = { min: 0, max: pathways.length - 1, step: 1, defaultValue: pathwayParameter.defaultValue };
const pathwayIndex = (pathway: PollutantPathway): number => Math.max(0, pathways.indexOf(pathway));
const pathwayForIndex = (index: number): PollutantPathway => pathways[Math.min(Math.max(Math.round(index), 0), pathways.length - 1)] ?? pathwayControl.defaultValue;
const isPollutantPathway = (value: unknown): value is PollutantPathway => pathways.some((pathway) => pathway === value);
const normalizePollutantValues = (values: PollutantValues) => ({ initial_pathway: isPollutantPathway(values.initial_pathway) ? values.initial_pathway : pathwayControl.defaultValue });
const pollutantCaption = (formatter: MessageFormatter, pathway: PollutantPathway): string => pathway === "photochemical-smog"
  ? formatter.formatMessage({ id: "learningBlock.primaryVsSecondaryPollutants.caption.smog", defaultMessage: "Nitrogen oxides and VOCs are emitted first; sunlight helps form ground-level ozone later" })
  : formatter.formatMessage({ id: "learningBlock.primaryVsSecondaryPollutants.caption.particles", defaultMessage: "Emitted gases form secondary particles; some particles are emitted directly" });
const pollutantAriaLabel = (formatter: MessageFormatter, pathway: PollutantPathway): string => pathway === "photochemical-smog"
  ? formatter.formatMessage({ id: "learningBlock.primaryVsSecondaryPollutants.visualizationAria.smog", defaultMessage: "Natural, stationary, and mobile sources emit primary pollutants. The highlighted nitrogen oxides and volatile organic compounds react in sunlight to form ground-level ozone, a secondary pollutant. Carbon monoxide, sulfur dioxide, and directly emitted particles remain examples of primary pollution." })
  : formatter.formatMessage({ id: "learningBlock.primaryVsSecondaryPollutants.visualizationAria.particles", defaultMessage: "Natural, stationary, and mobile sources emit primary pollutants. The highlighted sulfur dioxide, nitrogen oxides, and volatile organic compounds undergo atmospheric reactions that form sulfate, nitrate, and organic particles, which are secondary pollutants. Some particles are also emitted directly." });

function initializePollutantsSpecification(): void {}
function initializePollutantsModel(): void {}

export { pollutantAriaLabel as a, initializePollutantsSpecification as c, pollutantCaption as i, pollutantsSpecification as l, pathwayForIndex as n, initializePollutantsModel as o, pathwayIndex as r, normalizePollutantValues as s, pathwayControl as t };
