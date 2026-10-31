import assert from "node:assert/strict";
import fs from "node:fs";
import { z } from "zod";
import { createThreadCatalogSources } from "../src/main/main-app/thread-catalog/sources.ts";

let assertions = 0;
function equal(actual, expected, message) {
  assertions += 1;
  assert.deepEqual(actual, expected, message);
}

const schema = {
  wf(shape) {
    const object = z.object(shape);
    object.loose = () => object.passthrough();
    return object;
  },
  Of: () => z.string(),
  gf: () => z.boolean(),
  Cf: () => z.number(),
  hf: (item) => z.array(item),
};
const projections = [];
const {
  createAppServerThreadCatalogSource,
  createChatGptThreadCatalogSource,
  projectChatGptConversation,
} = createThreadCatalogSources({
  schema,
  sourceKinds: ["cli", "automation"],
  projectAppServerThread(thread, hostId) {
    projections.push({ thread, hostId });
    return { hostId, threadId: thread.id, projected: true };
  },
});

{
  const calls = [];
  const listeners = [];
  const archiveListeners = [];
  let notificationRemovals = 0;
  let archiveRemovals = 0;
  let promotions = 0;
  const connection = {
    async listThreads(request, context) {
      calls.push({ method: "listThreads", request, context });
      return {
        data: [
          { id: "one", updatedAt: 20 },
          { id: "two", updatedAt: 10 },
        ],
        nextCursor: "cursor-2",
      };
    },
    async readThread(threadId, options, context) {
      calls.push({ method: "readThread", threadId, options, context });
      return threadId === "missing" ? null : { id: threadId, updatedAt: 30 };
    },
    registerInternalNotificationHandler(listener) {
      listeners.push(listener);
      return () => {
        notificationRemovals += 1;
      };
    },
    registerArchiveSuccessHandler(listener) {
      archiveListeners.push(listener);
      return () => {
        archiveRemovals += 1;
      };
    },
    promoteQueuedCatalogPage() {
      promotions += 1;
    },
  };
  const source = createAppServerThreadCatalogSource("ssh-host", "ssh", connection);
  equal(source.id, "ssh-host");
  equal(source.hostKind, "ssh");
  const page = await source.listPage(
    { cursor: "cursor-1", limit: 25 },
    { signal: "signal", source: "caller" },
  );
  equal(calls[0], {
    method: "listThreads",
    request: {
      archived: false,
      cursor: "cursor-1",
      limit: 25,
      modelProviders: [],
      parentThreadId: null,
      sortKey: "updated_at",
      sortDirection: "desc",
      sourceKinds: ["cli", "automation"],
      useStateDbOnly: true,
    },
    context: { signal: "signal", source: "thread_catalog" },
  });
  equal(page.items, [
    { id: "one", updatedAt: 20, entry: { hostId: "ssh-host", threadId: "one", projected: true } },
    { id: "two", updatedAt: 10, entry: { hostId: "ssh-host", threadId: "two", projected: true } },
  ]);
  equal(page.nextCursor, "cursor-2");
  const observed = [];
  page.onAccepted({ observeThreads: (threads) => observed.push(threads) });
  equal(observed, [[{ id: "one", updatedAt: 20 }, { id: "two", updatedAt: 10 }]]);

  const item = await source.readItem("one", { priority: "interactive", source: "caller" });
  equal(calls[1], {
    method: "readThread",
    threadId: "one",
    options: { includeTurns: false },
    context: { priority: "interactive", source: "thread_catalog" },
  });
  equal(item.id, "one");
  equal(item.updatedAt, 30);
  equal(item.entry, { hostId: "ssh-host", threadId: "one", projected: true });
  item.onAccepted({ observeThreads: (threads) => observed.push(threads) });
  equal(observed.at(-1), [{ id: "one", updatedAt: 30 }]);
  equal(await source.readItem("missing", {}), null);
  equal(projections.length, 3);

  const notifications = [];
  const unsubscribe = source.subscribeNotifications((notification) => notifications.push(notification));
  listeners[0]({ method: "thread/started", params: { threadId: "one" } });
  archiveListeners[0]("archived-thread");
  equal(notifications, [
    { method: "thread/started", params: { threadId: "one" } },
    { method: "thread/archived", params: { threadId: "archived-thread" } },
  ]);
  unsubscribe();
  equal(notificationRemovals, 1);
  equal(archiveRemovals, 1);
  source.promoteQueuedPage();
  equal(promotions, 1);
}

{
  let removed = 0;
  const source = createAppServerThreadCatalogSource("local", "local", {
    registerInternalNotificationHandler() {
      return () => {
        removed += 1;
      };
    },
  });
  const unsubscribe = source.subscribeNotifications(() => {});
  unsubscribe();
  equal(removed, 1, "archive subscriptions remain optional");
  equal(source.promoteQueuedPage(), undefined, "queued-page promotion remains optional");
}

