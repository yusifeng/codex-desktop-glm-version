// Incidence-versus-prevalence learning model over a twelve-month cohort.
import "@rchunk/rolldown-runtime";

interface MonthSelectionValues { selectedMonth?: number | null }
interface PatientCase { id: string; onsetMonth: number; recoveryMonth: number }

const monthControl = { min: 1, max: 12, step: 1, defaultValue: 6 };
const patientCases: PatientCase[] = [
  { id: "P1", onsetMonth: 0.15, recoveryMonth: 2.35 },
  { id: "P2", onsetMonth: 0.7, recoveryMonth: 1.45 },
  { id: "P3", onsetMonth: 1.25, recoveryMonth: 4.4 },
  { id: "P4", onsetMonth: 2.15, recoveryMonth: 2.72 },
  { id: "P5", onsetMonth: 3.25, recoveryMonth: 7.45 },
  { id: "P6", onsetMonth: 4.15, recoveryMonth: 11.82 },
  { id: "P7", onsetMonth: 5.12, recoveryMonth: 5.68 },
  { id: "P8", onsetMonth: 5.35, recoveryMonth: 8.6 },
  { id: "P9", onsetMonth: 7.2, recoveryMonth: 9.45 },
  { id: "P10", onsetMonth: 8.15, recoveryMonth: 8.65 },
  { id: "P11", onsetMonth: 9.25, recoveryMonth: 11.4 },
  { id: "P12", onsetMonth: 11.18, recoveryMonth: 11.72 },
];
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const normalizeMonthSelection = (values: MonthSelectionValues) => {
  const month = Number.isFinite(values.selectedMonth) ? Math.round(values.selectedMonth ?? monthControl.defaultValue) : monthControl.defaultValue;
  return { selectedMonth: clamp(month, monthControl.min, monthControl.max) };
};
const isNewCaseInMonth = (patient: PatientCase, month: number): boolean => patient.onsetMonth > month - 1 && patient.onsetMonth <= month;
const isCurrentCaseAtMonth = (patient: PatientCase, month: number): boolean => patient.onsetMonth <= month && patient.recoveryMonth > month;

function calculateIncidenceAndPrevalence(values: MonthSelectionValues) {
  const { selectedMonth } = normalizeMonthSelection(values);
  const newCases = patientCases.filter((patient) => isNewCaseInMonth(patient, selectedMonth));
  const currentCases = patientCases.filter((patient) => isCurrentCaseAtMonth(patient, selectedMonth));
  const newIds = new Set(newCases.map(({ id }) => id));
  const currentIds = new Set(currentCases.map(({ id }) => id));
  return {
    selectedMonth,
    newCases,
    currentCases,
    both: newCases.filter(({ id }) => currentIds.has(id)),
    newOnly: newCases.filter(({ id }) => !currentIds.has(id)),
    currentOnly: currentCases.filter(({ id }) => !newIds.has(id)),
  };
}

function initializeIncidenceVsPrevalenceModel(): void {}

export {
  normalizeMonthSelection as a,
  initializeIncidenceVsPrevalenceModel as i,
  monthControl as n,
  calculateIncidenceAndPrevalence as r,
  patientCases as t,
};
