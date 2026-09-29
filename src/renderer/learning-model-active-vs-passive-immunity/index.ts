// Active-versus-passive immunity learning model. Release chunk: model-c57d1e222f54.js.
import "@rchunk/rolldown-runtime";

type ImmunityExample = "infection-and-recovery" | "vaccination" | "maternal-antibodies" | "immune-globulin";
type Acquisition = "natural" | "artificial";
type ImmuneResponse = "active" | "passive";
interface ImmunityValues { initial_example?: string | null; stage?: number | null }
interface ImmunityCase { example: ImmunityExample; acquisition: Acquisition; response: ImmuneResponse }
interface ImmunityManifest {
  type: string; version: number; thumbnailAssetKey: string;
  parameters: { initial_example: { kind: "enum"; defaultValue: ImmunityExample; allowedValues: ImmunityExample[] } };
}

let immunityManifest: ImmunityManifest;
let immunityExamples: ImmunityExample[];
let immunityCases: ImmunityCase[];
let defaultImmunityValues: { initial_example: ImmunityExample; stage: number };
let calculateImmunityState: (values: ImmunityValues) => {
  initial_example: ImmunityExample; stage: number; selected: ImmunityCase; activeProtection: number; passiveProtection: number;
};
let manifestInitialized = false;
let modelInitialized = false;

function initializeImmunityManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  immunityManifest = {
    type: "ACTIVE_VS_PASSIVE_IMMUNITY", version: 2, thumbnailAssetKey: "active-vs-passive-immunity-v1",
    parameters: {
      initial_example: {
        kind: "enum", defaultValue: "vaccination",
        allowedValues: ["infection-and-recovery", "vaccination", "maternal-antibodies", "immune-globulin"],
      },
    },
  };
}

function initializeActiveVsPassiveImmunityModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializeImmunityManifest();
  const isImmunityExample = (value: unknown): value is ImmunityExample =>
    typeof value === "string" && immunityManifest.parameters.initial_example.allowedValues.some(example => example === value);
  const defaultExample = immunityManifest.parameters.initial_example.defaultValue;
  if (!isImmunityExample(defaultExample)) throw Error("Invalid active-versus-passive-immunity default example");
  immunityExamples = immunityManifest.parameters.initial_example.allowedValues.filter(isImmunityExample);
  immunityCases = [
    { example: "infection-and-recovery", acquisition: "natural", response: "active" },
    { example: "vaccination", acquisition: "artificial", response: "active" },
    { example: "maternal-antibodies", acquisition: "natural", response: "passive" },
    { example: "immune-globulin", acquisition: "artificial", response: "passive" },
  ];
  defaultImmunityValues = { initial_example: defaultExample, stage: 0 };
  calculateImmunityState = values => {
    const initialExample = isImmunityExample(values.initial_example) ? values.initial_example : defaultExample;
    const rawStage = typeof values.stage === "number" && Number.isFinite(values.stage) ? values.stage : 0;
    const stage = Math.max(0, Math.min(3, Math.round(rawStage)));
    const selected = immunityCases.find(immunityCase => immunityCase.example === initialExample);
    if (!selected) throw Error("Missing active-versus-passive-immunity case");
    return {
      initial_example: initialExample, stage, selected,
      activeProtection: [0.12, 0.92, 0.82, 1][stage], passiveProtection: [1, 0.68, 0, 0][stage],
    };
  };
}

export {
  calculateImmunityState as a, initializeActiveVsPassiveImmunityModel as i, immunityCases as n,
  initializeImmunityManifest as o, immunityExamples as r, immunityManifest as s, defaultImmunityValues as t,
};
