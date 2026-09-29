// Round-robin CPU scheduling with preemption and queue-state replay.
import "@rchunk/rolldown-runtime";

type WorkloadId = "mixed-bursts" | "one-long-two-short" | "equal-bursts";
type ProcessId = "P1" | "P2" | "P3" | "P4";
interface RoundRobinValues { time_quantum?: number | null; workload?: unknown; step?: number | null }
interface ProcessBurst { id: ProcessId; burst: number }
interface TimeSlice { processId: ProcessId; start: number; end: number; duration: number; remainingAfter: number; outcome: "completed" | "preempted" }

const roundRobinSpecification = { type: "ROUND_ROBIN_CPU_SCHEDULING", version: 2, thumbnailAssetKey: "round-robin-cpu-scheduling-v1", parameters: { time_quantum: { kind: "integer" as const, defaultValue: 3, min: 1, max: 8 }, workload: { kind: "enum" as const, defaultValue: "mixed-bursts" as WorkloadId, allowedValues: ["mixed-bursts", "one-long-two-short", "equal-bursts"] as WorkloadId[] } } };
const workloads: Record<WorkloadId, ProcessBurst[]> = {
  "mixed-bursts": [{ id: "P1", burst: 8 }, { id: "P2", burst: 5 }, { id: "P3", burst: 2 }, { id: "P4", burst: 6 }],
  "one-long-two-short": [{ id: "P1", burst: 10 }, { id: "P2", burst: 2 }, { id: "P3", burst: 3 }],
  "equal-bursts": [{ id: "P1", burst: 4 }, { id: "P2", burst: 4 }, { id: "P3", burst: 4 }, { id: "P4", burst: 4 }],
};
const timeQuantumParameter = roundRobinSpecification.parameters.time_quantum;
const workloadParameter = roundRobinSpecification.parameters.workload;
const clampInteger = (value: number | null | undefined, minimum: number, maximum: number): number => Math.min(Math.max(typeof value === "number" && Number.isFinite(value) ? Math.round(value) : minimum, minimum), maximum);
const normalizeTimeQuantum = (value: number | null | undefined): number => clampInteger(typeof value === "number" && Number.isFinite(value) ? value : timeQuantumParameter.defaultValue, timeQuantumParameter.min, timeQuantumParameter.max);
const isWorkloadId = (value: unknown): value is WorkloadId => value === "mixed-bursts" || value === "one-long-two-short" || value === "equal-bursts";
const normalizeWorkload = (value: unknown): WorkloadId => isWorkloadId(value) ? value : isWorkloadId(workloadParameter.defaultValue) ? workloadParameter.defaultValue : "mixed-bursts";
const remainingByProcess = (workload: ProcessBurst[]): Record<ProcessId, number> => { const remaining: Record<ProcessId, number> = { P1: 0, P2: 0, P3: 0, P4: 0 }; for (const process of workload) remaining[process.id] = process.burst; return remaining; };
const buildRoundRobinSchedule = (timeQuantum: number, workloadId: WorkloadId = normalizeWorkload(workloadParameter.defaultValue)): TimeSlice[] => {
  const quantum = normalizeTimeQuantum(timeQuantum);
  const workload = workloads[workloadId];
  const remaining = remainingByProcess(workload);
  const queue = workload.map(({ id }) => id);
  const slices: TimeSlice[] = [];
  let elapsed = 0;
  while (queue.length > 0) {
    const processId = queue.shift();
    if (!processId) break;
    const duration = Math.min(quantum, remaining[processId]);
    remaining[processId] -= duration;
    const outcome = remaining[processId] === 0 ? "completed" : "preempted";
    slices.push({ processId, start: elapsed, end: elapsed + duration, duration, remainingAfter: remaining[processId], outcome });
    elapsed += duration;
    if (outcome === "preempted") queue.push(processId);
  }
  return slices;
};
const contextSwitchCount = (slices: TimeSlice[]): number => slices.slice(1).filter((slice, index) => slice.processId !== slices[index]?.processId).length;
const calculateRoundRobin = (values: RoundRobinValues) => {
  const timeQuantum = normalizeTimeQuantum(values.time_quantum);
  const workloadId = normalizeWorkload(values.workload);
  const workload = workloads[workloadId];
  const totalBurst = workload.reduce((sum, process) => sum + process.burst, 0);
  const allSlices = buildRoundRobinSchedule(timeQuantum, workloadId);
  const step = clampInteger(values.step, 0, allSlices.length);
  const visibleSlices = allSlices.slice(0, step);
  const remaining = remainingByProcess(workload);
  const queue = workload.map(({ id }) => id);
  const completed: ProcessId[] = [];
  for (const slice of visibleSlices) { const expectedProcess = queue.shift(); if (!expectedProcess || expectedProcess !== slice.processId) break; remaining[expectedProcess] = slice.remainingAfter; if (slice.outcome === "preempted") queue.push(expectedProcess); else completed.push(expectedProcess); }
  const preemptions = visibleSlices.filter(({ outcome }) => outcome === "preempted").length;
  const totalPreemptions = allSlices.filter(({ outcome }) => outcome === "preempted").length;
  const lastFirstRun = Math.max(...workload.map((process) => allSlices.find((slice) => slice.processId === process.id)?.start ?? 0));
  return { values: { time_quantum: timeQuantum, workload: workloadId, step }, allSlices, visibleSlices, queue, remaining, completed, latest: visibleSlices.at(-1) ?? null, preemptions, totalPreemptions, contextSwitches: contextSwitchCount(visibleSlices), totalContextSwitches: contextSwitchCount(allSlices), lastFirstRun, totalBurst, workload, elapsed: visibleSlices.at(-1)?.end ?? 0, maxStep: allSlices.length };
};
const initialRoundRobinValues = () => ({ time_quantum: timeQuantumParameter.defaultValue, workload: normalizeWorkload(workloadParameter.defaultValue), step: 0 });

function initializeRoundRobinSpecification(): void {}
function initializeRoundRobinModel(): void {}

export { initializeRoundRobinSpecification as a, initializeRoundRobinModel as i, calculateRoundRobin as n, roundRobinSpecification as o, initialRoundRobinValues as r, timeQuantumParameter as t };
