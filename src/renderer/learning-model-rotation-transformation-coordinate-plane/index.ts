// Coordinate-plane rotation transformation learning model. Release chunk: model-f531b58f0936.js.
import "@rchunk/rolldown-runtime";

interface RotationValues { angleDeg?: number | null }
interface Point { x: number; y: number }
interface NamedPoint extends Point { name: string }
interface RotationManifest {
  type: string; version: number; thumbnailAssetKey: string;
  parameters: { angleDeg: { kind: "number"; defaultValue: number; min: number; max: number } };
}

let rotationTransformationManifest: RotationManifest;
let angleControl: { min: number; max: number; step: number; defaultValue: number };
let calculateRotationTransformation: (values: RotationValues) => {
  angleDeg: number; center: Point; preimageVertices: NamedPoint[]; imageVertices: NamedPoint[];
  guideRadius: number; isOverlap: boolean;
};
let manifestInitialized = false;
let modelInitialized = false;

function initializeRotationTransformationManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  rotationTransformationManifest = {
    type: "ROTATION_TRANSFORMATION_COORDINATE_PLANE", version: 1,
    thumbnailAssetKey: "rotation-transformation-coordinate-plane-v1",
    parameters: { angleDeg: { kind: "number", defaultValue: 90, min: -180, max: 180 } },
  };
}

function initializeRotationTransformationModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializeRotationTransformationManifest();
  const angleParameter = rotationTransformationManifest.parameters.angleDeg;
  angleControl = { min: angleParameter.min, max: angleParameter.max, step: 15, defaultValue: angleParameter.defaultValue };
  const center: Point = { x: 0, y: 0 };
  const preimageVertices: NamedPoint[] = [
    { name: "A", x: 2, y: 1 }, { name: "B", x: 5, y: 1 }, { name: "C", x: 4, y: 3 },
  ];
  const tolerance = 1e-10;
  const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
  const cleanCoordinate = (value: number): number => {
    if (Math.abs(value) < tolerance) return 0;
    const rounded = Math.round(value);
    return Math.abs(value - rounded) < tolerance ? rounded : value;
  };
  const rotatePoint = (point: Point, angleDeg: number, rotationCenter: Point = center): Point => {
    const radians = angleDeg * Math.PI / 180;
    const cosine = Math.cos(radians);
    const sine = Math.sin(radians);
    const relativeX = point.x - rotationCenter.x;
    const relativeY = point.y - rotationCenter.y;
    return {
      x: cleanCoordinate(rotationCenter.x + relativeX * cosine - relativeY * sine),
      y: cleanCoordinate(rotationCenter.y + relativeX * sine + relativeY * cosine),
    };
  };
  calculateRotationTransformation = values => {
    const candidate = typeof values.angleDeg === "number" && Number.isFinite(values.angleDeg) ? values.angleDeg : angleControl.defaultValue;
    const angleDeg = clamp(candidate, angleControl.min, angleControl.max);
    const imageVertices = preimageVertices.map(vertex => ({ ...rotatePoint(vertex, angleDeg), name: vertex.name }));
    return {
      angleDeg, center, preimageVertices, imageVertices,
      guideRadius: Math.hypot(preimageVertices[0].x - center.x, preimageVertices[0].y - center.y),
      isOverlap: Math.abs(angleDeg) < tolerance,
    };
  };
}

export {
  rotationTransformationManifest as a, initializeRotationTransformationManifest as i,
  calculateRotationTransformation as n, initializeRotationTransformationModel as r, angleControl as t,
};
