// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { $3 as t, FX as n, HX as r, I3 as i, K2 as a, Y2 as o } from "@rchunk/app-shared";
import { Jot as s, Sun as c, Xot as l, mun as u } from "@rchunk/app-initial";
import { n as d, t as f } from "@rchunk/codex-thread-report-dialog";
function p(e) {
  let t = (0, h.c)(5),
    { accountId: n, onClose: i, project: a } = e,
    s = r(u),
    c;
  return (
    t[0] !== n || t[1] !== s || t[2] !== i || t[3] !== a
      ? ((c =
          s === n
            ? (0, g.jsx)(
                f,
                {
                  onClose: i,
                  reportEntityType: `project`,
                  successBody: (0, g.jsx)(o, {
                    id: `chatgptProjectHome.report.successBody`,
                    defaultMessage: `We appreciate you taking the time to share this. Our team will review the content to determine if it violates our policies. <learnMore>Learn how reports are handled</learnMore>`,
                    description: `Confirmation after reporting a shared ChatGPT project, with a link to OpenAI's content moderation policy`,
                    values: { learnMore: m },
                  }),
                  threadId: a.gizmo.id,
                  title: a.gizmo.display.name
                    ? (0, g.jsx)(o, {
                        id: `chatgptProjectHome.report.title`,
                        defaultMessage: `Report {projectName}`,
                        description: `Title of the safety and legal reporting dialog for a shared ChatGPT project, with the project's name`,
                        values: { projectName: a.gizmo.display.name },
                      })
                    : (0, g.jsx)(o, {
                        id: `chatgptProjectHome.report.fallbackTitle`,
                        defaultMessage: `Report project`,
                        description: `Title of the safety and legal reporting dialog when the shared ChatGPT project has no name`,
                      }),
                },
                a.gizmo.id,
              )
            : null),
        (t[0] = n),
        (t[1] = s),
        (t[2] = i),
        (t[3] = a),
        (t[4] = c))
      : (c = t[4]),
    c
  );
}
function m(e) {
  return (0, g.jsx)(s, {
    href: `https://openai.com/transparency-and-content-moderation/`,
    initiator: `open_in_browser_bridge`,
    openTarget: `external-browser`,
    children: e,
  });
}
var h, g;
function _() {
  return (_ = e(() => {
    ((h = t()), n(), a(), c(), l(), d(), (g = i()));
  }))();
}
_();
export { p as ChatGptProjectReportDialog };
