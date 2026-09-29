// Piano chord chart specification. Release chunk: type-f409ad2953b1.js.
import "@rchunk/rolldown-runtime";

type RootNote =
  "C" | "Db" | "D" | "Eb" | "E" | "F" | "F#" | "G" | "Ab" | "A" | "Bb" | "B";
interface Specification {
  type: "PIANO_CHORD_CHART";
  version: 2;
  thumbnailAssetKey: "piano-chord-chart-v2";
  parameters: {
    root_note: { kind: "enum"; defaultValue: "C"; allowedValues: RootNote[] };
    quality: {
      kind: "enum";
      defaultValue: "major";
      allowedValues: ["major", "minor"];
    };
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "PIANO_CHORD_CHART",
    version: 2,
    thumbnailAssetKey: "piano-chord-chart-v2",
    parameters: {
      root_note: {
        kind: "enum",
        defaultValue: "C",
        allowedValues: [
          "C",
          "Db",
          "D",
          "Eb",
          "E",
          "F",
          "F#",
          "G",
          "Ab",
          "A",
          "Bb",
          "B",
        ],
      },
      quality: {
        kind: "enum",
        defaultValue: "major",
        allowedValues: ["major", "minor"],
      },
    },
  };
}
export { specification as n, initializeSpecification as t };
