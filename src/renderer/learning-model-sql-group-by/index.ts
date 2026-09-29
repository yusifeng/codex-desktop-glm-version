// SQL GROUP BY model using a small customer table.
import "@rchunk/rolldown-runtime";

type GroupByColumn = "country" | "age";
interface SqlGroupByValues { groupBy?: unknown }
interface Customer { customerId: number; name: string; age: number; country: string }

const sqlGroupByType = "SQL_GROUP_BY";
const sqlGroupByThumbnail = "sql-group-by-v1";
const sqlGroupByParameters = {
  groupBy: { kind: "enum" as const, defaultValue: "country" as GroupByColumn, allowedValues: ["country", "age"] as GroupByColumn[] },
};
const sqlGroupBySpecification = { type: sqlGroupByType, version: 1, thumbnailAssetKey: sqlGroupByThumbnail, parameters: sqlGroupByParameters };
const customers: Customer[] = [
  { customerId: 1, name: "Betty", age: 22, country: "UAE" },
  { customerId: 2, name: "David", age: 22, country: "UK" },
  { customerId: 3, name: "Maria", age: 25, country: "UK" },
  { customerId: 4, name: "Robert", age: 28, country: "USA" },
  { customerId: 5, name: "John", age: 31, country: "USA" },
];
const groupByParameter = sqlGroupBySpecification.parameters.groupBy;
const groupByColumns = groupByParameter.allowedValues;
const defaultGroupByColumn = groupByParameter.defaultValue;
const isGroupByColumn = (value: unknown): value is GroupByColumn => groupByColumns.some((column) => column === value);
const normalizeSqlGroupByValues = (values: SqlGroupByValues) => ({ groupBy: isGroupByColumn(values.groupBy) ? values.groupBy : defaultGroupByColumn });
const groupKey = (customer: Customer, column: GroupByColumn): string => String(customer[column]);
const groupCustomers = (rows: Customer[], column: GroupByColumn) => {
  const groups = new Map<string, { key: string; count: number; rowIndexes: number[] }>();
  rows.forEach((customer, rowIndex) => {
    const key = groupKey(customer, column);
    const group = groups.get(key);
    if (group) { group.count += 1; group.rowIndexes.push(rowIndex); return; }
    groups.set(key, { key, count: 1, rowIndexes: [rowIndex] });
  });
  return [...groups.values()];
};
const sqlGroupByQuery = (column: GroupByColumn): string =>
  ["SELECT " + column + ", COUNT(*) AS customer_count", "FROM customers", "GROUP BY " + column + ";"].join(String.fromCharCode(10));

function initializeSqlGroupBySpecification(): void {}
function initializeSqlGroupByModel(): void {}

export { groupKey as a, normalizeSqlGroupByValues as c, sqlGroupByQuery as i, initializeSqlGroupBySpecification as l, defaultGroupByColumn as n, groupCustomers as o, groupByColumns as r, initializeSqlGroupByModel as s, customers as t, sqlGroupBySpecification as u };
