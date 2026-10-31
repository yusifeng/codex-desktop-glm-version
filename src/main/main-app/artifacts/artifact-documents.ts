// @ts-nocheck

/** Owns authorized artifact-document binding, updates, subscriptions, and materialization commits. */
export function createArtifactDocumentsClass(dependencies: Record<string, any>) {
  const {
    runtime: n,
    path,
    fs,
    isPathInside,
    isFileTooLarge,
    maxFileBytes,
    pipeline,
    createReadStream,
    createHash,
    randomUUID,
    platform,
    structuredCloneFn = structuredClone,
  } = dependencies;

var h4 = n
    .Of()
    .min(1)
    .refine((e) => path.isAbsolute(e), `Expected an absolute local path`),
  g4 = n.Of().min(1),
  _4 = n.wf({ publicFilePath: h4, workspaceRoot: h4 }).strict(),
  K5e = n.wf({ publicFilePath: h4 }).strict(),
  q5e = _4
    .extend({
      checkpoint: n.ff(Uint8Array),
      documentId: g4,
      kind: n.df([`presentation`, `spreadsheet`]),
      publicFileHash: n.Of().regex(/^[a-f0-9]{64}$/),
    })
    .strict(),
  v4 = _4.extend({ documentId: g4 }).strict(),
  J5e = v4
    .extend({
      baseStateVersion: n.Cf().int().nonnegative(),
      bytes: n.ff(Uint8Array),
      originId: g4,
      source: n.df([`model`, `user`]),
      updateId: g4,
    })
    .strict(),
  Y5e = v4
    .extend({
      checkpoint: n.ff(Uint8Array),
      expectedPublicFileHash: n.Of().regex(/^[a-f0-9]{64}$/),
      expectedStateVersion: n.Cf().int().nonnegative(),
      observedPublicFileHash: n.Of().regex(/^[a-f0-9]{64}$/),
      replacementDocumentId: g4,
    })
    .strict(),
  X5e = v4
    .extend({
      expectedStateVersion: n.Cf().int().nonnegative(),
      materializationId: g4,
      publicFileBytes: n.ff(Uint8Array),
    })
    .strict(),
  Z5e = class ArtifactDocuments extends n.Uf {
    options;
    exactPublicFilePath;
    listenersByPath;
    operationsByPath;
    constructor(e, t = null, n) {
      (super(),
        (this.options = e),
        (this.exactPublicFilePath = t),
        (this.listenersByPath = n?.listenersByPath ?? new Map()),
        (this.operationsByPath = n?.operationsByPath ?? new Map()));
    }
    async bindToExactFile(t) {
      let n = K5e.parse(t),
        r = await this.#i(n.publicFilePath);
      if (this.exactPublicFilePath != null && r !== this.exactPublicFilePath)
        throw Error(`Artifact file does not match exact-file binding`);
      return new ArtifactDocuments(this.options, r, {
        listenersByPath: this.listenersByPath,
        operationsByPath: this.operationsByPath,
      });
    }
    async find(e) {
      let t = _4.parse(e),
        n = await this.#n(t);
      return this.#e(t, n.publicFilePath, (e) => this.options.store.find(e));
    }
    async adopt(e) {
      let t = q5e.parse(e),
        n = await this.#n(t);
      return this.#e(t, n.publicFilePath, async (e) => {
        if (t.publicFileHash !== e.publicFileHash)
          throw Error(`Public artifact file hash does not match`);
        return this.options.store.adopt({
          ...e,
          checkpoint: t.checkpoint,
          documentId: t.documentId,
          kind: t.kind,
        });
      });
    }
    async read(e) {
      let t = v4.parse(e),
        n = await this.#n(t);
      return this.#e(t, n.publicFilePath, (e) =>
        this.options.store.read({ ...e, documentId: t.documentId }),
      );
    }
    async append(e) {
      let t = J5e.parse(e),
        n = await this.#r(t);
      return this.#e(t, n, async (e) => {
        let n = await this.options.store.append({
          ...e,
          baseStateVersion: t.baseStateVersion,
          bytes: t.bytes,
          documentId: t.documentId,
          originId: t.originId,
          source: t.source,
          updateId: t.updateId,
        });
        return n.status === `ok`
          ? `outcome` in n.value
            ? { status: `ok`, value: n.value }
            : (n.value.applied &&
                this.#o(e.publicFilePath, {
                  checkpointStateVersion: n.value.record.checkpointStateVersion,
                  committedUpdate: n.value.committedUpdate,
                  documentId: n.value.record.documentId,
                  materializedStateVersion: n.value.record.materializedStateVersion,
                  stateVersion: n.value.record.stateVersion,
                }),
              {
                status: `ok`,
                value: { applied: n.value.applied, stateVersion: n.value.stateVersion },
              })
          : n;
      });
    }
    async refreshCleanSession(e) {
      let t = Y5e.parse(e),
        n = await this.#n(t);
      return this.#e(t, n.publicFilePath, async (e) => {
        if (t.observedPublicFileHash !== e.publicFileHash) {
          let t = await this.options.store.find(e);
          if (t.status !== `ok`) return t;
          if (t.value == null) throw Error(`Artifact document does not exist`);
          return { status: `ok`, value: { outcome: `stale`, record: t.value } };
        }
        if ((this.listenersByPath.get(e.publicFilePath)?.size ?? 0) > 1) {
          let n = await this.options.store.read({ ...e, documentId: t.documentId });
          return n.status === `ok`
            ? { status: `ok`, value: { outcome: `multiple-viewers`, record: n.value } }
            : n;
        }
        return this.options.store.refreshCleanSession({
          ...e,
          checkpoint: t.checkpoint,
          documentId: t.documentId,
          expectedPublicFileHash: t.expectedPublicFileHash,
          expectedStateVersion: t.expectedStateVersion,
          replacementDocumentId: t.replacementDocumentId,
        });
      });
    }
    async materialize(e) {
      let t = X5e.parse(e),
        n = await this.#n(t);
      if (isFileTooLarge(t.publicFileBytes.byteLength))
        return { status: `ok`, value: { maxBytes: maxFileBytes, outcome: `too-large` } };
      let r = new Uint8Array(t.publicFileBytes),
        i = t7e(r);
      return this.#e(t, n.publicFilePath, async (e) => {
        let n = e7e(),
          a = await this.options.store.beginMaterialization({
            ...e,
            documentId: t.documentId,
            expectedStateVersion: t.expectedStateVersion,
            materializationId: t.materializationId,
            intendedPublicFileHash: i,
            stagedFileName: n,
          });
        if (a.status !== `ok`) return a;
        switch (a.value.outcome) {
          case `materialized`:
            return { status: `ok`, value: y4(a.value.record, a.value.applied) };
          case `stale`:
            return {
              status: `ok`,
              value: { outcome: `stale`, stateVersion: a.value.record.stateVersion },
            };
        }
        let o = await $5e({
          bytes: r,
          expectedPublicFileHash: e.publicFileHash,
          publicFilePath: e.publicFilePath,
          stagedFileName: n,
        });
        if (o.status === `conflict`)
          return {
            actualPublicFileHash: o.actualPublicFileHash,
            expectedPublicFileHash: e.publicFileHash,
            status: `conflict`,
          };
        if (o.status === `failed`) return { reason: `persistence`, status: `failed` };
        let s;
        try {
          s = await b4(e.publicFilePath);
        } catch {
          return { reason: `persistence`, status: `failed` };
        }
        if (s !== i)
          return { actualPublicFileHash: s, expectedPublicFileHash: i, status: `conflict` };
        let c = await this.options.store.finishMaterialization({
          documentId: t.documentId,
          materializationId: t.materializationId,
          publicFileHash: i,
          publicFilePath: e.publicFilePath,
        });
        return c.status === `ok` ? { status: `ok`, value: y4(c.value.record, c.value.applied) } : c;
      });
    }
    async subscribe(e, t) {
      let n = v4.parse(e),
        r = await this.#n(n);
      return this.#e(n, r.publicFilePath, async (e) => {
        let r = await this.options.store.read({ ...e, documentId: n.documentId });
        return r.status === `ok`
          ? { status: `ok`, value: { record: r.value, subscription: this.#a(e.publicFilePath, t) } }
          : r;
      });
    }
    #e(e, t, n) {
      return this.#s(t, async () => {
        let r = await this.#n(e);
        if (t !== r.publicFilePath) throw Error(`Artifact file path changed during the operation`);
        return (await this.#t(r), n(r));
      });
    }
    async #t(e) {
      let t = await this.options.store.getPendingMaterialization(e);
      t.status === `ok` &&
        t.value != null &&
        (await (0, fs.unlink)(
          path.join(path.dirname(e.publicFilePath), t.value.stagedFileName),
        ).catch((e) => {
          if (!n7e(e, `ENOENT`)) throw e;
        }));
    }
    async #n(e) {
      let t = await this.#r(e);
      return { publicFileHash: await b4(t), publicFilePath: t };
    }
    async #r(e) {
      if (this.exactPublicFilePath != null) {
        let t = await this.#i(e.publicFilePath);
        if (t !== this.exactPublicFilePath)
          throw Error(`Artifact file does not match exact-file binding`);
        return t;
      }
      let t = await (0, fs.realpath)(e.workspaceRoot);
      if (
        !(
          await Promise.all(
            (await this.options.getAllowedWorkspaceRoots()).map(async (e) => {
              try {
                return await (0, fs.realpath)(e);
              } catch {
                return null;
              }
            }),
          )
        ).includes(t)
      )
        throw Error(`Artifact workspace root is not authorized`);
      if (!(await (0, fs.stat)(t)).isDirectory())
        throw Error(`Artifact workspace root must be a directory`);
      let n = await this.#i(e.publicFilePath);
      if (!isPathInside(n, t)) throw Error(`Artifact file must stay within its workspace root`);
      return n;
    }
    async #i(e) {
      let t = await (0, fs.realpath)(e);
      if (!(await (0, fs.stat)(t)).isFile())
        throw Error(`Artifact path must identify a regular file`);
      return t;
    }
    #a(e, t) {
      let n = t.dup?.() ?? t,
        r = this.listenersByPath.get(e) ?? new Set();
      (r.add(n), this.listenersByPath.set(e, r));
      let i = !0,
        a = () => {
          i &&
            ((i = !1),
            r.delete(n),
            n[Symbol.dispose]?.(),
            r.size === 0 && this.listenersByPath.delete(e));
        };
      return (n.onRpcBroken?.(a), new Q5e(a));
    }
    #o(e, t) {
      for (let n of this.listenersByPath.get(e) ?? [])
        try {
          n(structuredCloneFn(t))?.[Symbol.dispose]();
        } catch {}
    }
    async #s(e, t) {
      let n = (this.operationsByPath.get(e) ?? Promise.resolve()).then(t),
        r = n.then(
          () => void 0,
          () => void 0,
        );
      this.operationsByPath.set(e, r);
      try {
        return await n;
      } finally {
        this.operationsByPath.get(e) === r && this.operationsByPath.delete(e);
      }
    }
  },
  Q5e = class extends n.Uf {
    unsubscribeOnce;
    constructor(e) {
      (super(), (this.unsubscribeOnce = e));
    }
    unsubscribe() {
      (this.unsubscribeOnce?.(), (this.unsubscribeOnce = null));
    }
    [Symbol.dispose]() {
      this.unsubscribe();
    }
  };
