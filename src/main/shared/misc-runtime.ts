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

export function shellJoin(values: readonly string[]): string {
  if (!Array.isArray(values)) throw new TypeError("args should be an array");
  return values.map(shellQuote).join(" ");
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

import { elicitationForTurn } from "./elicitation-protocol";
export { elicitationForTurn } from "./elicitation-protocol";
export type { UrlParser } from "./elicitation-protocol";

export function requestErrorOf(requestId: string, response: JsonRpcErrorLike): Error & { jsonRpcCode: number; data?: unknown; code?: string } {
  const error = Object.assign(new Error(response.message ?? `MCP request ${requestId} failed with code ${response.code}`), {
    jsonRpcCode: response.code,
    data: response.data,
  }) as Error & { jsonRpcCode: number; data?: unknown; code?: string };
  if (typeof response.data === `object` && response.data != null && `code` in response.data && typeof response.data.code === `string`)
    error.code = response.data.code;
  return error;
}

export {
  shellQuote as $n,
  shellJoin as Qn,
  requireMemoize as dr,
  shellSplit as er,
  elicitationForTurn as lr,
  parseMarkdownPathLinks as nr,
  requestErrorOf as or,
  unescapeMarkdownPunctuation as rr,
};
