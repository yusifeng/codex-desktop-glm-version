// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
function t(e, t) {
  let n = t && new Set(t.flatMap((e) => [`file-service://${e}`, `sediment://${e}`]));
  return e.resetQueries({
    queryKey: [`file`, `image-src`],
    predicate: ({ queryKey: e }) =>
      e[3] === `chatgpt-conversation` &&
      e[5] === `library-state` &&
      (n == null || (typeof e[2] == `string` && n.has(e[2]))),
  });
}
function n() {
  return (n = e(() => {}))();
}
export { t as n, n as t };