function y4(e, t) {
  return {
    applied: t,
    materializedStateVersion: e.materializedStateVersion,
    outcome: `materialized`,
    publicFileHash: e.publicFileHash,
    stateVersion: e.stateVersion,
  };
}
async function $5e({ bytes: e, expectedPublicFileHash: t, publicFilePath: n, stagedFileName: r }) {
  let i = await (0, fs.stat)(n);
  if (!i.isFile()) throw Error(`Artifact path must identify a regular file`);
  let a = i.mode % 4096,
    o = path.join(path.dirname(n), r),
    s,
    c,
    l = !1;
  try {
    if (
      ((c = await (0, fs.open)(o, `wx`, a)),
      await c.writeFile(e),
      platform !== `win32` && (await c.chmod(a)),
      await c.sync(),
      await c.close(),
      (c = void 0),
      !(await (0, fs.stat)(n)).isFile())
    )
      throw Error(`Artifact path must identify a regular file`);
    let r = await b4(n);
    return r === t
      ? (platform !== `win32` && (s = await (0, fs.open)(path.dirname(n), `r`)),
        await (0, fs.rename)(o, n),
        (l = !0),
        await s?.sync(),
        { status: `committed` })
      : { actualPublicFileHash: r, status: `conflict` };
  } catch {
    return { status: `failed` };
  } finally {
    (await c?.close().catch(() => {}),
      await s?.close().catch(() => {}),
      l || (await (0, fs.unlink)(o).catch(() => {})));
  }
}
function e7e() {
  return `.artifact-document-materialize-${randomUUID()}`;
}
async function b4(e) {
  let t = createHash(`sha256`);
  return (await pipeline(createReadStream(e), t), t.digest(`hex`));
}
function t7e(e) {
  return createHash(`sha256`).update(e).digest(`hex`);
}
function n7e(e, t) {
  return e instanceof Error && Reflect.get(e, `code`) === t;
}

  return Z5e;
}

if (typeof module !== "undefined") {
  module.exports = { createArtifactDocumentsClass };
}

