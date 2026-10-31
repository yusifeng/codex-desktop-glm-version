// Clipboard RPC service extracted from main-C-Mhak1n.ts (original `VO`).
import { clipboard } from "electron";
import { Uf as EventEmitterBase } from "@chunk/shared";

/** Small async facade used by the renderer RPC service registry. */
class ClipboardService extends (EventEmitterBase as new () => {}) {
  get bookmark(): { title: string; url: string } | undefined {
    if (process.platform !== "darwin") return undefined;
    const bookmark = clipboard.readBookmark();
    return bookmark.url && bookmark.title ? bookmark : undefined;
  }

  async readText(): Promise<string> {
    return clipboard.readText();
  }

  async writeText(text: string): Promise<void> {
    clipboard.writeText(text);
  }
}

export { ClipboardService };

if (typeof module !== "undefined") module.exports = { ClipboardService };
