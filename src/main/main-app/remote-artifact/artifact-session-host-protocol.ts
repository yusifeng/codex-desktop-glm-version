type AnyRecord = Record<string, any>;

type ProtocolDependencies = {
  maxFileBytes: number;
  path: {
    basename(value: string): string;
    extname(value: string): string;
    isAbsolute(value: string): boolean;
  };
  pathToFileUrl(value: string): { href: string };
  schema: any;
};

const INVALID_OBJECT = "Artifact Session host returned an invalid object.";

/**
 * Owns the strict wire boundary between the desktop host and the dynamically
 * installed Artifact Session runtime. All values crossing that boundary are
 * validated or normalized here before lifecycle owners consume them.
 */
export function createArtifactSessionHostProtocol({
  maxFileBytes,
  path,
  pathToFileUrl,
  schema,
}: ProtocolDependencies) {
  const bindingRequestSchema = schema.wf({ bindingId: schema.Of().min(1) });
  const bindingApplyRequestSchema = bindingRequestSchema.extend({
    snapshotId: schema.Of().min(1),
    invocationId: schema.Of().min(1),
    updateId: schema.Of().min(1),
    crdtUpdateBase64: schema.Of(),
  });
  const nativeSnapshotSchema = schema.vf("artifactType", [
    nativeSnapshotVariant(
      "spreadsheet",
      "workbook.xlsx",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "xlsx",
      ".xlsx",
    ),
    nativeSnapshotVariant(
      "presentation",
      "presentation.pptx",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "pptx",
      ".pptx",
    ),
  ]);

  function nativeSnapshotVariant(
    artifactType: string,
    fileName: string,
    contentType: string,
    format: string,
    extension: string,
  ) {
    return schema.wf({
      artifactRef: schema.Of().min(1),
      artifactType: schema.bf(artifactType),
      binding: schema.wf({ fileName: schema.bf(fileName) }),
      byteLength: schema.Cf().int().nonnegative().max(maxFileBytes),
      contentType: schema.bf(contentType),
      format: schema.bf(format),
      value: schema.wf({
        path: schema
          .Of()
          .min(1)
          .refine(
            (value: string) =>
              path.isAbsolute(value) && path.extname(value).toLowerCase() === extension,
          ),
      }),
    });
  }

  function parseRecord(value: unknown): AnyRecord {
    if (value == null || Array.isArray(value) || typeof value !== "object")
      throw Error(INVALID_OBJECT);
    return value as AnyRecord;
  }

  function parseString(record: AnyRecord, key: string, allowEmpty = false): string {
    const value = record[key];
    if (typeof value !== "string" || (!allowEmpty && value.length === 0))
      throw Error("Artifact Session host returned an invalid string.");
    return value;
  }

  function parseOptionalString(record: AnyRecord, key: string): string | undefined {
    const value = record[key];
    if (value === undefined) return undefined;
    if (typeof value !== "string")
      throw Error("Artifact Session host returned an invalid string.");
    return value;
  }

  function parseBoolean(record: AnyRecord, key: string): boolean {
    const value = record[key];
    if (typeof value !== "boolean")
      throw Error("Artifact Session host returned an invalid boolean.");
    return value;
  }

  function parseVersion(record: AnyRecord, key: string): number {
    const value = record[key];
    if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0)
      throw Error("Artifact Session host returned an invalid version.");
    return value;
  }

  function parseBase64(value: string): Uint8Array {
    if (
      value.length % 4 !== 0 ||
      !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)
    ) {
      throw Error("Artifact Session host returned invalid base64 data.");
    }
    const bytes = Buffer.from(value, "base64");
    if (bytes.toString("base64") !== value)
      throw Error("Artifact Session host returned non-canonical base64 data.");
    return Uint8Array.from(bytes);
  }

  function parseUpdate(value: unknown) {
    const record = parseRecord(value);
    const source = record.source;
    if (source !== "model" && source !== "user")
      throw Error("Artifact Session host returned an invalid update source.");
    const summary = parseOptionalString(record, "summary");
    return {
      baseStateVersion: parseVersion(record, "baseStateVersion"),
      bytes: parseBase64(parseString(record, "crdtUpdateBase64", true)),
      originId: parseString(record, "originId"),
      source,
      stateVersion: parseVersion(record, "stateVersion"),
      ...(summary === undefined ? {} : { summary }),
      updateId: parseString(record, "updateId"),
    };
  }

  function parseDocument(artifactRef: string, value: unknown) {
    const record = parseRecord(value);
    if (!Array.isArray(record.updates))
      throw Error("Artifact Session host returned invalid updates.");
    if (record.kind !== "spreadsheet" && record.kind !== "presentation")
      throw Error("Artifact Session host returned an invalid kind.");
    const title = parseOptionalString(record, "title");
    return {
      artifactRef,
      checkpointCrdtState: parseBase64(
        parseString(record, "checkpointCrdtStateBase64", true),
      ),
      checkpointStateVersion: parseVersion(record, "checkpointStateVersion"),
      initialArtifactProto: parseBase64(
        parseString(record, "initialArtifactProtoBase64", true),
      ),
      kind: record.kind,
      stateVersion: parseVersion(record, "stateVersion"),
      ...(title === undefined ? {} : { title }),
      updates: record.updates.map(parseUpdate),
    };
  }

  return {
    compareConnectionInfo(left: any, right: any): boolean {
      return (
        left?.hostClientModulePath === right?.hostClientModulePath &&
        left?.socketPath === right?.socketPath &&
        left?.token === right?.token
      );
    },

    async createViewerClient(connectionInfo: any) {
      const loaded = await import(pathToFileUrl(connectionInfo.hostClientModulePath).href);
      if (typeof loaded.ArtifactSessionHostRpcClient !== "function")
        throw Error("Installed Artifact Session host client is invalid.");
      const client = new loaded.ArtifactSessionHostRpcClient({
        role: "viewer",
        socketPath: connectionInfo.socketPath,
        token: connectionInfo.token,
      });
      if (
        typeof client.connect !== "function" ||
        typeof client.connectionEpoch !== "number" ||
        typeof client.onDisconnect !== "function"
      ) {
        await client.close().catch(() => undefined);
        throw Error("Installed Artifact Session host client is invalid.");
      }
      return client;
    },

    disposeValue(value: any): void {
      value?.[Symbol.dispose]?.();
    },

    isErrorCode(error: unknown, code: string): boolean {
      return typeof error === "object" && error != null && "code" in error && error.code === code;
    },

    parseAppendResult(value: unknown) {
      const record = parseRecord(value);
      return {
        applied: parseBoolean(record, "applied"),
        stateVersion: parseVersion(record, "stateVersion"),
      };
    },

    parseArtifactKind(value: unknown): "presentation" | "spreadsheet" {
      const kind = parseString(parseRecord(value), "kind");
      if (kind !== "presentation" && kind !== "spreadsheet")
        throw Error("Artifact Session host returned an invalid kind.");
      return kind;
    },

    parseAssetResult(value: unknown, expectedSha256: string): Uint8Array {
      const record = parseRecord(value);
      if (parseString(record, "sha256") !== expectedSha256)
        throw Error("Artifact Session host returned the wrong asset.");
      return parseBase64(parseString(record, "dataBase64"));
    },

    parseCapabilities(value: unknown): unknown {
      return parseRecord(value).capabilities;
    },

    parseEvent(value: unknown) {
      const record = parseRecord(value);
      if (record.type !== "artifact-session-update-committed")
        throw Error("Artifact Session host returned an invalid event.");
      const stateVersion = parseVersion(record, "stateVersion");
      const update = parseUpdate(record.update);
      if (stateVersion !== update.stateVersion)
        throw Error("Artifact Session host returned inconsistent versions.");
      return { stateVersion, update };
    },

    parseExternalDocumentApplyRequest(value: unknown) {
      return bindingApplyRequestSchema.parse(value);
    },

    parseExternalDocumentBindingRequest(value: unknown) {
      return bindingRequestSchema.parse(value);
    },

    parseFlushSubscriptionId(value: unknown): string {
      return parseString(parseRecord(value), "subscriptionId");
    },

    parseNativeSnapshot(value: unknown, artifactRef: string) {
      const result = nativeSnapshotSchema.safeParse(value);
      if (!result.success)
        throw Error("Artifact Session host returned an invalid native snapshot.");
      if (result.data.artifactRef !== artifactRef)
        throw Error("Artifact Session host returned the wrong artifact.");
      if (path.basename(result.data.value.path) !== result.data.binding.fileName)
        throw Error("Artifact Session host returned an invalid native snapshot.");
      return {
        byteLength: result.data.byteLength,
        contentType: result.data.contentType,
        fileName: result.data.binding.fileName,
        path: result.data.value.path,
      };
    },

    parseOpenResult(value: unknown, artifactRef: string, subscriptionId: string) {
      const record = parseRecord(value);
      if (parseString(record, "subscriptionId") !== subscriptionId)
        throw Error("Artifact Session host returned the wrong subscription.");
      return parseDocument(artifactRef, record.document);
    },

    serializeBytes(bytes: Uint8Array): string {
      return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString("base64");
    },
  };
}

if (typeof module !== "undefined") {
  module.exports = { createArtifactSessionHostProtocol };
}
