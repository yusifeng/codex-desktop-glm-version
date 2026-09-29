// Paper-chromatography teaching model. Release chunk: model-3cc878663baa.js.
import "@rchunk/rolldown-runtime";

type ChromatographyExample = "ink dyes" | "food coloring" | "leaf pigments";
interface ChromatographyInput { example?: string; development?: number; selectedComponent?: number }

const chromatographyExamples: ChromatographyExample[] = ["ink dyes", "food coloring", "leaf pigments"];
const rfValues = [0.2, 0.5, 0.8];
const maximumFrontDistanceCm = 10;
const calculatePaperChromatography = (input: ChromatographyInput) => {
  const example = chromatographyExamples.includes(input.example as ChromatographyExample)
    ? input.example as ChromatographyExample
    : "ink dyes";
  const development = Number.isFinite(input.development)
    ? Math.min(100, Math.max(1, input.development as number))
    : 72;
  const selectedComponent = Number.isFinite(input.selectedComponent)
    ? Math.min(2, Math.max(0, Math.round(input.selectedComponent as number)))
    : 1;
  const rf = rfValues[selectedComponent] ?? rfValues[1];
  const frontDistanceCm = development / 100 * maximumFrontDistanceCm;
  return { example, development, selectedComponent, frontDistanceCm, componentDistanceCm: frontDistanceCm * rf, rf, rfValues };
};
function initializePaperChromatographyModel(): void {}

export { calculatePaperChromatography as n, initializePaperChromatographyModel as r, chromatographyExamples as t };
