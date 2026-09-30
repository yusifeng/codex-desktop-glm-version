type UnknownRecord = Record<string, unknown>;
type RequestClient = { sendRequest(method: string, params: UnknownRecord): Promise<unknown> };
type AttachmentHost = {
  createId(): string; getCodexHome(): Promise<string>; getBasename(path: string): string;
  joinPath(...parts: string[]): string; joinHostPath(...parts: string[]): string;
  encodeText(text: string): string; decodeText(text: string): string; encodeBytes(bytes: Uint8Array): string;
  getTextExcerpt(text: string): string; getMaxDirectTransferBytes(allowSftpUpload: boolean): number;
  readLocalFileSize(path: string): Promise<number | null>; readLocalFile(path: string): Promise<string | null>;
  uploadLocalFile(source: string, destination: string): Promise<void>;
};
export interface FileAttachment { label: string; path?: string; fsPath: string; [key: string]: unknown }

export class FileAttachmentTooLargeError extends Error {
  readonly code = `file_attachment_too_large`;
  constructor(readonly maximumSizeBytes: number) { super(`File is too large to upload`); this.name = `FileAttachmentTooLargeError`; }
}

function filename(value: string, basename: (path: string) => string): string {
  const result = basename(value.trim()).replace(/[\\/:]/g, `_`);
  return result.length === 0 || result === `.` || result === `..` ? `attachment` : result;
}
function uniqueFilename(label: string, used: Set<string>, basename: (path: string) => string): string {
  const first = filename(label, basename); if (!used.has(first)) { used.add(first); return first; }
  const dot = first.lastIndexOf(`.`); const stem = dot > 0 ? first.slice(0, dot) : first; const suffix = dot > 0 ? first.slice(dot) : ``;
  let index = 2; while (used.has(`${stem}-${index}${suffix}`)) index += 1;
  const result = `${stem}-${index}${suffix}`; used.add(result); return result;
}
function responseRecord(value: unknown): UnknownRecord { return typeof value === `object` && value !== null ? value as UnknownRecord : {}; }
function missingFile(error: unknown): boolean {
  return error instanceof Error && ((`code` in error && error.code === `ENOENT`) || error.message.includes(`ENOENT`) || error.message.includes(`No such file or directory`) || /\(os error [23]\)/.test(error.message));
}

export class FileAttachmentUploader {
  private state: Promise<{ attachmentPaths: Set<string>; pendingRemovalPaths: Set<string>; textExcerptsByPath: Map<string, string> }> | null = null;
  private registryWrite = Promise.resolve();
  constructor(private readonly options: { hostId: string; isLocalHost: boolean; host: AttachmentHost; requestClient: RequestClient }) {}

