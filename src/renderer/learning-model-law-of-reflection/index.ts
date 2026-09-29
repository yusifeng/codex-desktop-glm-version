// Reflection geometry with equal incident and reflected angles.
import "@rchunk/rolldown-runtime";

interface ReflectionValues { incidentAngleDeg?: number | null; incidentRayLength?: number | null }
interface Point { x: number; y: number }
interface ClientBounds { left: number; top: number; width: number; height: number }

const reflectionSpecification = { type: "LAW_OF_REFLECTION", version: 2, thumbnailAssetKey: "law-of-reflection-v1", canonicalFormula: "\\theta_i = \\theta_r", parameters: { incidentAngleDeg: { kind: "number" as const, defaultValue: 40, min: 10, max: 75 } } };
const incidentAngleControl = { defaultValue: reflectionSpecification.parameters.incidentAngleDeg.defaultValue, min: reflectionSpecification.parameters.incidentAngleDeg.min, max: reflectionSpecification.parameters.incidentAngleDeg.max, step: 1 };
const incidentRayLengthControl = { defaultValue: 144, min: 104, max: 176 };
const reflectionLayout = { viewbox: { width: 448, height: 320 }, incidencePoint: { x: 224, y: 232 }, angleArcRadius: 40, normalLineStartY: 80, mirror: { x: 48, y: 232, width: 352, height: 16 }, labels: { instruction: { x: 224, y: 24, maxWidth: 304 }, normal: { x: 224, y: 48, maxWidth: 96 }, ray: { minX: 72, maxX: 160, endpointOffsetX: 40, minY: 112, endpointOffsetY: 24, maxWidth: 112 }, incidentAngleName: { x: 112, y: 64, maxWidth: 176 }, reflectedAngleName: { x: 336, y: 64, maxWidth: 176 }, angleValue: { incidentOffset: { x: -48, y: -32 }, reflectedOffset: { x: 64, y: -56 }, maxWidth: 64 }, pointOfIncidence: { x: 224, y: 272, maxWidth: 176 }, planeMirror: { x: 224, y: 296, maxWidth: 176 } } };
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const degreesToRadians = (degrees: number): number => degrees * Math.PI / 180;
const normalizeIncidentAngle = (value: unknown): number => clamp(typeof value === "number" && Number.isFinite(value) ? value : incidentAngleControl.defaultValue, incidentAngleControl.min, incidentAngleControl.max);
const normalizeIncidentRayLength = (value: unknown): number => clamp(typeof value === "number" && Number.isFinite(value) ? value : incidentRayLengthControl.defaultValue, incidentRayLengthControl.min, incidentRayLengthControl.max);
const normalizeReflectionValues = (values: ReflectionValues) => ({ incidentAngleDeg: normalizeIncidentAngle(values.incidentAngleDeg), incidentRayLength: normalizeIncidentRayLength(values.incidentRayLength) });
const pointOnRay = (side: "incident" | "reflected", length: number, radians: number): Point => { const direction = side === "incident" ? -1 : 1; return { x: reflectionLayout.incidencePoint.x + direction * length * Math.sin(radians), y: reflectionLayout.incidencePoint.y - length * Math.cos(radians) }; };
const angleArcPath = (side: "incident" | "reflected", radians: number): string => { const start = { x: reflectionLayout.incidencePoint.x, y: reflectionLayout.incidencePoint.y - reflectionLayout.angleArcRadius }; const end = pointOnRay(side, reflectionLayout.angleArcRadius, radians); return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${reflectionLayout.angleArcRadius} ${reflectionLayout.angleArcRadius} 0 0 ${side === "incident" ? 0 : 1} ${end.x.toFixed(2)} ${end.y.toFixed(2)}`; };
const reflectionGeometry = (angle: number, rayLength = incidentRayLengthControl.defaultValue) => {
  const angleDeg = normalizeIncidentAngle(angle); const safeLength = normalizeIncidentRayLength(rayLength); const radians = degreesToRadians(angleDeg);
  return { angleDeg, rayLength: safeLength, incidentSource: pointOnRay("incident", safeLength, radians), reflectedEnd: pointOnRay("reflected", safeLength, radians), incidentDirectionPoint: pointOnRay("incident", safeLength / 2, radians), reflectedDirectionPoint: pointOnRay("reflected", safeLength / 2, radians), incidentArcPath: angleArcPath("incident", radians), reflectedArcPath: angleArcPath("reflected", radians) };
};
const rayLabelPositions = (geometry: ReturnType<typeof reflectionGeometry>) => { const ray = reflectionLayout.labels.ray; const x = clamp(geometry.incidentSource.x - ray.endpointOffsetX, ray.minX, ray.maxX); const y = Math.max(ray.minY, geometry.incidentSource.y - ray.endpointOffsetY); return { incident: { x, y }, reflected: { x: reflectionLayout.viewbox.width - x, y } }; };
const angleValuePositions = () => { const angle = reflectionLayout.labels.angleValue; return { incident: { x: reflectionLayout.incidencePoint.x + angle.incidentOffset.x, y: reflectionLayout.incidencePoint.y + angle.incidentOffset.y }, reflected: { x: reflectionLayout.incidencePoint.x + angle.reflectedOffset.x, y: reflectionLayout.incidencePoint.y + angle.reflectedOffset.y } }; };
const reflectionValuesFromPoint = (point: Point) => { const deltaX = reflectionLayout.incidencePoint.x - point.x; const deltaY = reflectionLayout.incidencePoint.y - point.y; return { incidentAngleDeg: normalizeIncidentAngle(180 / Math.PI * Math.atan2(deltaX, deltaY)), incidentRayLength: normalizeIncidentRayLength(Math.hypot(deltaX, deltaY)) }; };
const clientToReflectionViewbox = ({ bounds, clientX, clientY }: { bounds: ClientBounds; clientX: number; clientY: number }): Point => { const scale = Math.min(bounds.width / reflectionLayout.viewbox.width, bounds.height / reflectionLayout.viewbox.height); const renderedWidth = reflectionLayout.viewbox.width * scale; const renderedHeight = reflectionLayout.viewbox.height * scale; const offsetX = (bounds.width - renderedWidth) / 2; const offsetY = (bounds.height - renderedHeight) / 2; return { x: (clientX - bounds.left - offsetX) / scale, y: (clientY - bounds.top - offsetY) / scale }; };

function initializeReflectionSpecification(): void {}
function initializeReflectionModel(): void {}

export { angleValuePositions as a, clientToReflectionViewbox as c, normalizeIncidentRayLength as d, normalizeReflectionValues as f, reflectionValuesFromPoint as i, initializeReflectionModel as l, reflectionSpecification as m, incidentRayLengthControl as n, reflectionGeometry as o, initializeReflectionSpecification as p, reflectionLayout as r, rayLabelPositions as s, incidentAngleControl as t, normalizeIncidentAngle as u };
