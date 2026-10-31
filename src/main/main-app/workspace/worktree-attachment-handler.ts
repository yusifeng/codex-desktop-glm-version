type WorktreeAttachmentDependencies = {
  RpcHandlerBase: new (...args: any[]) => any;
  isCloudHost(hostId: string): boolean;
  normalizeConversationId(threadId: string): string;
  supportsFeature(version: unknown, feature: string): boolean;
};

type CreateRequest = {
  callId: string;
  hostId: string;
  name?: string | null;
  ref?: string | null;
  threadId: string;
};

/**
 * Owns managed-worktree attachment admission, registration, removal, and the
 * archive cleanup barrier. Worktree creation itself remains in WorktreeService;
 * app-server attachment transport remains in the connection owner.
 */
export function createWorktreeAttachmentHandlerClass(
  dependencies: WorktreeAttachmentDependencies,
) {
  const { RpcHandlerBase, isCloudHost, normalizeConversationId, supportsFeature } = dependencies;

  return class WorktreeAttachmentHandler extends RpcHandlerBase {
    private readonly pendingCreations = new Map<string, Set<Promise<unknown>>>();

    constructor(
      readonly connections: any,
      readonly getWorktreeService: (hostId: string) => any,
    ) {
      super();
    }

    async createForThread(request: CreateRequest) {
      const key = this.creationKey(request.hostId, request.threadId);
      const pendingForThread = this.pendingCreations.get(key) ?? new Set<Promise<unknown>>();
      this.pendingCreations.set(key, pendingForThread);
      const creation = this.createAttachment(request);
      pendingForThread.add(creation);
      try {
        return await creation;
      } finally {
        pendingForThread.delete(creation);
        if (pendingForThread.size === 0) this.pendingCreations.delete(key);
      }
    }

    async removeFromThread({ hostId, threadId, root }: {
      hostId: string;
      root: string;
      threadId: string;
    }) {
      try {
        const connection = this.connections.getConnection(hostId);
        if (isCloudHost(hostId) || !supportsFeature(connection.appServerVersion, "threadAttachments")) {
          return {
            type: "error",
            message: "Worktree attachments are unavailable on this host.",
          };
        }

        let cursor: string | null = null;
        let identityKey: string | undefined;
        do {
          const page = await connection.sendAppServerRequest("thread/attachment/list", {
            threadId,
            cursor,
            limit: 100,
          });
          identityKey = page.data.find(
            (attachment: any) =>
              attachment.attachmentType === "worktree" && attachment.identityKey === root,
          )?.identityKey;
          cursor = page.nextCursor;
        } while (identityKey == null && cursor != null);

        if (identityKey == null) return { type: "removed" };
        const thread = await connection.readThread(threadId);
        if (thread == null) return { type: "error", message: "The task could not be found." };

        await this.getWorktreeService(hostId).archiveAttachedWorktree(threadId, thread.cwd, root);
        await connection.sendAppServerRequest("thread/attachment/remove", {
          threadId,
          attachmentType: "worktree",
          identityKey,
        });
        return { type: "removed" };
      } catch (error) {
        return {
          type: "error",
          message: error instanceof Error ? error.message : "Could not remove worktree.",
        };
      }
    }

    cleanupForArchivedThread = async (hostId: string, thread: any, signal: AbortSignal) => {
      const pendingForThread = this.pendingCreations.get(
        this.creationKey(hostId, thread.conversationId),
      );
      if (pendingForThread != null) await Promise.allSettled(pendingForThread);
      signal.throwIfAborted();
      await this.getWorktreeService(hostId).handleArchiveCleanup({ ...thread, signal });
    };

    private async createAttachment({ hostId, threadId, callId, ref, name }: CreateRequest) {
      if (isCloudHost(hostId)) {
        return {
          type: "error",
          message: "Managed worktrees require a local, SSH, or WSL task.",
        };
      }
      try {
        const connection = this.connections.getConnection(hostId);
        const thread = await connection.readThread(threadId);
        if (!supportsFeature(connection.appServerVersion, "threadAttachments")) {
          return {
            type: "error",
            message: "This host must support thread attachments before creating a managed worktree.",
          };
        }
        if (thread == null) {
          return { type: "error", message: "The calling task could not be found." };
        }

        const worktreeService = this.getWorktreeService(hostId);
        const created = await worktreeService.createManagedWorktree({
          hostId,
          cwd: thread.cwd,
          startingState: { type: "branch", branchName: ref ?? "HEAD" },
          name,
          localEnvironmentConfigPath: null,
          streamId: callId,
        });
        const registrationError = (
          await Promise.allSettled([
            worktreeService.setOwnerThread({
              worktree: created.worktreeGitRoot,
              conversationId: normalizeConversationId(threadId),
            }),
            connection.sendAppServerRequest("thread/attachment/add", {
              threadId,
              attachmentType: "worktree",
              identityKey: created.worktreeGitRoot,
              payload: {
                root: created.worktreeGitRoot,
                workspaceRoot: created.worktreeWorkspaceRoot,
                sourceCwd: thread.cwd,
              },
            }),
          ])
        )
          .flatMap((result) =>
            result.status === "rejected"
              ? [
                  result.reason instanceof Error
                    ? result.reason.message
                    : "Worktree registration failed.",
                ]
              : [],
          )
          .join("; ") || null;

        return {
          type: "created",
          worktreeGitRoot: created.worktreeGitRoot,
          worktreeWorkspaceRoot: created.worktreeWorkspaceRoot,
          registrationError,
        };
      } catch (error) {
        return {
          type: "error",
          message: error instanceof Error ? error.message : "Worktree creation failed.",
        };
      }
    }

    private creationKey(hostId: string, threadId: string) {
      return JSON.stringify([hostId, threadId]);
    }
  };
}
