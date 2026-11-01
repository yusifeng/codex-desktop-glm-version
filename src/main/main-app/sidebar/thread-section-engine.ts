import { isThreadNotFoundError } from "../misc/thread-errors";

/** App-server's built-in pinned section, hidden from custom-section listings. */
export const PINNED_THREAD_SECTION_ID = "01984de2-8f74-7c91-a3b2-5c5e937cf318";

export interface ThreadSectionHost {
  hostId: string;
  pinnedSectionId: string;
  [key: string]: unknown;
}

export interface ThreadSectionOwner extends ThreadSectionHost {
  isPinned: boolean;
  sectionId: string | null;
}

export interface ThreadSectionAdapter {
  listThreads(
    host: ThreadSectionHost,
    request: {
      cursor: string | null;
      limit: number;
      modelProviders: unknown[];
      sectionId: string;
      sortKey: "section_position";
      useStateDbOnly: true;
    },
  ): Promise<{ data: Array<{ id: string }>; nextCursor: string | null }>;
  listSections(
    host: ThreadSectionHost,
    request: { cursor: string | null; limit: number },
  ): Promise<{ data: Array<{ id: string; name: string }>; nextCursor: string | null }>;
  createSection(
    host: ThreadSectionHost,
    request: { name: string },
  ): Promise<{ section: { id: string; name: string } }>;
  updateSection(
    host: ThreadSectionHost,
    request: { sectionId: string; name: string },
  ): Promise<unknown>;
  deleteSection(host: ThreadSectionHost, request: { sectionId: string }): Promise<unknown>;
  readThread(
    host: ThreadSectionHost,
    threadId: string,
    forDiscovery: boolean,
  ): Promise<{ id: string; section?: { id: string } | null } | null>;
  moveThread(
    host: ThreadSectionHost,
    request: { beforeThreadId: string | null; sectionId: string | null; threadId: string },
  ): Promise<unknown>;
}

export interface FindThreadOwnerOptions {
  forDiscovery?: boolean;
  throwOnAmbiguousOwner?: boolean;
  throwOnMissingThread?: boolean;
}

const pendingSectionCreations = new Map<string, Promise<{ id: string; name: string }>>();

/**
 * Low-level app-server section engine. It owns pagination, cross-host owner
 * discovery, idempotent logical creates, and the two-step custom-section move
 * rollback required by app-server ordering semantics.
 */
export class ThreadSectionEngine {
  constructor(private readonly adapter: ThreadSectionAdapter) {}

  async listHostSectionThreadIds(
    host: ThreadSectionHost,
    sectionId = host.pinnedSectionId,
  ): Promise<string[]> {
    const threadIds: string[] = [];
    let cursor: string | null = null;
    do {
      const page = await this.adapter.listThreads(host, {
        cursor,
        limit: 100,
        modelProviders: [],
        sectionId,
        sortKey: "section_position",
        useStateDbOnly: true,
      });
      threadIds.push(...page.data.map((thread) => thread.id));
      cursor = page.nextCursor;
    } while (cursor != null);
    return threadIds;
  }

  async listSections(hosts: ThreadSectionHost[]): Promise<{
    hostIds: string[];
    sections: Array<{ hostId: string; id: string; name: string }>;
  }> {
    const sectionsByHost = await Promise.all(
      hosts.map(async (host) => {
        const sections: Array<{ hostId: string; id: string; name: string }> = [];
        let cursor: string | null = null;
        do {
          const page = await this.adapter.listSections(host, { cursor, limit: 100 });
          sections.push(
            ...page.data
              .filter(({ id }) => id !== PINNED_THREAD_SECTION_ID)
              .map(({ id, name }) => ({ hostId: host.hostId, id, name })),
          );
          cursor = page.nextCursor;
        } while (cursor != null);
        return sections;
      }),
    );
    return { hostIds: hosts.map(({ hostId }) => hostId), sections: sectionsByHost.flat() };
  }

