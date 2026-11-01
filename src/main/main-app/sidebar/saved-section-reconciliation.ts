// @ts-nocheck

export function createSavedSectionReconciliationClass(dependencies) {
  const {
    reconcileHostSectionList,
    reconcileHostSectionMembers,
    _,
    n,
    vH,
  } = dependencies;
  return class SavedSectionReconciliation extends n.Uf {
      #e;
      #t;
      #n;
      #r;
      #i;
      #a;
      #o;
      #s = !1;
      #c = !1;
      constructor(e, t, n, r) {
        (super(), (this.#e = e), (this.#r = r), (this.#t = t), (this.#n = n), (this.#i = e.read()));
      }
      async readList() {
        if ((this.#l(), this.#n != null)) throw Error(`Member query cannot read a section list`);
        let e = await this.#e.server.listSections({ hostId: this.#t }, this.#d());
        return (this.#u(), (this.#a = e), e);
      }
      async readMembers() {
        if ((this.#l(), this.#n == null)) throw Error(`List query cannot read section members`);
        this.#i?.sections.some((e) => e.hostSectionIds?.[this.#t] === this.#n) ||
          ((this.#a = await this.#e.server.listSections({ hostId: this.#t }, this.#d())), this.#u());
        let e = await this.#e.server.listSectionThreadIds(
          { hostId: this.#t, sectionId: this.#n },
          this.#d(),
        );
        return (this.#u(), (this.#o = e), e);
      }
      async commitList(e) {
        if (this.#i == null || this.#a == null || this.#c || !this.#e.isSourceCurrent())
          return `unavailable`;
        this.#c = !0;
        let t = this.#i,
          n = this.#a,
          r = new Map();
        if (
          (await Promise.all(
            n.sections
              .filter(
                (e) =>
                  e.hostId === this.#t &&
                  !t.sections.some((t) => t.hostSectionIds?.[this.#t] === e.id),
              )
              .map(async (e) => {
                r.set(
                  e.id,
                  await this.#e.server.listSectionThreadIds(
                    { hostId: this.#t, sectionId: e.id },
                    this.#d(),
                  ),
                );
              }),
          ),
          this.#i == null)
        )
          return `unavailable`;
        if (!this.#r()) return `conflict`;
        let i = reconcileHostSectionList(
          t,
          this.#t,
          n,
          e.threadHostIds,
          e.boundThreadIds,
          _.randomUUID,
          r,
        );
        for (let [t, n] of r)
          i = reconcileHostSectionMembers(
            i,
            this.#t,
            t,
            n,
            e.threadHostIds,
            e.boundThreadIds,
          );
        return vH(this.#e, t, i, e.operationId, this.#t);
      }
      async commitMembers(e) {
        if (this.#i == null || this.#o == null || this.#n == null || this.#c) return `unavailable`;
        if (((this.#c = !0), !this.#r())) return `conflict`;
        let t = this.#i.sections.find((e) => e.hostSectionIds?.[this.#t] === this.#n);
        if (
          (t != null && this.#e.read().sections.find(({ id: e }) => e === t.id) !== t) ||
          (t == null && this.#a == null)
        )
          return `conflict`;
        let n = this.#i,
          r =
            this.#a == null
              ? n
              : reconcileHostSectionList(
                  n,
                  this.#t,
                  this.#a,
                  e.threadHostIds,
                  e.boundThreadIds,
                  _.randomUUID,
                  new Map([[this.#n, this.#o]]),
                );
        return vH(
          this.#e,
          n,
          reconcileHostSectionMembers(
            r,
            this.#t,
            this.#n,
            this.#o,
            e.threadHostIds,
            e.boundThreadIds,
          ),
          e.operationId,
          this.#t,
        );
      }
      [Symbol.dispose]() {
        ((this.#i = void 0), (this.#a = void 0), (this.#o = void 0));
      }
      #l() {
        if ((this.#u(), this.#s)) throw Error(`Saved section query was already read`);
        this.#s = !0;
      }
      #u() {
        if (this.#i == null || !this.#e.isSourceCurrent())
          throw new DOMException(`Saved section query retired`, `AbortError`);
        this.#e.getConnection(this.#t);
      }
      #d() {
        return {
          getConnection: (e) => {
            if (e !== this.#t) throw Error(`Host is outside this query`);
            return this.#e.getConnection(e);
          },
          assertCurrent: () => this.#u(),
          assertSourceCurrent: () => this.#u(),
          canDeleteCreatedReplica: () => !1,
        };
      }
    };
}

if (typeof module !== "undefined") module.exports = { createSavedSectionReconciliationClass };
