import "@rchunk/rolldown-runtime";

function toArray<T>(value: ArrayLike<T> | Iterable<T>): T[] | ArrayLike<T> {
  return typeof value === "object" && value !== null && "length" in value
    ? value
    : Array.from(value);
}

function initializeArrayLikeToArrayRuntime(): void {
  void Array.prototype.slice;
}

export { initializeArrayLikeToArrayRuntime as n, toArray as t };
