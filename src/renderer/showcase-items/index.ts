// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { I3 as t } from "@rchunk/app-shared";
import { $3 as n, Alt as r, X3 as i, klt as a } from "@rchunk/app-initial";
import { n as o, t as s } from "@rchunk/appgen-project-row";
function c(e) {
  if (e.kind === `site`)
    return {
      title: e.site.title,
      description: e.site.description ?? null,
      icon: (0, l.jsx)(s, { screenshotUrl: e.site.thumbnail_url ?? null, viewMode: `list` }),
    };
  let t = e.pin.icon;
  return (
    t &&
      !t.startsWith(`data:`) &&
      (t = `data:${
        [
          [`PHN2Zy`, `image/svg+xml`],
          [`PD94bWw`, `image/svg+xml`],
          [`/9j/`, `image/jpeg`],
          [`R0lGOD`, `image/gif`],
          [`UklGR`, `image/webp`],
        ].find(([e]) => t?.startsWith(e))?.[1] ?? `image/png`
      };base64,${t}`),
    {
      title: e.pin.title,
      description: e.pin.description ?? null,
      icon: (0, l.jsx)(`span`, {
        className: `flex size-9 shrink-0 items-center justify-center`,
        children: t
          ? (0, l.jsx)(
              a,
              {
                alt: ``,
                src: t,
                className: `size-9`,
                fallback: (0, l.jsx)(u, { className: `size-9` }),
              },
              t,
            )
          : (0, l.jsx)(u, { className: `size-9` }),
      }),
    }
  );
}
var l, u;
function d() {
  return (d = e(() => {
    (o(), r(), n(), (l = t()), (u = i()));
  }))();
}
export { d as n, c as t };
