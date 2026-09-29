// Passive and active transport mechanisms across a cell membrane.
import "@rchunk/rolldown-runtime";

type TransportMechanism = "diffusion" | "facilitatedDiffusion" | "activeTransport";
interface TransportValues { mechanism?: unknown }
interface MessageFormatter { formatMessage(descriptor: { id: string; defaultMessage: string }): string }

const cellMembraneTransportSpecification = {
  type: "CELL_MEMBRANE_TRANSPORT",
  version: 1,
  thumbnailAssetKey: "cell-membrane-transport-v2",
  parameters: { mechanism: { kind: "enum" as const, defaultValue: "diffusion" as TransportMechanism, allowedValues: ["diffusion", "facilitatedDiffusion", "activeTransport"] as TransportMechanism[] } },
};
const isTransportMechanism = (value: unknown): value is TransportMechanism => value === "diffusion" || value === "facilitatedDiffusion" || value === "activeTransport";
const parseTransportMechanism = (value: unknown): TransportMechanism => {
  if (!isTransportMechanism(value)) throw new Error(`Unsupported cell membrane transport mechanism: ${String(value)}`);
  return value;
};
const transportMechanisms = cellMembraneTransportSpecification.parameters.mechanism.allowedValues.map(parseTransportMechanism);
const mechanismIndexControl = { min: 0, max: transportMechanisms.length - 1, step: 1 };
const defaultTransportMechanism = parseTransportMechanism(cellMembraneTransportSpecification.parameters.mechanism.defaultValue);
const normalizeTransportValues = (values: TransportValues) => ({ mechanism: isTransportMechanism(values.mechanism) && cellMembraneTransportSpecification.parameters.mechanism.allowedValues.includes(values.mechanism) ? values.mechanism : defaultTransportMechanism });
const transportMechanismLabel = (formatter: MessageFormatter, mechanism: TransportMechanism): string => {
  switch (mechanism) {
    case "diffusion": return formatter.formatMessage({ id: "learningBlock.cellMembraneTransport.mechanism.diffusion", defaultMessage: "Diffusion" });
    case "facilitatedDiffusion": return formatter.formatMessage({ id: "learningBlock.cellMembraneTransport.mechanism.facilitatedDiffusion", defaultMessage: "Facilitated diffusion" });
    case "activeTransport": return formatter.formatMessage({ id: "learningBlock.cellMembraneTransport.mechanism.activeTransport", defaultMessage: "Active transport" });
  }
};
const transportCaption = (values: TransportValues, formatter: MessageFormatter): string => {
  switch (normalizeTransportValues(values).mechanism) {
    case "diffusion": return formatter.formatMessage({ id: "learningBlock.cellMembraneTransport.caption.diffusion", defaultMessage: "In simple diffusion, small nonpolar molecules move down their concentration gradient directly through the phospholipid bilayer." });
    case "facilitatedDiffusion": return formatter.formatMessage({ id: "learningBlock.cellMembraneTransport.caption.facilitatedDiffusion", defaultMessage: "In facilitated diffusion, a channel protein allows solute particles to move down their concentration gradient without ATP." });
    case "activeTransport": return formatter.formatMessage({ id: "learningBlock.cellMembraneTransport.caption.activeTransport", defaultMessage: "In this active transport example, ATP powers a pump that moves solute particles against their concentration gradient." });
  }
};

function initializeCellMembraneTransportSpecification(): void {}
function initializeCellMembraneTransportModel(): void {}

export { transportMechanismLabel as a, initializeCellMembraneTransportSpecification as c, transportCaption as i, cellMembraneTransportSpecification as l, mechanismIndexControl as n, initializeCellMembraneTransportModel as o, transportMechanisms as r, normalizeTransportValues as s, defaultTransportMechanism as t };
