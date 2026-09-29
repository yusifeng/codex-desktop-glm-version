import "@rchunk/rolldown-runtime";
import * as appInitialChunk from "@rchunk/app-initial";

interface ScheduleBlock { days: readonly string[]; end_time: string; id: string; start_time: string }
interface ScheduleState { blocks: ScheduleBlock[]; enabled: boolean }
type ScheduleAction = { type: "set_enabled"; enabled: boolean } | { type: "add_block" } | ({ type: "update_block" } & Record<string, unknown>) | { type: "remove_block"; id: string };

const runtime = appInitialChunk as unknown as {
  Mqt: () => void;
  Nqt: (state: ScheduleState, action: ScheduleAction) => ScheduleState;
  jqt: readonly string[];
};
const { Mqt: initializeScheduleRuntime, Nqt: reduceSchedule, jqt: weekDays } = runtime;

function createLegacyStudySchedule(): ScheduleState {
  return { enabled: true, blocks: [{ id: "study-hours-always-on", days: [...weekDays], start_time: "00:00", end_time: "23:59" }] };
}

function reduceLegacyStudySchedule(state: ScheduleState, action: ScheduleAction): ScheduleState {
  switch (action.type) {
    case "set_enabled": return reduceSchedule(state, action);
    case "add_block": return reduceSchedule({ ...state, enabled: true }, action);
    case "update_block": {
      const updated = reduceSchedule(createLegacyStudySchedule(), action).blocks[0];
      return { ...state, enabled: true, blocks: [{ ...updated, id: "web-study-hours-" + globalThis.crypto.randomUUID() }, ...state.blocks] };
    }
    case "remove_block": return state;
  }
}

function initializeLegacyStudyHoursSchedule(): void { initializeScheduleRuntime(); }
initializeLegacyStudyHoursSchedule();
export { createLegacyStudySchedule as n, initializeLegacyStudyHoursSchedule as r, reduceLegacyStudySchedule as t };
