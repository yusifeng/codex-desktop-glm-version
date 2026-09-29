// ER-diagram to relational-table mapping learning model.
import "@rchunk/rolldown-runtime";

type RelationshipKind = "one-to-one" | "one-to-many" | "many-to-many";
interface ErMappingValues { relationship_kind?: unknown; include_relationship_attribute?: unknown; mappingStage?: number | null }
interface RelationalColumn { name: string; badges: string[]; mapped: boolean }
interface RelationalTable { name: string; columns: RelationalColumn[]; compositeKey: boolean; junction: boolean }

const erDiagramType = "ER_DIAGRAM_RELATIONAL_TABLES";
const erDiagramThumbnail = "er-diagram-relational-tables-v1";
const erDiagramParameters = {
  relationship_kind: { kind: "enum", defaultValue: "one-to-many" as RelationshipKind, allowedValues: ["one-to-one", "one-to-many", "many-to-many"] as RelationshipKind[] },
  include_relationship_attribute: { kind: "boolean", defaultValue: true },
};
const erDiagramDefinition = { type: erDiagramType, version: 2, thumbnailAssetKey: erDiagramThumbnail, parameters: erDiagramParameters };
const relationshipParameter = erDiagramDefinition.parameters.relationship_kind;
const relationshipAttributeParameter = erDiagramDefinition.parameters.include_relationship_attribute;
const relationshipKinds = relationshipParameter.allowedValues;
const defaultRelationshipKind = relationshipParameter.defaultValue;
const defaultErMappingValues = { relationship_kind: defaultRelationshipKind, include_relationship_attribute: relationshipAttributeParameter.defaultValue, mappingStage: 2 };
const isRelationshipKind = (value: unknown): value is RelationshipKind => relationshipKinds.some((kind) => kind === value);
const normalizeMappingStage = (value: number | null | undefined): number => typeof value === "number" && Number.isFinite(value) ? Math.min(2, Math.max(0, Math.round(value))) : defaultErMappingValues.mappingStage;
const normalizeErMappingValues = (values: ErMappingValues) => ({
  relationship_kind: isRelationshipKind(values.relationship_kind) ? values.relationship_kind : defaultRelationshipKind,
  include_relationship_attribute: typeof values.include_relationship_attribute === "boolean" ? values.include_relationship_attribute : relationshipAttributeParameter.defaultValue,
  mappingStage: normalizeMappingStage(values.mappingStage),
});
const instructorColumns: RelationalColumn[] = [{ name: "inst_id", badges: ["PK"], mapped: false }, { name: "name", badges: [], mapped: false }];
const courseColumns: RelationalColumn[] = [{ name: "course_id", badges: ["PK"], mapped: false }, { name: "title", badges: [], mapped: false }];
const relationshipAttributeColumns = (include: boolean): RelationalColumn[] => include ? [{ name: "assigned_on", badges: [], mapped: true }] : [];
const createTable = (name: string, columns: RelationalColumn[], compositeKey = false, junction = false): RelationalTable => ({ name, columns, compositeKey, junction });

function deriveRelationalTables(values: ErMappingValues): RelationalTable[] {
  const normalized = normalizeErMappingValues(values);
  if (normalized.mappingStage === 0) return [];
  const instructor = createTable("Instructor", instructorColumns);
  const course = createTable("Course", courseColumns);
  if (normalized.mappingStage === 1) return [instructor, course];
  if (normalized.relationship_kind === "many-to-many") {
    return [instructor, course, createTable("Teaches", [
      { name: "inst_id", badges: ["PK", "FK"], mapped: true },
      { name: "course_id", badges: ["PK", "FK"], mapped: true },
      ...relationshipAttributeColumns(normalized.include_relationship_attribute),
    ], true, true)];
  }
  const foreignKeyBadges = normalized.relationship_kind === "one-to-one" ? ["FK", "UNIQUE"] : ["FK"];
  return [instructor, createTable("Course", [
    ...courseColumns,
    { name: "inst_id", badges: foreignKeyBadges, mapped: true },
    ...relationshipAttributeColumns(normalized.include_relationship_attribute),
  ])];
}

const relationshipCardinality = (kind: RelationshipKind): [string, string] => kind === "one-to-one" ? ["1", "1"] : kind === "one-to-many" ? ["1", "N"] : ["M", "N"];
function initializeErDiagramSchema(): void {}
function initializeErDiagramModel(): void {}

export {
  relationshipCardinality as a,
  initializeErDiagramSchema as c,
  deriveRelationalTables as i,
  erDiagramDefinition as l,
  defaultRelationshipKind as n,
  initializeErDiagramModel as o,
  relationshipKinds as r,
  normalizeErMappingValues as s,
  defaultErMappingValues as t,
};
