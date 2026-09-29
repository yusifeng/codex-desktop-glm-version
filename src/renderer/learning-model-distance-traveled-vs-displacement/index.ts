// Distance traveled versus displacement learning model along three routes.
import "@rchunk/rolldown-runtime";

type RouteName = "direct" | "detour" | "round_trip";
interface RouteValues { route?: string | null; progressPercent?: number | null }
interface Point { x: number; y: number }

const routeModelType = "DISTANCE_TRAVELED_VS_DISPLACEMENT"; const routeThumbnail = "distance-traveled-vs-displacement-v1";
const routeParameters = { route: { kind: "enum", defaultValue: "detour" as RouteName, allowedValues: ["direct", "detour", "round_trip"] as RouteName[] } };
const routeDefinition = { type: routeModelType, version: 1, thumbnailAssetKey: routeThumbnail, parameters: routeParameters };
const progressControl = { defaultValue: 100, min: 0, max: 100, step: 1 }; const startPoint = { x: 70, y: 55 }; const destinationPoint = { x: 210, y: 225 }; const metersPerPixel = 0.05; const comparisonTolerance = 0.05;
const routeGeometries: Record<RouteName, { points: Point[] }> = { direct: { points: [startPoint, destinationPoint] }, detour: { points: [startPoint,{x:120,y:55},{x:120,y:120},{x:175,y:120},{x:175,y:170},destinationPoint] }, round_trip: { points: [startPoint,{x:70,y:220},{x:210,y:220},{x:210,y:55},startPoint] } };
const isRoute = (value: unknown): value is RouteName => value === "direct" || value === "detour" || value === "round_trip"; const routes = routeDefinition.parameters.route.allowedValues.filter(isRoute); const defaultRoute = isRoute(routeDefinition.parameters.route.defaultValue) ? routeDefinition.parameters.route.defaultValue : routes[0] ?? "detour";
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const normalizeRouteValues = (values: RouteValues) => ({ route: values.route && routes.includes(values.route as RouteName) ? values.route as RouteName : defaultRoute, progressPercent: Math.round(clamp(typeof values.progressPercent === "number" && Number.isFinite(values.progressPercent) ? values.progressPercent : progressControl.defaultValue, progressControl.min, progressControl.max)) });
const distance = (first: Point, second: Point): number => Math.hypot(second.x - first.x, second.y - first.y);
const routeSegments = (geometry: { points: Point[] }) => geometry.points.slice(0, -1).map((from, index) => { const to = geometry.points[index + 1]; return { from, to, length: distance(from, to) }; });
const traceRoute = (geometry: { points: Point[] }, progressPercent: number) => {
  const segments = routeSegments(geometry); const total = segments.reduce((sum, segment) => sum + segment.length, 0);
  if (progressPercent <= 0) return { completedPoints: [geometry.points[0]], currentPoint: geometry.points[0], displacementMagnitude: 0, remainingPoints: [...geometry.points], traveledLength: 0 };
  if (progressPercent >= 100) { const currentPoint = geometry.points.at(-1) as Point; return { completedPoints: [...geometry.points], currentPoint, displacementMagnitude: distance(geometry.points[0], currentPoint), remainingPoints: [], traveledLength: total }; }
  const traveledLength = progressPercent / 100 * total; let remaining = traveledLength; const completedPoints = [geometry.points[0]]; let currentPoint = geometry.points[0]; let remainingPoints: Point[] = [];
  for (const [index, segment] of segments.entries()) { if (remaining >= segment.length) { completedPoints.push(segment.to); currentPoint = segment.to; remaining -= segment.length; continue; } const fraction = segment.length === 0 ? 0 : remaining / segment.length; currentPoint = { x: segment.from.x + (segment.to.x - segment.from.x) * fraction, y: segment.from.y + (segment.to.y - segment.from.y) * fraction }; if (fraction > 0) completedPoints.push(currentPoint); remainingPoints = [currentPoint, ...segments.slice(index).map((item) => item.to)]; break; }
  return { completedPoints, currentPoint, displacementMagnitude: distance(geometry.points[0], currentPoint), remainingPoints, traveledLength };
};
const classifyDistanceRelationship = ({ distanceMeters, displacementMeters, progressPercent }: { distanceMeters: number; displacementMeters: number; progressPercent: number }) => progressPercent === 0 ? "bothZero" : displacementMeters < comparisonTolerance && distanceMeters > comparisonTolerance ? "returned" : Math.abs(distanceMeters - displacementMeters) < comparisonTolerance ? "equal" : "greater";
const deriveDistanceDisplacementState = (values: RouteValues) => { const safeValues = normalizeRouteValues(values); const geometry = traceRoute(routeGeometries[safeValues.route], safeValues.progressPercent); const distanceMeters = geometry.traveledLength * metersPerPixel; const displacementMeters = geometry.displacementMagnitude * metersPerPixel; return { distanceMeters, displacementMeters, geometry, relationship: classifyDistanceRelationship({ distanceMeters, displacementMeters, progressPercent: safeValues.progressPercent }), values: safeValues }; };
function initializeDistanceDisplacementSchema(): void {}
function initializeDistanceDisplacementModel(): void {}
export { startPoint as a, normalizeRouteValues as c, routes as i, initializeDistanceDisplacementSchema as l, destinationPoint as n, deriveDistanceDisplacementState as o, progressControl as r, initializeDistanceDisplacementModel as s, defaultRoute as t, routeDefinition as u };
