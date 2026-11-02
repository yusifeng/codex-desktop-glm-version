type Iteratee<T> = ((value: T) => unknown) | string | readonly string[];

function valueAtPath(value: unknown, path: string | readonly string[]): unknown {
  const parts = typeof path === "string" ? path.match(/[^.[\]]+/g) ?? [] : path;
  return parts.reduce<unknown>((current, part) =>
    current != null && typeof current === "object"
      ? (current as Record<string, unknown>)[part]
      : undefined, value);
}

function iterateeFor<T>(iteratee: Iteratee<T>): (value: T) => unknown {
  return typeof iteratee === "function" ? iteratee : (value) => valueAtPath(value, iteratee);
}

function compareValues(left: unknown, right: unknown): number {
  if (left === right) return 0;
  const leftDefined = left !== undefined;
  const rightDefined = right !== undefined;
  const leftNull = left === null;
  const rightNull = right === null;
  const leftReflexive = left === left;
  const rightReflexive = right === right;
  const leftSymbol = typeof left === "symbol";
  const rightSymbol = typeof right === "symbol";
  if ((!rightNull && !rightSymbol && !leftSymbol && (left as any) > (right as any)) ||
      (leftSymbol && rightDefined && rightReflexive && !rightNull && !rightSymbol) ||
      (leftNull && rightDefined && rightReflexive) || (!leftDefined && rightReflexive) || !leftReflexive) return 1;
  if ((!leftNull && !leftSymbol && !rightSymbol && (left as any) < (right as any)) ||
      (rightSymbol && leftDefined && leftReflexive && !leftNull && !leftSymbol) ||
      (rightNull && leftDefined && leftReflexive) || (!rightDefined && leftReflexive) || !rightReflexive) return -1;
  return 0;
}

/** Stable multi-column orderBy compatible with the lodash contract used by extension actions. */
export function orderBy<T>(values: Iterable<T> | ArrayLike<T> | null | undefined, iteratees: Iteratee<T> | Iteratee<T>[], orders: Array<"asc" | "desc"> = []): T[] {
  if (values == null) return [];
  const source = Array.from(values as Iterable<T>);
  const normalized = (Array.isArray(iteratees) ? iteratees : [iteratees]).map(iterateeFor);
  return source
    .map((value, index) => ({ value, index, criteria: normalized.map((iteratee) => iteratee(value)) }))
    .sort((left, right) => {
      for (let index = 0; index < left.criteria.length; index += 1) {
        const comparison = compareValues(left.criteria[index], right.criteria[index]);
        if (comparison !== 0) return orders[index] === "desc" ? -comparison : comparison;
      }
      return left.index - right.index;
    })
    .map(({ value }) => value);
}
