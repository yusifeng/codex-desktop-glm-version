// Conjugated-diene conformation and progression through a Diels-Alder reaction.
import "@rchunk/rolldown-runtime";

type DielsAlderExample = "butadiene-and-ethene" | "butadiene-and-methyl-vinyl-ketone" | "butadiene-and-maleic-anhydride";
type DieneConformation = "s-cis" | "s-trans";
interface DielsAlderValues { example?: string | null; conformation?: string | null; stage?: number | null; product?: string }

const dielsAlderType = "CONJUGATED_DIENES_AND_DIELS_ALDER";
const dielsAlderThumbnail = "conjugated-dienes-and-diels-alder-v1";
const dielsAlderParameters = {
  example: { kind: "enum" as const, defaultValue: "butadiene-and-ethene" as DielsAlderExample, allowedValues: ["butadiene-and-ethene", "butadiene-and-methyl-vinyl-ketone", "butadiene-and-maleic-anhydride"] as DielsAlderExample[] },
};
const dielsAlderSpecification = { type: dielsAlderType, version: 2, thumbnailAssetKey: dielsAlderThumbnail, parameters: dielsAlderParameters };
const examples = dielsAlderSpecification.parameters.example.allowedValues;
const defaultExample = dielsAlderSpecification.parameters.example.defaultValue;
const products: Record<DielsAlderExample, string> = {
  "butadiene-and-ethene": "cyclohexene",
  "butadiene-and-maleic-anhydride": "cyclohexene anhydride",
  "butadiene-and-methyl-vinyl-ketone": "acetylcyclohexene",
};
const defaultDielsAlderValues = () => ({ conformation: "s-cis" as DieneConformation, example: defaultExample, stage: 1 });
const isExample = (value: unknown): value is DielsAlderExample => examples.some((example) => example === value);
const normalizeDielsAlderValues = (values: DielsAlderValues) => {
  const example = isExample(values.example) ? values.example : defaultExample;
  const conformation: DieneConformation = values.conformation === "s-trans" ? "s-trans" : "s-cis";
  const stage = Math.min(2, Math.max(0, Math.round(Number.isFinite(values.stage) ? values.stage ?? 1 : 1)));
  return { conformation, example, product: products[example], stage: conformation === "s-trans" ? 0 : stage };
};
const setDieneConformation = (values: DielsAlderValues, conformation: DieneConformation) => ({ ...values, conformation, stage: conformation === "s-trans" ? 0 : values.stage });
const setDielsAlderStage = (values: DielsAlderValues, stage: number) => ({ ...values, conformation: stage > 0 ? "s-cis" as DieneConformation : values.conformation, stage });

function initializeDielsAlderSpecification(): void {}
function initializeDielsAlderModel(): void {}

export { setDielsAlderStage as a, setDieneConformation as i, defaultDielsAlderValues as n, initializeDielsAlderSpecification as o, initializeDielsAlderModel as r, dielsAlderSpecification as s, normalizeDielsAlderValues as t };
