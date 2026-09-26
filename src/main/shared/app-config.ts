// shared chunk：应用品牌/HTML 工具/内存配置拦截器/node repl 配置/
// 动态 config 合并（app-config 分区，settings-threads 子区收尾）。
//
// 对应 src-DldfpmrL.ts 的 L16,695-16,706（品牌）、L16,825-16,890
// （lodash unescape/last）、L16,954-17,128（InMemoryInterceptor）、
// L17,803-17,856（node repl MCP 配置）、L19,284-19,296（动态工具
// 结果 schema）、L19,843-19,877（动态 config 合并）区段：
//   - ev/tv + rv（ud）：应用品牌（codex|chatgpt）解析
//   - mv（od）：HTML 实体反转义（lodash _unescape）
//   - yv（id）：数组末项
//   - Dv/kv + Av（td）：InMemoryInterceptor——内存 config 的 MCP 请求
//     拦截器：thread/read 冒号 id 拒绝、command/exec 与 fs/*（除
//     unwatch）缺 environmentId 拒绝、config/read 返回内存快照、
//     config/batchWrite 应用编辑（replace+null → unset）、
//     configRequirements/permissionProfile 空响应、thread/list 剥
//     useStateDbOnly、start/turn 剥 personality + serviceTier 归一
//     （Mv：priority→fast，非 fast/flex → undefined）
//   - one（eu）：buildNodeReplMcpConfig——mcp_servers.node_repl 的
//     env 全表（CODEX_HOME、NODE_REPL_*、sentry/trace meta、WSLENV
//     追加、win32 CODEX_WINDOWS_REGISTERED_CORE）
//   - Tb（nu）：node repl 沙箱平台判定（darwin|linux|win32）
//   - xy（Iu）：浏览器上下文种类表（browser-context 分区转发）
//   - EC（Ec）：动态 app 工具结果 schema（contentItems 三态 + success）
//   - Tw（ac）：动态 config schema（min_app_server_version + config）
//   - Ew（rc）：composeDefaultEnableFeatures——guardianv2 config 按
//     min_app_server_version 门控合并（数组覆盖语义）
//   - Dw（tc）：composeFeatureOverrides——default_mode_request_user_input
//     非 true 时置 false
//   - Ow（oc）：configKeyPath——features. 前缀补全
//
// 兼容导出：ud/od/id/td/eu/nu/Iu/Ec/ac/rc/tc/oc。

import { z } from "zod";

import { BROWSER_CONTEXT_KINDS } from "./browser-context";
import { compareSemver, isValidSemver } from "./app-server-version";

// ---------------------------------------------------------------------------
// 应用品牌（原 `ev`/`tv`/`rv`）
// ---------------------------------------------------------------------------

/** 应用品牌。 */
export type AppBrand = "codex" | "chatgpt";

/** 品牌解析（原 `rv`，导出 `ud`：trim + 白名单，否则 null）。 */
export function parseAppBrand(input: string | null | undefined): AppBrand | null {
  const parsed = z.enum(["codex", "chatgpt"]).safeParse(input?.trim());
  return parsed.success ? parsed.data : null;
}

// ---------------------------------------------------------------------------
// HTML 反转义与数组末项（原 `mv`/`yv`——lodash 门面）
// ---------------------------------------------------------------------------

const HTML_UNESCAPES: Record<string, string> = { "&amp;": "&", "<": "<", ">": ">", "&quot;": '"', "&#39;": "'" };

