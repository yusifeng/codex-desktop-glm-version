// Reorder-point and safety-stock teaching model. Release chunk: model-bf9f007f736e.js.
import "@rchunk/rolldown-runtime";

interface InventoryInput {
  initialInventory?: number;
  demandRate?: number;
  leadTime?: number;
  safetyStock?: number;
}

interface NumericControl { min: number; max: number; step: number; defaultValue: number }

const initialInventoryControl = { min: 220, max: 300, step: 10, defaultValue: 240 };
const demandRateControl = { min: 20, max: 40, step: 1, defaultValue: 20 };
const leadTimeControl = { min: 2, max: 4, step: 0.5, defaultValue: 4 };
const safetyStockControl = { min: 20, max: 60, step: 5, defaultValue: 40 };
const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(Math.max(value, minimum), maximum);
const normalizeValue = (value: number | undefined, control: NumericControl): number =>
  Number.isFinite(value)
    ? clamp(value ?? control.defaultValue, control.min, control.max)
    : control.defaultValue;
const normalizeInventoryInput = (input: InventoryInput) => ({
  initialInventory: normalizeValue(input.initialInventory, initialInventoryControl),
  demandRate: normalizeValue(input.demandRate, demandRateControl),
  leadTime: normalizeValue(input.leadTime, leadTimeControl),
  safetyStock: normalizeValue(input.safetyStock, safetyStockControl),
});
const calculateReorderPoint = (input: InventoryInput) => {
  const safe = normalizeInventoryInput(input);
  const demandDuringLeadTime = safe.demandRate * safe.leadTime;
  const reorderPoint = demandDuringLeadTime + safe.safetyStock;
  const orderDay = (safe.initialInventory - reorderPoint) / safe.demandRate;
  return {
    ...safe,
    orderDay,
    demandDuringLeadTime,
    reorderPoint,
    deliveryDay: orderDay + safe.leadTime,
  };
};
function initializeReorderPointModel(): void {}

export { calculateReorderPoint as a, safetyStockControl as i, initialInventoryControl as n, initializeReorderPointModel as o, leadTimeControl as r, normalizeInventoryInput as s, demandRateControl as t };
