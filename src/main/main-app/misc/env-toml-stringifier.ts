// 自定义 TOML 序列化器（原 main-C-Mhak1n.ts 788-903 行的
// `Ut/Wt/aee/Gt/Kt/oee/see/qt/Jt/Yt`）。
//
// 职责：把 JS 对象序列化为 TOML 文本（写 app-server 环境配置 / codex CLI 的
// config.toml 片段用）。特性：
//   - 顶层与嵌套表输出 `[section]` / `[a.b]` 块；对象数组输出
//     `[[section]]` 块（数组元素须全为对象且非空）；
//   - 值：number（NaN→nan、±Infinity→±inf、整数在 numbersAsFloat 或非安全
//     整数时补 `.0`）、bigint/boolean、string（JSON 转义 + \x7f→\u007f）、
//     date（ISO，非法抛 TypeError）、内联 object/array（`{ }` / `[ ]`）；
//   - null/undefined 值跳过；symbol/function 抛 TypeError；数组内
//     null/undefined 抛 TypeError；
//   - 键：bare（/^[a-z0-9-_]+$/i）原样，否则 JSON 字符串引号；
//   - maxDepth（默认 1000）防递归失控。
//
// 本模块无模块加载期副作用。

/** bare 键判定（原 `Ut`）。 */
const BARE_KEY_PATTERN = /^[a-z0-9-_]+$/i;

/** 值的 TOML 类型（原 `Wt`）。 */
function tomlTypeOf(value: unknown): string {
  const type = typeof value;
  if (type === `object`) {
    if (Array.isArray(value)) return `array`;
    if (value instanceof Date) return `date`;
  }
  return type;
}

/** 数组元素是否全为非空对象（原 `aee`）。 */
function isArrayOfTables(value: unknown[]): boolean {
  for (let i = 0; i < value.length; i++) if (tomlTypeOf(value[i]) !== `object`) return false;
  return value.length != 0;
}

/** 字符串转义（JSON.stringify + DEL 字符转 \u007f，原 `Gt`）。 */
function encodeString(value: string): string {
  return JSON.stringify(value).replace(/\x7f/g, `\\u007f`);
}

/** 单值序列化（原 `Kt`）。 */
function stringifyValue(value: unknown, type: string, depth: number, numbersAsFloat: boolean): string {
  if (depth === 0) throw new Error(`Could not stringify the object: maximum object depth exceeded`);
  if (type === `number`) {
    const num = value as number;
    if (isNaN(num)) return `nan`;
    if (num === Infinity) return `inf`;
    if (num === -Infinity) return `-inf`;
    return Number.isInteger(num) && (numbersAsFloat || !Number.isSafeInteger(num))
      ? num.toFixed(1)
      : num.toString();
  }
  if (type === `bigint` || type === `boolean`) return String(value);
  if (type === `string`) return encodeString(value as string);
  if (type === `date`) {
    if (isNaN((value as Date).getTime())) throw new TypeError(`cannot serialize invalid date`);
    return (value as Date).toISOString();
  }
  if (type === `object`) return stringifyInlineObject(value as Record<string, unknown>, depth, numbersAsFloat);
  if (type === `array`) return stringifyInlineArray(value as unknown[], depth, numbersAsFloat);
  // symbol/function 等不可序列化类型（原版在键遍历处抛错；此处兜底同语义）
  throw new TypeError(`cannot serialize values of type '${type}'`);
}

/** 内联对象 `{ k = v, ... }`（原 `oee`）。 */
function stringifyInlineObject(value: Record<string, unknown>, depth: number, numbersAsFloat: boolean): string {
  const keys = Object.keys(value);
  if (keys.length === 0) return `{}`;
  let out = `{ `;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (i) out += `, `;
    out += BARE_KEY_PATTERN.test(key) ? key : encodeString(key);
    out += ` = `;
    out += stringifyValue(value[key], tomlTypeOf(value[key]), depth - 1, numbersAsFloat);
  }
  return out + ` }`;
}

