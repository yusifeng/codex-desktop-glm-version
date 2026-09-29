// Greenhouse-effect teaching model. Release chunk: model-c4c3d4ac3d2a.js.
import "@rchunk/rolldown-runtime";

interface GreenhouseEffectInput { greenhouseGasLevel?: number }
interface GreenhouseEffectValues { greenhouseGasLevel: number }

const greenhouseGasControl = { min: 0, max: 100, step: 1, defaultValue: 55 };
const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(Math.max(value, minimum), maximum);
const normalizeGreenhouseGasLevel = (value: number | undefined): number =>
  Number.isFinite(value)
    ? clamp(Math.round(value as number), greenhouseGasControl.min, greenhouseGasControl.max)
    : greenhouseGasControl.defaultValue;
const normalizeGreenhouseEffectInput = (input: GreenhouseEffectInput): GreenhouseEffectValues => ({
  greenhouseGasLevel: normalizeGreenhouseGasLevel(input.greenhouseGasLevel),
});
const calculateGreenhouseEffect = (input: GreenhouseEffectInput) => {
  const safeValues = normalizeGreenhouseEffectInput(input);
  const gasRatio = (safeValues.greenhouseGasLevel - greenhouseGasControl.min) /
    (greenhouseGasControl.max - greenhouseGasControl.min);
  return {
    safeValues,
    gasRatio,
    retainedInfraredRatio: gasRatio * 0.72,
    escapingInfraredRatio: 1 - gasRatio * 0.72,
  };
};
function initializeGreenhouseEffectModel(): void {}

export { calculateGreenhouseEffect as n, initializeGreenhouseEffectModel as r, greenhouseGasControl as t };
