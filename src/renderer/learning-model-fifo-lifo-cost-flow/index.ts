// Inventory cost allocation under FIFO and LIFO assumptions.
import "@rchunk/rolldown-runtime";

type PriceTrend = "falling" | "flat" | "rising";
type CostFlowMethod = "fifo" | "lifo";
interface CostFlowValues { unitsSold?: number | null; priceTrend?: unknown }
interface InventoryLayer { id: string; purchaseMonth: number; purchaseDay: number; quantity: number; unitCost: number }

const costFlowSpecification = {
  type: "FIFO_LIFO_COST_FLOW",
  version: 1,
  thumbnailAssetKey: "fifo-lifo-cost-flow-v1",
  parameters: {
    unitsSold: { kind: "integer" as const, defaultValue: 180, min: 0, max: 300 },
    priceTrend: { kind: "enum" as const, defaultValue: "rising" as PriceTrend, allowedValues: ["falling", "flat", "rising"] as PriceTrend[] },
  },
};
const unitsSoldControl = { min: costFlowSpecification.parameters.unitsSold.min, max: costFlowSpecification.parameters.unitsSold.max, step: 1, defaultValue: costFlowSpecification.parameters.unitsSold.defaultValue };
const priceTrends = costFlowSpecification.parameters.priceTrend.allowedValues;
const defaultCostFlowValues = { unitsSold: unitsSoldControl.defaultValue, priceTrend: costFlowSpecification.parameters.priceTrend.defaultValue };
const baseLayers = [
  { id: "jan", purchaseMonth: 0, purchaseDay: 5, quantity: 100 },
  { id: "feb", purchaseMonth: 1, purchaseDay: 12, quantity: 100 },
  { id: "mar", purchaseMonth: 2, purchaseDay: 20, quantity: 100 },
];
const costsByTrend: Record<PriceTrend, [number, number, number]> = { falling: [12, 10, 8], flat: [10, 10, 10], rising: [8, 10, 12] };
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const normalizePriceTrend = (value: unknown): PriceTrend => typeof value === "string" && priceTrends.some((trend) => trend === value) ? value as PriceTrend : defaultCostFlowValues.priceTrend;
const normalizeCostFlowValues = (values: CostFlowValues) => ({
  unitsSold: typeof values.unitsSold === "number" && Number.isFinite(values.unitsSold) ? Math.round(clamp(values.unitsSold, unitsSoldControl.min, unitsSoldControl.max)) : unitsSoldControl.defaultValue,
  priceTrend: normalizePriceTrend(values.priceTrend),
});
const createInventoryLayers = (trend: PriceTrend): InventoryLayer[] => {
  const costs = costsByTrend[trend];
  return baseLayers.map((layer, index) => ({ ...layer, unitCost: costs[index] }));
};
const allocateCostFlow = (layers: InventoryLayer[], unitsSold: number, method: CostFlowMethod) => {
  let remaining = unitsSold;
  const quantitiesSold = new Map<string, number>();
  for (const layer of method === "fifo" ? layers : [...layers].reverse()) {
    const sold = Math.min(layer.quantity, remaining);
    quantitiesSold.set(layer.id, sold);
    remaining -= sold;
  }
  const allocations = layers.map((layer) => {
    const cogsQuantity = quantitiesSold.get(layer.id) ?? 0;
    const endingQuantity = layer.quantity - cogsQuantity;
    return { ...layer, cogsQuantity, endingQuantity, cogsValue: cogsQuantity * layer.unitCost, endingValue: endingQuantity * layer.unitCost };
  });
  return { method, allocations, cogs: allocations.reduce((total, layer) => total + layer.cogsValue, 0), endingInventory: allocations.reduce((total, layer) => total + layer.endingValue, 0) };
};
const calculateCostFlow = (values: CostFlowValues) => {
  const normalized = normalizeCostFlowValues(values);
  const layers = createInventoryLayers(normalized.priceTrend);
  const fifo = allocateCostFlow(layers, normalized.unitsSold, "fifo");
  const lifo = allocateCostFlow(layers, normalized.unitsSold, "lifo");
  const unitsAvailable = layers.reduce((total, layer) => total + layer.quantity, 0);
  const goodsAvailableCost = layers.reduce((total, layer) => total + layer.quantity * layer.unitCost, 0);
  return { values: normalized, layers, fifo, lifo, unitsAvailable, unitsRemaining: unitsAvailable - normalized.unitsSold, goodsAvailableCost, cogsDifference: lifo.cogs - fifo.cogs };
};

function initializeCostFlowSpecification(): void {}
function initializeCostFlowModel(): void {}

export { initializeCostFlowModel as a, costFlowSpecification as c, calculateCostFlow as i, priceTrends as n, normalizeCostFlowValues as o, unitsSoldControl as r, initializeCostFlowSpecification as s, defaultCostFlowValues as t };
