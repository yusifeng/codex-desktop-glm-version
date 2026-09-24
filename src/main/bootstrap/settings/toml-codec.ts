// TOML 设置值编解码：zod schema 引导下的 JSON 值 ↔ TOML 值互转。
// TOML 不支持 null/undefined：写方向（原 ye/xe）丢弃 null（数组内 / 动态字段
// 中的 null 直接抛错），读方向（原 be/Se）为缺失的可空字段补 null。
// 对应 bootstrap-C4dRql4x.ts 130-188 行（_e/ve/ye/be/xe/Se/k/Ce）。
import {
  af as arraySchemaClass, // ZodArray（.element）
  cf as objectSchemaClass, // ZodObject（.shape）
  lf as optionalSchemaClass, // ZodOptional（.unwrap）
  of as defaultSchemaClass, // ZodDefault（.unwrap）
  sf as nullableSchemaClass, // ZodNullable（.unwrap）
  uf as recordSchemaClass, // ZodRecord（.valueType）
} from "@chunk/shared";

const NULL_IN_ARRAYS_MESSAGE = "TOML-backed settings cannot contain null inside arrays"; // _e
const NULL_IN_DYNAMIC_FIELDS_MESSAGE =
  "TOML-backed settings cannot contain null in dynamic object fields"; // ve

/**
 * JSON 设置值 → TOML 值（原 ye；写设置前的编码）。
 * 经 SettingsStore 落盘前调用：丢弃 null/undefined，数组与动态字段遇到 null 抛错。
 */
export function encodeSettingsForToml(schema: any, value: any): any {
  return jsonToTomlValue(unwrapSchema(schema), value);
}

/**
 * TOML 值 → JSON 设置值（原 be；读设置后的解码）。
 * 为 schema 中声明可空但 TOML 中缺失的字段补 null。
 */
export function decodeSettingsFromToml(schema: any, value: any): any {
  return tomlToJsonValue(unwrapSchema(schema), value);
}

/** JSON 值 → TOML 值（原 xe）。 */
function jsonToTomlValue(schema: any, value: any): any {
  if (value == null) return null;
  if (typeof value === "boolean" || typeof value === "number" || typeof value === "string")
    return value;
  if (Array.isArray(value)) {
    if (value.some((item) => item == null)) throw Error(NULL_IN_ARRAYS_MESSAGE);
    const elementSchema =
      schema instanceof arraySchemaClass ? unwrapSchema(schema.element) : undefined;
    return value.map((item) => jsonToTomlValue(elementSchema, item));
  }
  if (!isPlainObject(value)) throw Error("TOML-backed settings must be JSON-compatible");
  if (schema instanceof recordSchemaClass)
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => {
        if (item == null) throw Error(NULL_IN_DYNAMIC_FIELDS_MESSAGE);
        return [key, jsonToTomlValue(unwrapSchema(schema.valueType), item)];
      }),
    );
  const objectSchema = schema instanceof objectSchemaClass ? schema : null;
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, item]) => {
      if (item === undefined) return [];
      const fieldSchema = objectSchema?.shape[key];
      if (item == null) {
        if (fieldSchema == null) throw Error(NULL_IN_DYNAMIC_FIELDS_MESSAGE);
        return [];
      }
      return [[key, jsonToTomlValue(fieldSchema == null ? undefined : unwrapSchema(fieldSchema), item)]];
    }),
  );
}

/** TOML 值 → JSON 值（原 Se）。 */
function tomlToJsonValue(schema: any, value: any): any {
  if (Array.isArray(value)) {
    const elementSchema =
      schema instanceof arraySchemaClass ? unwrapSchema(schema.element) : undefined;
    return value.map((item) => tomlToJsonValue(elementSchema, item));
  }
  if (!isPlainObject(value)) return value;
  if (schema instanceof recordSchemaClass)
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        tomlToJsonValue(unwrapSchema(schema.valueType), item),
      ]),
    );
  if (!(schema instanceof objectSchemaClass)) return value;
  const result = Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      tomlToJsonValue(
        schema.shape[key] == null ? undefined : unwrapSchema(schema.shape[key]),
        item,
      ),
    ]),
  );
  for (const [key, fieldSchema] of Object.entries<any>(schema.shape))
    if (!Object.prototype.hasOwnProperty.call(result, key) && fieldSchema.isNullable())
      result[key] = null;
  return result;
}

/** 剥掉 default/nullable/optional 包装，取内层 schema（原 k）。 */
function unwrapSchema(schema: any): any {
  return schema instanceof defaultSchemaClass ||
    schema instanceof nullableSchemaClass ||
    schema instanceof optionalSchemaClass
    ? unwrapSchema(schema.unwrap())
    : schema;
}

/** 是否为非数组的普通对象（原 Ce）。 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && !!value && !Array.isArray(value);
}
