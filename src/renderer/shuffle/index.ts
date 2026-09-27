import "@rchunk/app-shared";
import "@rchunk/rolldown-runtime";
import {
  n as shuffleSelfExport,
  t as objectValuesExport,
} from "@rchunk/values";

const shuffleSelf = shuffleSelfExport;
const objectValues = objectValuesExport;

function isArrayLike(value: unknown): value is ArrayLike<unknown> {
  if (value == null || typeof value === "function") return false;
  const length = (value as { length?: unknown }).length;
  return (
    typeof length === "number" && length >= 0 && Number.isSafeInteger(length)
  );
}

function copyArrayLike<T>(value: ArrayLike<T>): T[] {
  return Array.from(value);
}

function shuffle<T>(
  value: ArrayLike<T> | Record<string, T> | null | undefined,
): T[] {
  const items = isArrayLike(value)
    ? copyArrayLike(value)
    : objectValues(value as Record<string, T> | null | undefined);
  return shuffleSelf(items);
}

export { shuffle as t };
