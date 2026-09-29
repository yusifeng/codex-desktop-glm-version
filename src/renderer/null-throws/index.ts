// Non-null assertion utility. Release chunk: null-throws-c7a886463bcb.js.
import "@rchunk/rolldown-runtime";

function nullThrows<T>(value: T | null | undefined): T {
  if (value == null) throw new Error("Unexpected null or undefined value");
  return value;
}
function initializeNullThrows(): void {}

export { nullThrows as n, initializeNullThrows as t };
