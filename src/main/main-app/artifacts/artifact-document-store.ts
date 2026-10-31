// @ts-nocheck

/** Owns durable artifact-document records, compaction, hashing, and materialization journals. */
export function createArtifactDocumentStoreClass(dependencies: Record<string, any>) {
  const {
    runtime: n,
    path,
    fs,
    createHash,
    randomUUID,
    platform,
    validateYjsUpdate,
    mergeYjsUpdates,
    BufferClass = Buffer,
  } = dependencies;

var bet = 8388608,
  xet = 128,
  E8 = /^[a-f0-9]{64}$/,
  D8 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/,
  Cet = n
    .wf({
      bytesBase64: n.Of().regex(D8),
      originId: n.Of().min(1),
      source: n.df([`model`, `user`]),
      stateVersion: n.Cf().int().positive(),
      updateId: n.Of().min(1),
    })
    .strict(),
  wet = n
    .wf({
      bytesHash: n.Of().regex(E8),
      originId: n.Of().min(1),
      source: n.df([`model`, `user`]),
      stateVersion: n.Cf().int().positive(),
      updateId: n.Of().min(1),
    })
    .strict(),
  O8 = n
    .wf({
      materializationId: n.Of().min(1),
      publicFileHash: n.Of().regex(E8),
      stateVersion: n.Cf().int().nonnegative(),
    })
    .strict(),
  Tet = O8.extend({
    stagedFileName: n.Of().regex(/^\.artifact-document-materialize-[a-f0-9-]{36}$/),
  }),
  Eet = n
    .wf({
      adoptedCheckpointHash: n.Of().regex(E8),
      checkpointBase64: n.Of().regex(D8),
      checkpointStateVersion: n.Cf().int().nonnegative(),
      commits: n.hf(wet),
      documentId: n.Of().min(1),
      kind: n.df([`presentation`, `spreadsheet`]),
      materializations: n.hf(O8).optional(),
      materializedStateVersion: n.Cf().int().nonnegative(),
      pendingMaterialization: Tet.nullable().optional(),
      publicFileHash: n.Of().regex(E8),
      publicFilePath: n.Of().min(1),
      recordHash: n.Of().regex(E8),
      schemaVersion: n.bf(1),
      stateVersion: n.Cf().int().nonnegative(),
      updates: n.hf(Cet),
    })
    .strict(),
  k8 = new Map(),
  A8 = new Set(),
  j8 = new Set(),
  Det = class ArtifactDocumentStore {
    #e;
    #t;
    #n;
    constructor(e) {
      if (
        ((this.#e = e.directory),
        (this.#t = e.compactionUpdateBytesThreshold ?? bet),
        (this.#n = e.compactionUpdateCountThreshold ?? xet),
        !Number.isFinite(this.#t) || this.#t <= 0 || !Number.isInteger(this.#n) || this.#n <= 0)
      )
        throw Error(`Artifact document compaction thresholds must be positive`);
    }
    find(e) {
      let t = this.#r(e.publicFilePath);
      return M8(t, async () => {
        let n = await N8(t);
        if (n.status === `missing`) return { status: `ok`, value: null };
        if (n.status !== `ok`) return { reason: n.status, status: `failed` };
        let r = await P8(t, n.value, e.publicFileHash);
        return r.status === `ok`
          ? r.value.publicFilePath === e.publicFilePath
            ? { status: `ok`, value: V8(r.value) }
            : { reason: `corrupt`, status: `failed` }
          : r;
      });
    }
    adopt(e) {
      let t = new Uint8Array(e.checkpoint),
        n = G8(t),
        r = this.#r(e.publicFilePath);
      return M8(r, async () => {
        let i = await N8(r);
        if (i.status === `corrupt` || i.status === `persistence`)
          return { reason: i.status, status: `failed` };
        if (i.status === `ok`) {
          let t = await P8(r, i.value, e.publicFileHash);
          if (t.status !== `ok`) return t;
          if (t.value.publicFilePath !== e.publicFilePath)
            return { reason: `corrupt`, status: `failed` };
          if (t.value.publicFileHash !== e.publicFileHash) return H8(t.value, e.publicFileHash);
          if (t.value.documentId !== e.documentId) throw Error(`Artifact document ID collision`);
          if (t.value.kind !== e.kind) throw Error(`Artifact document kind collision`);
          if (t.value.adoptedCheckpointHash !== n)
            throw Error(`Artifact document checkpoint collision`);
          return { status: `ok`, value: V8(t.value) };
        }
        W8(t, `checkpoint`);
        let a = F8({
          adoptedCheckpointHash: n,
          checkpointBase64: q8(t),
          checkpointStateVersion: 0,
          commits: [],
          documentId: e.documentId,
          kind: e.kind,
          materializations: [],
          materializedStateVersion: 0,
          pendingMaterialization: null,
          publicFileHash: e.publicFileHash,
          publicFilePath: e.publicFilePath,
          recordHash: ``,
          schemaVersion: 1,
          stateVersion: 0,
          updates: [],
        });
        return (await B8(r, a))
          ? { status: `ok`, value: V8(a) }
          : { reason: `persistence`, status: `failed` };
      });
    }
    read(e) {
      let t = this.#r(e.publicFilePath);
      return M8(t, async () => {
        let n = await N8(t);
        if (n.status === `missing`) throw Error(`Artifact document does not exist`);
        if (n.status !== `ok`) return { reason: n.status, status: `failed` };
        let r = await P8(t, n.value, e.publicFileHash);
        return r.status === `ok`
          ? r.value.publicFilePath === e.publicFilePath
            ? (U8(r.value, e.documentId), { status: `ok`, value: V8(r.value) })
            : { reason: `corrupt`, status: `failed` }
          : r;
      });
    }
    append(e) {
      let t = new Uint8Array(e.bytes),
        n = G8(t),
        r = this.#r(e.publicFilePath);
      return M8(r, async () => {
        let i = await N8(r);
        if (i.status === `missing`) throw Error(`Artifact document does not exist`);
        if (i.status !== `ok`) return { reason: i.status, status: `failed` };
        let a = await P8(r, i.value, e.publicFileHash);
        if (a.status !== `ok`) return a;
        if (a.value.publicFilePath !== e.publicFilePath)
          return { reason: `corrupt`, status: `failed` };
        U8(a.value, e.documentId);
        let o = a.value.commits.find(({ updateId: t }) => t === e.updateId);
        if (o != null) {
          if (o.bytesHash !== n || o.originId !== e.originId || o.source !== e.source)
            throw Error(`Artifact document update ID collision`);
          return {
            status: `ok`,
            value: { applied: !1, record: V8(a.value), stateVersion: o.stateVersion },
          };
        }
        let s = a.value.commits[0]?.stateVersion ?? a.value.stateVersion + 1;
        if (e.baseStateVersion < s - 1)
          return {
            status: `ok`,
            value: {
              earliestRetainedStateVersion: s,
              outcome: `expired-retry`,
              stateVersion: a.value.stateVersion,
            },
          };
        W8(t, `update`);
        let c = a.value.stateVersion + 1,
          l = {
            bytes: t,
            originId: e.originId,
            source: e.source,
            stateVersion: c,
            updateId: e.updateId,
          },
          u = {
            ...a.value,
            commits: [
              ...a.value.commits,
              {
                bytesHash: n,
                originId: e.originId,
                source: e.source,
                stateVersion: c,
                updateId: e.updateId,
              },
            ].slice(-512),
            stateVersion: c,
            updates: [
              ...a.value.updates,
              {
                bytesBase64: q8(t),
                originId: e.originId,
                source: e.source,
                stateVersion: c,
                updateId: e.updateId,
              },
            ],
          };
        if (this.#i(u.updates)) {
          let e = mergeYjsUpdates([J8(u.checkpointBase64), ...u.updates.map(({ bytesBase64: e }) => J8(e))]);
          u = { ...u, checkpointBase64: q8(e), checkpointStateVersion: c, updates: [] };
        }
        return (
          (u = F8(u)),
          (await B8(r, u))
            ? {
                status: `ok`,
                value: { applied: !0, committedUpdate: l, record: V8(u), stateVersion: c },
              }
            : { reason: `persistence`, status: `failed` }
        );
      });
    }
    refreshCleanSession(e) {
      let t = new Uint8Array(e.checkpoint),
        n = G8(t),
        r = this.#r(e.publicFilePath);
      return M8(r, async () => {
        let i = await N8(r);
        if (i.status === `missing`) throw Error(`Artifact document does not exist`);
        if (i.status !== `ok`) return { reason: i.status, status: `failed` };
        let a = await P8(r, i.value, e.publicFileHash);
        if (a.status !== `ok`) return a;
        if (a.value.publicFilePath !== e.publicFilePath)
          return { reason: `corrupt`, status: `failed` };
        if (a.value.documentId === e.replacementDocumentId) {
          if (a.value.adoptedCheckpointHash !== n || a.value.publicFileHash !== e.publicFileHash)
            throw Error(`Artifact document replacement ID collision`);
          return {
            status: `ok`,
            value: { applied: !1, outcome: `refreshed`, record: V8(a.value) },
          };
        }
        if (
          a.value.documentId !== e.documentId ||
          a.value.publicFileHash !== e.expectedPublicFileHash ||
          a.value.stateVersion !== e.expectedStateVersion
        )
          return { status: `ok`, value: { outcome: `stale`, record: V8(a.value) } };
        if (a.value.stateVersion !== a.value.materializedStateVersion)
          return { status: `ok`, value: { outcome: `dirty`, record: V8(a.value) } };
        if (e.replacementDocumentId === e.documentId)
          throw Error(`Artifact document replacement ID must be new`);
        W8(t, `checkpoint`);
        let o = F8({
          adoptedCheckpointHash: n,
          checkpointBase64: q8(t),
          checkpointStateVersion: 0,
          commits: [],
          documentId: e.replacementDocumentId,
          kind: a.value.kind,
          materializations: [],
          materializedStateVersion: 0,
          pendingMaterialization: null,
          publicFileHash: e.publicFileHash,
          publicFilePath: e.publicFilePath,
          recordHash: ``,
          schemaVersion: 1,
          stateVersion: 0,
          updates: [],
        });
        return (await B8(r, o))
          ? { status: `ok`, value: { applied: !0, outcome: `refreshed`, record: V8(o) } }
          : { reason: `persistence`, status: `failed` };
      });
    }
    getPendingMaterialization(e) {
      let t = this.#r(e.publicFilePath);
      return M8(t, async () => {
        let n = await N8(t);
        if (n.status === `missing`) return { status: `ok`, value: null };
        if (n.status !== `ok`) return { reason: n.status, status: `failed` };
        if (n.value.publicFilePath !== e.publicFilePath)
          return { reason: `corrupt`, status: `failed` };
        let r = n.value.pendingMaterialization;
        return { status: `ok`, value: r == null ? null : { stagedFileName: r.stagedFileName } };
      });
    }
    beginMaterialization(e) {
      let t = this.#r(e.publicFilePath);
      return M8(t, async () => {
        let n = await N8(t);
        if (n.status === `missing`) throw Error(`Artifact document does not exist`);
        if (n.status !== `ok`) return { reason: n.status, status: `failed` };
        let r = await P8(t, n.value, e.publicFileHash);
        if (r.status !== `ok`) return r;
        if (r.value.publicFilePath !== e.publicFilePath)
          return { reason: `corrupt`, status: `failed` };
        if (r.value.publicFileHash !== e.publicFileHash) return H8(r.value, e.publicFileHash);
        U8(r.value, e.documentId);
        let i = L8(r.value),
          a = i.find(({ materializationId: t }) => t === e.materializationId);
        if (a != null) {
          if (
            a.publicFileHash !== e.intendedPublicFileHash ||
            a.stateVersion !== e.expectedStateVersion
          )
            throw Error(`Artifact document materialization ID collision`);
          return {
            status: `ok`,
            value: { applied: !1, outcome: `materialized`, record: V8(r.value) },
          };
        }
        if (
          r.value.stateVersion !== e.expectedStateVersion ||
          i.some(({ stateVersion: t }) => t === e.expectedStateVersion)
        )
          return { status: `ok`, value: { outcome: `stale`, record: V8(r.value) } };
        let o = {
          materializationId: e.materializationId,
          publicFileHash: e.intendedPublicFileHash,
          stateVersion: e.expectedStateVersion,
        };
        if (e.intendedPublicFileHash === r.value.publicFileHash) {
          let e = I8(r.value, o);
          return (await B8(t, e))
            ? { status: `ok`, value: { applied: !0, outcome: `materialized`, record: V8(e) } }
            : { reason: `persistence`, status: `failed` };
        }
        let s = F8({
          ...r.value,
          pendingMaterialization: { ...o, stagedFileName: e.stagedFileName },
        });
        return (await B8(t, s))
          ? { status: `ok`, value: { outcome: `prepared` } }
          : { reason: `persistence`, status: `failed` };
      });
    }
    finishMaterialization(e) {
      let t = this.#r(e.publicFilePath);
      return M8(t, async () => {
        let n = await N8(t);
        if (n.status === `missing`) throw Error(`Artifact document does not exist`);
        if (n.status !== `ok`) return { reason: n.status, status: `failed` };
        let r = await P8(t, n.value, e.publicFileHash);
        if (r.status !== `ok`) return r;
        if (r.value.publicFilePath !== e.publicFilePath)
          return { reason: `corrupt`, status: `failed` };
        if (r.value.publicFileHash !== e.publicFileHash) return H8(r.value, e.publicFileHash);
        if (
          (U8(r.value, e.documentId),
          L8(r.value).find(({ materializationId: t }) => t === e.materializationId) == null)
        )
          throw Error(`Artifact document materialization does not exist`);
        return {
          status: `ok`,
          value: { applied: !0, outcome: `materialized`, record: V8(r.value) },
        };
      });
    }
    #r(e) {
      return (0, path.join)(this.#e, `${K8(e)}.json`);
    }
    #i(e) {
      return (
        e.length >= this.#n ||
        e.reduce((e, { bytesBase64: t }) => e + J8(t).byteLength, 0) >= this.#t
      );
    }
  };
async function M8(e, t) {
  let n = (k8.get(e) ?? Promise.resolve()).then(t),
    r = n.then(
      () => void 0,
      () => void 0,
    );
  k8.set(e, r);
  try {
    return await n;
  } finally {
    k8.get(e) === r && k8.delete(e);
  }
}
async function N8(e) {
  if (j8.has(e)) return { status: `persistence` };
  let t;
  try {
    t = await (0, fs.readFile)(e, `utf8`);
  } catch (t) {
    return Y8(t, `ENOENT`)
      ? (await Oet(e))
        ? { status: `persistence` }
        : { status: `missing` }
      : { status: `persistence` };
  }
  try {
    let e = Eet.safeParse(JSON.parse(t));
    return !e.success || !ket(e.data) ? { status: `corrupt` } : { status: `ok`, value: e.data };
  } catch {
    return { status: `corrupt` };
  }
}
async function Oet(e) {
  try {
    let t = `.${(0, path.basename)(e)}.tmp-`;
    return (await (0, fs.readdir)((0, path.dirname)(e))).some((e) => e.startsWith(t));
  } catch (e) {
    return !Y8(e, `ENOENT`);
  }
}
async function P8(e, t, n) {
  let r = t.pendingMaterialization;
  if (r == null) return { status: `ok`, value: t };
  if (n === r.publicFileHash) {
    let n = I8(t, r);
    return (await B8(e, n))
      ? { status: `ok`, value: n }
      : { reason: `persistence`, status: `failed` };
  }
  let i = F8({ ...t, pendingMaterialization: null });
  return (await B8(e, i))
    ? { status: `ok`, value: i }
    : { reason: `persistence`, status: `failed` };
}
function ket(e) {
  if (
    e.recordHash !== R8(e) ||
    e.checkpointStateVersion > e.stateVersion ||
    e.materializedStateVersion > e.stateVersion ||
    e.commits.length > e.stateVersion ||
    (e.stateVersion > 0 && e.commits.length === 0) ||
    e.updates.length !== e.stateVersion - e.checkpointStateVersion
  )
    return !1;
  let t = e.stateVersion - e.commits.length + 1,
    n = new Set();
  for (let [r, i] of e.commits.entries()) {
    if (i.stateVersion !== t + r || n.has(i.updateId)) return !1;
    n.add(i.updateId);
  }
  let r = new Set(),
    i = -1;
  for (let t of L8(e)) {
    if (t.stateVersion <= i || t.stateVersion > e.stateVersion || r.has(t.materializationId))
      return !1;
    (r.add(t.materializationId), (i = t.stateVersion));
  }
  return e.materializedStateVersion !== Math.max(i, 0) ||
    (e.pendingMaterialization != null &&
      (e.pendingMaterialization.stateVersion !== e.stateVersion ||
        e.pendingMaterialization.stateVersion < e.materializedStateVersion ||
        e.pendingMaterialization.publicFileHash === e.publicFileHash ||
        r.has(e.pendingMaterialization.materializationId)))
    ? !1
    : e.updates.every((n, r) => {
        let i = n.stateVersion < t ? void 0 : e.commits[n.stateVersion - t];
        return (
          n.stateVersion === e.checkpointStateVersion + r + 1 &&
          (i == null ||
            (i.bytesHash === G8(J8(n.bytesBase64)) &&
              i.originId === n.originId &&
              i.source === n.source &&
              i.updateId === n.updateId))
        );
      });
}
function F8(e) {
  let t = z8(e);
  return { ...t, recordHash: R8(t) };
}
function I8(e, t) {
  let n = {
    materializationId: t.materializationId,
    publicFileHash: t.publicFileHash,
    stateVersion: t.stateVersion,
  };
  return F8({
    ...e,
    materializations: [...L8(e), n],
    materializedStateVersion: t.stateVersion,
    pendingMaterialization: null,
    publicFileHash: t.publicFileHash,
  });
}
function L8(e) {
  return e.materializations ?? [];
}
function R8(e) {
  return K8(JSON.stringify({ ...z8(e), recordHash: `` }));
}
function z8(e) {
  return {
    adoptedCheckpointHash: e.adoptedCheckpointHash,
    checkpointBase64: e.checkpointBase64,
    checkpointStateVersion: e.checkpointStateVersion,
    commits: e.commits,
    documentId: e.documentId,
    kind: e.kind,
    materializations: e.materializations,
    materializedStateVersion: e.materializedStateVersion,
    pendingMaterialization: e.pendingMaterialization,
    publicFileHash: e.publicFileHash,
    publicFilePath: e.publicFilePath,
    recordHash: e.recordHash,
    schemaVersion: e.schemaVersion,
    stateVersion: e.stateVersion,
    updates: e.updates,
  };
}
async function B8(e, t) {
  let n = (0, path.dirname)(e),
    r = (0, path.join)(n, `.${(0, path.basename)(e)}.tmp-${randomUUID()}`),
    i,
    a,
    o = !1;
  try {
    let s = !1;
    try {
      (await (0, fs.mkdir)(n, { mode: 448 }), (s = !0));
    } catch (e) {
      if (!Y8(e, `EEXIST`)) throw e;
    }
    return (
      s && A8.delete(n),
      platform !== `win32` &&
        !A8.has(n) &&
        ((i = await (0, fs.open)((0, path.dirname)(n), `r`)),
        await i.sync(),
        await i.close(),
        (i = void 0),
        A8.add(n)),
      (a = await (0, fs.open)(r, `wx`, 384)),
      await a.writeFile(JSON.stringify(t)),
      await a.sync(),
      await a.close(),
      (a = void 0),
      platform !== `win32` && (i = await (0, fs.open)(n, `r`)),
      await (0, fs.rename)(r, e),
      (o = !0),
      await i?.sync(),
      !0
    );
  } catch {
    return (o && j8.add(e), !1);
  } finally {
    (await a?.close().catch(() => {}),
      await i?.close().catch(() => {}),
      o || (await (0, fs.unlink)(r).catch(() => {})));
  }
}
function V8(e) {
  return {
    checkpoint: J8(e.checkpointBase64),
    checkpointStateVersion: e.checkpointStateVersion,
    documentId: e.documentId,
    kind: e.kind,
    materializedStateVersion: e.materializedStateVersion,
    publicFileHash: e.publicFileHash,
    publicFilePath: e.publicFilePath,
    stateVersion: e.stateVersion,
    updates: e.updates.map(
      ({ bytesBase64: e, originId: t, source: n, stateVersion: r, updateId: i }) => ({
        bytes: J8(e),
        originId: t,
        source: n,
        stateVersion: r,
        updateId: i,
      }),
    ),
  };
}
function H8(e, t) {
  return { actualPublicFileHash: t, expectedPublicFileHash: e.publicFileHash, status: `conflict` };
}
function U8(e, t) {
  if (e.documentId !== t) throw Error(`Artifact document ID mismatch`);
}
function W8(e, t) {
  try {
    validateYjsUpdate(e);
  } catch {
    throw Error(`Artifact document ${t} must be a valid Yjs v2 update`);
  }
}
function G8(e) {
  return createHash(`sha256`).update(e).digest(`hex`);
}
function K8(e) {
  return createHash(`sha256`).update(e).digest(`hex`);
}
function q8(e) {
  return BufferClass.from(e).toString(`base64`);
}
function J8(e) {
  return new Uint8Array(BufferClass.from(e, `base64`));
}
function Y8(e, t) {
  return e instanceof Error && Reflect.get(e, `code`) === t;
}

  return Det;
}

if (typeof module !== "undefined") {
  module.exports = { createArtifactDocumentStoreClass };
}

