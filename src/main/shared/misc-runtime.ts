/** Shared chunk miscellaneous runtime helpers (original YK/JK/zU/TW/HW/vK/bK). */

export interface MarkdownPathLink {
  start: number;
  end: number;
  label: string;
  path: string;
}

export function unescapeMarkdownPunctuation(value: string): string {
  return value.replace(/\\([!-/:-@[\-`{-~])/g, `$1`);
}

export function parseMarkdownPathLinks(value: string): MarkdownPathLink[] {
  const links: MarkdownPathLink[] = [];
  let cursor = 0;
  scan: while (cursor < value.length) {
    const start = value.indexOf(`[`, cursor);
    if (start < 0) break;
    let labelEnd = start + 1;
    while (labelEnd < value.length) {
      const char = value[labelEnd];
      const next = value[labelEnd + 1];
      if (char === `\n` || char === `\r`) {
        cursor = labelEnd + 1;
        continue scan;
      }
      if (char === `\\` && (next === `\\` || (next === `]` && value[labelEnd + 2] !== `(`))) {
        labelEnd += 2;
        continue;
      }
      if (char === `]`) break;
      labelEnd += 1;
    }
    if (labelEnd >= value.length || labelEnd === start + 1 || value[labelEnd + 1] !== `(`) {
      cursor = labelEnd + 1;
      continue;
    }
    let pathEnd = labelEnd + 2;
    while (pathEnd < value.length) {
      const char = value[pathEnd];
      const next = value[pathEnd + 1];
      if (char === `\n` || char === `\r`) {
        cursor = pathEnd + 1;
        continue scan;
      }
      if (char === `\\` && (next === `\n` || next === `\r`)) {
        cursor = pathEnd + 2;
        continue scan;
      }
      if (char === `\\` && next != null) {
        pathEnd += 2;
        continue;
      }
      if (char === `)`) {
        if (pathEnd === labelEnd + 2) {
          cursor = pathEnd + 1;
          continue scan;
        }
        links.push({
          start,
          end: pathEnd + 1,
          label: value.slice(start + 1, labelEnd),
          path: value.slice(labelEnd + 2, pathEnd),
        });
        cursor = pathEnd + 1;
        continue scan;
      }
      pathEnd += 1;
    }
    break;
  }
  return links;
}

export function shellQuote(value: string): string {
  return value === ``
    ? `''`
    : /[^\w@%\-+=:,./]/.test(value)
      ? (`'` + value.replace(/('+)/g, `'"$1"'`) + `'`).replace(/^''|''$/g, ``)
      : value;
}

/** POSIX-compatible argument splitting used for ssh ProxyCommand output. */
export function shellSplit(command: string): string[] {
  const result: string[] = [];
  let token = ``;
  let started = false;
  let quote: `'` | `"` | null = null;
  for (let index = 0; index < command.length; index += 1) {
    const char = command[index];
    if (quote === `'`) {
      if (char === `'`) quote = null;
      else token += char;
      started = true;
      continue;
    }
    if (quote === `"`) {
      if (char === `"`) quote = null;
      else if (char === `\\` && index + 1 < command.length && /[\\"$`\n]/.test(command[index + 1])) token += command[++index];
      else token += char;
      started = true;
      continue;
    }
    if (/\s/.test(char)) {
      if (started) {
        result.push(token);
        token = ``;
        started = false;
      }
    } else if (char === `'` || char === `"`) {
      quote = char;
      started = true;
    } else if (char === `\\` && index + 1 < command.length) {
      token += command[++index];
      started = true;
    } else {
      token += char;
      started = true;
    }
  }
  if (quote != null) throw new Error(`Unterminated ${quote} quote`);
  if (started) result.push(token);
  return result;
}

type Callable = (...args: never[]) => unknown;

function memoize<T extends Callable>(fn: T, options: { max?: number; promise?: boolean } = {}): T {
  const cache = new Map<string, ReturnType<T>>();
  const wrapped = function (this: unknown, ...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args);
    const cached = cache.get(key);
    if (cached !== undefined || cache.has(key)) return cached as ReturnType<T>;
    const value = fn.apply(this, args) as ReturnType<T>;
    cache.set(key, value);
    if (options.promise && value instanceof Promise) value.catch(() => cache.delete(key));
    if (options.max != null && cache.size > options.max) cache.delete(cache.keys().next().value as string);
    return value;
  };
  return wrapped as T;
}

/** Preserve the original lazy CommonJS interop surface. */
export function requireMemoize(): { default: typeof memoize } {
  return { default: memoize };
}

export interface JsonRpcErrorLike {
  code: number;
  message?: string;
  data?: unknown;
}

export function requestErrorOf(requestId: string, response: JsonRpcErrorLike): Error & { jsonRpcCode: number; data?: unknown; code?: string } {
  const error = Object.assign(new Error(response.message ?? `MCP request ${requestId} failed with code ${response.code}`), {
    jsonRpcCode: response.code,
    data: response.data,
  }) as Error & { jsonRpcCode: number; data?: unknown; code?: string };
  if (typeof response.data === `object` && response.data != null && `code` in response.data && typeof response.data.code === `string`)
    error.code = response.data.code;
  return error;
}

export type UrlParser = (value: string) => URL | null | undefined;

/** Convert an app-server elicitation request into the desktop's pending-request shape. */
export function elicitationForTurn(
  request: Record<string, unknown>,
  supportsOpenAiForm: boolean,
  parseUrl: UrlParser,
): Record<string, unknown> | null {
  const mode = request.mode;
  const serverName = typeof request.serverName === `string` ? request.serverName : ``;
  if (mode === `openai/userVerification`)
    return { kind: `userVerification`, serverName, title: request.title, description: request.description, challenge: request.challenge };
  const metadata = typeof request._meta === `object` && request._meta != null ? request._meta as Record<string, unknown> : {};
  const risk = metadata.riskLevel === `low` || metadata.riskLevel === `high` ? { riskLevel: metadata.riskLevel } : {};
  if (metadata.codex_approval_kind === `browser_auth`) {
    if (mode !== `form` || typeof metadata.browser_auth_challenge_id !== `string`) return null;
    const { browser_auth_challenge_id: challengeId, ...browserAuth } = metadata;
    return { kind: `browserAuth`, challengeId, message: request.message, serverName, browserAuth };
  }
  if (mode === `url`) {
    if (typeof request.url !== `string`) return null;
    const url = parseUrl(request.url);
    if (url == null || url.protocol !== `https:` || url.username || url.password) return null;
    return { ...risk, kind: `urlAction`, message: request.message, serverName, url: url.href };
  }
  if (mode === `openai/form` || mode === `openaiForm`)
    return supportsOpenAiForm
      ? { ...risk, kind: mode === `openaiForm` ? `openaiForm` : `legacyOpenAIForm`, message: request.message, serverName, schema: request.requestedSchema }
      : { kind: `unsupportedOpenAIForm`, serverName };
  if (mode !== `form`) return null;
  if (metadata.codex_approval_kind === `tool_suggestion`) return { ...risk, kind: `toolSuggestion`, suggestion: metadata };
  if (metadata.codex_approval_kind === `mcp_tool_call`)
    return { ...risk, kind: `mcpToolCall`, message: request.message, approval: metadata, toolParamsDisplay: metadata.tool_params_display };
  return { ...risk, kind: `formElicitation`, message: request.message, serverName, schema: request.requestedSchema };
}

export {
  shellQuote as $n,
  requireMemoize as dr,
  shellSplit as er,
  elicitationForTurn as lr,
  parseMarkdownPathLinks as nr,
  requestErrorOf as or,
  unescapeMarkdownPunctuation as rr,
};
