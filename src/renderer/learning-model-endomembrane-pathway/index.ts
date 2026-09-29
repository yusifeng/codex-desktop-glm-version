// Cargo trafficking through the endomembrane system.
import "@rchunk/rolldown-runtime";

type CargoDestination = "secretion" | "plasma membrane" | "lysosome";
interface EndomembraneValues { cargo_destination?: string | null; stageIndex?: number | null }

const endomembranePathwayType = "ENDOMEMBRANE_PATHWAY";
const endomembranePathwayThumbnail = "endomembrane-pathway-v2";
const endomembranePathwayParameters = {
  cargo_destination: { kind: "enum" as const, defaultValue: "secretion" as CargoDestination, allowedValues: ["secretion", "plasma membrane", "lysosome"] as CargoDestination[] },
};
const endomembranePathwaySpecification = { type: endomembranePathwayType, version: 2, thumbnailAssetKey: endomembranePathwayThumbnail, parameters: endomembranePathwayParameters };
const cargoDestinations = endomembranePathwaySpecification.parameters.cargo_destination.allowedValues;
const endomembraneControls = { destinationMin: 0, destinationMax: cargoDestinations.length - 1, stageMin: 0, stageMax: 4, step: 1, defaultDestination: endomembranePathwaySpecification.parameters.cargo_destination.defaultValue, defaultStage: 0 };
const isCargoDestination = (value: unknown): value is CargoDestination => cargoDestinations.some((destination) => destination === value);
const normalizeEndomembraneValues = (values: EndomembraneValues) => ({
  cargo_destination: isCargoDestination(values.cargo_destination) ? values.cargo_destination : endomembraneControls.defaultDestination,
  stageIndex: Number.isFinite(values.stageIndex)
    ? Math.min(endomembraneControls.stageMax, Math.max(endomembraneControls.stageMin, Math.round(values.stageIndex ?? 0)))
    : endomembraneControls.defaultStage,
});
const indexForDestination = (destination: CargoDestination): number => Math.max(0, cargoDestinations.indexOf(destination));
const destinationForIndex = (index: number): CargoDestination =>
  cargoDestinations[Math.min(endomembraneControls.destinationMax, Math.max(endomembraneControls.destinationMin, Math.round(index)))] ?? endomembraneControls.defaultDestination;
const cargoLocationForStage = ({ cargo_destination: destination, stageIndex }: { cargo_destination: CargoDestination; stageIndex: number }): string =>
  stageIndex === 0
    ? destination === "plasma membrane" ? "roughErMembrane" : "roughErSoluble"
    : stageIndex === 1
      ? destination === "plasma membrane" ? "cisMembrane" : "cisSoluble"
      : stageIndex === 2
        ? "golgi"
        : stageIndex === 3
          ? destination === "lysosome" ? "outgoingLysosome" : destination === "plasma membrane" ? "outgoingMembrane" : "outgoingSecretion"
          : destination === "lysosome" ? "deliveryLysosome" : destination === "plasma membrane" ? "deliveryMembrane" : "deliverySecretion";

function initializeEndomembranePathwaySpecification(): void {}
function initializeEndomembranePathwayModel(): void {}

export { initializeEndomembranePathwayModel as a, endomembranePathwaySpecification as c, cargoLocationForStage as i, destinationForIndex as n, normalizeEndomembraneValues as o, indexForDestination as r, initializeEndomembranePathwaySpecification as s, endomembraneControls as t };
