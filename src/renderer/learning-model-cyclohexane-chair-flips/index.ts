// Cyclohexane chair-flip model: classify substituents as axial or equatorial.
import "@rchunk/rolldown-runtime";

type Chair = "A" | "B";
type CyclohexaneExample = "methylcyclohexane" | "cis-1,2-dimethylcyclohexane" | "trans-1,2-dimethylcyclohexane";
interface ChairInput { example?: string; flipped?: boolean }
interface Substituent { carbon: number; orientation: "up" | "down" }

const cyclohexaneExamples: readonly CyclohexaneExample[] = ["methylcyclohexane", "cis-1,2-dimethylcyclohexane", "trans-1,2-dimethylcyclohexane"];
const isExample = (value: string | undefined): value is CyclohexaneExample => cyclohexaneExamples.some((example) => example === value);
const normalizeChairInput = (input: ChairInput) => ({ example: isExample(input.example) ? input.example : "methylcyclohexane" as CyclohexaneExample, flipped: input.flipped === true });
const substituentsForExample = (example: CyclohexaneExample): Substituent[] => example === "methylcyclohexane"
  ? [{ carbon: 1, orientation: "up" }]
  : [{ carbon: 1, orientation: "up" }, { carbon: 2, orientation: example === "cis-1,2-dimethylcyclohexane" ? "up" : "down" }];
const axialOrientation = (carbon: number, chair: Chair): "up" | "down" => carbon % 2 === 1 === (chair === "A") ? "up" : "down";
const positionSubstituents = (example: CyclohexaneExample, chair: Chair) => substituentsForExample(example).map((substituent) => ({ ...substituent, position: axialOrientation(substituent.carbon, chair) === substituent.orientation ? "axial" as const : "equatorial" as const }));
const countAxialSubstituents = (substituents: ReturnType<typeof positionSubstituents>): number => substituents.filter(({ position }) => position === "axial").length;
const exampleClass = (example: CyclohexaneExample): "mono" | "cis" | "trans" => example === "methylcyclohexane" ? "mono" : example === "cis-1,2-dimethylcyclohexane" ? "cis" : "trans";
function initializeCyclohexaneChairFlipsModel(): void {}

export { initializeCyclohexaneChairFlipsModel as a, axialOrientation as i, positionSubstituents as n, exampleClass as o, countAxialSubstituents as r, normalizeChairInput as s, cyclohexaneExamples as t };
