// package.json 元数据候选与读取：从 resourcesPath/app.asar、cwd、cwd/electron
// 下的 package.json 读取 codex* 构建字段（codexBuildFlavor / codexBuildNumber /
// codexBuildCommit / codexReleaseChannel 等）。
// 对应 bootstrap-C4dRql4x.ts 3725-3747 行（Pt/j）。
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** package.json 候选路径列表（原 Pt，按优先级排序）。 */
export function packageJsonCandidates(): string[] {
  const cwd = process.cwd();
  const candidates: string[] = [];
  if (process.resourcesPath)
    candidates.push(join(process.resourcesPath, "app.asar", "package.json"));
  candidates.push(join(cwd, "package.json"));
  candidates.push(join(cwd, "electron", "package.json"));
  return candidates;
}

export interface ReadPackageMetadataFieldOptions<T> {
  /** 候选 package.json 路径，默认 packageJsonCandidates()。 */
  candidates?: string[];
  /** 对读到的字符串值做进一步解析；返回 null/undefined 视为不命中。 */
  parse?: (value: string) => T | null | undefined;
}

/**
 * 从候选 package.json 读取字段（原 j）：取第一个存在且（trim 后）非空字符串
 * 的字段值；提供 parse 时用 parse 的结果（null/undefined 跳过该候选）。
 * 全部未命中返回 null。
 */
export function readPackageMetadataField<T = string>(
  field: string,
  { candidates = packageJsonCandidates(), parse }: ReadPackageMetadataFieldOptions<T> = {},
): T | null {
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    const contents = readFileSync(candidate, "utf8");
    const parsed = JSON.parse(contents);
    const value = typeof parsed[field] === "string" ? parsed[field].trim() : "";
    if (!value) continue;
    const result = parse ? parse(value) : (value as T);
    if (result != null) return result;
  }
  return null;
}
