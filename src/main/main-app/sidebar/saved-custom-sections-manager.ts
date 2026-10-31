// @ts-nocheck

export function createSavedCustomSectionsManagerClass(dependencies) {
  const {
    G,
    Hb,
    Ub,
    Wb,
    _H,
    a,
    aBe,
    n,
    rBe,
    yH,
  } = dependencies;
  return class SavedCustomSectionsManager extends n.Uf {
      #e;
      #t;
      #n;
      #r;
      #i;
      #a;
      #o = new WeakMap();
      #s = Promise.resolve();
      #c = {};
      constructor(e, t, n, r, i, a) {
        (super(),
          (this.#e = e),
          (this.#t = t),
          (this.#n = n),
          (this.#r = r),
          (this.#i = i),
          (this.#a = a));
      }
      applySavedCustomSectionCommand(e) {
        let t = this.#u(e.accountId);
        return this.#l(async () => {
          let r = await t;
          if (r == null || !r.isSourceCurrent()) return { status: `unavailable` };
          let i = this.#d(e.accountId);
          if (i == null) return { status: `unavailable` };
          let { command: a } = e,
            o = _H(i, a),
            s = (0, G.default)(i, o),
            c =
              s &&
              `itemKey` in a &&
              a.itemKey.startsWith(`codex:thread:local:`) &&
              !n.hu(a.itemKey.slice(19)) &&
              (a.type === `remove` ||
                (a.type === `move` &&
                  o.sections.some((e) => e.id === a.sectionId && e.itemKeys.includes(a.itemKey))))
                ? a
                : void 0;
          if (s && (this.#p(e.operationId), c == null)) return { status: `unchanged` };
          c != null && (this.#c = {});
          let l = new yH(r, i, s ? i : this.#f(e.accountId, o, e.operationId), c);
          return {
            status: `applied`,
            ...yH.affectedState(l),
            receipt: l,
            transition: yH.initialTransition(l),
          };
        });
      }
      #l(e) {
        let t = this.#s.then(e);
        return (
          (this.#s = t.then(
            () => void 0,
            () => void 0,
          )),
          t
        );
      }
      beginSavedCustomSectionReconciliation(e) {
        let t = this.#u(e.accountId),
          n = this.#s.then(async () => {
            let n = await t;
            if (n == null || !n.isSourceCurrent()) return { status: `unavailable` };
            let r = this.#c;
            return {
              status: `ready`,
              reconciliation: new rBe(n, e.hostId, e.sectionId, () => r === this.#c),
            };
          });
        return (
          (this.#s = n.then(
            () => void 0,
            () => void 0,
          )),
          n
        );
      }
      beginSavedCustomSectionMigration(e) {
        let t = this.#u(e.accountId);
        return this.#l(async () => {
          let n = await t;
          if (n == null || !n.isSourceCurrent()) return { status: `unavailable` };
          let r = n.read();
          return r.appServerMigratedHostIds?.includes(e.hostId)
            ? { status: `unavailable` }
            : (r.appServerLegacySectionIds ??
                n.write({ ...r, appServerLegacySectionIds: r.sections.map(({ id: e }) => e) }, ``),
              { status: `ready`, state: n.read(), transition: yH.migrationTransition(n, e.hostId) });
        });
      }
      importLegacySavedCustomSections(e) {
        let t = this.#u(void 0);
        return this.#l(async () => {
          let r = await t;
          if (r == null || !r.isSourceCurrent()) return `unavailable`;
          let i = n
            .Ef(n.Of(), n.Mf())
            .safeParse(
              this.#e.get(`electron-persisted-atom-state`)?.[`sidebar-custom-sections-v3`] ?? {},
            );
          if (!i.success) return `unavailable`;
          if (Object.hasOwn(i.data, r.accountId)) return `unchanged`;
          let a = Ub.safeParse(e[r.accountId]);
          return a.success ? (r.write(a.data, ``), `applied`) : `unchanged`;
        });
      }
      async #u(e) {
        let t = this.#r?.captureContext(`local`),
          n = new Map(
            this.#t.getAllHostIds().flatMap((e) => {
              let t = this.#t.getMaybeConnection(e);
              return t == null
                ? []
                : [[e, { connection: t, assertCurrent: t.captureRequestLifetime() }]];
            }),
          ),
          r = await t;
        if (r == null || !r.isCurrent() || r.context.identity.kind !== `chatgpt`) return null;
        let i = r.context.identity.accountId;
        if ((e != null && e !== i) || this.#d(i) == null) return null;
        let a = { sections: [], collapsedSectionIds: [], sectionOrder: [] },
          o = new Set(),
          s = (e) => {
            let t = n.get(e);
            if (t == null || this.#t.getMaybeConnection(e) !== t.connection)
              throw new DOMException(`Section source connection retired`, `AbortError`);
            return (n.get(`local`)?.assertCurrent(), t.assertCurrent(), o.add(e), t.connection);
          };
        return {
          enqueueWrite: (e) => this.#l(e),
          accountId: i,
          read: () => {
            let e = this.#d(i, a);
            if (e == null) throw Error(`Saved sections are unavailable`);
            return e;
          },
          write: (e, t) => this.#f(i, e, t),
          isSourceCurrent: () => {
            try {
              n.get(`local`)?.assertCurrent();
              for (let e of o) s(e);
              return (
                r.isCurrent() &&
                this.#t.getMaybeConnection(`local`) === (n.get(`local`)?.connection ?? null) &&
                this.#d(i) != null
              );
            } catch {
              return !1;
            }
          },
          getConnection: s,
          reserveCreation: (e, t) => {
            let n = s(e),
              r = this.#o.get(n) ?? new Map(),
              a = r.get(i) ?? new Map();
            if (a.has(t)) return null;
            let o = {};
            return (
              a.set(t, o),
              r.set(i, a),
              this.#o.set(n, r),
              () => {
                a.get(t) === o &&
                  (a.delete(t), a.size === 0 && r.delete(i), r.size === 0 && this.#o.delete(n));
              }
            );
          },
          server: this.#i,
          onServerChanged: (e, t, n) => (
            (this.#c = {}),
            this.#a(
              e,
              () => {
                (t(), s(e));
              },
              n,
            )
          ),
        };
      }
      #d(e, t) {
        let r = this.#e.get(a.J)?.[Hb];
        if (r == null) return t ?? { sections: [], collapsedSectionIds: [], sectionOrder: [] };
        let i = n.Ef(n.Of(), n.Mf()).safeParse(r);
        if (!i.success) return null;
        let o = i.data[e];
        return o == null
          ? (t ?? { sections: [], collapsedSectionIds: [], sectionOrder: [] })
          : aBe(o)
            ? o
            : null;
      }
      #f(e, t, r) {
        let i = this.#e.get(`electron-persisted-atom-state`) ?? {},
          o = n.Ef(n.Of(), n.Mf()).parse(i[`sidebar-custom-sections-v3`] ?? {}),
          s = this.#d(e),
          c = Wb(t),
          l = c.sections.map((e) => {
            let t = s?.sections.find(({ id: t }) => t === e.id);
            return t != null && (0, G.default)({ ...t, appearance: null }, e) ? t : e;
          }),
          u = {
            ...c,
            sections:
              s != null && l.length === s.sections.length && l.every((e, t) => e === s.sections[t])
                ? s.sections
                : l,
            collapsedSectionIds:
              s != null && (0, G.default)(s.collapsedSectionIds, t.collapsedSectionIds)
                ? s.collapsedSectionIds
                : t.collapsedSectionIds,
            sectionOrder:
              s != null && (0, G.default)(s.sectionOrder, t.sectionOrder)
                ? s.sectionOrder
                : t.sectionOrder,
            appServerLegacySectionIds: (0, G.default)(
              s?.appServerLegacySectionIds,
              t.appServerLegacySectionIds,
            )
              ? s?.appServerLegacySectionIds
              : t.appServerLegacySectionIds,
            appServerMigratedHostIds: (0, G.default)(
              s?.appServerMigratedHostIds,
              t.appServerMigratedHostIds,
            )
              ? s?.appServerMigratedHostIds
              : t.appServerMigratedHostIds,
          };
        return (this.#e.set(a.J, { ...i, [Hb]: { ...o, [e]: u } }), this.#p(r), u);
      }
      #p(e) {
        this.#n.sendMessageToAllRegisteredWindows({
          type: `persisted-atom-updated`,
          key: Hb,
          value: this.#e.get(a.J)?.[Hb],
          savedCustomSectionOperationId: e || void 0,
        });
      }
    };
}

if (typeof module !== "undefined") module.exports = { createSavedCustomSectionsManagerClass };