/** HTML 实体反转义（原 `mv`，导出 `od`）。 */
export function unescapeHtml(text: string | null | undefined): string {
  if (text == null) return "";
  return text.replace(/&(?:amp|lt|gt|quot|#39);/g, (entity) => HTML_UNESCAPES[entity] ?? entity);
}

/** 数组末项（原 `yv`，导出 `id`）。 */
export function last<T>(values: T[] | null | undefined): T | undefined {
  const length = values == null ? 0 : values.length;
  return length ? values[length - 1] : undefined;
}

// ---------------------------------------------------------------------------
// InMemoryInterceptor（原 `Dv`/`kv`/`Av`/`Mv`）
// ---------------------------------------------------------------------------

/** 拦截器支持的方法集（原 `Dv`）。 */
const INTERCEPTED_METHODS = new Set(
  "config/batchWrite.config/read.configRequirements/read.command/exec.model/list.permissionProfile/list.thread/archive.thread/list.thread/name/set.thread/read.thread/realtime/appendAudio.thread/realtime/appendSpeech.thread/realtime/appendText.thread/realtime/listVoices.thread/realtime/start.thread/realtime/stop.thread/resume.thread/settings/update.thread/start.thread/startAeon.thread/stop.thread/items/list.thread/inject_items.thread/turns/list.thread/unarchive.turn/addUserMessage.turn/interrupt.turn/start.turn/steer".split(
    ".",
  ),
);

/** 内存 config 初始形状（原 `kv`）。 */
const EMPTY_IN_MEMORY_CONFIG: Record<string, unknown> = {
  model: null,
  review_model: null,
  model_context_window: null,
  model_auto_compact_token_limit: null,
  model_auto_compact_token_limit_scope: null,
  model_provider: null,
  approval_policy: null,
  approvals_reviewer: null,
  sandbox_mode: null,
  sandbox_workspace_write: null,
  forced_chatgpt_workspace_id: null,
  forced_login_method: null,
  web_search: null,
  tools: null,
  profile: null,
  profiles: {},
  instructions: null,
  developer_instructions: null,
  compact_prompt: null,
  model_reasoning_effort: null,
  model_reasoning_summary: null,
  model_verbosity: null,
  service_tier: null,
  analytics: null,
  apps: null,
  browser_use: null,
  computer_use: null,
  desktop: null,
};

/** MCP 请求形态。 */
export interface McpRequest {
  id: unknown;
  method: string;
  params?: Record<string, unknown> | null;
}

/** 拦截结果：响应直接回，或改写后的请求继续下发。 */
export type InterceptResult =
  | { type: "response"; response: { id: unknown; result?: unknown; error?: { code: number; message: string } } }
  | { type: "request"; request: McpRequest };

/** serviceTier 归一（原 `Mv`：priority→fast，非 fast/flex 剥除）。 */
function normalizedServiceTier(tier: unknown): unknown {
  return tier === "priority" ? "fast" : tier == null || tier === "fast" || tier === "flex" ? tier : undefined;
}

/**
 * 内存 config 拦截器（原 `Av`，导出 `td`）。
 * config/read 与 config/batchWrite 走内存；越权方法拒绝；
 * start/turn 类请求剥 personality 并归一 serviceTier。
 */
export class InMemoryInterceptor {
  private inMemoryConfigVersion = 0;
  private inMemoryConfig: Record<string, unknown> = structuredClone(EMPTY_IN_MEMORY_CONFIG);

  supports(request: { method: string }): boolean {
    return INTERCEPTED_METHODS.has(request.method);
  }

  send(request: McpRequest): InterceptResult {
    if (
      (request.method === "thread/read" && String(request.params?.threadId ?? "").includes(":")) ||
      ((request.method === "command/exec" ||
        (request.method.startsWith("fs/") && request.method !== "fs/unwatch")) &&
        (request.params == null ||
          !("environmentId" in request.params) ||
          typeof request.params.environmentId != "string" ||
          request.params.environmentId.trim() === ""))
    )
      return {
        type: "response",
        response: {
          id: request.id,
          error: {
            code: -32602,
            message:
              request.method === "thread/read"
                ? "thread/read requires a server-issued thread ID"
                : `${request.method} requires an environmentId`,
          },
        },
      };
    if (request.method === "config/read")
      return {
        type: "response",
        response: {
          id: request.id,
          result: { config: structuredClone(this.inMemoryConfig), origins: {}, layers: null },
        },
      };
    if (request.method === "config/batchWrite") {
      for (const edit of (request.params?.edits ?? []) as { keyPath: (string | number)[]; mergeStrategy?: string; value?: unknown }[]) {
        if (edit.mergeStrategy === "replace" && edit.value == null) {
          this.unsetPath(edit.keyPath);
          continue;
        }
        this.setPath(edit.keyPath, structuredClone(edit.value));
      }
      this.inMemoryConfigVersion += 1;
      return {
        type: "response",
        response: {
          id: request.id,
          result: {
            status: "ok",
            version: `in-memory-${this.inMemoryConfigVersion}`,
            filePath: "/in-memory/config.toml",
            overriddenMetadata: null,
          },
        },
      };
    }
    if (request.method === "configRequirements/read")
      return { type: "response", response: { id: request.id, result: { requirements: null } } };
    if (request.method === "permissionProfile/list")
      return { type: "response", response: { id: request.id, result: { data: [], nextCursor: null } } };
    if (request.method === "thread/list")
      return {
        type: "request",
        request: { ...request, params: { ...request.params, useStateDbOnly: undefined } },
      };
    if (
      request.method === "thread/startAeon" ||
      request.method === "thread/start" ||
      request.method === "thread/resume" ||
      request.method === "turn/start" ||
      request.method === "turn/addUserMessage"
    )
      return {
        type: "request",
        request: {
          ...request,
          params: {
            ...request.params,
            personality: undefined,
            serviceTier: normalizedServiceTier(request.params?.serviceTier),
          },
        },
      };
    return { type: "request", request };
  }

  /** 路径写入（lodash set 语义的受限实现：逐段创建）。 */
  private setPath(keyPath: (string | number)[], value: unknown): void {
    let node: Record<string | number, unknown> = this.inMemoryConfig;
    for (let index = 0; index < keyPath.length - 1; index += 1) {
      const key = keyPath[index];
      if (key === "__proto__" || key === "constructor" || key === "prototype") return;
      if (typeof node[key] != "object" || node[key] == null) node[key] = {};
      node = node[key] as Record<string | number, unknown>;
    }
    const leaf = keyPath[keyPath.length - 1];
    if (leaf === "__proto__" || leaf === "constructor" || leaf === "prototype") return;
    node[leaf] = value;
  }

  /** 路径删除（lodash unset 语义的受限实现）。 */
  private unsetPath(keyPath: (string | number)[]): void {
    let node: Record<string | number, unknown> | undefined = this.inMemoryConfig;
    for (let index = 0; index < keyPath.length - 1 && node != null; index += 1) {
      const key = keyPath[index];
      if (key === "__proto__" || key === "constructor" || key === "prototype") return;
      node = node[key] as Record<string | number, unknown> | undefined;
    }
    const leaf = keyPath[keyPath.length - 1];
    if (node != null && leaf !== "__proto__" && leaf !== "constructor" && leaf !== "prototype") delete node[leaf];
  }
}

// ---------------------------------------------------------------------------
// node repl MCP 配置（原 `one`/`sne`/`Tb`/`cne`）
// ---------------------------------------------------------------------------

/** 沙箱平台判定（原 `Tb`，导出 `nu`）。 */
export function isNodeReplSandboxPlatform(platform: string): boolean {
  return platform === "darwin" || platform === "linux" || platform === "win32";
}

/** buildNodeReplMcpConfig 参数。 */
export interface NodeReplMcpConfigInput {
  codexCliPath?: string | null;
  codexHome: string;
  envVars?: string[];
  extraEnv?: Record<string, string | null> | null;
  nodeModuleDirs?: string;
  nodePath: string | null;
  nodeReplPath: string | null;
  platform: string;
  requestMeta?: string | null;
  sentryUserId?: string | null;
  shouldUseWslPaths?: boolean;
  traceMeta?: boolean;
}

/** mcp_servers.node_repl 配置（原 `one`，导出 `eu`；缺 node 则 null）。 */
export function buildNodeReplMcpConfig({
  codexCliPath,
  codexHome,
  envVars = [],
  extraEnv,
  nodeModuleDirs = "",
  nodePath,
  nodeReplPath,
  platform,
  requestMeta,
  sentryUserId,
  shouldUseWslPaths,
  traceMeta = false,
}: NodeReplMcpConfigInput): Record<string, unknown> | null {
  if (nodePath == null || nodeReplPath == null) return null;
  const env: Record<string, string> = {
    NODE_REPL_NATIVE_PIPE_CONNECT_TIMEOUT_MS: "1000",
    NODE_REPL_NODE_MODULE_DIRS: nodeModuleDirs,
    NODE_REPL_NODE_PATH: nodePath,
    NODE_REPL_TRUSTED_CODE_PATHS: [codexHome, nodeModuleDirs].filter((path) => path.length > 0).join(platform === "win32" ? ";" : ":"),
    CODEX_HOME: codexHome,
  };
  if (requestMeta != null) env.NODE_REPL_REQUEST_META = requestMeta;
  if (sentryUserId != null) env.NODE_REPL_SENTRY_USER_ID = sentryUserId;
  if (traceMeta) env.NODE_REPL_TRACE_META = "1";
  for (const [key, value] of Object.entries(extraEnv ?? {})) if (value != null) env[key] = value;
  if (codexCliPath != null && isNodeReplSandboxPlatform(platform)) env.CODEX_CLI_PATH = codexCliPath;
  let effectiveEnvVars = envVars;
  if (platform === "win32" && !shouldUseWslPaths && codexCliPath != null) {
    const registeredCore = "CODEX_WINDOWS_REGISTERED_CORE";
    effectiveEnvVars = [...new Set([...envVars, registeredCore])];
    const allowlist = env.NODE_REPL_UNTRUSTED_ENV_ALLOWLIST;
    env.NODE_REPL_UNTRUSTED_ENV_ALLOWLIST = allowlist ? `${allowlist},${registeredCore}` : registeredCore;
  }
  if (shouldUseWslPaths)
    env.WSLENV = Object.keys(env)
      .map((key) => `${key}/w`)
      .join(":");
  return {
    "mcp_servers.node_repl": {
      args: [],
      command: nodeReplPath,
      env,
      ...(effectiveEnvVars.length === 0 ? {} : { env_vars: Array.from(effectiveEnvVars) }),
      startup_timeout_sec: 120,
    },
  };
}

// ---------------------------------------------------------------------------
// 动态工具结果与 config 合并（原 `EC`/`Tw`/`Ew`/`Dw`/`Ow`）
// ---------------------------------------------------------------------------

/** 动态 app 工具结果 schema（原 `EC`，导出 `Ec`）。 */
export const dynamicAppToolResultSchema = z.object({
  contentItems: z.array(
    z.discriminatedUnion("type", [
      z.object({ text: z.string(), type: z.literal("inputText") }),
      z.object({ imageUrl: z.string(), type: z.literal("inputImage") }),
      z.object({ audioUrl: z.string(), type: z.literal("inputAudio") }),
    ]),
  ),
  success: z.boolean(),
});

/** 动态 config schema（原 `Tw`，导出 `ac`）。 */
export const jsonSchema = z.object({
  min_app_server_version: z.string().refine(isValidSemver),
  config: z.record(z.string(), z.any()),
});

/** guardianv2 config 键（原 `Cw`）。 */
const GUARDIAN_V2_CONFIG_KEY = "guardianv2";

/** features. 前缀（原 `bw`）。 */
const FEATURES_PREFIX = "features.";

/**
 * 动态 config 合并（原 `Ew`，导出 `rc`）。
 * guardianv2 config 在 min_app_server_version 门控通过时深合并
 * （数组覆盖）。
 */
export function composeDefaultEnableFeatures(
  baseConfig: Record<string, unknown>,
  dynamicConfig: { min_app_server_version: string; config: Record<string, unknown> } | null,
  appServerVersion: string | null,
): Record<string, unknown> {
  return dynamicConfig == null ||
    Object.keys(dynamicConfig.config).length === 0 ||
    appServerVersion == null ||
    !isValidSemver(appServerVersion) ||
    (appServerVersion !== "0.0.0" && compareSemver(appServerVersion, dynamicConfig.min_app_server_version) < 0)
    ? baseConfig
    : deepMergeWith(
        {},
        baseConfig,
        { [GUARDIAN_V2_CONFIG_KEY]: dynamicConfig.config },
      );
}

/** default_mode_request_user_input 键（原 `ww`）。 */
const DEFAULT_MODE_REQUEST_USER_INPUT = "default_mode_request_user_input";

/** 特性覆盖（原 `Dw`，导出 `tc`：非 true 时置 false）。 */
export function composeFeatureOverrides(config: Record<string, unknown> | null | undefined, override: boolean): Record<string, unknown> | null | undefined {
  return override || config?.default_mode_request_user_input !== true
    ? config
    : { ...config, [DEFAULT_MODE_REQUEST_USER_INPUT]: false };
}

/** configKeyPath（原 `Ow`，导出 `oc`：features. 前缀补全）。 */
export function configKeyPath(key: string): string {
  return key.startsWith(FEATURES_PREFIX) ? key : `${FEATURES_PREFIX}${key}`;
}

/** 深合并（lodash mergeWith 语义的受限实现）。 */
function deepMergeWith(target: Record<string, unknown>, ...sources: Record<string, unknown>[]): Record<string, unknown> {
  for (const source of sources) {
    for (const [key, value] of Object.entries(source)) {
      if (key === "__proto__" || key === "constructor" || key === "prototype") continue;
      if (Array.isArray(value)) {
        target[key] = value;
        continue;
      }
      if (typeof value == "object" && value != null && typeof target[key] == "object" && target[key] != null && !Array.isArray(target[key])) {
        deepMergeWith(target[key] as Record<string, unknown>, value as Record<string, unknown>);
      } else if (typeof value == "object" && value != null) {
        target[key] = deepMergeWith({}, value as Record<string, unknown>);
      } else {
        target[key] = value;
      }
    }
  }
  return target;
}

// ---------------------------------------------------------------------------
// 兼容导出（app-config 分区 12 个压缩名）
// ---------------------------------------------------------------------------

export {
  parseAppBrand as ud,
  unescapeHtml as od,
  last as id,
  InMemoryInterceptor as td,
  buildNodeReplMcpConfig as eu,
  isNodeReplSandboxPlatform as nu,
  BROWSER_CONTEXT_KINDS as Iu,
  dynamicAppToolResultSchema as Ec,
  jsonSchema as ac,
  composeDefaultEnableFeatures as rc,
  composeFeatureOverrides as tc,
  configKeyPath as oc,
};
