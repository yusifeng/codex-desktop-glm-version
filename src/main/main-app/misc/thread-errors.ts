type ErrorRecord = { code?: unknown; jsonRpcCode?: unknown; message?: unknown; data?: unknown };

function errorMessage(value: unknown): string {
  return value instanceof Error ? value.message : typeof value === `string` ? value :
    typeof value === `object` && value !== null && typeof (value as ErrorRecord).message === `string`
      ? (value as ErrorRecord).message as string : String(value);
}

function hasThreadNotFoundMessage(message: string): boolean {
  return /^(?:thread not (?:found|loaded)|unknown thread):/i.test(message) ||
    /^no rollout found for thread id /i.test(message) || /^invalid thread id:/i.test(message);
}

export function me(value: unknown): boolean {
  if (typeof value !== `object` || value === null) return hasThreadNotFoundMessage(errorMessage(value));
  const record = value as ErrorRecord;
  const message = errorMessage(value);
  if (record.code === `thread_not_found` || record.jsonRpcCode === `thread_not_found` || hasThreadNotFoundMessage(message)) return true;
  const data = record.data;
  return typeof data === `object` && data !== null && `grpcStatusCode` in data &&
    (((data as { grpcStatusCode?: unknown }).grpcStatusCode === 5) || ((data as { grpcStatusCode?: unknown }).grpcStatusCode === 9)) &&
    hasThreadNotFoundMessage(message.slice(message.indexOf(`:`) + 1).trimStart());
}

export const isThreadNotFoundError = me;

export function Xt(action: `accept` | `decline` | `cancel`, meta: unknown = null, content: unknown = {}):
  { action: typeof action; content: unknown; _meta: unknown } {
  return action === `accept` ? { action, content, _meta: meta } : { action, content: null, _meta: meta };
}

export const buildInterruptResponse = Xt;
