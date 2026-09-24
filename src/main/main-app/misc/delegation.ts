// 委派协议解析 + 账号/plan 判定（原版 66-99、348-363、783、121-122 区段）。
//
// 职责：
//   - `<codex_delegation>` 文本协议解析（预览串里内嵌的 source_thread_id/input，
//     经 `ae/oe/se` 实体解码）；
//   - OpenAI 员工邮箱与付费 plan 白名单判定（`ce/le/ue/de`）；
//   - codex 站点 URL 常量（`ie`）、去重重试间隔（`pe`）、下载大文件阈值
//     （`Ae/K`）、resume-state 有效期（`nee`）。
//
// 依赖约束：叶子模块（纯函数 + 常量，无 I/O、无模块加载期副作用）。
//
// 语义不确定点：
//   - `ie`（`https://chatgpt.com/codex`）在 99,831/99,980/100,166 被用于
//     `new URL(ie).origin` 与 pathname 拼接（codex 站点跳转），据此命名为
//     CODEX_SITE_URL；与 delegation 解析无直接关系，作为共享常量就近放置。

/** codex 站点 URL（原 ie；`new URL(ie).origin` 的跳转基准）。 */
export const CODEX_SITE_URL = `https://chatgpt.com/codex`;

/** 去重缓存（he 类，区间外）的失败重试/prune 间隔（ms，原 pe = 6e4）。 */
export const LOOKUP_RETRY_INTERVAL_MS = 60_000;

/** 下载「大文件」判定阈值（字节，原 Ae = 268,435,456 = 256MB）。 */
export const LARGE_DOWNLOAD_THRESHOLD_BYTES = 268_435_456;

/** 是否为「大文件」下载（原 K，356-358）。 */
export function isLargeDownload(sizeBytes: number): boolean {
  return sizeBytes > LARGE_DOWNLOAD_THRESHOLD_BYTES;
}

/** resume-state 有效期（ms，原 nee = 900_000 = 15 分钟，783）。 */
export const RESUME_STATE_TTL_MS = 900_000;

// ---------------------------------------------------------------------------
// <codex_delegation> 协议解析
// ---------------------------------------------------------------------------

/** 委派协议解析结果（原 ae 的返回值）。 */
export interface CodexDelegation {
  /** 来源线程 id（`<source_thread_id>` 内文）。 */
  sourceThreadId: string;
  /** 委派输入（`<input>` 内文）。 */
  input: string;
}

/**
 * 解析 `<codex_delegation>...</codex_delegation>` 包裹的委派串（原 ae，67-73）。
 * 首尾标签不完整、或任一字段缺失时返回 null；字段值经 HTML 实体解码。
 */
export function parseCodexDelegation(preview: string): CodexDelegation | null {
  let text = preview.trim();
  if (!text.startsWith(`<codex_delegation>`) || !text.endsWith(`</codex_delegation>`))
    return null;
  let sourceThreadId = readDelegationField(text, `source_thread_id`);
  let input = readDelegationField(text, `input`);
  return sourceThreadId == null || input == null ? null : { sourceThreadId, input };
}

/** 读取 `<t>...</t>` 字段并解码实体（原 oe，74-77）。 */
function readDelegationField(text: string, fieldName: string): string | null {
  let raw =
    RegExp(`<${fieldName}>\\s*([\\s\\S]*?)\\s*<\\/${fieldName}>`, `i`).exec(text)?.[1].trim() ??
    null;
  return raw == null ? null : decodeDelegationEntities(raw);
}

/** HTML 实体解码（原 se，78-80；仅处理 lt/gt/amp 的最小集，顺序不可换——
 * `&` 必须最后解，否则 `&lt;` 会被二次还原）。 */
function decodeDelegationEntities(text: string): string {
  // 源码里以 \u0026 转义书写 "&"，等价于原文的 "<" / ">" / "&"。
  return (
    text
      .replaceAll(`\u0026lt;`, `<`)
      .replaceAll(`\u0026gt;`, `>`)
      .replaceAll(`\u0026amp;`, `\u0026`)
  );
}

// ---------------------------------------------------------------------------
// 账号 / plan 判定
// ---------------------------------------------------------------------------

/** 是否为 OpenAI 员工邮箱（原 ce，81-83）。 */
export function isOpenaiEmail(email: string | null | undefined): boolean {
  return email?.toLowerCase().endsWith(`@openai.com`) === true;
}

/** 付费 plan 白名单（原 le，84-91）。 */
export const PAID_PLAN_TYPES = [
  `plus`,
  `pro`,
  `business`,
  `team`,
  `self_serve_business_prolite`,
  `self_serve_business_usage_based`,
] as const;

/**
 * 账号是否有资格使用相关能力：apiKey 模式一律通过，chatgpt 模式需
 * 员工邮箱或付费 plan（原 ue，92-96）。
 */
export function isAccountEntitled(
  account: { type?: string; email?: string | null; planType?: string | null } | null | undefined,
): boolean {
  return account == null
    ? false
    : account.type === `apiKey` ||
        (account.type === `chatgpt` &&
          hasEntitledChatgptPlan({ email: account.email, plan: account.planType }));
}

/** 员工邮箱或付费 plan 命中（原 de，97-99）。 */
export function hasEntitledChatgptPlan({
  email,
  plan,
}: {
  email?: string | null;
  plan?: string | null;
}): boolean {
  return (
    isOpenaiEmail(email) || PAID_PLAN_TYPES.some((paidPlan) => paidPlan === plan)
  );
}