// @ts-nocheck

type ThreadCatalogSourceDependencies = {
  schema: any;
  sourceKinds: readonly string[];
  projectAppServerThread(thread: Record<string, any>, hostId: string): Record<string, any>;
};

/** Creates the app-server and ChatGPT history adapters consumed by the thread catalog. */
export function createThreadCatalogSources(dependencies: ThreadCatalogSourceDependencies) {
  const chatGptConversationSchema = dependencies.schema
    .wf({
      id: dependencies.schema.Of().min(1),
      title: dependencies.schema.Of().nullish(),
      create_time: dependencies.schema.Of().nullish(),
      update_time: dependencies.schema.Of().nullish(),
      is_temporary_chat: dependencies.schema.gf().nullish(),
      gizmo_id: dependencies.schema.Of().nullish(),
      conversation_origin: dependencies.schema.Of().nullish(),
    })
    .loose();
  const chatGptHistoryPageSchema = dependencies.schema.wf({
    items: dependencies.schema.hf(chatGptConversationSchema),
    total: dependencies.schema.Cf().int().nonnegative(),
    limit: dependencies.schema.Cf().int().positive(),
    offset: dependencies.schema.Cf().int().nonnegative(),
  });

  function projectChatGptConversation(hostId: string, conversation: Record<string, any>) {
    const updatedAt =
      conversation.update_time == null ? NaN : Date.parse(conversation.update_time) / 1000;
    if (conversation.is_temporary_chat === true || !Number.isFinite(updatedAt)) {
      return { id: conversation.id, updatedAt, entry: null };
    }
    const createdAt =
      conversation.create_time == null ? NaN : Date.parse(conversation.create_time) / 1000;
    return {
      id: conversation.id,
      updatedAt,
      entry: {
        hostId,
        threadId: conversation.id,
        displayTitle: conversation.title?.trim() || conversation.id,
        sourceCreatedAt: Number.isFinite(createdAt) ? createdAt : updatedAt,
        sourceUpdatedAt: updatedAt,
        sourceRecencyAt: updatedAt,
        sourceKind: `chatgpt`,
        projectId: conversation.gizmo_id?.startsWith(`g-p-`)
          ? conversation.gizmo_id
          : null,
        conversationOrigin: conversation.conversation_origin ?? null,
      },
    };
  }

  function createAppServerThreadCatalogSource(
    hostId: string,
    hostKind: string,
    appServerConnection: Record<string, any>,
  ) {
    return {
      id: hostId,
      hostKind,
      listPage: async (
        { cursor, limit }: { cursor: string | null; limit: number },
        requestContext: Record<string, any>,
      ) => {
        const page = await appServerConnection.listThreads(
          {
            archived: false,
            cursor,
            limit,
            modelProviders: [],
            parentThreadId: null,
            sortKey: `updated_at`,
            sortDirection: `desc`,
            sourceKinds: dependencies.sourceKinds,
            useStateDbOnly: true,
          },
          { ...requestContext, source: `thread_catalog` },
        );
        return {
          items: page.data.map((thread: Record<string, any>) => ({
            id: thread.id,
            updatedAt: thread.updatedAt,
            entry: dependencies.projectAppServerThread(thread, hostId),
          })),
          nextCursor: page.nextCursor,
          onAccepted: (observer: Record<string, any>) => observer.observeThreads(page.data),
        };
      },
      readItem: async (threadId: string, requestContext: Record<string, any>) => {
        const thread = await appServerConnection.readThread(
          threadId,
          { includeTurns: false },
          { ...requestContext, source: `thread_catalog` },
        );
        return thread == null
          ? null
          : {
              id: thread.id,
              updatedAt: thread.updatedAt,
              entry: dependencies.projectAppServerThread(thread, hostId),
              onAccepted: (observer: Record<string, any>) => observer.observeThreads([thread]),
            };
      },
      subscribeNotifications: (listener: (notification: Record<string, any>) => void) => {
        const removeNotificationHandler =
          appServerConnection.registerInternalNotificationHandler(listener);
        const removeArchiveHandler = appServerConnection.registerArchiveSuccessHandler?.(
          (threadId: string) => {
            listener({ method: `thread/archived`, params: { threadId } });
          },
        );
        return () => {
          removeNotificationHandler();
          removeArchiveHandler?.();
        };
      },
      promoteQueuedPage: () => appServerConnection.promoteQueuedCatalogPage?.(),
    };
  }

  function createChatGptThreadCatalogSource(
    hostId: string,
    fetchAuthenticatedJson: (path: string, init: Record<string, any>) => Promise<unknown>,
  ) {
    return {
      id: hostId,
      hostKind: `chatgpt`,
      listPage: async (
        { cursor, limit }: { cursor: string | null; limit: number },
        { signal }: { signal?: AbortSignal },
      ) => {
        const offset = cursor == null ? 0 : Number(cursor);
        const page = chatGptHistoryPageSchema.parse(
          await fetchAuthenticatedJson(
            `/conversations?offset=${offset}&limit=${limit}&order=updated&is_archived=false&hide_snorlax=false`,
            { signal },
          ),
        );
        if (page.offset !== offset) {
          throw Error(`ChatGPT history returned an unexpected page offset`);
        }
        const nextOffset = page.offset + page.limit;
        return {
          items: page.items.map((conversation: Record<string, any>) =>
            projectChatGptConversation(hostId, conversation),
          ),
          nextCursor: nextOffset < page.total ? String(nextOffset) : null,
        };
      },
      readItem: async (threadId: string, { signal }: { signal?: AbortSignal }) => {
        const conversation = dependencies.schema
          .hf(chatGptConversationSchema)
          .parse(
            await fetchAuthenticatedJson(`/conversations/batch`, {
              method: `POST`,
              body: { conversation_ids: [threadId] },
              signal,
            }),
          )
          .find(({ id }: Record<string, any>) => id === threadId);
        return conversation == null
          ? null
          : projectChatGptConversation(hostId, conversation);
      },
    };
  }

  return {
    createAppServerThreadCatalogSource,
    createChatGptThreadCatalogSource,
    projectChatGptConversation,
  };
}

if (typeof module !== `undefined`) {
  module.exports = { createThreadCatalogSources };
}
