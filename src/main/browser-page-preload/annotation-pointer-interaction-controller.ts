function createAnnotationPointerInteractionController(deps: any) {
  const { De, updateAnnotationTextPointer, w, E, f, o, c, Ne, Ue, yt, Oe, x, selectionModifierNotifier, g, xl, bl, e, t, Lc, k, D, mc, Jc, A, fc, wl, Ce, pl, vl, tv, Yy, ac, isAnnotationPointInViewport, Te, document, me, xe, Se, u_, oe, ut, al, G_, iv, j, window, T, C_, S, be, m, pe, updateAnnotationRegionDrag, pb, gu, ec, pd, rt, st, Ze, Je, le, ce, ot, ml, dc, P_, hl, Lv, Iv, O, _l, od, _b, installAnnotationPointerEventLifecycle } = deps;
  if (De) return;
  let n = () => {
          (updateAnnotationTextPointer(null, !1), w.current?.clearHover(), (E.current = null), f(null), o(null), c(null));
        },
        r = (e, t) => Ne && (t || (Ue && !w.current?.hasSurfaceAtPoint(e))),
        i = (e) => {
          let n = Oe && e;
          (yt(n),
            x?.target.mode === `create` &&
              x.anchor.type !== `text` &&
              selectionModifierNotifier.notify(n));
        },
        a = (t, a) => {
          g(a.altKey);
          let s = x?.target.mode === `create` && x.anchor.type !== `text` && xl(a),
            l = s && (a.shiftKey || be.current);
          if (!a.isTrusted || (bl(a, e) && !s)) {
            n();
            return;
          }
          let u = Lc(t, { x: a.clientX, y: a.clientY });
          if (((E.current = u), k !== `comment`)) return;
          let d = D.current;
          if (((D.current = u), s && !l)) {
            (f(null), o(null), c(null), mc());
            return;
          }
          Jc(a, { preventDefault: !1 });
          let p = d == null || d.x !== u.x || d.y !== u.y;
          Oe && a.shiftKey && !be.current && p && i(!0);
          let m = Oe && x?.target.mode === `create` && x.anchor.type !== `text` && be.current;
          if (x != null && !m) {
            (f(null), o(null), c(null), mc());
            return;
          }
          if (O.current != null) {
            (f(u), o(null), c(null));
            return;
          }
          if (updateAnnotationTextPointer(u, A && x == null)) return;
          if ((fc(t.document, wl), _l(u, e), f(u), Ce.current)) {
            (o(null), c(null));
            return;
          }
          let h = r(u, a.altKey);
          if (!h && x == null && w.current?.hover(u)) {
            (o(null), c(null));
            return;
          }
          w.current?.clearHover();
          let _ = h ? pl(u.x, u.y, A, e) : vl(u, e, a, A);
          if (!_) {
            (o(null), c(null));
            return;
          }
          (c({ anchor: tv(_, u.x, u.y).anchor, liveElement: _ }), o(Yy(_, h)));
        },
        s = (t, r, i) => {
          i.isTrusted && k === `comment` && x == null && !bl(i, e) && Jc(i, { preventDefault: !1 });
          let a = i.relatedTarget;
          if (a instanceof (t.defaultView?.Node ?? Node) && t.documentElement?.contains(a)) {
            ac(a) && (Te.cancel() && (xe.current = !0), n());
            return;
          }
          let o = Lc(r, { x: i.clientX, y: i.clientY });
          (a != null &&
            isAnnotationPointInViewport(o, { width: window.innerWidth, height: window.innerHeight })) ||
            n();
        },
        l = () => {
          (Te.isDragging && document.hasFocus()) ||
            (Te.cancel() && (xe.current = !0), g(!1), n(), i(!1));
        },
        u = ({ currentDragSelection: e, suppressFollowUpClick: r }) => {
          if (!e.isDraggingRegion || e.rect == null) return !1;
          me.current += 1;
          let i = me.current;
          (w.current?.clear(), (xe.current = r), (Se.current = r));
          let a = u_(e.rect, e.current, { framePath: e.framePath, frameUrl: e.frameUrl });
          if (
            ((O.current = null),
            oe(e),
            Oe && x?.target.mode === `create` && x.anchor.type !== `text`)
          )
            return (
              ut(x, al(G_(x.anchor), { anchor: a, liveElement: null }, !0)),
              oe(null),
              n(),
              !0
            );
          let o = iv(a, j);
          return (
            window.requestAnimationFrame(() => {
              me.current === i &&
                (t.sendMessageToHost({
                  type: `browser-sidebar-runtime-open-editor`,
                  target: { mode: `create` },
                  anchorState: o,
                  wantsScreenshot: !0,
                }),
                be.current &&
                  selectionModifierNotifier.notify(!0),
                T(C_()),
                S({
                  target: { mode: `create` },
                  anchor: {
                    type: `region`,
                    additionalSelections: [],
                    themeVariant: o.themeVariant,
                    value: a,
                    viewportSize: o.viewportSize,
                  },
                }),
                oe(null),
                n());
            }),
            !0
          );
        },
        d = (t, n) => {
          ((ce.current = null), (le.current = null));
          let a =
            Oe &&
            x?.target.mode === `create` &&
            x.anchor.type !== `text` &&
            (n.shiftKey || be.current);
          if (
            !n.isTrusted ||
            !n.isPrimary ||
            n.button !== 0 ||
            bl(n, e) ||
            k !== `comment` ||
            ((xe.current = !1), (Se.current = !1), x != null && !a)
          )
            return;
          (x ?? w.current?.clear(),
            Oe &&
              n.shiftKey &&
              !be.current &&
              (x?.target.mode === `create` && x.anchor.type !== `text`
                ? i(!0)
                : ((be.current = !0), m(!0))));
          let o = Lc(t, { x: n.clientX, y: n.clientY });
          if (A && Te.handlePointerDown(t, n, o, x == null)) {
            x ?? (E.current = o);
            return;
          }
          if ((pe(!1), r(o, n.altKey))) {
            Jc(n);
            return;
          }
          if (
            O.current != null &&
            u({ currentDragSelection: updateAnnotationRegionDrag(O.current, o, pb), suppressFollowUpClick: !0 })
          ) {
            Jc(n);
            return;
          }
          ((me.current += 1), gu(), Jc(n));
          let s = ec(t) ?? [],
            c = {
              pointerId: n.pointerId,
              start: o,
              current: o,
              rect: null,
              isDraggingRegion: !1,
              framePath: s,
              frameUrl: pd(t, s),
            };
          ((O.current = c), oe(c));
        },
        p = (t, n) => {
          if (!n.isTrusted || bl(n, e)) {
            ((ce.current = null), (le.current = null));
            return;
          }
          let r = Lc(t, { x: n.clientX, y: n.clientY });
          ot(t);
          let i = ml(n, A) ?? pl(r.x, r.y, A, e);
          if (i == null) {
            ce.current = null;
            return;
          }
          (k === `comment` && Jc(n),
            (ce.current = {
              anchorState: tv(i, r.x, r.y),
              capturedAt: Date.now(),
              designElement: ml(n, !1, `design`),
              element: i,
              viewportPoint: r,
            }));
        },
        h = (e, t) => {
          if (!t.isTrusted || Te.handlePointerMove(e, t)) return;
          let n = O.current;
          if (n == null || t.pointerId !== n.pointerId) return;
          Jc(t);
          let r = Lc(e, { x: t.clientX, y: t.clientY }),
            i = updateAnnotationRegionDrag(n, r, pb);
          ((O.current = i), oe(i), (E.current = r), f(r), o(null), c(null));
        },
        _ = (e, n) => {
          if (
            Te.handlePointerUp(n, (e) => {
              ((xe.current = !0), e != null && Je(e));
            })
          )
            return;
          let i = O.current;
          if (i == null || n.pointerId !== i.pointerId) return;
          let a = updateAnnotationRegionDrag(i, Lc(e, { x: n.clientX, y: n.clientY }), pb);
          if (
            ((O.current = null),
            oe(null),
            n.isTrusted &&
              (Jc(n), !u({ currentDragSelection: a, suppressFollowUpClick: !0 }) && x == null))
          ) {
            if (((xe.current = !0), (Se.current = !1), r(a.current, n.altKey))) {
              st(a.current, `annotation`);
              return;
            }
            rt(a.current) &&
              Oe &&
              n.shiftKey &&
              ((be.current = !0),
              m(!0),
              selectionModifierNotifier.notify(!0));
          }
        },
        v = (e) => {
          (Te.handlePointerCancel(e) && (xe.current = !0),
            e.pointerId === O.current?.pointerId && ((O.current = null), oe(null), n()));
        },
        y = (e) => {
          (w.current?.clear(),
            t.sendMessageToHost({
              type: `browser-sidebar-runtime-cancel-editor`,
              target: e.target,
            }),
            (be.current = !1),
            m(!1),
            f(null),
            mc(),
            o(null),
            c(null));
        },
        b = (e) => {
          if (e.key === `Escape` && e.isTrusted) {
            if ((w.current?.clear(), Te.cancel())) {
              ((xe.current = !0), Jc(e));
              return;
            }
            if (O.current != null) {
              (Jc(e), (xe.current = !0), (Se.current = !1), (O.current = null), oe(null), n());
              return;
            }
            if (x?.target.mode === `create` && x.anchor.type !== `text`) {
              (Jc(e), y(x));
              return;
            }
            x == null &&
              k === `comment` &&
              (Jc(e), t.sendMessageToHost({ type: `browser-sidebar-runtime-exit-comment-mode` }));
          }
        },
        ee = (t) => {
          let n = x?.target.mode === `create`;
          !t.isTrusted ||
            k !== `comment` ||
            (x != null && !n) ||
            bl(t, e) ||
            Jc(t, { preventDefault: !Te.isDragging });
        },
        C = (n, a) => {
          if (xe.current && ((xe.current = !1), (Se.current = !1), k === `comment`)) {
            Jc(a);
            return;
          }
          let s = Oe && (a.shiftKey || be.current),
            l = x?.target.mode === `create` && x.anchor.type !== `text` && s && xl(a);
          if (!a.isTrusted || (bl(a, e) && !l) || k !== `comment`) return;
          if (x != null) {
            if ((Jc(a), x.target.mode === `create` && !s)) {
              y(x);
              return;
            }
            if (x.target.mode === `create` && x.anchor.type !== `text`) {
              i(s);
              let t = Lc(n, { x: a.clientX, y: a.clientY });
              if (w.current?.hasSurfaceAtPoint(t)) return;
              let r = vl(t, e, a, A);
              if (r == null) return;
              let l = tv(r, t.x, t.y),
                u = al(G_(x.anchor), { anchor: od(r, l.anchor, A), liveElement: r }, s);
              (ut(x, u, s ? void 0 : l),
                u != null &&
                  ((E.current = t), f(t), o(Yy(r)), c({ anchor: l.anchor, liveElement: r })));
            }
            return;
          }
          let d = Lc(n, { x: a.clientX, y: a.clientY }),
            p = O.current;
          if (p != null) {
            let e = updateAnnotationRegionDrag(p, d, pb);
            if (
              ((O.current = null),
              oe(null),
              u({ currentDragSelection: e, suppressFollowUpClick: !1 }))
            ) {
              Jc(a);
              return;
            }
          }
          if ((Jc(a), r(d, a.altKey))) {
            let t = pl(d.x, d.y, A, e);
            t != null && Ze(t, tv(t, d.x, d.y));
            return;
          }
          rt(d) &&
            Oe &&
            a.shiftKey &&
            ((be.current = !0),
            m(!0),
            selectionModifierNotifier.notify(!0));
        },
        te = (t, n) => {
          if (
            !n.isTrusted ||
            n.ctrlKey ||
            k !== `comment` ||
            (x != null && (x.target.mode !== `create` || x.anchor.type === `text`)) ||
            bl(n, e)
          )
            return;
          let r = Lc(t, { x: n.clientX, y: n.clientY });
          Iv(hl(r.x, r.y, e), Lv(n, t)) && Jc(n);
        };
  return dc((e, t) => {
        let n = (e) => {
            d(t, e);
          },
          r = (e) => {
            h(t, e);
          },
          o = (e) => {
            _(t, e);
          },
          c = (e) => {
            a(t, e);
          },
          u = (n) => {
            s(e, t, n);
          },
          f = (e) => {
            C(t, e);
          },
          m = (e) => {
            p(t, e);
          },
          y = (e) => {
            te(t, e);
          };
        let x = (e) => {
            (e.key === `Alt` && g(!1), !e.shiftKey && be.current && i(!1));
          },
          S = (e) => {
            (e.key === `Alt` && g(!0), b(e));
          };
        let cleanupEvents = installAnnotationPointerEventLifecycle({
          documentLike: e,
          windowLike: t,
          auxiliaryEvents: _b,
          handlers: {
            pointerDown: n,
            pointerMove: r,
            pointerUp: o,
            pointerCancel: v,
            mouseMove: c,
            mouseOut: u,
            keyDown: S,
            keyUp: x,
            click: f,
            contextMenu: m,
            wheel: y,
            blur: l,
            auxiliary: ee,
          },
        });
        return () => {
          (Te.disposeFrame(t), cleanupEvents());
        };
      });
}
export { createAnnotationPointerInteractionController };
if (typeof module !== `undefined`) module.exports = { createAnnotationPointerInteractionController };
