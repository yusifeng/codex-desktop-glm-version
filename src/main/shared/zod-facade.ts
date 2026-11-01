// shared chunk 的 Zod 导出兼容面。
//
// 原始 chunk 内嵌 Zod v4；仓库当前依赖 Zod v3，因此这里按原始导出表提供
// 等价构造器/类，而不是继续传播压缩名。映射已经逐项从
// `.reference/originals/main/src-DldfpmrL.ts` 的最终 exports getter 核实。

import {
  z,
  ZodArray,
  ZodDefault,
  ZodError,
  ZodNullable,
  ZodObject,
  ZodOptional,
  ZodRecord,
} from "zod";

type JsonSchema = boolean | { [key: string]: unknown };
type ZodLike = {
  _def?: Record<string, any>;
  description?: string;
};

const uuidSchema = (options?: any) => z.string().uuid(options);
const urlSchema = (options?: any) => z.string().url(options);
const isoDateSchema = (options?: any) => z.string().date(options);
const isoDateTimeSchema = (options?: any) => z.string().datetime(options);
const stringSchema = z.string;
const booleanSchema = z.boolean;
const numberSchema = z.number;
const unknownSchema = z.unknown;
const tupleSchema = z.tuple;
const recordSchema = z.record;
const discriminatedUnionSchema = z.discriminatedUnion;
const arraySchema = z.array;
const unionSchema = z.union;
const preprocessSchema = z.preprocess;
const customSchema = z.custom;
const instanceOfSchema = z.instanceof;
const literalSchema = z.literal;
const neverSchema = z.never;
const enumSchema = z.enum;
const undefinedSchema = z.undefined;
const nullSchema = z.null;
const objectSchema = z.object;
const coercedNumberSchema = z.coerce.number;
const strictObjectSchema = (shape: z.ZodRawShape, options?: any) =>
  z.object(shape, options).strict();
const looseObjectSchema = (shape: z.ZodRawShape, options?: any) =>
  z.object(shape, options).passthrough();

/** 原 `yf = ch`：递归 JSON value schema，而不是 `z.any()`。 */
const jsonSchema = () => {
  let schema: z.ZodType<unknown>;
  schema = z.lazy(() =>
    z.union([
      z.string(),
      z.number(),
      z.boolean(),
      z.null(),
      z.array(schema),
      z.record(z.string(), schema),
    ]),
  );
  return schema;
};

function jsonTypeForLiteral(value: unknown): string | undefined {
  if (value === null) return "null";
  if (["string", "number", "boolean"].includes(typeof value)) return typeof value;
  return undefined;
}

/**
 * Zod v3 lacks Zod v4's built-in `toJSONSchema`; cover the schema kinds used by
 * first-party main modules so the original module-load validation remains real.
 */
