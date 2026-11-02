// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { e6 as t } from "@rchunk/app-shared";
function n(e) {
  let t = (0, r.useRef)(e);
  return (
    (0, r.useInsertionEffect)(() => {
      t.current = e;
    }, [e]),
    (0, r.useMemo)(
      () =>
        (...e) => {
          let { current: n } = t;
          return n(...e);
        },
      [],
    )
  );
}
var r;
function i() {
  return (i = e(() => {
    r = t();
  }))();
}
export { n, i as t };
