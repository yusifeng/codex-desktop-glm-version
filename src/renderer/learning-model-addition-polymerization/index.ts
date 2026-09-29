// Addition-polymerization learning model: normalize monomer and displayed repeat-unit count.
import "@rchunk/rolldown-runtime";

type Monomer = "chloroethene" | "ethene" | "propene" | "tetrafluoroethene";
interface PolymerValues { monomer?: string | null; unitStage?: number | null }
interface PolymerState {
  leftBottom: string;
  leftTop: string;
  monomer: Monomer;
  rightBottom: string;
  rightTop: string;
  units: number;
  unitStage: number;
}

const monomers: readonly Monomer[] = ["ethene", "propene", "chloroethene", "tetrafluoroethene"];
const repeatUnitCounts = [1, 2, 3, 4, 6] as const;
const isMonomer = (value: string | null | undefined): value is Monomer => monomers.some((monomer) => monomer === value);

function normalizePolymerValues(values: PolymerValues): PolymerState {
  const monomer = isMonomer(values.monomer) ? values.monomer : "ethene";
  const unitStage = Number.isFinite(values.unitStage)
    ? Math.min(repeatUnitCounts.length - 1, Math.max(0, Math.round(values.unitStage as number)))
    : 2;
  const [leftTop, leftBottom, rightTop, rightBottom] = {
    ethene: ["H", "H", "H", "H"],
    propene: ["H", "H", "CH₃", "H"],
    chloroethene: ["H", "H", "Cl", "H"],
    tetrafluoroethene: ["F", "F", "F", "F"],
  }[monomer];
  return {
    monomer,
    unitStage,
    units: repeatUnitCounts[unitStage] ?? 3,
    leftTop,
    leftBottom,
    rightTop,
    rightBottom,
  };
}

function initializeAdditionPolymerizationModel(): void {}

export { initializeAdditionPolymerizationModel as i, repeatUnitCounts as n, normalizePolymerValues as r, monomers as t };