function toJSONSchema(schema: ZodLike): JsonSchema {
  const memo = new WeakMap<object, JsonSchema>();
  const convertFresh = (current: ZodLike): JsonSchema => {
    if (current == null || typeof current !== "object") return {};
    const definition = current._def ?? {};
    const description = current.description == null ? {} : { description: current.description };
    switch (definition.typeName) {
      case z.ZodFirstPartyTypeKind.ZodString: {
        const result: Record<string, unknown> = { type: "string", ...description };
        for (const check of definition.checks ?? []) {
          if (check.kind === "min") result.minLength = check.value;
          else if (check.kind === "max") result.maxLength = check.value;
          else if (check.kind === "email") result.format = "email";
          else if (check.kind === "url") result.format = "uri";
          else if (check.kind === "uuid") result.format = "uuid";
          else if (check.kind === "datetime") result.format = "date-time";
          else if (check.kind === "date") result.format = "date";
          else if (check.kind === "regex") result.pattern = check.regex.source;
        }
        return result;
      }
      case z.ZodFirstPartyTypeKind.ZodNumber: {
        const result: Record<string, unknown> = { type: "number", ...description };
        for (const check of definition.checks ?? []) {
          if (check.kind === "int") result.type = "integer";
          else if (check.kind === "min") result[check.inclusive ? "minimum" : "exclusiveMinimum"] = check.value;
          else if (check.kind === "max") result[check.inclusive ? "maximum" : "exclusiveMaximum"] = check.value;
        }
        return result;
      }
      case z.ZodFirstPartyTypeKind.ZodBoolean:
        return { type: "boolean", ...description };
      case z.ZodFirstPartyTypeKind.ZodNull:
        return { type: "null", ...description };
      case z.ZodFirstPartyTypeKind.ZodLiteral:
        return { const: definition.value, type: jsonTypeForLiteral(definition.value), ...description };
      case z.ZodFirstPartyTypeKind.ZodEnum:
        return { type: "string", enum: definition.values, ...description };
      case z.ZodFirstPartyTypeKind.ZodArray:
        return { type: "array", items: convert(definition.type), ...description };
      case z.ZodFirstPartyTypeKind.ZodTuple:
        return {
          type: "array",
          prefixItems: definition.items.map(convert),
          minItems: definition.items.length,
          ...(definition.rest == null
            ? { maxItems: definition.items.length }
            : { items: convert(definition.rest) }),
          ...description,
        };
      case z.ZodFirstPartyTypeKind.ZodRecord:
        return { type: "object", additionalProperties: convert(definition.valueType), ...description };
      case z.ZodFirstPartyTypeKind.ZodObject: {
        const shape = definition.shape();
        const properties = Object.fromEntries(
          Object.entries(shape).map(([key, value]) => [key, convert(value as ZodLike)]),
        );
        const required = Object.entries(shape)
          .filter(([, value]) => !(value as any).isOptional?.())
          .map(([key]) => key);
        return {
          type: "object",
          properties,
          ...(required.length === 0 ? {} : { required }),
          additionalProperties:
            definition.catchall?._def?.typeName !== z.ZodFirstPartyTypeKind.ZodNever
              ? convert(definition.catchall)
              : definition.unknownKeys === "passthrough",
          ...description,
        };
      }
      case z.ZodFirstPartyTypeKind.ZodUnion:
        return { anyOf: definition.options.map(convert), ...description };
      case z.ZodFirstPartyTypeKind.ZodDiscriminatedUnion:
        return { oneOf: [...definition.options.values()].map(convert), ...description };
      case z.ZodFirstPartyTypeKind.ZodOptional:
      case z.ZodFirstPartyTypeKind.ZodDefault:
      case z.ZodFirstPartyTypeKind.ZodReadonly:
      case z.ZodFirstPartyTypeKind.ZodBranded:
        return convert(definition.innerType ?? definition.type);
      case z.ZodFirstPartyTypeKind.ZodNullable:
        return { anyOf: [convert(definition.innerType), { type: "null" }], ...description };
      case z.ZodFirstPartyTypeKind.ZodEffects:
        return convert(definition.schema);
      case z.ZodFirstPartyTypeKind.ZodLazy:
        return convert(definition.getter());
      case z.ZodFirstPartyTypeKind.ZodDate:
        return { type: "string", format: "date-time", ...description };
      case z.ZodFirstPartyTypeKind.ZodNever:
        return false;
      default:
        return description;
    }
  };
  function convert(current: ZodLike): JsonSchema {
    if (current == null || typeof current !== "object") return {};
    const cached = memo.get(current as object);
    if (cached != null) return cached;
    // Break recursive schema cycles; non-recursive repeated schemas are replaced
    // with the completed cached value after their first conversion.
    memo.set(current as object, {});
    const converted = convertFresh(current);
    memo.set(current as object, converted);
    return converted;
  }
  return convert(schema);
}

// Zod v3 没有 ZodTemplateLiteral。当前源码没有该别名 consumer；保留一个
// 接受同签名、至少强制 string 的兼容构造器，避免把它错误映射成 void。
const templateLiteralSchema = (_parts: readonly unknown[], options?: any) =>
  z.string(options);

// 原始 Zod v4 类导出；settings TOML codec 用它们做 instanceof/unwrap。
const zodArrayClass = ZodArray;
const zodObjectClass = ZodObject;
const zodOptionalClass = ZodOptional;
const zodNullableClass = ZodNullable;
const zodDefaultClass = ZodDefault;
const zodRecordClass = ZodRecord;

export {
  // 基础构造器
  z as rf,
  stringSchema as Of,
  booleanSchema as gf,
  numberSchema as Cf,
  uuidSchema as Pf,
  urlSchema as Nf,
  ZodError as Ff,
  unknownSchema as Mf,
  isoDateSchema as If,
  isoDateTimeSchema as Lf,
  // 组合 schema
  tupleSchema as Af,
  recordSchema as Ef,
  discriminatedUnionSchema as vf,
  looseObjectSchema as xf,
  strictObjectSchema as Df,
  toJSONSchema as Rf,
  arraySchema as hf,
  zodRecordClass as uf,
  unionSchema as jf,
  templateLiteralSchema as kf,
  preprocessSchema as Tf,
  customSchema as _f,
  instanceOfSchema as ff,
  // schema 类
  zodOptionalClass as lf,
  zodNullableClass as sf,
  zodDefaultClass as of,
  zodArrayClass as af,
  zodObjectClass as cf,
  // 其余构造器
  literalSchema as bf,
  neverSchema as Sf,
  enumSchema as df,
  undefinedSchema as mf,
  nullSchema as pf,
  objectSchema as wf,
  jsonSchema as yf,
  coercedNumberSchema as if,
  // 仍有旧声明引用该内部 ISO date 符号；没有独立运行时 consumer。
  isoDateSchema as Gd,
};
