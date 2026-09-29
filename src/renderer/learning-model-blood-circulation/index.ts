// Pulmonary and systemic blood-circulation pathways.
import "@rchunk/rolldown-runtime";

type Circulation = "pulmonary" | "systemic";
interface BloodCirculationValues { circulation?: unknown }
interface MessageFormatter { formatMessage(descriptor: { id: string; defaultMessage: string }): string }

const bloodCirculationType = "BLOOD_CIRCULATION";
const bloodCirculationThumbnail = "blood-circulation-v2";
const bloodCirculationParameters = { circulation: { kind: "enum" as const, defaultValue: "pulmonary" as Circulation, allowedValues: ["pulmonary", "systemic"] as Circulation[] } };
const bloodCirculationSpecification = { type: bloodCirculationType, version: 2, thumbnailAssetKey: bloodCirculationThumbnail, parameters: bloodCirculationParameters };
const circulationParameter = bloodCirculationSpecification.parameters.circulation;
const circulations = circulationParameter.allowedValues;
const circulationControl = { min: 0, max: circulations.length - 1, step: 1, defaultValue: circulationParameter.defaultValue };
const circulationIndex = (circulation: Circulation): number => Math.max(0, circulations.indexOf(circulation));
const circulationForIndex = (index: number): Circulation => circulations[Math.min(Math.max(Math.round(index), 0), circulations.length - 1)] ?? circulationControl.defaultValue;
const isCirculation = (value: unknown): value is Circulation => circulations.some((circulation) => circulation === value);
const normalizeBloodCirculationValues = (values: BloodCirculationValues) => ({ circulation: isCirculation(values.circulation) ? values.circulation : circulationControl.defaultValue });
const bloodCirculationCaption = (formatter: MessageFormatter, circulation: Circulation): string => circulation === "pulmonary"
  ? formatter.formatMessage({ id: "learningBlock.bloodCirculation.caption.pulmonary", defaultMessage: "Pulmonary circulation carries oxygen-poor blood from the right ventricle to the lungs and returns oxygen-rich blood to the left atrium." })
  : formatter.formatMessage({ id: "learningBlock.bloodCirculation.caption.systemic", defaultMessage: "Systemic circulation carries oxygen-rich blood from the left ventricle to body tissues and returns oxygen-poor blood to the right atrium." });
const bloodCirculationAriaLabel = (formatter: MessageFormatter, circulation: Circulation): string => circulation === "pulmonary"
  ? formatter.formatMessage({ id: "learningBlock.bloodCirculation.visualizationAriaLabel.pulmonary", defaultMessage: "Pulmonary circulation is focused. Blood flows from the right ventricle through the pulmonary arteries to the lungs, then through the pulmonary veins to the left atrium. Blue indicates oxygen-poor blood; red indicates oxygen-rich blood." })
  : formatter.formatMessage({ id: "learningBlock.bloodCirculation.visualizationAriaLabel.systemic", defaultMessage: "Systemic circulation is focused. Blood flows from the left ventricle through the aorta and systemic arteries to body tissues, then through systemic veins and the venae cavae to the right atrium. Blue indicates oxygen-poor blood; red indicates oxygen-rich blood." });

function initializeBloodCirculationSpecification(): void {}
function initializeBloodCirculationModel(): void {}

export { bloodCirculationAriaLabel as a, initializeBloodCirculationSpecification as c, circulationIndex as i, bloodCirculationSpecification as l, bloodCirculationCaption as n, initializeBloodCirculationModel as o, circulationForIndex as r, normalizeBloodCirculationValues as s, circulationControl as t };
