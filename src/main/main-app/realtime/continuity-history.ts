// @ts-nocheck

/** Creates the file-backed realtime voice continuity history service. */
export function createRealtimeContinuityHistoryRuntime(
  dependencies: Record<string, any>,
) {
  const { runtime: n, fs, path, fileName = "realtime-voice-continuity.json" } =
    dependencies;
  const itemSchema = n.wf({
    role: n.df(["user", "assistant"]),
    text: n.Of(),
  });
  const historySchema = n.wf({
    version: n.bf(1),
    threads: n.Ef(n.Of(), n.wf({ items: n.hf(itemSchema) })),
  });
  let writeQueue = Promise.resolve();

  function historyPath(codexHome: string) {
    return path.join(codexHome, fileName);
  }

  function normalizeItem(item: any, maxTextLength: number) {
    const text = item.text.trim().slice(0, maxTextLength);
    return text.length === 0 ? null : { role: item.role, text };
  }

  async function readHistory(codexHome: string) {
    try {
      return historySchema.parse(
        JSON.parse(await fs.readFile(historyPath(codexHome), "utf8")),
      );
    } catch {
      return { version: 1, threads: {} };
    }
  }

  async function writeHistory(codexHome: string, history: any) {
    const target = historyPath(codexHome);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, `${JSON.stringify(history)}\n`, "utf8");
  }

  class RealtimeContinuityHistory extends n.Uf {
    executionHost;

    constructor(executionHost: any) {
      super();
      this.executionHost = executionHost;
    }

    async read({ threadId, maxItems }: any) {
      const history = await readHistory(await this.executionHost.codexHome());
      return (history.threads[threadId]?.items ?? []).slice(-maxItems);
    }

    async record({ threadId, item, maxItems, maxTextLength }: any) {
      const normalizedItem = normalizeItem(item, maxTextLength);
      if (normalizedItem == null) return;
      writeQueue = writeQueue
        .catch(() => undefined)
        .then(async () => {
          const codexHome = await this.executionHost.codexHome();
          const history = await readHistory(codexHome);
          const items = history.threads[threadId]?.items ?? [];
          history.threads[threadId] = {
            items: [...items, normalizedItem].slice(-maxItems),
          };
          await writeHistory(codexHome, history);
        });
      await writeQueue;
    }
  }

  return {
    RealtimeContinuityHistory,
    historyPath,
    normalizeItem,
    readHistory,
    writeHistory,
  };
}

if (typeof module !== "undefined")
  module.exports = { createRealtimeContinuityHistoryRuntime };
