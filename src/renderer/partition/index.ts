import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";

function partition<Value>(values: Value[], predicate: (value: Value, index: number) => boolean): [Value[], Value[]] {
  const matching: Value[] = [];
  const remaining: Value[] = [];
  values.forEach((value, index) => (predicate(value, index) ? matching : remaining).push(value));
  return [matching, remaining];
}
export { partition as t };
