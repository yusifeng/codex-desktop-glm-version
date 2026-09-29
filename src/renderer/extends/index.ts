// Object spread compatibility helper. Release chunk: extends-df342f7c2e8b.js.
import "@rchunk/rolldown-runtime";

type UnionToIntersection<Union> = (
  Union extends unknown ? (value: Union) => void : never
) extends (value: infer Intersection) => void
  ? Intersection
  : never;

function extendObject<
  Target extends object,
  Sources extends readonly unknown[],
>(
  target: Target,
  ...sources: Sources
): Target & UnionToIntersection<Exclude<Sources[number], null | undefined>> {
  return Object.assign(target, ...sources) as Target &
    UnionToIntersection<Exclude<Sources[number], null | undefined>>;
}

function initializeExtends(): void {}

export { initializeExtends as n, extendObject as t };
