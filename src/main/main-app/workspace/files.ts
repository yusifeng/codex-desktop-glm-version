// @ts-nocheck

/** Owns workspace file reads/writes, previews, downloads, and temporary-file cleanup. */
export function createWorkspaceFileServiceClass(
  dependencies: Record<string, any>,
) {
  const {
    runtime: n,
    path: h,
    os: p,
    crypto: _,
    fsPromises: b,
    electron: l,
    stream: C,
    sanitizeFileName: je,
    isFileTooLarge: K,
    maxFileBytes: Ae,
    showItemInFolder: Ij,
    resolveWorkspacePath: fQ,
    resolveLocalWorkspacePath: pQ,
    atomicDownloadWrite: sQ,
    classifyBuffer: cQ,
    normalizeBase64: m$e,
    decodeBase64: h$e,
    statIfExists: lQ,
    createEtag: uQ,
    thumbnailMaxBytes: u$e,
    thumbnailMaxDimension: d$e,
    thumbnailConcurrency: f$e,
    operationTimeoutMs: oQ,
  } = dependencies;

  return class WorkspaceFileService extends n.Uf {
    executionHostRegistry;
    globalState;
    isDisposed = !1;
    nativeThumbnailInFlight = !1;
    nativeThumbnailQueue = Promise.resolve();
    pendingNativeThumbnailCount = 0;
    temporaryFilePaths = new Set();
    constructor(e, t) {
      (super(), (this.executionHostRegistry = e), (this.globalState = t));
    }
    async createDirectory({ hostId: e, path: t }) {
      let r = this.executionHostRegistry.get(e);
      await n.Di.mkdir(await fQ(t, r, this.globalState), { recursive: !0 }, r);
    }
    dispose() {
      this.isDisposed = !0;
      let e = [...this.temporaryFilePaths];
      (this.temporaryFilePaths.clear(),
        Promise.allSettled(
          e.map((e) => (0, b.rm)(h.dirname(e), { force: !0, recursive: !0 })),
        ));
    }
    async createTemporaryFile({ bytes: e, fileName: t }) {
      if (this.isDisposed) throw Error(`Workspace file service is disposed`);
      if (K(e.byteLength)) throw Error(`Temporary file is too large`);
      let n = await (0, b.mkdtemp)(
          h.join((0, p.tmpdir)(), `codex-file-preview-`),
        ),
        r = h.join(n, je(t));
      try {
        if (
          (await (0, b.writeFile)(r, e, { flag: `wx`, mode: 384 }),
          this.isDisposed)
        )
          throw Error(`Workspace file service is disposed`);
        return (this.temporaryFilePaths.add(r), { path: r });
      } catch (e) {
        throw (await (0, b.rm)(n, { force: !0, recursive: !0 }), e);
      }
    }
    async downloadCopy({ fileName: e, hostId: t, path: r }) {
      let i = this.executionHostRegistry.get(t);
      if (n.Es(i.hostConfig))
        throw Error(`Downloading a copy is only supported for local files`);
      let a = await fQ(r, i, this.globalState),
        o = l.app.getPath(`downloads`),
        s = h.parse(e == null ? a : je(e));
      for (let e = 0; ; e += 1) {
        let t = e === 0 ? s.base : `${s.name} (${e})${s.ext}`,
          r = h.join(o, t);
        try {
          (await n.Di.copyFile(a, r, i, { exclusive: !0 }), Ij(r));
          return;
        } catch (e) {
          if (
            typeof e != `object` ||
            !e ||
            !(`code` in e) ||
            e.code !== `EEXIST`
          )
            throw e;
        }
      }
    }
    async getDownloadsFolderIcon() {
      let e = l.app.getPath(`downloads`),
        t = await l.app.getFileIcon(e, { size: `normal` });
      if (t.isEmpty())
        throw Error(`Could not load the system Downloads folder icon`);
      return t.toDataURL();
    }
    async getMetadata({ hostId: e, path: t }) {
      let r = this.executionHostRegistry.get(e),
        i = await fQ(t, r, this.globalState),
        a = await n.Di.stat(i, r, { bypassCache: !0 });
      return a.isDirectory()
        ? { kind: `directory` }
        : a.isFile()
          ? { kind: `file` }
          : null;
    }
    get getThumbnailDataUrl() {
      return process.platform === `darwin` ? this.#e.bind(this) : void 0;
    }
    #e({ hostId: e, maxBytes: t, path: r, size: i }) {
      let a = this.executionHostRegistry.getMaybe(e);
      if (
        this.isDisposed ||
        a == null ||
        !Number.isSafeInteger(t) ||
        t <= 0 ||
        !Number.isSafeInteger(i) ||
        i <= 0 ||
        i > d$e
      )
        return Promise.resolve({ dataUrl: null });
      if (this.pendingNativeThumbnailCount >= f$e)
        return Promise.resolve({ dataUrl: null, reason: `overloaded` });
      this.pendingNativeThumbnailCount += 1;
      let o = this.nativeThumbnailQueue.then(async () => {
        let e,
          o,
          s = !1;
        try {
          if (this.isDisposed || this.nativeThumbnailInFlight)
            return { dataUrl: null };
          let c = n.Es(a.hostConfig);
          if (c && (await a.platformFamily()) !== `unix`)
            return { dataUrl: null, reason: `unsupported` };
          let u = c
              ? await fQ(r, a, this.globalState)
              : pQ(r, a, this.globalState),
            d = h.extname(u).toLowerCase(),
            f = await n.Di.stat(u, a, { bypassCache: !0, followSymlinks: !1 });
          if (!f.isFile() || f.isSymbolicLink() || (!c && f.size == null))
            return { dataUrl: null };
          let m = Math.min(t, u$e);
          if (f.size != null && f.size > m)
            return { byteLength: f.size, dataUrl: null };
          let g = c
              ? Buffer.from(
                  await new Response(
                    n.yc(
                      await a.spawn({
                        args: [`head`, `-c`, `${m + 1}`, `--`, u],
                        cwd: `/`,
                        outputBytesCap: m + 1,
                        timeoutMs: oQ,
                      }),
                      `Failed to read remote thumbnail file`,
                    ),
                  ).arrayBuffer(),
                )
              : void 0,
            _ = g?.byteLength ?? f.size;
          if (_ == null || _ > m) return { byteLength: _, dataUrl: null };
          if (/^\.(docx|pdf|pptx|xlsx|xlsm)$/.test(d)) {
            let e = d === `.pdf` ? `%PDF-` : `PK`;
            if (
              (
                g?.subarray(0, e.length) ??
                (await n.Di.readFileSampleBytes(u, a, e.length))
              ).toString(`latin1`) !== e
            )
              return { dataUrl: null };
          }
          let v = u;
          if (
            (g != null &&
              ((o = await (0, b.mkdtemp)(
                h.join((0, p.tmpdir)(), `codex-remote-file-thumbnail-`),
              )),
              (v = h.join(o, je(h.posix.basename(u)))),
              await (0, b.writeFile)(v, g, { flag: `wx`, mode: 384 })),
            this.isDisposed)
          )
            return { dataUrl: null };
          ((s = !0), (this.nativeThumbnailInFlight = !0));
          let y = (async () => {
              try {
                return await l.nativeImage.createThumbnailFromPath(v, {
                  height: i,
                  width: i,
                });
              } finally {
                (o != null &&
                  (await (0, b.rm)(o, { force: !0, recursive: !0 }).catch(
                    () => void 0,
                  )),
                  (this.nativeThumbnailInFlight = !1));
              }
            })(),
            x = await Promise.race([
              y,
              new Promise((t) => {
                ((e = setTimeout(t, oQ, null)), e.unref());
              }),
            ]);
          if (x == null) return { dataUrl: null, reason: `timeout` };
          if (this.isDisposed || x.isEmpty()) return { dataUrl: null };
          let S = x.toPNG();
          return {
            byteLength: _,
            dataUrl:
              S.length === 0
                ? null
                : `data:image/png;base64,${S.toString(`base64`)}`,
          };
        } catch {
          return { dataUrl: null };
        } finally {
          (clearTimeout(e),
            o != null &&
              !s &&
              (await (0, b.rm)(o, { force: !0, recursive: !0 }).catch(
                () => void 0,
              )),
            --this.pendingNativeThumbnailCount);
        }
      });
      return (
        (this.nativeThumbnailQueue = o.then(
          () => void 0,
          () => void 0,
        )),
        o
      );
    }
    async read({ hostId: e, maxBytes: t, path: r, representation: i }) {
      let a = this.executionHostRegistry.get(e),
        o = await fQ(r, a, this.globalState);
      if (t != null) {
        let e = await n.Di.stat(o, a, { bypassCache: !0 });
        if (e.size != null && e.size > t)
          throw Error(`Workspace file exceeds the requested size limit`);
        let r = await n.Di.readFileSampleBytes(o, a, t + 1);
        if (r.byteLength > t)
          throw Error(`Workspace file exceeds the requested size limit`);
        let s = uQ(e);
        switch (i) {
          case `auto`:
            return { ...(await cQ(r)), etag: s };
          case `blob`:
            return { blob: r.toString(`base64`), etag: s };
          case `text`:
            return { etag: s, text: new TextDecoder().decode(r) };
        }
      }
      if (i === `text`) {
        let [e, t] = await Promise.all([
          n.Di.readFile(o, a),
          n.Di.stat(o, a, { bypassCache: !0 }),
        ]);
        return { etag: uQ(t), text: e };
      }
      let [s, c] = await Promise.all([
          n.Di.readFileBase64(o, a),
          n.Di.stat(o, a, { bypassCache: !0 }),
        ]),
        l = h$e(s),
        u = uQ(c);
      switch (i) {
        case `auto`:
          return { ...(await cQ(l)), etag: u };
        case `blob`:
          return { blob: m$e(s), etag: u };
      }
    }
    async releaseTemporaryFile({ path: e }) {
      this.temporaryFilePaths.delete(e) &&
        (await (0, b.rm)(h.dirname(e), { force: !0, recursive: !0 }));
    }
    async saveCopy(e) {
      if (this.isDisposed) throw Error(`Workspace file service is disposed`);
      let t = await l.dialog.showSaveDialog({
        defaultPath: je(`bytes` in e ? e.fileName : (e.fileName ?? e.path)),
      });
      if (t.canceled || t.filePath == null) return { path: null };
      if (`bytes` in e) {
        if (K(e.bytes.byteLength))
          throw Error(`File is too large to save directly`);
        await sQ(t.filePath, () => e.bytes);
      } else {
        let r = this.executionHostRegistry.get(e.hostId),
          i = await fQ(e.path, r, this.globalState);
        if (!n.Es(r.hostConfig) && h.resolve(i) === h.resolve(t.filePath))
          return { path: t.filePath };
        await sQ(t.filePath, async () => C.Readable.from(await r.readFile(i)));
      }
      return (Ij(t.filePath), { path: t.filePath });
    }
    async write({ bytes: e, hostId: t, ifMatch: r, path: i }) {
      if (K(e.byteLength)) return { maxBytes: Ae, outcome: `too-large` };
      let a = this.executionHostRegistry.get(t),
        o = await fQ(i, a, this.globalState);
      if (r != null) {
        let e = uQ(await lQ(o, a));
        if (r !== e) return { etag: e, outcome: `conflict` };
      }
      return (
        await n.Di.writeFileBuffer(o, Buffer.from(e), a),
        { etag: uQ(await lQ(o, a)), outcome: `saved` }
      );
    }
  };
}

if (typeof module !== "undefined")
  module.exports = { createWorkspaceFileServiceClass };
