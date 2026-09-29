// Latitude-and-longitude globe projection learning model. Release chunk: model-fe09a72207e2.js.
import "@rchunk/rolldown-runtime";

interface GeographicValues { latitude?: number | null; longitude?: number | null }
interface Point { x: number; y: number }
interface ProjectionValues { latitude: number; longitude: number; viewCenterLongitude: number }
interface LatitudeLongitudeManifest {
  type: string; version: number; thumbnailAssetKey: string;
  parameters: {
    latitude: { kind: "integer"; defaultValue: number; min: number; max: number };
    longitude: { kind: "integer"; defaultValue: number; min: number; max: number };
  };
}

let latitudeLongitudeManifest: LatitudeLongitudeManifest;
let latitudeControl: { kind: "integer"; defaultValue: number; min: number; max: number; step: number };
let longitudeControl: { kind: "integer"; defaultValue: number; min: number; max: number; step: number };
let globeGeometry: { centerX: number; centerY: number; radius: number };
let normalizeGeographicValues: (values: GeographicValues) => { latitude: number; longitude: number };
let projectGlobePoint: (values: ProjectionValues) => Point;
let generateMeridian: (longitude: number, viewCenterLongitude: number) => Point[];
let latitudeParallelEndpoints: (latitude: number) => [Point, Point];
let halveLongitude: (longitude: number) => number;
let isPoleLatitude: (latitude: number) => boolean;
let manifestInitialized = false;
let modelInitialized = false;

function initializeLatitudeLongitudeManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  latitudeLongitudeManifest = {
    type: "LATITUDE_LONGITUDE", version: 1, thumbnailAssetKey: "latitude-longitude-v2",
    parameters: {
      latitude: { kind: "integer", defaultValue: 30, min: -90, max: 90 },
      longitude: { kind: "integer", defaultValue: 45, min: -180, max: 180 },
    },
  };
}

function initializeLatitudeLongitudeModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializeLatitudeLongitudeManifest();
  latitudeControl = { ...latitudeLongitudeManifest.parameters.latitude, step: 1 };
  longitudeControl = { ...latitudeLongitudeManifest.parameters.longitude, step: 1 };
  globeGeometry = { centerX: 180, centerY: 130, radius: 96 };
  const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
  const normalizeCoordinate = (value: number | null | undefined, control: typeof latitudeControl): number => {
    const candidate = typeof value === "number" && Number.isFinite(value) ? value : control.defaultValue;
    return clamp(Math.round(candidate), control.min, control.max);
  };
  normalizeGeographicValues = values => ({
    latitude: normalizeCoordinate(values.latitude, latitudeControl),
    longitude: normalizeCoordinate(values.longitude, longitudeControl),
  });
  const degreesToRadians = (degrees: number): number => degrees * Math.PI / 180;
  halveLongitude = longitude => longitude / 2;
  projectGlobePoint = ({ latitude, longitude, viewCenterLongitude }) => {
    const latitudeRadians = degreesToRadians(latitude);
    const relativeLongitudeRadians = degreesToRadians(longitude - viewCenterLongitude);
    const projectedRadius = globeGeometry.radius * Math.cos(latitudeRadians);
    return {
      x: globeGeometry.centerX + projectedRadius * Math.sin(relativeLongitudeRadians),
      y: globeGeometry.centerY - globeGeometry.radius * Math.sin(latitudeRadians),
    };
  };
  generateMeridian = (longitude, viewCenterLongitude) => Array.from(
    { length: 61 },
    (_unused, index) => projectGlobePoint({ latitude: -90 + index * 3, longitude, viewCenterLongitude }),
  );
  latitudeParallelEndpoints = latitude => {
    const latitudeRadians = degreesToRadians(latitude);
    const horizontalRadius = globeGeometry.radius * Math.cos(latitudeRadians);
    const y = globeGeometry.centerY - globeGeometry.radius * Math.sin(latitudeRadians);
    return [{ x: globeGeometry.centerX - horizontalRadius, y }, { x: globeGeometry.centerX + horizontalRadius, y }];
  };
  isPoleLatitude = latitude => Math.abs(latitude) === 90;
}

export {
  latitudeParallelEndpoints as a, isPoleLatitude as c, initializeLatitudeLongitudeManifest as d,
  latitudeLongitudeManifest as f, generateMeridian as i, projectGlobePoint as l, latitudeControl as n,
  halveLongitude as o, longitudeControl as r, initializeLatitudeLongitudeModel as s, globeGeometry as t,
  normalizeGeographicValues as u,
};