  async uploadLocalFiles(input: Array<FileAttachment | string> | { attachments: FileAttachment[]; allowSftpUpload?: boolean }): Promise<FileAttachment[]> {
    const attachments: FileAttachment[] = Array.isArray(input) ? input.map((item) => typeof item === `string` ? { label: this.options.host.getBasename(item), fsPath: item } : item) : input.attachments;
    const allowSftpUpload = !Array.isArray(input) && input.allowSftpUpload === true;
    if (this.options.isLocalHost) return attachments;
    const local = attachments.filter((item) => item.path == null); if (local.length === 0) return [];
    const directory = await this.createAttachmentDirectory(); const used = new Set<string>(); const maximum = this.options.host.getMaxDirectTransferBytes(allowSftpUpload);
    return Promise.all(local.map(async (item) => {
      const destination = this.options.host.joinPath(directory, uniqueFilename(item.label, used, this.options.host.getBasename.bind(this.options.host)));
      const size = await this.options.host.readLocalFileSize(item.fsPath);
      if (size == null || size > maximum) {
        if (!allowSftpUpload) throw size == null ? Error(`Unable to determine file size for direct upload`) : new FileAttachmentTooLargeError(maximum);
        await this.options.host.uploadLocalFile(item.fsPath, destination);
      } else {
        const dataBase64 = await this.options.host.readLocalFile(item.fsPath); if (dataBase64 == null) throw Error(`Unable to read local attachment ${item.fsPath}`);
        await this.options.requestClient.sendRequest(`fs/writeFile`, { path: destination, dataBase64 });
      }
      return { ...item, path: destination, fsPath: destination };
    }));
  }
  create(text: string, label: string, name = `pasted-text.txt`) { return this.createManagedFile({ contentsBase64: this.options.host.encodeText(text), filename: filename(name, this.options.host.getBasename.bind(this.options.host)), label, textExcerpt: this.options.host.getTextExcerpt(text) }); }
  createBase64(contentsBase64: string, label: string) { return this.createManagedFile({ contentsBase64, filename: filename(label, this.options.host.getBasename.bind(this.options.host)), label }); }
  async createBlob(blob: unknown, label: string) {
    if (typeof blob === `string`) return this.create(blob, label);
    if (blob != null && typeof blob === `object` && `arrayBuffer` in blob && typeof blob.arrayBuffer === `function`) { const buffer = await blob.arrayBuffer(); return this.createBase64(this.options.host.encodeBytes(new Uint8Array(buffer)), label); }
    throw new TypeError(`Attachment contents must be text or a Blob-like value`);
  }
  createLocalFile(source: string, label: string) { return this.createManagedFileAttachment({ filename: filename(label, this.options.host.getBasename.bind(this.options.host)), label, writeAttachment: async (path) => { await this.options.requestClient.sendRequest(`fs/copy`, { destinationPath: path, sourcePath: source }); } }); }
  async getTextExcerpts(items?: Array<{ path: string }> | null) { const state = await this.getState(); return (items ?? []).flatMap((item) => state.textExcerptsByPath.get(item.path) ?? []); }
  private createManagedFile(input: { contentsBase64: string; filename: string; label: string; textExcerpt?: string }) { return this.createManagedFileAttachment({ ...input, writeAttachment: async (path) => { await this.options.requestClient.sendRequest(`fs/writeFile`, { path, dataBase64: input.contentsBase64 }); } }); }
  private async createManagedFileAttachment(input: { filename: string; label: string; textExcerpt?: string; writeAttachment(path: string): Promise<void> }) {
    const state = await this.getState(); await this.retryPendingRemovals(state); const path = this.options.host.joinPath(await this.createAttachmentDirectory(), input.filename); await input.writeAttachment(path); state.attachmentPaths.add(path); if (input.textExcerpt) state.textExcerptsByPath.set(path, input.textExcerpt);
    try { await this.writeState(state); } catch (error) { state.attachmentPaths.delete(path); state.textExcerptsByPath.delete(path); await this.options.requestClient.sendRequest(`fs/remove`, { path, force: true }).catch(() => undefined); throw error; }
    return { label: input.label, path, fsPath: path };
  }
  async remove(path: string) { const state = await this.getState(); if (state.attachmentPaths.has(path)) { state.pendingRemovalPaths.add(path); await this.writeState(state); await this.removePendingAttachment(state, path); } }
  async cleanupPendingRemovals() { await this.retryPendingRemovals(await this.getState()); }
  private getState() { this.state ??= this.readState().catch((error) => { this.state = null; throw error; }); return this.state; }
  private async readState() {
    try {
      const response = responseRecord(await this.options.requestClient.sendRequest(`fs/readFile`, { path: await this.getRegistryPath() })); const parsed = JSON.parse(this.options.host.decodeText(String(response.dataBase64 ?? ``))) as UnknownRecord; const root = (await this.getAttachmentsRoot()).replace(/\/+$/, ``);
      const valid = (value: unknown): value is string => typeof value === `string` && value.replaceAll(`\\`, `/`).startsWith(`${root.replaceAll(`\\`, `/`)}/`); const paths = new Set((Array.isArray(parsed.attachmentPaths) ? parsed.attachmentPaths : []).filter(valid));
      const pending = new Set((Array.isArray(parsed.pendingRemovalPaths) ? parsed.pendingRemovalPaths : []).filter((value): value is string => valid(value) && paths.has(value))); const excerpts = new Map<string, string>(); const raw = responseRecord(parsed.textExcerptsByPath); for (const [key, value] of Object.entries(raw)) if (paths.has(key) && typeof value === `string`) excerpts.set(key, value);
      return { attachmentPaths: paths, pendingRemovalPaths: pending, textExcerptsByPath: excerpts };
    } catch (error) { if (!missingFile(error)) throw error; return { attachmentPaths: new Set<string>(), pendingRemovalPaths: new Set<string>(), textExcerptsByPath: new Map<string, string>() }; }
  }
  private async retryPendingRemovals(state: Awaited<ReturnType<FileAttachmentUploader[`readState`]>>) { await Promise.allSettled([...state.pendingRemovalPaths].map((path) => this.removePendingAttachment(state, path))); }
  private async removePendingAttachment(state: Awaited<ReturnType<FileAttachmentUploader[`readState`]>>, path: string) { await this.options.requestClient.sendRequest(`fs/remove`, { path, force: true }); state.attachmentPaths.delete(path); state.pendingRemovalPaths.delete(path); state.textExcerptsByPath.delete(path); await this.writeState(state); }
  private async writeState(state: Awaited<ReturnType<FileAttachmentUploader[`readState`]>>) { const data = { attachmentPaths: [...state.attachmentPaths], pendingRemovalPaths: [...state.pendingRemovalPaths], textExcerptsByPath: Object.fromEntries(state.textExcerptsByPath) }; const next = this.registryWrite.catch(() => undefined).then(async () => { await this.options.requestClient.sendRequest(`fs/writeFile`, { path: await this.getRegistryPath(), dataBase64: this.options.host.encodeText(JSON.stringify(data)) }); }); this.registryWrite = next; await next; }
  private async getRegistryPath() { return this.options.host.joinPath(await this.getAttachmentsRoot(), `pasted-text-attachments.json`); }
  private async createAttachmentDirectory() { const path = this.options.host.joinPath(await this.getAttachmentsRoot(), this.options.host.createId()); await this.options.requestClient.sendRequest(`fs/createDirectory`, { path, recursive: true }); return path; }
  private async getAttachmentsRoot() { return this.options.host.joinPath(await this.options.host.getCodexHome(), `attachments`); }
}

