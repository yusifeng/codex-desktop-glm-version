import "@rchunk/rolldown-runtime";
function invariant(condition: unknown, _message?: string): asserts condition { if (!condition) throw new Error("Invariant failed"); }
function initializeInvariant(): void {}
export { invariant as n, initializeInvariant as t };