/** 内联数组 `[ v, ... ]`（原 `see`；元素不可为 null/undefined）。 */
function stringifyInlineArray(value: unknown[], depth: number, numbersAsFloat: boolean): string {
  if (value.length === 0) return `[]`;
  let out = `[ `;
  for (let i = 0; i < value.length; i++) {
    if (i) out += `, `;
    if (value[i] === null || value[i] === undefined)
      throw new TypeError(`arrays cannot contain null or undefined values`);
    out += stringifyValue(value[i], tomlTypeOf(value[i]), depth - 1, numbersAsFloat);
  }
  return out + ` ]`;
}

/** 数组表 `[[section]]` 块序列化（原 `qt`）。 */
function stringifyArrayOfTables(
  value: Record<string, unknown>[],
  sectionPath: string,
  depth: number,
  numbersAsFloat: boolean,
): string {
  if (depth === 0) throw new Error(`Could not stringify the object: maximum object depth exceeded`);
  let out = ``;
  for (let i = 0; i < value.length; i++) {
    out += `${out && `\n` }[[${sectionPath}]]\n`;
    out += stringifyTable(``, value[i], sectionPath, depth, numbersAsFloat);
  }
  return out;
}

/**
 * 单个表的键值序列化（原 `Jt`）：
 * 标量键直接 `k = v`；嵌套对象递归为 `[a.b]` 块（追加在标量之后）；
 * 对象数组递归为 `[[a.b]]` 块。返回无表头的键值文本 + 子表块。
 */
function stringifyTable(
  parentPath: string,
  table: Record<string, unknown>,
  sectionPath: string,
  depth: number,
  numbersAsFloat: boolean,
): string {
  if (depth === 0) throw new Error(`Could not stringify the object: maximum object depth exceeded`);
  let scalars = ``;
  let subTables = ``;
  const keys = Object.keys(table);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (table[key] !== null && table[key] !== undefined) {
      const type = tomlTypeOf(table[key]);
      if (type === `symbol` || type === `function`)
        throw new TypeError(`cannot serialize values of type '${type}'`);
      const encodedKey = BARE_KEY_PATTERN.test(key) ? key : encodeString(key);
      if (type === `array` && isArrayOfTables(table[key] as unknown[]))
        subTables +=
          (subTables && `\n`) +
          stringifyArrayOfTables(
            table[key] as Record<string, unknown>[],
            sectionPath ? `${sectionPath}.${encodedKey}` : encodedKey,
            depth - 1,
            numbersAsFloat,
          );
      else if (type === `object`) {
        const nestedPath = sectionPath ? `${sectionPath}.${encodedKey}` : encodedKey;
        subTables +=
          (subTables && `\n`) +
          stringifyTable(nestedPath, table[key] as Record<string, unknown>, nestedPath, depth - 1, numbersAsFloat);
      } else {
        scalars += encodedKey;
        scalars += ` = `;
        scalars += stringifyValue(table[key], type, depth, numbersAsFloat);
        scalars += `\n`;
      }
    }
  }
  // 父路径存在时，本表的标量键需要表头（无子表且无标量的空表不输出表头）
  if (parentPath && (scalars || !subTables)) scalars = scalars ? `[${parentPath}]\n${scalars}` : `[${parentPath}]`;
  return scalars && subTables ? `${scalars}\n${subTables}` : scalars || subTables;
}

/**
 * 对象 → TOML 文本（原 `Yt`）：
 * 顶层必须为对象；结尾保证一个换行。
 * numbersAsFloat=true 时整数也按浮点输出（`1.0`）。
 */
export function stringifyToml(
  value: unknown,
  { maxDepth = 1e3, numbersAsFloat = false }: { maxDepth?: number; numbersAsFloat?: boolean } = {},
): string {
  if (tomlTypeOf(value) !== `object`)
    throw new TypeError(`stringify can only be called with an object`);
  const out = stringifyTable(``, value as Record<string, unknown>, ``, maxDepth, numbersAsFloat);
  return out[out.length - 1] === `\n` ? out : out + `\n`;
}