export class ThreadGoalAttachmentDirectories {
  private readonly directories = new Set<string>();
  constructor(private readonly options: { host: AttachmentHost; requestClient: RequestClient }) {}
  async createDirectory() { const path = this.options.host.joinHostPath(await this.options.host.getCodexHome(), `attachments`, this.options.host.createId()); await this.options.requestClient.sendRequest(`fs/createDirectory`, { path, recursive: true }); this.directories.add(path); return { path }; }
  async write(input: unknown) { const value = responseRecord(input); const contentsBase64 = String(value.contentsBase64 ?? ``); const directoryPath = String(value.directoryPath ?? ``); const name = String(value.filename ?? `attachment`); await this.assertOwnedDirectory(directoryPath); const label = filename(name, this.options.host.getBasename.bind(this.options.host)); const path = this.options.host.joinHostPath(directoryPath, label); await this.options.requestClient.sendRequest(`fs/writeFile`, { path, dataBase64: contentsBase64 }); return { label, path, fsPath: path }; }
  async remove(input: string | { path: string }) { const path = typeof input === `string` ? input : input.path; await this.assertOwnedDirectory(path); await this.options.requestClient.sendRequest(`fs/remove`, { path, force: true, recursive: true }); this.directories.delete(path); }
  private async assertOwnedDirectory(path: string) { if (!this.directories.has(path)) throw Error(`Unknown thread goal attachment directory`); const id = path.split(/[\\/]/u).at(-1); if (id == null || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) || path !== this.options.host.joinHostPath(await this.options.host.getCodexHome(), `attachments`, id)) throw Error(`Invalid thread goal attachment directory`); }
}

export { FileAttachmentUploader as $_e, ThreadGoalAttachmentDirectories as ive };
