// @ts-nocheck
const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "@rchunk/portable-thumbnail-pdf-runtime",
      "@rchunk/app-shared",
      "@rchunk/rolldown-runtime",
      "./app-shared-fa570b9eb9dd.css",
      "@rchunk/portable-thumbnail-pdf-document",
      "@rchunk/portable-thumbnail-fonts",
      "@rchunk/portable-thumbnail-font-runtime",
      "@rchunk/portable-thumbnail-font-face-source-runtime",
      "@rchunk/portable-thumbnail-font-metrics",
      "./ensure-fonts-loaded-cc781733d401.css",
      "@rchunk/portable-thumbnail-font-face-sources",
    ]),
) => i.map((i) => d[i]);
import { n as e } from "@rchunk/rolldown-runtime";
import { H3 as t, V3 as n } from "@rchunk/app-shared";
import { C8t as r, x8t as i } from "@rchunk/app-initial";
function a({ importKind: e, readBytes: t, signal: n, size: r = u }) {
  return n.aborted ||
    e == null ||
    e === `ipynb` ||
    e === `tex` ||
    !Number.isFinite(r) ||
    r <= 0 ||
    r > u
    ? Promise.resolve({ dataUrl: null })
    : typeof Worker > `u` ||
        typeof OffscreenCanvas > `u` ||
        typeof OffscreenCanvas.prototype.convertToBlob != `function`
      ? Promise.resolve({ dataUrl: null, reason: `unsupported` })
      : d.length >= c
        ? Promise.resolve({ dataUrl: null, reason: `overloaded` })
        : new Promise((i) => {
            let a = {
              cancel: () => {
                let e = d.indexOf(a);
                e !== -1 &&
                  (d.splice(e, 1), n.removeEventListener(`abort`, a.cancel), i({ dataUrl: null }));
              },
              importKind: e,
              readBytes: t,
              resolve: i,
              signal: n,
              size: Math.max(1, Math.round(r)),
            };
            (n.addEventListener(`abort`, a.cancel, { once: !0 }), d.push(a), o());
          });
}
function o() {
  if (f) return;
  let e = d.shift();
  e != null &&
    ((f = !0),
    e.signal.removeEventListener(`abort`, e.cancel),
    s(e).then((t) => {
      (e.resolve(t), (f = !1), o());
    }));
}
function s(e) {
  return new Promise((t) => {
    let r = new AbortController(),
      a,
      o,
      s,
      c = !1,
      u = (n) => {
        c ||
          ((c = !0),
          clearTimeout(f),
          e.signal.removeEventListener(`abort`, d),
          r.abort(),
          a?.terminate(),
          o?.abort(),
          t(n));
      },
      d = () => u({ byteLength: s, dataUrl: null }),
      f = setTimeout(() => u({ byteLength: s, dataUrl: null, reason: `timeout` }), l);
    if ((e.signal.addEventListener(`abort`, d, { once: !0 }), e.signal.aborted)) {
      d();
      return;
    }
    (async () => {
      try {
        let t = await e.readBytes(r.signal);
        if (c) return;
        let i = t.byteLength;
        if (((s = i), s > 41943040 || s === 0)) {
          u({ byteLength: s, dataUrl: null });
          return;
        }
        let l = [],
          f;
        if (e.importKind === `pdf`) {
          let { getPdfjs: e } = await n(
            async () => {
              let { getPdfjs: e } = await import(`@rchunk/portable-thumbnail-pdf-runtime`);
              return { getPdfjs: e };
            },
            __vite__mapDeps([0, 1, 2, 3, 4]),
            import.meta.url,
          );
          f = (await e()).GlobalWorkerOptions.workerSrc;
        } else {
          let [e, t] = await Promise.all([
            n(
              () => import(`@rchunk/portable-thumbnail-fonts`),
              __vite__mapDeps([5, 6, 2, 7, 8, 9]),
              import.meta.url,
            ),
            n(
              () => import(`@rchunk/portable-thumbnail-font-face-sources`),
              __vite__mapDeps([10, 7, 2, 8]),
              import.meta.url,
            ),
          ]);
          (await e.ensurePopcornSpreadsheetFontsLoaded(),
            (l = t.getPopcornCarlitoFontFaceSourcesFromDocument()));
        }
        if (c) return;
        ((a = new Worker(
          new URL(
            `` +
              new URL(`portable-attachment-thumbnail.worker-239d300eaa56.js`, import.meta.url).href,
            `` + import.meta.url,
          ),
          { type: `module`, name: `composer-attachment-thumbnail` },
        )),
          (a.onerror = d),
          (a.onmessageerror = d),
          (a.onmessage = ({ data: e }) => {
            if (e == null) {
              d();
              return;
            }
            ((o = new FileReader()), (o.onerror = d));
            let t = o;
            ((t.onload = () => {
              typeof t.result == `string` ? u({ byteLength: i, dataUrl: t.result }) : d();
            }),
              t.readAsDataURL(e));
          }));
        let p = t.slice(),
          m = {
            bytes: p,
            fonts: l,
            importKind: e.importKind,
            pdfWorkerSrc: f,
            resourceBaseUrl: location.href,
            size: e.size,
          };
        a.postMessage(m, [p.buffer]);
      } catch (e) {
        e instanceof i ? u({ byteLength: e.byteLength, dataUrl: null }) : d();
      }
    })();
  });
}
var c, l, u, d, f;
function p() {
  return (p = e(() => {
    (r(), t(), (c = 16), (l = 15e3), (u = 352), (d = []), (f = !1));
  }))();
}
p();
export { a as renderPortableAttachmentThumbnail };
