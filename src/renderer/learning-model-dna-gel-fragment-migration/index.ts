// DNA-gel fragment-migration manifest. Release chunk: type-d83a95defdf3.js.
import "@rchunk/rolldown-runtime";

const dnaGelFragmentMigrationSpecification = {
  type: "DNA_GEL_FRAGMENT_MIGRATION",
  version: 1,
  thumbnailAssetKey: "dna-gel-fragment-migration-v1",
  parameters: {
    runTimeMinutes: { kind: "integer" as const, defaultValue: 18, min: 1, max: 40 },
    fragmentSizeBasePairs: { kind: "integer" as const, defaultValue: 700, min: 100, max: 2_000 },
  },
};

function initializeDnaGelFragmentMigrationSpecification(): void {}

export { dnaGelFragmentMigrationSpecification as n, initializeDnaGelFragmentMigrationSpecification as t };
