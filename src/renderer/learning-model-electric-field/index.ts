// Point-charge electric-field learning model. Release chunk: model-4f70c67288f2.js.
import "@rchunk/rolldown-runtime";

type ChargePolarity = "positive" | "negative";
interface ElectricFieldValues { polarity?: string | null; testX?: number | null; testY?: number | null }
interface PointerProjection { bounds: { left: number; top: number; width: number; height: number }; clientX: number; clientY: number }
interface ElectricFieldManifest {
  type: string; version: number; thumbnailAssetKey: string; canonicalFormula: string;
  parameters: { polarity: { kind: "enum"; defaultValue: ChargePolarity; allowedValues: ChargePolarity[] } };
}

let electricFieldManifest: ElectricFieldManifest;
let fieldLayout: { width: number; height: number; center: { x: number; y: number }; domainScale: { x: number; y: number } };
let initialTestPosition: { x: number; y: number };
let normalizeElectricFieldValues: (values: ElectricFieldValues) => { polarity: ChargePolarity; testX: number; testY: number };
let projectPointerToField: (projection: PointerProjection) => { testX: number; testY: number };
let calculateElectricField: (values: ElectricFieldValues) => {
  safeValues: { polarity: ChargePolarity; testX: number; testY: number }; distance: number; relativeStrength: number;
  fieldUnitX: number; fieldUnitY: number; arrowLength: number;
};
let moveTestCharge: (values: ElectricFieldValues, deltaX: number, deltaY: number) => { polarity: ChargePolarity; testX: number; testY: number };
let manifestInitialized = false;
let modelInitialized = false;

function initializeElectricFieldManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  electricFieldManifest = {
    type: "ELECTRIC_FIELD", version: 1, thumbnailAssetKey: "electric-field-v2",
    canonicalFormula: "E\\propto\\frac{1}{r^2}",
    parameters: { polarity: { kind: "enum", defaultValue: "positive", allowedValues: ["positive", "negative"] } },
  };
}

function initializeElectricFieldModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializeElectricFieldManifest();
  fieldLayout = { width: 352, height: 248, center: { x: 176, y: 128 }, domainScale: { x: 100, y: 100 } };
  const domain = { minX: -1.2, maxX: 1.2, minY: -0.72, maxY: 0.72 };
  initialTestPosition = { x: 0.56, y: 0.36 };
  const polarityParameter = electricFieldManifest.parameters.polarity;
  const minimumRadius = 0.44;
  const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
  const finiteOr = (value: number | null | undefined, fallback: number): number =>
    typeof value === "number" && Number.isFinite(value) ? value : fallback;
  const isPolarity = (value: unknown): value is ChargePolarity => value === "positive" || value === "negative";
  normalizeElectricFieldValues = values => {
    let testX = clamp(finiteOr(values.testX, initialTestPosition.x), domain.minX, domain.maxX);
    let testY = clamp(finiteOr(values.testY, initialTestPosition.y), domain.minY, domain.maxY);
    const distance = Math.hypot(testX, testY);
    if (distance < minimumRadius) {
      if (distance <= 2 ** -52) {
        testX = minimumRadius;
        testY = 0;
      } else {
        const scale = minimumRadius / distance;
        testX *= scale;
        testY *= scale;
      }
    }
    return { polarity: isPolarity(values.polarity) ? values.polarity : polarityParameter.defaultValue, testX, testY };
  };
  projectPointerToField = ({ bounds, clientX, clientY }) => {
    const pixelX = (clientX - bounds.left) / bounds.width * fieldLayout.width;
    const pixelY = (clientY - bounds.top) / bounds.height * fieldLayout.height;
    return {
      testX: (pixelX - fieldLayout.center.x) / fieldLayout.domainScale.x,
      testY: (fieldLayout.center.y - pixelY) / fieldLayout.domainScale.y,
    };
  };
  calculateElectricField = values => {
    const safeValues = normalizeElectricFieldValues(values);
    const distance = Math.hypot(safeValues.testX, safeValues.testY);
    const polarityDirection = safeValues.polarity === "positive" ? 1 : -1;
    const relativeStrength = 1 / distance ** 2;
    return {
      safeValues, distance, relativeStrength,
      fieldUnitX: polarityDirection * safeValues.testX / distance,
      fieldUnitY: polarityDirection * safeValues.testY / distance, arrowLength: relativeStrength * 9,
    };
  };
  moveTestCharge = (values, deltaX, deltaY) => {
    const safeValues = normalizeElectricFieldValues(values);
    return normalizeElectricFieldValues({ ...safeValues, testX: safeValues.testX + deltaX, testY: safeValues.testY + deltaY });
  };
}

export {
  initializeElectricFieldModel as a, initializeElectricFieldManifest as c, projectPointerToField as i, electricFieldManifest as l,
  fieldLayout as n, moveTestCharge as o, calculateElectricField as r, normalizeElectricFieldValues as s, initialTestPosition as t,
};
