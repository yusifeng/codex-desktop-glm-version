// Meiosis nondisjunction phase-sequence learning model.
import "@rchunk/rolldown-runtime";

type ErrorDivision = "meiosis-one" | "meiosis-two";
interface MeiosisValues { errorDivision?: string | null; phaseIndex?: number | null }
interface MessageFormatter { formatMessage(descriptor: { id: string; defaultMessage: string }, values?: Record<string, string>): string }

const meiosisType = "MEIOSIS_NONDISJUNCTION";
const meiosisParameters = { errorDivision: { kind: "enum", defaultValue: "meiosis-one" as ErrorDivision, allowedValues: ["meiosis-one", "meiosis-two"] as ErrorDivision[] } };
const meiosisDefinition = { type: meiosisType, version: 1, parameters: meiosisParameters };
const meiosisPhases = ["interphase", "prophase-one", "metaphase-one", "anaphase-one", "telophase-one", "prophase-two", "metaphase-two", "anaphase-two", "gamete-outcome"];
const phaseIndexes: Record<ErrorDivision, number[]> = { "meiosis-one": [0, 1, 2, 3, 8], "meiosis-two": [0, 1, 2, 3, 4, 5, 6, 7, 8] };
const errorDivisionParameter = meiosisDefinition.parameters.errorDivision;
const phaseControl = { min: 0, max: 8, defaultValue: 3 };
const defaultMeiosisValues = { errorDivision: errorDivisionParameter.defaultValue, phaseIndex: phaseControl.defaultValue };
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const normalizeInteger = (value: number | null | undefined, control: typeof phaseControl): number => clamp(Number.isFinite(value) ? Math.round(value as number) : control.defaultValue, control.min, control.max);
const normalizeMeiosisValues = (values: MeiosisValues) => ({ errorDivision: errorDivisionParameter.allowedValues.includes(values.errorDivision as ErrorDivision) ? values.errorDivision as ErrorDivision : defaultMeiosisValues.errorDivision, phaseIndex: normalizeInteger(values.phaseIndex, phaseControl) });
const resolveMeiosisPhaseIndex = (values: MeiosisValues): number => { const normalized = normalizeMeiosisValues(values); const allowed = phaseIndexes[normalized.errorDivision]; return allowed.includes(normalized.phaseIndex) ? normalized.phaseIndex : allowed[allowed.length - 1]; };
const formatDivision = (formatter: MessageFormatter, division: ErrorDivision): string => division === "meiosis-one" ? formatter.formatMessage({ id: "learningBlock.meiosisNondisjunction.division.meiosisOne", defaultMessage: "Meiosis I" }) : formatter.formatMessage({ id: "learningBlock.meiosisNondisjunction.division.meiosisTwo", defaultMessage: "Meiosis II" });
const phaseMessages = [
  ["learningBlock.meiosisNondisjunction.phase.interphase", "Interphase"], ["learningBlock.meiosisNondisjunction.phase.prophaseOne", "Prophase I"], ["learningBlock.meiosisNondisjunction.phase.metaphaseOne", "Metaphase I"], ["learningBlock.meiosisNondisjunction.phase.anaphaseOne", "Anaphase I"], ["learningBlock.meiosisNondisjunction.phase.telophaseOne", "Telophase I + Cytokinesis"], ["learningBlock.meiosisNondisjunction.phase.prophaseTwo", "Prophase II"], ["learningBlock.meiosisNondisjunction.phase.metaphaseTwo", "Metaphase II"], ["learningBlock.meiosisNondisjunction.phase.anaphaseTwo", "Anaphase II"], ["learningBlock.meiosisNondisjunction.phase.gameteOutcome", "Gamete outcome"],
] as const;
const formatPhase = (formatter: MessageFormatter, phaseIndex: number): string => { const message = phaseMessages[phaseIndex]; return message ? formatter.formatMessage({ id: message[0], defaultMessage: message[1] }) : ""; };
function initializeMeiosisSchema(): void {}
function initializeMeiosisModel(): void {}
export { formatPhase as a, initializeMeiosisSchema as c, formatDivision as i, meiosisDefinition as l, phaseIndexes as n, initializeMeiosisModel as o, resolveMeiosisPhaseIndex as r, normalizeMeiosisValues as s, defaultMeiosisValues as t };
