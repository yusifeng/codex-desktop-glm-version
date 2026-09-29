// Restriction-enzyme map and digest-fragment learning model. Release chunk: model-6e039b1d844f.js.
import "@rchunk/rolldown-runtime";

type MoleculeTopology = "circular plasmid" | "linear DNA";
type Enzyme = "A" | "B";
interface RestrictionValues { molecule_topology?: string | null; digest?: number | null }
interface RestrictionSite { enzyme: Enzyme; position: number }
interface RestrictionManifest {
  type: string; version: number; thumbnailAssetKey: string;
  parameters: { molecule_topology: { kind: "enum"; defaultValue: MoleculeTopology; allowedValues: MoleculeTopology[] } };
}

let restrictionMapManifest: RestrictionManifest;
let moleculeLength: number;
let restrictionSites: RestrictionSite[];
let topologyOptions: MoleculeTopology[];
let defaultTopology: MoleculeTopology;
let siteIncludedInDigest: (enzyme: Enzyme, digest: number) => boolean;
let gelMigrationPosition: (fragmentSize: number) => number;
let calculateRestrictionDigest: (values: RestrictionValues) => {
  safeValues: { molecule_topology: MoleculeTopology; digest: number };
  lanes: { digest: number; fragments: number[]; bands: { size: number; count: number }[] }[];
  selectedLane: { digest: number; fragments: number[]; bands: { size: number; count: number }[] };
  activeSites: RestrictionSite[];
};
let manifestInitialized = false;
let modelInitialized = false;

function initializeRestrictionMapManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  restrictionMapManifest = {
    type: "RESTRICTION_ENZYME_MAP", version: 3, thumbnailAssetKey: "restriction-enzyme-map-v1",
    parameters: {
      molecule_topology: { kind: "enum", defaultValue: "circular plasmid", allowedValues: ["circular plasmid", "linear DNA"] },
    },
  };
}

function initializeRestrictionEnzymeMapModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializeRestrictionMapManifest();
  moleculeLength = 6_000;
  restrictionSites = [
    { enzyme: "A", position: 1_000 }, { enzyme: "B", position: 2_500 }, { enzyme: "A", position: 4_000 },
  ];
  const topologyParameter = restrictionMapManifest.parameters.molecule_topology;
  const isTopology = (value: unknown): value is MoleculeTopology =>
    typeof value === "string" && topologyParameter.allowedValues.some(topology => topology === value);
  topologyOptions = topologyParameter.allowedValues.filter(isTopology);
  defaultTopology = isTopology(topologyParameter.defaultValue) ? topologyParameter.defaultValue : "circular plasmid";
  const normalizeValues = (values: RestrictionValues) => ({
    molecule_topology: isTopology(values.molecule_topology) ? values.molecule_topology : defaultTopology,
    digest: values.digest === 0 || values.digest === 1 || values.digest === 2 ? values.digest : 2,
  });
  siteIncludedInDigest = (enzyme, digest) => digest === 2 || (digest === 0 ? enzyme === "A" : enzyme === "B");
  const fragmentSizes = (topology: MoleculeTopology, digest: number): number[] => {
    const positions = restrictionSites
      .filter(site => siteIncludedInDigest(site.enzyme, digest))
      .map(site => site.position)
      .sort((left, right) => left - right);
    if (topology === "linear DNA") {
      const starts = [0, ...positions];
      return [0, ...positions, moleculeLength].slice(1).map((position, index) => position - starts[index]);
    }
    if (positions.length <= 1) return [moleculeLength];
    return positions.map((position, index) => {
      const nextPosition = positions[(index + 1) % positions.length];
      return nextPosition > position ? nextPosition - position : moleculeLength - position + nextPosition;
    });
  };
  const bandsFor = (fragments: number[]): { size: number; count: number }[] =>
    Array.from(new Set(fragments)).sort((left, right) => right - left)
      .map(size => ({ size, count: fragments.filter(fragment => fragment === size).length }));
  gelMigrationPosition = fragmentSize => Math.log(moleculeLength / fragmentSize) / Math.log(moleculeLength / 1_000);
  calculateRestrictionDigest = values => {
    const safeValues = normalizeValues(values);
    const lanes = [0, 1, 2].map(digest => {
      const fragments = fragmentSizes(safeValues.molecule_topology, digest);
      return { digest, fragments, bands: bandsFor(fragments) };
    });
    return {
      safeValues, lanes, selectedLane: lanes[safeValues.digest],
      activeSites: restrictionSites.filter(site => siteIncludedInDigest(site.enzyme, safeValues.digest)),
    };
  };
}

export {
  calculateRestrictionDigest as a, gelMigrationPosition as c, moleculeLength as i, initializeRestrictionMapManifest as l,
  defaultTopology as n, initializeRestrictionEnzymeMapModel as o, topologyOptions as r,
  siteIncludedInDigest as s, restrictionSites as t, restrictionMapManifest as u,
};
