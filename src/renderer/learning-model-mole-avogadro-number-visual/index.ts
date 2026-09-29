// Mole and Avogadro-number visualization metadata. Release chunk: type-bd9c85267933.js.
import "@rchunk/rolldown-runtime";
type Substance = "carbon" | "copper" | "water";
interface Specification {
  type: "MOLE_AVOGADRO_NUMBER_VISUAL";
  version: 1;
  thumbnailAssetKey: "mole-avogadro-number-visual-v1";
  parameters: {
    substance: {
      kind: "enum";
      defaultValue: Substance;
      allowedValues: Substance[];
    };
    initial_moles: { kind: "number"; defaultValue: 1; min: 0.25; max: 5 };
  };
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "MOLE_AVOGADRO_NUMBER_VISUAL",
    version: 1,
    thumbnailAssetKey: "mole-avogadro-number-visual-v1",
    parameters: {
      substance: {
        kind: "enum",
        defaultValue: "copper",
        allowedValues: ["carbon", "copper", "water"],
      },
      initial_moles: { kind: "number", defaultValue: 1, min: 0.25, max: 5 },
    },
  };
}
export { specification as n, initialize as t };