  async createSection(
    host: ThreadSectionHost,
    name: string,
    logicalSectionId: string,
  ): Promise<{ id: string; name: string }> {
    const key = `${host.hostId}\0${logicalSectionId}`;
    const pending = pendingSectionCreations.get(key);
    if (pending != null) return pending;
    const creation = this.adapter
      .createSection(host, { name })
      .then(({ section: { id, name: createdName } }) => ({ id, name: createdName }));
    pendingSectionCreations.set(key, creation);
    try {
      return await creation;
    } finally {
      if (pendingSectionCreations.get(key) === creation) pendingSectionCreations.delete(key);
    }
  }

  async updateSection(host: ThreadSectionHost, sectionId: string, name: string): Promise<void> {
    await this.adapter.updateSection(host, { sectionId, name });
  }

  async deleteSection(host: ThreadSectionHost, sectionId: string): Promise<void> {
    await this.adapter.deleteSection(host, { sectionId });
  }

  async findThreadOwner(
    threadId: string,
    hosts: ThreadSectionHost[],
    options: FindThreadOwnerOptions = {},
  ): Promise<ThreadSectionOwner | null> {
    const owners = (
      await Promise.all(
        hosts.map(async (host) => {
          try {
            const thread = await this.adapter.readThread(
              host,
              threadId,
              options.forDiscovery === true,
            );
            return thread?.id === threadId
              ? {
                  ...host,
                  isPinned: thread.section?.id === host.pinnedSectionId,
                  sectionId: thread.section?.id ?? null,
                }
              : null;
          } catch (error) {
            if (
              options.throwOnMissingThread ||
              !(error instanceof Error) ||
              !isThreadNotFoundError(error)
            ) throw error;
            return null;
          }
        }),
      )
    ).filter((owner): owner is ThreadSectionOwner => owner != null);
    if (owners.length <= 1 || !options.throwOnAmbiguousOwner)
      return owners.length === 1 ? (owners[0] ?? null) : null;
    throw Error(`Pinned thread ownership is ambiguous across app-server hosts`);
  }

  async setThreadPinned(
    owner: ThreadSectionOwner,
    request: { threadId: string; pinned: boolean; beforeThreadId?: string | null },
  ): Promise<boolean> {
    const { threadId, pinned, beforeThreadId } = request;
    if (owner.isPinned === pinned) return false;
    const beforeOwner = pinned && beforeThreadId != null
      ? await this.findThreadOwner(beforeThreadId, [owner])
      : null;
    return this.setThreadSection(owner, {
      beforeThreadId: beforeOwner?.isPinned ? beforeThreadId : null,
      sectionId: pinned ? owner.pinnedSectionId : null,
      threadId,
    });
  }

  async setThreadSection(
    owner: ThreadSectionOwner,
    request: {
      threadId: string;
      sectionId: string | null;
      beforeThreadId?: string | null;
      previousSectionId?: string | null;
    },
  ): Promise<boolean> {
    const { threadId, sectionId, beforeThreadId, previousSectionId } = request;
    if (
      (previousSectionId != null && owner.sectionId !== previousSectionId) ||
      (owner.sectionId === sectionId && beforeThreadId === undefined)
    ) return false;
    let stagedMove = false;
    if (
      sectionId != null &&
      sectionId !== owner.pinnedSectionId &&
      owner.sectionId !== sectionId &&
      beforeThreadId != null
    ) {
      await this.adapter.moveThread(owner, {
        beforeThreadId: null,
        sectionId,
        threadId,
      });
      stagedMove = true;
    }
    try {
      await this.adapter.moveThread(owner, {
        beforeThreadId: beforeThreadId ?? null,
        sectionId,
        threadId,
      });
    } catch (error) {
      if (stagedMove) {
        await this.adapter.moveThread(owner, {
          beforeThreadId: null,
          sectionId: owner.sectionId,
          threadId,
        });
      }
      throw error;
    }
    return true;
  }

  async movePinnedThread(
    owner: ThreadSectionOwner,
    request: { threadId: string; beforeThreadId: string | null },
  ): Promise<boolean> {
    return owner.isPinned
      ? this.setThreadSection(owner, {
          beforeThreadId: request.beforeThreadId,
          sectionId: owner.pinnedSectionId,
          threadId: request.threadId,
        })
      : false;
  }
}
