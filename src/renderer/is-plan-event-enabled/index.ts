// Resolve whether a plan event is enabled. Release chunk: is-plan-event-enabled-edb7e7f2c465.js.
import "@rchunk/rolldown-runtime";

interface PlanEventSetting { enabled?: boolean }
interface PlanEventDefaults { __default?: PlanEventSetting }

function isPlanEventEnabled(
  defaults: PlanEventDefaults | null | undefined,
  event: PlanEventSetting | null | undefined,
): boolean {
  return typeof event?.enabled === "boolean"
    ? event.enabled
    : (defaults?.__default?.enabled ?? true);
}
function initializePlanEventEnabled(): void {}

export { isPlanEventEnabled as n, initializePlanEventEnabled as t };
