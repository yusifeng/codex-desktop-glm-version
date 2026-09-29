// Two-dice sample-space-grid learning model. Release chunk: model-f4dbaa3dfc38.js.
import "@rchunk/rolldown-runtime";

type SampleEvent = "sum equals 5" | "sum equals 7" | "sum at least 10" | "matching values";
interface SampleSpaceValues { event?: string | null }
interface SampleOutcome { firstDie: number; secondDie: number; sum: number; favorable: boolean }
interface SampleSpaceManifest {
  type: string; version: number; thumbnailAssetKey: string;
  parameters: { event: { kind: "enum"; defaultValue: SampleEvent; allowedValues: SampleEvent[] } };
}

let sampleSpaceManifest: SampleSpaceManifest;
let defaultSampleSpaceValues: { event: SampleEvent };
let sampleEvents: SampleEvent[];
let calculateSampleSpace: (values: SampleSpaceValues) => {
  event: SampleEvent; outcomes: SampleOutcome[]; favorableCount: number; totalCount: number;
  simplifiedNumerator: number; simplifiedDenominator: number;
};
let manifestInitialized = false;
let modelInitialized = false;

function initializeSampleSpaceManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  sampleSpaceManifest = {
    type: "SAMPLE_SPACE_GRID", version: 2, thumbnailAssetKey: "sample-space-grid-v1",
    parameters: {
      event: {
        kind: "enum", defaultValue: "sum equals 7",
        allowedValues: ["sum equals 5", "sum equals 7", "sum at least 10", "matching values"],
      },
    },
  };
}

function initializeSampleSpaceGridModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializeSampleSpaceManifest();
  const isSampleEvent = (value: unknown): value is SampleEvent =>
    typeof value === "string" && sampleSpaceManifest.parameters.event.allowedValues.some(event => event === value);
  const defaultEvent = sampleSpaceManifest.parameters.event.defaultValue;
  if (!isSampleEvent(defaultEvent)) throw Error("Invalid default event in sample-space grid manifest");
  sampleEvents = sampleSpaceManifest.parameters.event.allowedValues.filter(isSampleEvent);
  defaultSampleSpaceValues = { event: defaultEvent };
  const isFavorable = (event: SampleEvent, firstDie: number, secondDie: number): boolean => {
    switch (event) {
      case "sum equals 5": return firstDie + secondDie === 5;
      case "sum equals 7": return firstDie + secondDie === 7;
      case "sum at least 10": return firstDie + secondDie >= 10;
      case "matching values": return firstDie === secondDie;
    }
  };
  const greatestCommonDivisor = (left: number, right: number): number => {
    let dividend = left;
    let divisor = right;
    while (divisor !== 0) [dividend, divisor] = [divisor, dividend % divisor];
    return dividend;
  };
  calculateSampleSpace = values => {
    const event = isSampleEvent(values.event) ? values.event : defaultSampleSpaceValues.event;
    const outcomes = Array.from({ length: 36 }, (_unused, index): SampleOutcome => {
      const firstDie = Math.floor(index / 6) + 1;
      const secondDie = index % 6 + 1;
      return { firstDie, secondDie, sum: firstDie + secondDie, favorable: isFavorable(event, firstDie, secondDie) };
    });
    const favorableCount = outcomes.filter(outcome => outcome.favorable).length;
    const totalCount = outcomes.length;
    const divisor = greatestCommonDivisor(favorableCount, totalCount);
    return {
      event, outcomes, favorableCount, totalCount,
      simplifiedNumerator: favorableCount / divisor, simplifiedDenominator: totalCount / divisor,
    };
  };
}

export {
  initializeSampleSpaceManifest as a, calculateSampleSpace as i, defaultSampleSpaceValues as n,
  sampleSpaceManifest as o, initializeSampleSpaceGridModel as r, sampleEvents as t,
};
