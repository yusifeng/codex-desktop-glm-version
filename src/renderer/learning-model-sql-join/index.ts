// INNER, LEFT, RIGHT, and FULL joins over two small customer tables.
import "@rchunk/rolldown-runtime";

type JoinType = "inner" | "left" | "right" | "full";
interface SqlJoinValues { joinType?: unknown }
interface LeftRow { rowRef: string; customerId: number; customer: string }
interface RightRow { rowRef: string; customerId: number; level: string }

const sqlJoinType = "SQL_JOIN";
const sqlJoinThumbnail = "sql-join-v1";
const sqlJoinParameters = { joinType: { kind: "enum" as const, defaultValue: "inner" as JoinType, allowedValues: ["inner", "left", "right", "full"] as JoinType[] } };
const sqlJoinSpecification = { type: sqlJoinType, version: 1, thumbnailAssetKey: sqlJoinThumbnail, parameters: sqlJoinParameters };
const joinTypeParameter = sqlJoinSpecification.parameters.joinType;
const joinTypes = joinTypeParameter.allowedValues;
const defaultJoinType = joinTypeParameter.defaultValue;
const defaultSqlJoinValues = { joinType: defaultJoinType };
const leftRows: LeftRow[] = [
  { rowRef: "L1", customerId: 1, customer: "Ava" },
  { rowRef: "L2", customerId: 2, customer: "Bo" },
  { rowRef: "L3", customerId: 4, customer: "Dee" },
];
const rightRows: RightRow[] = [
  { rowRef: "R1", customerId: 1, level: "Gold" },
  { rowRef: "R2", customerId: 3, level: "Silver" },
  { rowRef: "R3", customerId: 4, level: "Bronze" },
];
const isJoinType = (value: unknown): value is JoinType => joinTypes.some((joinType) => joinType === value);
const normalizeSqlJoinValues = (values: SqlJoinValues) => ({ joinType: isJoinType(values.joinType) ? values.joinType : defaultJoinType });
const shouldIncludeJoinRow = (joinType: JoinType, left: LeftRow | undefined, right: RightRow | undefined): boolean =>
  left && right ? true : left ? joinType === "left" || joinType === "full" : joinType === "right" || joinType === "full";
const joinRows = (leftTable: LeftRow[], rightTable: RightRow[], joinType: JoinType) => {
  const leftByCustomer = new Map(leftTable.map((row) => [row.customerId, row]));
  const rightByCustomer = new Map(rightTable.map((row) => [row.customerId, row]));
  return [...new Set([...leftByCustomer.keys(), ...rightByCustomer.keys()])].sort((left, right) => left - right).flatMap((customerId) => {
    const left = leftByCustomer.get(customerId);
    const right = rightByCustomer.get(customerId);
    return shouldIncludeJoinRow(joinType, left, right)
      ? [{ key: customerId, left: left ?? null, right: right ?? null, kind: left && right ? "matched" : left ? "left-only" : "right-only" }]
      : [];
  });
};

function initializeSqlJoinSpecification(): void {}
function initializeSqlJoinModel(): void {}

export { joinTypes as a, normalizeSqlJoinValues as c, rightRows as i, initializeSqlJoinSpecification as l, defaultJoinType as n, initializeSqlJoinModel as o, leftRows as r, joinRows as s, defaultSqlJoinValues as t, sqlJoinSpecification as u };
