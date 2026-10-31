// @ts-nocheck

export function createSavedSectionUndoRedoStackClass(dependencies) {
  const {
    CH,
    G,
    SH,
    _H,
    bH,
    n,
    tBe,
    wH,
    xH,
  } = dependencies;
  return class e extends n.Uf {
    #e;
    #t;
    #n;
    #r;
    #i;
    #a;
    #o;
    #s;
    #c = `undo`;
    #l = !1;
    #u = {};
    #d = Promise.resolve();
    #f = Promise.resolve();
    #p;
    #m;
    constructor(e, t, n, r, i) {
      if (
        (super(),
        (this.#e = e),
        (this.#m = r),
        (this.#p = i),
        (this.#r =
          i == null
            ? bH(t, n)
            : {
                sections: t.sections
                  .filter(({ id: e }) => t.appServerLegacySectionIds?.includes(e))
                  .map((e) => ({ id: e.id, before: e, after: e })),
                collections: [
                  `threadHostIds`,
                  `appServerLegacySectionIds`,
                  `appServerMigratedHostIds`,
                ],
                structure: !1,
              }),
        r?.type === `move`)
      ) {
        let e = n.sections.find(({ id: e }) => e === r.sectionId);
        e != null && this.#r.sections.push({ id: e.id, before: e, after: e });
      }
      let a = new Set([
        ...this.#r.sections.flatMap(({ before: e, after: t }) => [
          ...(e?.itemKeys ?? []),
          ...(t?.itemKeys ?? []),
        ]),
        ...(r == null ? [] : [r.itemKey]),
      ]);
      ((this.#i = Object.fromEntries(
        Object.entries({ ...t.threadHostIds, ...n.threadHostIds }).filter(([e]) =>
          a.has(`codex:thread:local:${e}`),
        ),
      )),
        (this.#t = CH(t, this.#r)),
        (this.#n = CH(n, this.#r)),
        (this.#a = this.#r.structure ? t.sections.map(({ id: e }) => e) : void 0),
        (this.#o = this.#r.structure ? n.sections.map(({ id: e }) => e) : void 0),
        (this.#s = xH(n, this.#r)));
    }
    static affectedState(e) {
      return { affectedBefore: e.#t, affectedAfter: e.#n };
    }
    static initialTransition(e) {
      return e.#y();
    }
    static migrationTransition(t, n) {
      let r = t.read();
      return new e(t, r, r, void 0, n).#y();
    }
    async undo(e) {
      return this.#h(() => this.#e.enqueueWrite(() => this.#v(`undo`, e)));
    }
    async redo(e) {
      return this.#h(() => this.#e.enqueueWrite(() => this.#v(`redo`, e)));
    }
    [Symbol.dispose]() {
      ((this.#l = !0), (this.#u = {}));
    }
    #h(e) {
      let t = this.#d.then(e);
      return (
        (this.#d = t.then(
          () => {},
          () => {},
        )),
        (this.#f = this.#d),
        t
      );
    }
    #g(e) {
      let t = this.#f.then(e);
      return ((this.#d = Promise.allSettled([this.#d, t]).then(() => {})), t);
    }
    #_() {
      return (
        !this.#l &&
        this.#e.isSourceCurrent() &&
        (this.#m == null || (0, G.default)(_H(this.#e.read(), this.#m), this.#e.read())) &&
        SH(this.#e.read(), this.#s)
      );
    }
    #v(e, t) {
      if (this.#l || !this.#e.isSourceCurrent()) return { status: `unavailable` };
      if (this.#c !== e || !this.#_()) return (this[Symbol.dispose](), { status: `conflict` });
      let n = this.#e.read(),
        r = wH(n, e === `undo` ? this.#t : this.#n, this.#r, e === `undo` ? this.#a : this.#o);
      return (
        (this.#u = {}),
        this.#e.write(r, t),
        (this.#s = xH(this.#e.read(), this.#r)),
        (this.#c = e === `undo` ? `redo` : `undo`),
        {
          status: `applied`,
          affectedBefore: CH(n, this.#r),
          affectedAfter: CH(r, this.#r),
          transition: this.#y(this.#m == null ? bH(n, r) : this.#r),
        }
      );
    }
    #y(e = this.#r) {
      let t = this.#u;
      return new tBe(
        this.#e,
        (e) => this.#g(e),
        (e) => this.#h(e),
        e,
        this.#i,
        this.#m?.itemKey,
        () => {
          if (t !== this.#u || !this.#_())
            throw new DOMException(`Saved section transition retired`, `AbortError`);
        },
        (e, n, r) => {
          if (t !== this.#u || !this.#_()) return `conflict`;
          let i = this.#e.read(),
            a = i.sections.find(({ id: t }) => t === e);
          if (a == null) return `conflict`;
          if ((this.#e.getConnection(n), a.hostSectionIds?.[n] === r)) return `unchanged`;
          this.#e.write(
            {
              ...i,
              sections: i.sections.map((e) =>
                e === a ? { ...e, hostSectionIds: { ...e.hostSectionIds, [n]: r } } : e,
              ),
            },
            ``,
          );
          for (let t of [this.#t, this.#n])
            t.sections = t.sections.map((t) =>
              t.id === e ? { ...t, hostSectionIds: { ...t.hostSectionIds, [n]: r } } : t,
            );
          for (let e of this.#r.sections)
            ((e.before = this.#t.sections.find(({ id: t }) => t === e.id)),
              (e.after = this.#n.sections.find(({ id: t }) => t === e.id)));
          return ((this.#s = xH(this.#e.read(), this.#r)), `applied`);
        },
        this.#p,
        (e, n) => {
          if (t !== this.#u || !this.#_() || e !== this.#p) return `conflict`;
          let r = this.#e.read();
          return (
            this.#e.getConnection(e),
            r.appServerMigratedHostIds?.includes(e)
              ? `unchanged`
              : (this.#e.write(
                  { ...r, appServerMigratedHostIds: [...(r.appServerMigratedHostIds ?? []), e] },
                  n,
                ),
                (this.#u = {}),
                `applied`)
          );
        },
      );
    }
  };
}

if (typeof module !== "undefined") module.exports = { createSavedSectionUndoRedoStackClass };
