// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r;
function i() {
  return (i = e(() => {
    ((t = (function (e) {
      return ((e.Local = `local`), (e.Remote = `remote`), e);
    })({})),
      (n = (function (e) {
        return ((e.Audio = `audio`), (e.Video = `video`), e);
      })({})),
      (r = (function (e) {
        return (
          (e.Camera = `camera`),
          (e.Microphone = `microphone`),
          (e.ScreenShare = `screen_share`),
          e
        );
      })({})));
  }))();
}
export { i, t as n, r, n as t };
