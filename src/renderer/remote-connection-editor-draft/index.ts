import "@rchunk/rolldown-runtime";
import {
  NU as getDiscoveredRemoteHostId,
  wL as initializeUtilities,
} from "@rchunk/app-shared";

export interface RemoteConnectionDraft {
  authMode: "identity" | "none";
  displayName: string;
  hostId: string;
  identity: string;
  sshHost: string;
  sshPort: string;
  targetKind: "alias" | "hostname";
}

export interface RemoteConnection {
  alias?: string | null;
  connectionAnalyticsId?: string;
  displayName: string;
  hostId: string;
  hostname?: string | null;
  identity?: string | null;
  source: string;
  sshAlias?: string | null;
  sshHost?: string;
  sshPort?: number | null;
}

export type RemoteConnectionDraftError =
  | "displayNameRequired"
  | "duplicateDisplayName"
  | "identityRequired"
  | "sshHostRequired"
  | "sshPortInteger"
  | "sshPortRange";

function createRemoteConnectionDraft(): RemoteConnectionDraft {
  return {
    hostId: `remote-ssh-codex-managed:${crypto.randomUUID()}`,
    displayName: "",
    targetKind: "hostname",
    sshHost: "",
    sshPort: "",
    authMode: "none",
    identity: "",
  };
}

function remoteConnectionToDraft(connection: RemoteConnection): RemoteConnectionDraft {
  return {
    hostId: connection.hostId,
    displayName: connection.displayName,
    targetKind: connection.sshAlias?.trim() ? "alias" : "hostname",
    sshHost: connection.sshAlias?.trim() || connection.sshHost || "",
    sshPort: connection.sshPort == null ? "" : String(connection.sshPort),
    authMode: connection.identity == null ? "none" : "identity",
    identity: connection.identity ?? "",
  };
}

function parseSshPort(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed.length === 0 || !/^\d+$/.test(trimmed)) return null;
  const port = Number(trimmed);
  return Number.isSafeInteger(port) ? port : null;
}

function remoteConnectionFromDraft(
  draft: RemoteConnectionDraft,
  existing?: RemoteConnection | null,
): RemoteConnection {
  const displayName = draft.displayName.trim();
  const sshHost = draft.sshHost.trim();
  const alias = draft.targetKind === "alias" ? sshHost : null;
  if (alias != null) {
    return {
      hostId: getDiscoveredRemoteHostId(alias),
      connectionAnalyticsId: existing?.connectionAnalyticsId,
      displayName,
      source: "discovered",
      alias,
      hostname: null,
      sshPort: null,
      identity: null,
    };
  }
  let hostId = draft.hostId;
  if (existing?.source === "codex-managed") hostId = existing.hostId;
  else if (!hostId.startsWith("remote-ssh-codex-managed:")) {
    hostId = `remote-ssh-codex-managed:${crypto.randomUUID()}`;
  }
  return {
    hostId,
    connectionAnalyticsId: existing?.connectionAnalyticsId,
    displayName,
    source: "codex-managed",
    alias: null,
    hostname: sshHost,
    sshPort: parseSshPort(draft.sshPort),
    identity: draft.authMode === "identity" ? draft.identity.trim() : null,
  };
}

function validateRemoteConnectionDraft({
  draft,
  editingHostId,
  existingConnections,
}: {
  draft: RemoteConnectionDraft;
  editingHostId?: string | null;
  existingConnections: RemoteConnection[];
}): RemoteConnectionDraftError[] {
  const errors: RemoteConnectionDraftError[] = [];
  const displayName = draft.displayName.trim();
  if (displayName.length === 0) errors.push("displayNameRequired");
  if (draft.sshHost.trim().length === 0) errors.push("sshHostRequired");
  const port = draft.sshPort.trim();
  if (port.length > 0) {
    if (!/^\d+$/.test(port)) errors.push("sshPortInteger");
    else {
      const numericPort = Number(port);
      if (!Number.isSafeInteger(numericPort) || numericPort < 1 || numericPort > 65_535) {
        errors.push("sshPortRange");
      }
    }
  }
  if (draft.authMode === "identity" && draft.identity.trim().length === 0) {
    errors.push("identityRequired");
  }
  if (
    existingConnections.some(
      (connection) =>
        (editingHostId == null || connection.hostId !== editingHostId) &&
        connection.displayName.trim() === displayName,
    )
  ) {
    errors.push("duplicateDisplayName");
  }
  return errors;
}

function initializeRemoteConnectionEditorDraft(): void {
  initializeUtilities();
}

export {
  remoteConnectionToDraft as a,
  remoteConnectionFromDraft as i,
  validateRemoteConnectionDraft as n,
  initializeRemoteConnectionEditorDraft as r,
  createRemoteConnectionDraft as t,
};
