import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, e6 as getReactRuntime } from "@rchunk/app-shared";
import { cJt as initializeApiClient, rJt as apiClient } from "@rchunk/app-initial";
import { Gp as updateAccountSetting, Wp as initializeAccountSettings } from "@rchunk/app-primary";
import { n as initializeAnimatedIcon, t as AnimatedIcon } from "@rchunk/animated-icon";

interface AboutYouSection {
  description: string;
  id: string;
  title: string;
  [key: string]: unknown;
}

interface AboutYouSummary {
  generatedAtIso?: string;
  sectionChanges?: unknown[];
  sections: AboutYouSection[];
  [key: string]: unknown;
}

interface StreamEvent { data: unknown; event: string }
interface StreamOptions {
  additionalHeaders: Record<string, string>;
  body: string;
  onComplete(): void;
  onError(error: { error: string }): void;
  onEvent(event: StreamEvent): void;
  parameters?: Record<string, unknown>;
}
interface AboutYouApiClient {
  cancelStream(id: unknown): void;
  safePost<Response>(path: string, options: Record<string, unknown>): Promise<Response>;
  streamPost(path: string, options: StreamOptions): unknown;
}
interface RegenerateOptions {
  accountId: string;
  contextualHint?: string;
  onSectionTypes?(sections: unknown[]): void;
  onStarted?(summary: AboutYouSummary & { sectionChanges: unknown[] }): void;
  onUpdatedSection?(section: AboutYouSection, change: unknown | null): void;
  signal?: AbortSignal;
  source?: string;
}
interface CorrectionOptions {
  accountId: string;
  onAssistantResponse?(response: { didUpdateSummary?: boolean; text: string }): void;
  onCorrectionTargets?(targets: unknown): void;
  onDeletedSection?(sectionId: string): void;
  onUpdatedSection?(section: AboutYouSection, change: unknown | null): void;
  signal?: AbortSignal;
}
interface AboutYouProps {
  accountId: string;
  contextualHint?: string;
  forceRefresh?: boolean;
  initialSummary?: AboutYouSummary;
  onClose(): void;
  onDeleteAndTurnOffMemory?(): Promise<void>;
  source?: string;
}

const jsx = getJsxRuntime();
const React = getReactRuntime();
const client = apiClient as unknown as AboutYouApiClient;

function headers(accountId: string): Record<string, string> {
  return { "ChatGPT-Account-ID": accountId };
}

function normalizeSummary(value: unknown): AboutYouSummary {
  const record = value as Partial<AboutYouSummary> | null;
  if (record == null || !Array.isArray(record.sections)) throw new Error("Invalid About You response");
  return { ...record, sections: record.sections } as AboutYouSummary;
}

function streamSummary(options: RegenerateOptions, endpoint = "/memories/about_you/summary/regenerate"): Promise<AboutYouSummary> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let streamId: unknown;
    const fail = (message: string) => {
      if (settled) return;
      settled = true;
      options.signal?.removeEventListener("abort", abort);
      reject(new Error(message));
    };
    const abort = () => {
      if (settled) return;
      settled = true;
      if (streamId != null) client.cancelStream(streamId);
      reject(new DOMException("Memory summary cancelled", "AbortError"));
    };
    if (options.signal?.aborted) return abort();
    streamId = client.streamPost(endpoint, {
      additionalHeaders: headers(options.accountId),
      body: JSON.stringify({ contextual_hint: options.contextualHint, force_regenerate: options.contextualHint != null }),
      parameters: { query: { source: options.source ?? "personalization-setting" } },
      onComplete: () => fail("About You stream ended without a result"),
      onError: error => fail(error.error),
      onEvent: event => {
        if (settled) return;
        if (event.event === "started") {
          const summary = normalizeSummary({ ...(event.data as Record<string, unknown>), sections: [] });
          options.onStarted?.({ ...summary, sectionChanges: [] });
        } else if (event.event === "section_types") {
          const data = event.data as { sections?: unknown[] };
          options.onSectionTypes?.(data.sections ?? []);
        } else if (event.event === "section") {
          const data = event.data as { changes?: unknown; section?: AboutYouSection };
          if (data.section != null) options.onUpdatedSection?.(data.section, data.changes ?? null);
        } else if (event.event === "error") {
          fail("About You stream failed");
        } else if (event.event === "done") {
          const summary = normalizeSummary(event.data);
          if (!summary.generatedAtIso) return fail("Invalid About You stream response");
          settled = true;
          options.signal?.removeEventListener("abort", abort);
          resolve({ ...summary, sectionChanges: summary.sectionChanges ?? [] });
        }
      },
    });
    options.signal?.addEventListener("abort", abort, { once: true });
  });
}

