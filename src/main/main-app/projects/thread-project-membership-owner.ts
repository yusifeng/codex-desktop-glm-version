// @ts-nocheck

/** Owns desktop persistence and projectless metadata around the shared thread-project assignment store. */
export function createThreadProjectMembershipOwnerClass(dependencies: Record<string, any>) {
  const { runtime, MembershipStoreBase } = dependencies;
  const updateProjectlessThreadSchema = runtime.wf({
    threadId: runtime.Of().min(1).transform(runtime.$u),
    projectless: runtime.gf().optional(),
    outputDirectory: runtime.Of().nullable().optional(),
    workspaceRoot: runtime.Of().nullable().optional(),
  });

  return class ThreadProjectMembershipOwner extends MembershipStoreBase {
    globalState;
    windowManager;
    getInitialServerProjectId;
    static removedThreadIdsByGlobalState = new WeakMap();

    constructor(
      globalState: any,
      windowManager: any,
      writeAssignment: any,
      getInitialServerProjectId: any,
    ) {
      super(
        {
          read: () => ({
            assignments: runtime.ca(
              globalState.get(runtime.iu.THREAD_PROJECT_ASSIGNMENTS),
            ),
            projectlessThreadIds:
              globalState.get(runtime.iu.PROJECTLESS_THREAD_IDS) ?? [],
          }),
          write: (previous: Record<string, any>, next: Record<string, any>) => {
            if (previous.assignments !== next.assignments) {
              globalState.set(runtime.iu.THREAD_PROJECT_ASSIGNMENTS, next.assignments);
            }
            if (previous.projectlessThreadIds !== next.projectlessThreadIds) {
              globalState.set(
                runtime.iu.PROJECTLESS_THREAD_IDS,
                next.projectlessThreadIds,
              );
            }
          },
        },
        (memberships: unknown) =>
          windowManager.sendMessageToAllWindows({
            type: `thread-project-memberships-updated`,
            memberships,
          }),
        writeAssignment == null
          ? undefined
          : (request: Record<string, any>, commit: () => Promise<void>, signal: AbortSignal) =>
              writeAssignment(
                request.threadId,
                request.assignment,
                async () => {
                  await commit();
                  const hostId = request.hostId;
                  if (hostId != null) {
                    globalState.update(
                      runtime.iu.THREAD_PROJECT_MEMBERSHIP_HOST_IDS,
                      (hostIds: Record<string, string>) => ({
                        ...hostIds,
                        [request.threadId]: hostId,
                      }),
                    );
                  }
                },
                signal,
                request.hostId ??
                  globalState.get(runtime.iu.THREAD_PROJECT_MEMBERSHIP_HOST_IDS)?.[
                    request.threadId
                  ],
              ),
      );
      this.globalState = globalState;
      this.windowManager = windowManager;
      this.getInitialServerProjectId = getInitialServerProjectId;
    }

    async getThreadStartProjectId(input: unknown) {
      return this.getInitialServerProjectId?.(runtime.la.parse(input)) ?? null;
    }

    async updateProjectlessThread(input: unknown) {
      const {
        threadId,
        projectless,
        outputDirectory,
        workspaceRoot,
      } = updateProjectlessThreadSchema.parse(input);
      const changedKeys = [];
      let removedThreadIds = ThreadProjectMembershipOwner.removedThreadIdsByGlobalState.get(
        this.globalState,
      );
      if (projectless === false && outputDirectory == null) {
        if (removedThreadIds == null) {
          removedThreadIds = new Set();
          ThreadProjectMembershipOwner.removedThreadIdsByGlobalState.set(
            this.globalState,
            removedThreadIds,
          );
        }
        removedThreadIds.add(threadId);
      } else if (removedThreadIds?.has(threadId)) {
        return;
      }

      if (projectless != null) {
        await this.setProjectless({ threadId, projectless });
        changedKeys.push(runtime.iu.PROJECTLESS_THREAD_IDS);
      }
      if (outputDirectory !== undefined) {
        this.globalState.update(
          runtime.iu.THREAD_PROJECTLESS_OUTPUT_DIRECTORIES,
          (directories: Record<string, string>) => {
            const next = { ...directories };
            if (outputDirectory == null) delete next[threadId];
            else next[threadId] = outputDirectory;
            return next;
          },
        );
        changedKeys.push(runtime.iu.THREAD_PROJECTLESS_OUTPUT_DIRECTORIES);
      }
      if (
        workspaceRoot !== undefined ||
        (projectless === false &&
          outputDirectory == null &&
          this.globalState.get(runtime.iu.THREAD_WORKSPACE_ROOT_HINTS)?.[threadId] != null)
      ) {
        this.globalState.update(
          runtime.iu.THREAD_WORKSPACE_ROOT_HINTS,
          (hints: Record<string, string>) => {
            const next = { ...hints };
            if (workspaceRoot == null) delete next[threadId];
            else next[threadId] = workspaceRoot;
            return next;
          },
        );
        changedKeys.push(runtime.iu.THREAD_WORKSPACE_ROOT_HINTS);
      }
      if (changedKeys.length > 0) {
        this.windowManager.sendMessageToAllWindows({
          type: `global-state-updated`,
          keys: changedKeys,
        });
      }
    }
  };
}

if (typeof module !== "undefined") {
  module.exports = { createThreadProjectMembershipOwnerClass };
}
