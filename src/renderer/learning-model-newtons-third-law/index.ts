// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `pushingBox`),
      (n = (e) => {
        switch (e.example) {
          case `pushingBox`:
          case `collidingBalls`:
          case `boxOnTable`:
            return { example: e.example };
          default:
            return { example: t };
        }
      }),
      (r = (e) => {
        switch (e) {
          case `pushingBox`:
            return 0;
          case `collidingBalls`:
            return 1;
          case `boxOnTable`:
            return 2;
        }
      }),
      (i = (e) => {
        switch (e) {
          case 1:
            return `collidingBalls`;
          case 2:
            return `boxOnTable`;
          default:
            return `pushingBox`;
        }
      }));
  }))();
}
export { n as a, a as i, i as n, r, t };
