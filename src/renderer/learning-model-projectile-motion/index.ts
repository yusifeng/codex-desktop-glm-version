// Ideal projectile motion without air resistance.
import "@rchunk/rolldown-runtime";

interface NumberParameter { kind: "number"; defaultValue: number; min: number; max: number }
interface ProjectileValues { initialSpeedMetersPerSecond?: number | null; launchAngleDegrees?: number | null }
interface ProjectileState { flightTime: number; horizontalVelocity: number; initialVerticalVelocity: number }

const projectileMotionType = "PROJECTILE_MOTION";
const projectileMotionThumbnail = "projectile-motion-v1";
const projectileMotionParameters: { initialSpeedMetersPerSecond: NumberParameter; launchAngleDegrees: NumberParameter } = {
  initialSpeedMetersPerSecond: { kind: "number", defaultValue: 18, min: 12, max: 25 },
  launchAngleDegrees: { kind: "number", defaultValue: 45, min: 25, max: 65 },
};
const projectileMotionSpecification = { type: projectileMotionType, version: 1, thumbnailAssetKey: projectileMotionThumbnail, parameters: projectileMotionParameters };
const gravity = 9.8;
const speedControl = { ...projectileMotionSpecification.parameters.initialSpeedMetersPerSecond, step: 1 };
const angleControl = { ...projectileMotionSpecification.parameters.launchAngleDegrees, step: 1 };
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const defaultProjectileValues = { initialSpeedMetersPerSecond: speedControl.defaultValue, launchAngleDegrees: angleControl.defaultValue };
const chartReferenceAngle = clamp(45, angleControl.min, angleControl.max) * Math.PI / 180;
const chartMaximumRange = speedControl.max ** 2 * Math.sin(2 * chartReferenceAngle) / gravity;
const chartMaximumHeight = (speedControl.max * Math.sin(angleControl.max * Math.PI / 180)) ** 2 / (2 * gravity);
const projectileChartBounds = { xMax: Math.ceil(chartMaximumRange / 10) * 10, yMax: Math.ceil(chartMaximumHeight / 8) * 8 };
const normalizeParameter = (value: number | null | undefined, control: NumberParameter): number => clamp(typeof value === "number" && Number.isFinite(value) ? value : control.defaultValue, control.min, control.max);
const normalizeProjectileValues = (values: ProjectileValues) => ({ initialSpeedMetersPerSecond: normalizeParameter(values.initialSpeedMetersPerSecond, speedControl), launchAngleDegrees: normalizeParameter(values.launchAngleDegrees, angleControl) });
const calculateProjectileMotion = (values: ProjectileValues) => {
  const normalized = normalizeProjectileValues(values);
  const angleRadians = normalized.launchAngleDegrees * Math.PI / 180;
  const horizontalVelocity = normalized.initialSpeedMetersPerSecond * Math.cos(angleRadians);
  const initialVerticalVelocity = normalized.initialSpeedMetersPerSecond * Math.sin(angleRadians);
  const flightTime = 2 * initialVerticalVelocity / gravity;
  return { ...normalized, angleRadians, horizontalVelocity, initialVerticalVelocity, flightTime, maxHeight: initialVerticalVelocity ** 2 / (2 * gravity), range: horizontalVelocity * flightTime };
};
const projectileStateAtTime = (projectile: ProjectileState, time: number) => {
  const safeTime = clamp(time, 0, projectile.flightTime);
  return { time: safeTime, x: projectile.horizontalVelocity * safeTime, y: Math.max(0, projectile.initialVerticalVelocity * safeTime - 0.5 * gravity * safeTime ** 2), verticalVelocity: projectile.initialVerticalVelocity - gravity * safeTime };
};
const sampleProjectileTrajectory = (projectile: ProjectileState, sampleCount: number) => {
  const count = Math.max(2, Math.round(sampleCount));
  return Array.from({ length: count }, (_unused, index) => projectileStateAtTime(projectile, projectile.flightTime * index / (count - 1)));
};

function initializeProjectileMotionSpecification(): void {}
function initializeProjectileMotionModel(): void {}

export { projectileChartBounds as a, initializeProjectileMotionModel as c, initializeProjectileMotionSpecification as d, projectileMotionSpecification as f, speedControl as i, normalizeProjectileValues as l, defaultProjectileValues as n, sampleProjectileTrajectory as o, gravity as r, projectileStateAtTime as s, angleControl as t, calculateProjectileMotion as u };