{
  const signal = AbortSignal.abort("test signal");
  const calls = [];
  const fetchJson = async (path, init) => {
    calls.push({ path, init });
    return {
      items: [
        {
          id: "chat-one",
          title: "  Chat title  ",
          create_time: "2024-01-01T00:00:00.000Z",
          update_time: "2024-01-02T00:00:00.000Z",
          is_temporary_chat: false,
          gizmo_id: "g-p-project",
          conversation_origin: "tpp",
          ignored: true,
        },
        {
          id: "temporary",
          update_time: "2024-01-03T00:00:00.000Z",
          is_temporary_chat: true,
        },
      ],
      total: 5,
      limit: 2,
      offset: 2,
    };
  };
  const source = createChatGptThreadCatalogSource("chatgpt-account", fetchJson);
  equal(source.id, "chatgpt-account");
  equal(source.hostKind, "chatgpt");
  const page = await source.listPage({ cursor: "2", limit: 2 }, { signal });
  equal(calls[0], {
    path: "/conversations?offset=2&limit=2&order=updated&is_archived=false&hide_snorlax=false",
    init: { signal },
  });
  equal(page.nextCursor, "4");
  equal(page.items[0], {
    id: "chat-one",
    updatedAt: 1704153600,
    entry: {
      hostId: "chatgpt-account",
      threadId: "chat-one",
      displayTitle: "Chat title",
      sourceCreatedAt: 1704067200,
      sourceUpdatedAt: 1704153600,
      sourceRecencyAt: 1704153600,
      sourceKind: "chatgpt",
      projectId: "g-p-project",
      conversationOrigin: "tpp",
    },
  });
  equal(page.items[1].id, "temporary");
  equal(page.items[1].updatedAt, 1704240000);
  equal(page.items[1].entry, null);
}

{
  const calls = [];
  const source = createChatGptThreadCatalogSource("chatgpt", async (path, init) => {
    calls.push({ path, init });
    return path === "/conversations/batch"
      ? [
          { id: "other", update_time: "2024-01-01T00:00:00Z" },
          { id: "wanted", title: "", create_time: "invalid", update_time: "2024-02-01T00:00:00Z", gizmo_id: "bad" },
        ]
      : { items: [], total: 0, limit: 10, offset: 0 };
  });
  const signal = new AbortController().signal;
  const first = await source.listPage({ cursor: null, limit: 10 }, { signal });
  equal(calls[0], {
    path: "/conversations?offset=0&limit=10&order=updated&is_archived=false&hide_snorlax=false",
    init: { signal },
  });
  equal(first, { items: [], nextCursor: null });
  const item = await source.readItem("wanted", { signal });
  equal(calls[1], {
    path: "/conversations/batch",
    init: { method: "POST", body: { conversation_ids: ["wanted"] }, signal },
  });
  equal(item.entry.displayTitle, "wanted");
  equal(item.entry.sourceCreatedAt, item.updatedAt);
  equal(item.entry.projectId, null);
  equal(item.entry.conversationOrigin, null);
  equal(await source.readItem("missing", { signal }), null);
}

{
  const source = createChatGptThreadCatalogSource("chatgpt", async () => ({
    items: [],
    total: 1,
    limit: 1,
    offset: 2,
  }));
  await assert.rejects(
    source.listPage({ cursor: "1", limit: 1 }, {}),
    /ChatGPT history returned an unexpected page offset/,
  );
  assertions += 1;
}

{
  const source = createChatGptThreadCatalogSource("chatgpt", async () => ({
    items: "not-an-array",
    total: -1,
    limit: 0,
    offset: -1,
  }));
  await assert.rejects(source.listPage({ cursor: null, limit: 10 }, {}), z.ZodError);
  assertions += 1;
}

{
  const invalidDate = projectChatGptConversation("chatgpt", {
    id: "invalid-date",
    update_time: "not-a-date",
  });
  equal(invalidDate.id, "invalid-date");
  equal(Number.isNaN(invalidDate.updatedAt), true);
  equal(invalidDate.entry, null);
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
const windowContext = fs.readFileSync(
  new URL("../src/main/main-app/window/window-context.ts", import.meta.url),
  "utf8",
);
equal(main.includes("createThreadCatalogSources({"), true);
equal(main.includes("function M5("), false);
equal(main.includes("function fnt("), false);
equal(main.includes("function N5("), false);
equal(windowContext.includes("attachSource(M5(`local`, `local`, r))"), true);
equal(windowContext.includes("attachSource(M5(e.hostId, trt(e), n))"), true);
equal(windowContext.includes("fnt(e, (e, t) => this.fetchWrapper.fetchAuthenticatedJson(e, t))"), true);

console.log(`${assertions} main thread-catalog source assertions passed`);