function correctSummary(payload: Record<string, unknown>, options: CorrectionOptions): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let assistantResponse: string | null = null;
    let streamId: unknown;
    const fail = (message: string) => {
      if (settled) return;
      settled = true;
      options.signal?.removeEventListener("abort", abort);
      reject(new Error(message));
    };
    const abort = () => {
      if (settled) return;
      settled = true;
      if (streamId != null) client.cancelStream(streamId);
      reject(new DOMException("Memory correction cancelled", "AbortError"));
    };
    if (options.signal?.aborted) return abort();
    streamId = client.streamPost("/memories/about_you/correction", {
      additionalHeaders: headers(options.accountId),
      body: JSON.stringify(payload),
      onComplete: () => fail("About You correction stream ended without a result"),
      onError: error => fail(error.error),
      onEvent: event => {
        if (settled) return;
        const data = event.data as Record<string, unknown>;
        if (event.event === "correction_targets") options.onCorrectionTargets?.(data);
        else if (event.event === "assistant_response" && typeof data.response === "string" && data.response.trim()) {
          assistantResponse = data.response.trim();
          options.onAssistantResponse?.({ didUpdateSummary: data.didUpdateSummary as boolean | undefined, text: assistantResponse });
        } else if (event.event === "section" && data.section != null) {
          options.onUpdatedSection?.(data.section as AboutYouSection, data.changes ?? null);
        } else if (event.event === "section_deleted" && typeof data.sectionId === "string") {
          options.onDeletedSection?.(data.sectionId);
        } else if (event.event === "error") fail("About You correction stream failed");
        else if (event.event === "done") {
          settled = true;
          options.signal?.removeEventListener("abort", abort);
          resolve({ ...data, assistantResponse: data.assistantResponse ?? assistantResponse });
        }
      },
    });
    options.signal?.addEventListener("abort", abort, { once: true });
  });
}

async function fetchSummary(accountId: string | null, options?: RegenerateOptions): Promise<AboutYouSummary> {
  if (accountId != null && options != null) {
    try {
      return await streamSummary({ ...options, accountId }, "/memories/about_you/summary/stream");
    } catch (error) {
      if (options.signal?.aborted) throw error;
    }
  }
  const response = await client.safePost<unknown>("/memories/about_you/summary", {
    signal: options?.signal,
    additionalHeaders: accountId == null ? undefined : headers(accountId),
    parameters: { query: { source: options?.source ?? "personalization-setting" } },
    requestBody: options?.contextualHint == null ? undefined : { contextual_hint: options.contextualHint, force_regenerate: true },
  });
  const summary = normalizeSummary(response);
  return { ...summary, sectionChanges: summary.sectionChanges ?? [] };
}

function AboutYouSummaryView(props: AboutYouProps): unknown {
  const [summary, setSummary] = React.useState<AboutYouSummary | null>(props.initialSummary ?? null);
  const [loading, setLoading] = React.useState(props.initialSummary == null);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (props.initialSummary != null) return;
    const controller = new AbortController();
    setLoading(true);
    fetchSummary(props.accountId, { accountId: props.accountId, contextualHint: props.contextualHint, source: props.source, signal: controller.signal })
      .then(setSummary, reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Could not load About You"); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [props.accountId, props.contextualHint, props.forceRefresh, props.initialSummary, props.source]);

  const regenerate = () => {
    setLoading(true);
    setError(null);
    streamSummary({ accountId: props.accountId, contextualHint: props.contextualHint, source: props.source })
      .then(setSummary, reason => setError(reason instanceof Error ? reason.message : "Could not regenerate About You"))
      .finally(() => setLoading(false));
  };

  return jsx.jsxs("section", { "aria-label": "About you", children: [
    jsx.jsxs("header", { children: [jsx.jsx("h2", { children: "About you" }), jsx.jsx("button", { type: "button", onClick: props.onClose, children: "Close" })] }),
    loading ? jsx.jsxs("p", { role: "status", children: [jsx.jsx(AnimatedIcon, { animation: "loader", loop: true }), " Updating what ChatGPT knows about you…"] }) : null,
    error ? jsx.jsx("p", { role: "alert", children: error }) : null,
    summary?.sections.map(section => jsx.jsxs("article", { "data-memory-section-id": section.id, children: [jsx.jsx("h3", { children: section.title }), jsx.jsx("p", { children: section.description })] }, section.id)),
    jsx.jsxs("footer", { children: [
      jsx.jsx("button", { type: "button", onClick: regenerate, children: "Regenerate" }),
      props.onDeleteAndTurnOffMemory ? jsx.jsx("button", { type: "button", onClick: () => props.onDeleteAndTurnOffMemory?.().then(() => setSummary(null)).catch(reason => setError(reason instanceof Error ? reason.message : "Could not turn off memory")), children: "Delete and turn off memory" }) : null,
    ] }),
  ] });
}

function AboutYouSummary(props: AboutYouProps): unknown {
  const deleteAndDisable = async () => {
    await updateAccountSetting({}, props.accountId, "m3m", false);
    await client.safePost("/memories/about_you/summary/cache/delete", {
      additionalHeaders: headers(props.accountId),
      requestBody: { disableMemory: true },
    });
  };
  return jsx.jsx(AboutYouSummaryView, { ...props, onDeleteAndTurnOffMemory: deleteAndDisable }, props.accountId);
}

function initializeAboutYouSummary(): void {
  initializeApiClient();
  initializeAccountSettings();
  initializeAnimatedIcon();
}

export { streamSummary as a, initializeAboutYouSummary as i, AboutYouSummary as n, correctSummary as o, fetchSummary as r, AboutYouSummaryView as t };
