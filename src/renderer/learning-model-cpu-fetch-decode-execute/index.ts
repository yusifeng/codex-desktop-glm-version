// CPU fetch-decode-execute cycle learning model. Release chunk: model-21889c1e147f.js.
import "@rchunk/rolldown-runtime";

type InstructionExample = "load" | "add" | "branch";
interface CpuCycleValues { instructionExample?: string | null; step?: number | null }
interface CpuCycleManifest {
  type: string; version: number; thumbnailAssetKey: string;
  parameters: { instructionExample: { kind: "enum"; defaultValue: InstructionExample; allowedValues: InstructionExample[] } };
}

let cpuCycleManifest: CpuCycleManifest;
let instructionControl: { min: number; max: number; step: number; defaultValue: InstructionExample };
let cycleStepControl: { min: number; max: number; step: number };
let instructionIndex: (instruction: InstructionExample) => number;
let instructionAtIndex: (index: number) => InstructionExample;
let normalizeCpuCycleValues: (values: CpuCycleValues) => { instructionExample: InstructionExample; step: number };
let calculateCpuCycleState: (values: CpuCycleValues) => {
  accumulator: number; activePath: string; activeRegister: string; cir: string; dataAddress: number; dataValue: number;
  instruction: string; instructionAddress: number; mar: string; mdr: string; nextAddress: number; nextInstruction: string;
  pc: number; phase: "fetch" | "decode" | "execute" | "next-fetch"; step: number;
};
let manifestInitialized = false;
let modelInitialized = false;

function initializeCpuCycleManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  cpuCycleManifest = {
    type: "CPU_FETCH_DECODE_EXECUTE", version: 2, thumbnailAssetKey: "cpu-fetch-decode-execute-v1",
    parameters: { instructionExample: { kind: "enum", defaultValue: "load", allowedValues: ["load", "add", "branch"] } },
  };
}

function initializeCpuFetchDecodeExecuteModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializeCpuCycleManifest();
  const parameter = cpuCycleManifest.parameters.instructionExample;
  const instructions = parameter.allowedValues;
  instructionControl = { min: 0, max: instructions.length - 1, step: 1, defaultValue: parameter.defaultValue };
  cycleStepControl = { min: 0, max: 8, step: 1 };
  const isInstruction = (value: unknown): value is InstructionExample => instructions.some(instruction => instruction === value);
  instructionIndex = instruction => Math.max(0, instructions.indexOf(instruction));
  instructionAtIndex = index => instructions[Math.min(Math.max(Math.round(index), 0), instructions.length - 1)] ?? instructionControl.defaultValue;
  normalizeCpuCycleValues = values => ({
    instructionExample: isInstruction(values.instructionExample) ? values.instructionExample : instructionControl.defaultValue,
    step: typeof values.step === "number" && Number.isFinite(values.step)
      ? Math.min(Math.max(Math.round(values.step), 0), cycleStepControl.max)
      : 0,
  });
  calculateCpuCycleState = values => {
    const normalized = normalizeCpuCycleValues(values);
    const isBranch = normalized.instructionExample === "branch";
    const isAdd = normalized.instructionExample === "add";
    const instruction = isBranch ? "JUMP 24" : isAdd ? "ADD 42" : "LOAD 42";
    const nextAddress = isBranch ? 24 : 21;
    const nextInstruction = isBranch ? "LOAD 42" : "STORE 43";
    const startingAccumulator = isAdd || isBranch ? 5 : 2;
    const finalAccumulator = isAdd ? startingAccumulator + 7 : isBranch ? startingAccumulator : 7;
    const phase = normalized.step <= 4 ? "fetch" : normalized.step === 5 ? "decode" : normalized.step <= 7 ? "execute" : "next-fetch";
    const activePath = normalized.step === 0 ? "ready" : normalized.step === 1 ? "pc-mar" : normalized.step === 2 ? "address"
      : normalized.step === 3 ? "data" : normalized.step === 4 ? "mdr-cir" : normalized.step === 5 ? "decode"
      : normalized.step === 6 ? isBranch ? "branch" : "operand" : normalized.step === 7 ? isBranch ? "branch" : isAdd ? "alu" : "load" : "pc-mar";
    const activeRegister = normalized.step === 0 || normalized.step === 2 || isBranch && normalized.step === 7 ? "PC"
      : normalized.step === 1 || normalized.step === 8 ? "MAR" : normalized.step === 3 || !isBranch && normalized.step === 6 ? "MDR"
      : normalized.step === 4 ? "CIR" : normalized.step === 5 || isBranch && normalized.step === 6 ? "CU" : "ACC";
    return {
      accumulator: normalized.step >= 7 ? finalAccumulator : startingAccumulator, activePath, activeRegister,
      cir: normalized.step >= 4 ? instruction : "—", dataAddress: 42, dataValue: 7, instruction, instructionAddress: 20,
      mar: normalized.step >= 8 ? String(nextAddress) : !isBranch && normalized.step >= 6 ? "42" : normalized.step >= 1 ? "20" : "—",
      mdr: !isBranch && normalized.step >= 6 ? "7" : normalized.step >= 3 ? instruction : "—",
      nextAddress, nextInstruction, pc: normalized.step >= 7 && isBranch ? nextAddress : normalized.step >= 2 ? 21 : 20,
      phase, step: normalized.step,
    };
  };
}

export {
  instructionIndex as a, initializeCpuCycleManifest as c, instructionAtIndex as i, cpuCycleManifest as l, instructionControl as n,
  initializeCpuFetchDecodeExecuteModel as o, calculateCpuCycleState as r, normalizeCpuCycleValues as s, cycleStepControl as t,
};
