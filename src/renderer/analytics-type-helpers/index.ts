import "@rchunk/rolldown-runtime";

function isPlainObject(value: unknown): value is Record<string, unknown> { return Object.prototype.toString.call(value).slice(8, -1).toLowerCase() === "object"; }
function isNumber(value: unknown): value is number { return typeof value === "number"; }
function initializeAnalyticsTypeHelpers(): void {}
function isString(value: unknown): value is string { return typeof value === "string"; }
function isFunction(value: unknown): value is (...arguments_: unknown[]) => unknown { return typeof value === "function"; }
function isPresent<T>(value: T | null | undefined): value is T { return value != null; }

export { isPlainObject as a, isNumber as i, initializeAnalyticsTypeHelpers as n, isString as o, isFunction as r, isPresent as t };
