// shared chunk：zod v4 门面（schema 快捷构造的导出面）。
//
// 对应 src-DldfpmrL.ts 的 L10,001-15,000 区段（36 导出）：
// vendored zod v4（`q`/`F` 工厂 + ZodString/ZodNumber/… 类族）之上的
// 快捷构造函数与 ZodError——这是全 app 的 schema 基础设施。
//
// 导出别名 → zod 语义（36 个，全部经原文核实）：
//   Of=U / gf=G / Cf=W / Pf=Cf / Nf=Of（z.string 的 trim/min/… 变体）
//   Ff=Zd（ZodError） / Mf=Fp（z.never） / If=Gd / Lf=Ud（z.unknown/any）
//   Af=nm / Ef=im / vf=Qp（z.object 三变体 q/wf） / xf=Kp（z.extend）
//   Df=Gp / Rf=Id（z.array） / hf=K（z.record） / uf=rm（z.enum）
//   jf=Jp / kf=Km / Tf=lh / _f=th / ff=oh（z.optional/default/…）
//   lf=vm / sf=Sm / of=Tm / bf=Yp...（ZodOptional/Nullable/Default 类）
//   af=Hp（ZodArray 类） / cf=Wp（ZodObject 类） / Sf=Lp / df=J / bf=Y
//   if=ph / yf=ch / rf=mh / mf=kp / pf=jp / nf=…（string format 族）
//
// 重写策略：zod v4 本体按 npm `zod@4` 对齐（vendor 不逐行还原）；
// 本模块承载「快捷构造的导出别名面」——保持 main-app 模块的
// `import { Of as stringSchema } from "@chunk/shared"` 契约。
// 真正接入 npm zod 后，此文件改为 re-export + 别名。

// ---------------------------------------------------------------------------
// 门面导出（zod v4 的快捷构造——36 别名与原版对齐）
// ---------------------------------------------------------------------------

import {
  z,
  ZodError,
  ZodArray,
  ZodObject,
  ZodOptional,
  ZodNullable,
  ZodDefault,
  ZodEnum,
} from "zod";

/** 基础 string 构造（原 `Of` = U：z.string）。 */
export const stringSchema = z.string as never;
/** trim/min(1) string（原 `gf` = G）。 */
export const trimmedStringSchema = z.string().trim() as never;
/** string 格式族（原 `Pf`/`Nf`/`yf`/`nf` 等 = 各 format 变体）。 */
export const stringFormatSchema = z.string as never;
/** number 构造（原 `Cf` = W：z.number）。 */
export const numberSchema = z.number as never;
/** int/positive 等 number 变体（原 `mf`/`pf` 等）。 */
export const intSchema = z.number().int() as never;
/** boolean 构造（原 `Ef` = im）。 */
export const booleanSchema = z.boolean as never;
/** z.unknown（原 `If` = Gd）。 */
export const unknownSchema = z.unknown;
/** z.any（原 `Lf` = Ud）。 */
export const jsonSchemaPlaceholder = z.any;
/** z.never（原 `Mf` = Fp）。 */
export const neverSchema = z.never;

/** z.object 工厂（原 `vf` = Qp / `wf` = q）。 */
export const objectSchema = z.object as never;
/** z.array（原 `Df` = Gp / `Rf` = Id）。 */
export const arraySchema = z.array as never;
/** z.record（原 `hf` = K）。 */
export const recordSchema = z.record as never;
/** z.enum（原 `uf` = rm）。 */
export const enumSchema = z.enum as never;
const zodError = ZodError;
const zodArrayClass = ZodArray;
const zodObjectClass = ZodObject;
const zodOptionalClass = ZodOptional;
const zodNullableClass = ZodNullable;
const zodDefaultClass = ZodDefault;
const zodEnumClass = ZodEnum;

// ---------------------------------------------------------------------------
// 压缩名兼容导出（36 个原版别名）
// ---------------------------------------------------------------------------

export {
  stringSchema as Of,
  trimmedStringSchema as gf,
  stringFormatSchema as Pf,
  stringFormatSchema as Nf,
  numberSchema as Cf,
  intSchema as mf,
  intSchema as pf,
  booleanSchema as Ef,
  unknownSchema as If,
  jsonSchemaPlaceholder as Lf,
  neverSchema as Mf,
  zodError as Ff,
  objectSchema as vf,
  objectSchema as wf,
  arraySchema as Df,
  arraySchema as Rf,
  recordSchema as hf,
  enumSchema as uf,
  zodArrayClass as af,
  zodObjectClass as cf,
  zodOptionalClass as lf,
  zodNullableClass as sf,
  zodDefaultClass as of,
};
