// VSEPR geometry teaching model. Release chunk: model-cde8f9761457.js.
import "@rchunk/rolldown-runtime";
type Configuration =
  | "AX2"
  | "AX3"
  | "AX2E"
  | "AX4"
  | "AX3E"
  | "AX2E2"
  | "AX5"
  | "AX4E"
  | "AX3E2"
  | "AX2E3"
  | "AX6"
  | "AX5E"
  | "AX4E2"
  | "AX3E3"
  | "AX2E4";
type Direction = [number, number, number];
interface Counts {
  bonds: number;
  lonePairs: number;
}
const configurations: Configuration[] = [
  "AX2",
  "AX3",
  "AX2E",
  "AX4",
  "AX3E",
  "AX2E2",
  "AX5",
  "AX4E",
  "AX3E2",
  "AX2E3",
  "AX6",
  "AX5E",
  "AX4E2",
  "AX3E3",
  "AX2E4",
];
const definition = {
  type: "VSEPR_GEOMETRY",
  version: 1,
  thumbnailAssetKey: "vsepr-geometry-v1",
  parameters: {
    configuration: {
      kind: "enum",
      defaultValue: "AX4" as Configuration,
      allowedValues: configurations,
    },
  },
};
const defaults = {
  configuration: definition.parameters.configuration.defaultValue,
};
const counts: Record<Configuration, Counts> = Object.fromEntries(
  configurations.map((value) => {
    const match = /AX(\d)E?(\d)?/.exec(value);
    return [
      value,
      { bonds: Number(match?.[1]), lonePairs: Number(match?.[2] ?? 0) },
    ];
  }),
) as Record<Configuration, Counts>;
const linear = { left: [-1, 0, 0] as Direction, right: [1, 0, 0] as Direction };
const trigonal = {
  top: [0, 1, 0] as Direction,
  lowerLeft: [-0.866, -0.5, 0] as Direction,
  lowerRight: [0.866, -0.5, 0] as Direction,
};
const tetra = {
  frontTop: [0.577, 0.577, 0.577] as Direction,
  backBottom: [-0.577, -0.577, 0.577] as Direction,
  backTop: [-0.577, 0.577, -0.577] as Direction,
  frontBottom: [0.577, -0.577, -0.577] as Direction,
};
const bipyramid = {
  axialTop: [0, 1, 0] as Direction,
  axialBottom: [0, -1, 0] as Direction,
  equatorialFront: [0, 0, 1] as Direction,
  equatorialBackLeft: [-0.866, 0, -0.5] as Direction,
  equatorialBackRight: [0.866, 0, -0.5] as Direction,
};
const octa = {
  top: [0, 1, 0] as Direction,
  bottom: [0, -1, 0] as Direction,
  left: [-1, 0, 0] as Direction,
  right: [1, 0, 0] as Direction,
  front: [0, 0, 1] as Direction,
  back: [0, 0, -1] as Direction,
};
interface Geometry {
  electronGeometry: string;
  molecularGeometry: string;
  bondDirections: Direction[];
  lonePairDirections: Direction[];
}
const geometries: Record<string, Geometry> = {
  "2:0": {
    electronGeometry: "linear",
    molecularGeometry: "linear",
    bondDirections: Object.values(linear),
    lonePairDirections: [],
  },
  "3:0": {
    electronGeometry: "trigonal-planar",
    molecularGeometry: "trigonal-planar",
    bondDirections: Object.values(trigonal),
    lonePairDirections: [],
  },
  "2:1": {
    electronGeometry: "trigonal-planar",
    molecularGeometry: "bent",
    bondDirections: [trigonal.lowerLeft, trigonal.lowerRight],
    lonePairDirections: [trigonal.top],
  },
  "4:0": {
    electronGeometry: "tetrahedral",
    molecularGeometry: "tetrahedral",
    bondDirections: Object.values(tetra),
    lonePairDirections: [],
  },
  "3:1": {
    electronGeometry: "tetrahedral",
    molecularGeometry: "trigonal-pyramidal",
    bondDirections: [tetra.backBottom, tetra.backTop, tetra.frontBottom],
    lonePairDirections: [tetra.frontTop],
  },
  "2:2": {
    electronGeometry: "tetrahedral",
    molecularGeometry: "bent",
    bondDirections: [tetra.backBottom, tetra.frontBottom],
    lonePairDirections: [tetra.frontTop, tetra.backTop],
  },
  "5:0": {
    electronGeometry: "trigonal-bipyramidal",
    molecularGeometry: "trigonal-bipyramidal",
    bondDirections: Object.values(bipyramid),
    lonePairDirections: [],
  },
  "4:1": {
    electronGeometry: "trigonal-bipyramidal",
    molecularGeometry: "seesaw",
    bondDirections: [
      bipyramid.axialTop,
      bipyramid.axialBottom,
      bipyramid.equatorialBackLeft,
      bipyramid.equatorialBackRight,
    ],
    lonePairDirections: [bipyramid.equatorialFront],
  },
  "3:2": {
    electronGeometry: "trigonal-bipyramidal",
    molecularGeometry: "t-shaped",
    bondDirections: [
      bipyramid.axialTop,
      bipyramid.axialBottom,
      bipyramid.equatorialFront,
    ],
    lonePairDirections: [
      bipyramid.equatorialBackLeft,
      bipyramid.equatorialBackRight,
    ],
  },
  "2:3": {
    electronGeometry: "trigonal-bipyramidal",
    molecularGeometry: "linear",
    bondDirections: [bipyramid.axialTop, bipyramid.axialBottom],
    lonePairDirections: [
      bipyramid.equatorialFront,
      bipyramid.equatorialBackLeft,
      bipyramid.equatorialBackRight,
    ],
  },
  "6:0": {
    electronGeometry: "octahedral",
    molecularGeometry: "octahedral",
    bondDirections: Object.values(octa),
    lonePairDirections: [],
  },
  "5:1": {
    electronGeometry: "octahedral",
    molecularGeometry: "square-pyramidal",
    bondDirections: [octa.top, octa.left, octa.right, octa.front, octa.back],
    lonePairDirections: [octa.bottom],
  },
  "4:2": {
    electronGeometry: "octahedral",
    molecularGeometry: "square-planar",
    bondDirections: [octa.left, octa.right, octa.front, octa.back],
    lonePairDirections: [octa.top, octa.bottom],
  },
  "3:3": {
    electronGeometry: "octahedral",
    molecularGeometry: "t-shaped",
    bondDirections: [octa.left, octa.right, octa.front],
    lonePairDirections: [octa.top, octa.bottom, octa.back],
  },
  "2:4": {
    electronGeometry: "octahedral",
    molecularGeometry: "linear",
    bondDirections: [octa.left, octa.right],
    lonePairDirections: [octa.top, octa.bottom, octa.front, octa.back],
  },
};
const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);
const maxLonePairs = (bonds: number) => clamp(6 - Math.round(bonds), 0, 4);
const normalize = (input: { configuration?: unknown }) => ({
  configuration:
    typeof input.configuration === "string" && input.configuration in counts
      ? (input.configuration as Configuration)
      : defaults.configuration,
});
const configurationFor = (bonds: number, lonePairs: number) => {
  const safeBonds = clamp(Number.isFinite(bonds) ? Math.round(bonds) : 2, 2, 6),
    safePairs = clamp(
      Number.isFinite(lonePairs) ? Math.round(lonePairs) : 0,
      0,
      maxLonePairs(safeBonds),
    );
  return (
    configurations.find(
      (configuration) =>
        counts[configuration].bonds === safeBonds &&
        counts[configuration].lonePairs === safePairs,
    ) ?? "AX4"
  );
};
const deriveCounts = (input: { configuration?: unknown }) => {
  const safe = normalize(input);
  return { ...safe, ...counts[safe.configuration] };
};
const deriveGeometry = (input: { configuration?: unknown }) => {
  const safe = deriveCounts(input);
  return geometries[`${safe.bonds}:${safe.lonePairs}`] ?? geometries["4:0"]!;
};
function initializeSpecification(): void {}
function initializeModel(): void {}
export {
  initializeModel as a,
  definition as c,
  deriveGeometry as i,
  maxLonePairs as n,
  deriveCounts as o,
  configurationFor as r,
  initializeSpecification as s,
  defaults as t,
};
