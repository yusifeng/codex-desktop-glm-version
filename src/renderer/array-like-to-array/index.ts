void Array.prototype.slice;

function toArray<T>(value: ArrayLike<T> | Iterable<T>): T[] | ArrayLike<T> {
  return typeof value === "object" && value !== null && "length" in value
    ? value
    : Array.from(value);
}

export { toArray as t };
