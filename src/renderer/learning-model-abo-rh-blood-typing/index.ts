// ABO/Rh blood-typing learning model. Release chunk: model-20fa5aabbc94.js.
import "@rchunk/rolldown-runtime";

type BloodType = "O-" | "O+" | "A-" | "A+" | "B-" | "B+" | "AB-" | "AB+";
type AboGroup = "O" | "A" | "B" | "AB";
type RhFactor = "-" | "+";
interface BloodTypingValues { initial_blood_type?: string | null }
interface AgglutinationRow { bloodType: BloodType; antiA: boolean; antiB: boolean; antiD: boolean }
interface BloodTypingManifest {
  type: string; version: number; thumbnailAssetKey: string;
  parameters: { initial_blood_type: { kind: "enum"; defaultValue: BloodType; allowedValues: BloodType[] } };
}

let bloodTypingManifest: BloodTypingManifest;
let aboGroups: AboGroup[];
let rhFactors: RhFactor[];
let defaultBloodTypingValues: { initial_blood_type: BloodType };
let calculateBloodTypingState: (values: BloodTypingValues) => {
  initial_blood_type: BloodType; abo: AboGroup; rh: RhFactor; bloodType: BloodType;
  antiA: boolean; antiB: boolean; antiD: boolean; rows: AgglutinationRow[]; activeRowIndex: number;
};
let combineBloodType: (abo: AboGroup, rh: RhFactor) => BloodType;
let manifestInitialized = false;
let modelInitialized = false;

function initializeBloodTypingManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  bloodTypingManifest = {
    type: "ABO_RH_BLOOD_TYPING", version: 2, thumbnailAssetKey: "abo-rh-blood-typing-v2",
    parameters: {
      initial_blood_type: {
        kind: "enum", defaultValue: "A+",
        allowedValues: ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
      },
    },
  };
}

function initializeBloodTypingModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializeBloodTypingManifest();
  const isBloodType = (value: unknown): value is BloodType =>
    typeof value === "string" && bloodTypingManifest.parameters.initial_blood_type.allowedValues.some(type => type === value);
  const defaultBloodType = bloodTypingManifest.parameters.initial_blood_type.defaultValue;
  if (!isBloodType(defaultBloodType)) throw Error("Invalid default blood type in ABO/Rh blood typing manifest");
  defaultBloodTypingValues = { initial_blood_type: defaultBloodType };
  const bloodTypes = bloodTypingManifest.parameters.initial_blood_type.allowedValues.filter(isBloodType);
  aboGroups = ["O", "A", "B", "AB"];
  rhFactors = ["-", "+"];
  const agglutinationFor = (bloodType: BloodType): AgglutinationRow => {
    const rhPositive = bloodType.endsWith("+");
    const abo: AboGroup = bloodType.startsWith("AB") ? "AB" : bloodType.startsWith("A") ? "A" : bloodType.startsWith("B") ? "B" : "O";
    return { bloodType, antiA: abo === "A" || abo === "AB", antiB: abo === "B" || abo === "AB", antiD: rhPositive };
  };
  const rows = bloodTypes.map(agglutinationFor);
  calculateBloodTypingState = values => {
    const initialBloodType = isBloodType(values.initial_blood_type) ? values.initial_blood_type : defaultBloodTypingValues.initial_blood_type;
    const reaction = agglutinationFor(initialBloodType);
    return {
      initial_blood_type: initialBloodType,
      abo: initialBloodType.startsWith("AB") ? "AB" : initialBloodType.startsWith("A") ? "A" : initialBloodType.startsWith("B") ? "B" : "O",
      rh: initialBloodType.endsWith("+") ? "+" : "-",
      ...reaction, rows, activeRowIndex: bloodTypes.indexOf(initialBloodType),
    };
  };
  combineBloodType = (abo, rh) => {
    if (abo === "O") return rh === "+" ? "O+" : "O-";
    if (abo === "A") return rh === "+" ? "A+" : "A-";
    if (abo === "B") return rh === "+" ? "B+" : "B-";
    return rh === "+" ? "AB+" : "AB-";
  };
}

export {
  initializeBloodTypingModel as a, bloodTypingManifest as c, combineBloodType as i, aboGroups as n,
  calculateBloodTypingState as o, rhFactors as r, initializeBloodTypingManifest as s, defaultBloodTypingValues as t,
};
