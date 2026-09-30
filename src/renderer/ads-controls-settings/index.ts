import "@rchunk/rolldown-runtime";
import {
  $3 as initializeJsxRuntime,
  HX as useSignalValue,
  I3 as getJsxRuntime,
  Qh as LoadingSpinner,
  Yh as Button,
  e6 as getReactRuntime,
  type JsxRuntime,
  type ReactRuntime,
} from "@rchunk/app-shared";
import {
  U6t as currentAccountIdSignal,
  d_n as useSearchParams,
  ofn as useGate,
} from "@rchunk/app-initial";
import "@rchunk/command-menu-availability";
import "@rchunk/ads-controls-state";

interface AdsSettings {
  bazaarPersonalizationEnabled?: boolean;
  bazaarPersonalizationUnavailable?: boolean;
  freeAdsOptOut?: boolean;
}

interface AdsHistoryItem {
  action: "opened" | "viewed" | string;
  ad_data: { advertiser_brand: { name: string }; title: string };
  id: string;
  occurred_at: string;
}

interface AdsHistoryPage {
  cursor?: string | null;
  history: readonly AdsHistoryItem[];
}

interface AdsTopicsPage {
  cursor?: string | null;
  preferences: readonly { content: string }[];
}

interface Snapshot<Data> {
  data?: Data;
  error?: string | null;
  loading?: boolean;
}

interface PagedSnapshot<Page> extends Snapshot<Page> {
  pages?: readonly Page[];
}

interface AdsControlsService {
  deleteData(accountId: string): Promise<boolean>;
  loadHistory(accountId: string, cursor?: string): Promise<AdsHistoryPage>;
  loadSettings(accountId: string): Promise<AdsSettings>;
  loadTopics(accountId: string, cursor?: string): Promise<AdsTopicsPage>;
  updateSetting(
    accountId: string,
    input: {
      feature: "bazaar_personalization_enabled" | "free_ads_opt_out";
      value: boolean;
    },
  ): Promise<boolean>;
}

interface AdsControlsSettingsProps {
  accountId?: string | null;
  available?: boolean;
  freeOptOutEligible?: boolean;
  historySnapshot?: PagedSnapshot<AdsHistoryPage>;
  onBack?(): void;
  onOpenExternal?(url: string): void;
  searchParams?: URLSearchParams;
  service?: AdsControlsService;
  settingsSnapshot?: Snapshot<AdsSettings>;
  showPlanUpsell?: boolean;
  topicsSnapshot?: PagedSnapshot<AdsTopicsPage>;
}

type Dialog = "ad-free" | "delete" | null;
type PageView = "ads" | "ads-history" | "ads-topics";

const defaultService: AdsControlsService = {
  async deleteData(accountId) {
    const response = await fetch("/bazaar/profile", {
      headers: accountHeaders(accountId),
      method: "DELETE",
    });
    return response.ok;
  },
  async loadHistory(accountId, cursor) {
    const search = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    return requestJson<AdsHistoryPage>(`/bazaar/history${search}`, accountId);
  },
  async loadSettings(accountId) {
    return requestJson<AdsSettings>(
      "/settings/account_user_setting",
      accountId,
    );
  },
  async loadTopics(accountId, cursor) {
    const search = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    return requestJson<AdsTopicsPage>(
      `/bazaar/preferences${search}`,
      accountId,
    );
  },
  async updateSetting(accountId, input) {
    const parameters = new URLSearchParams({
      feature: input.feature,
      value: String(input.value),
    });
    const response = await fetch(
      `/settings/account_user_setting?${parameters}`,
      {
        headers: accountHeaders(accountId),
        method: "PATCH",
      },
    );
    return response.ok;
  },
};

let React: ReactRuntime;
let jsx: JsxRuntime;

function accountHeaders(accountId: string): Record<string, string> {
  return {
    "ChatGPT-Account-ID": accountId,
    "X-OpenAI-Expected-Account-Id": accountId,
  };
}

async function requestJson<Data>(
  url: string,
  accountId: string,
): Promise<Data> {
  const response = await fetch(url, { headers: accountHeaders(accountId) });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return (await response.json()) as Data;
}

function resolveView(parameters: URLSearchParams): PageView {
  const view = parameters.get("view") ?? "ads";
  const legacyView = parameters.get("adsView");
  if (view === "ads" && legacyView === "history") return "ads-history";
  if (view === "ads" && legacyView === "topics") return "ads-topics";
  if (view === "ads-history" || view === "ads-topics") return view;
  return "ads";
}

function Status(props: {
  error?: string | null;
  loading?: boolean;
  onRetry(): void;
}): unknown {
  if (props.error) {
    return jsx.jsxs("div", {
      role: "alert",
      children: [
        jsx.jsx("p", {
          children: "Couldn’t load ads controls. Please try again",
        }),
        jsx.jsx(Button, { children: "Retry", onClick: props.onRetry }),
      ],
    });
  }
  if (props.loading) {
    return jsx.jsxs("div", {
      role: "status",
      children: [
        jsx.jsx(LoadingSpinner, {}),
        jsx.jsx("span", { children: "Loading ads controls…" }),
      ],
    });
  }
  return null;
}

function Section(props: {
  children?: unknown;
  subtitle?: string;
  title?: string;
}): unknown {
  return jsx.jsxs("section", {
    children: [
      props.title ? jsx.jsx("h2", { children: props.title }) : null,
      props.subtitle ? jsx.jsx("p", { children: props.subtitle }) : null,
      props.children,
    ],
  });
}

function DeleteDialog(props: {
  accountId: string;
  historyOnly: boolean;
  onClose(): void;
  service: AdsControlsService;
}): unknown {
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState(false);
  const confirm = async (): Promise<void> => {
    if (pending) return;
    setPending(true);
    setError(false);
    try {
      if (await props.service.deleteData(props.accountId)) props.onClose();
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  };
  return jsx.jsxs("div", {
    role: "dialog",
    children: [
      jsx.jsx("h2", { children: "Delete all ads data?" }),
      jsx.jsx("p", {
        children: props.historyOnly
          ? "This will permanently delete your ad history. This action cannot be undone."
          : "This will permanently delete your ads history and ads topics data. This action cannot be undone.",
      }),
      error
        ? jsx.jsx("p", {
            role: "alert",
            children: "Couldn’t delete ads data. Please try again",
          })
        : null,
      jsx.jsx(Button, {
        children: "Cancel",
        disabled: pending,
        onClick: props.onClose,
      }),
      jsx.jsx(Button, {
        children: "Delete",
        disabled: pending,
        loading: pending,
        onClick: () => void confirm(),
      }),
    ],
  });
}

function AdFreeDialog(props: {
  eligible: boolean;
  onClose(): void;
  onOptOut(): void;
  onUpgrade(): void;
}): unknown {
  return jsx.jsxs("div", {
    role: "dialog",
    children: [
      jsx.jsx("h2", {
        children: props.eligible
          ? "Choices to go ad-free"
          : "Upgrade to go ad-free",
      }),
      jsx.jsx("p", { children: "Ads allow for more messages with ChatGPT" }),
      jsx.jsx("p", {
        children: props.eligible
          ? "To get full access without ads, upgrade to Plus. Or, you can reduce message limits to remove ads for free."
          : "To get full access without ads, upgrade to Plus",
      }),
      jsx.jsx(Button, { children: "Cancel", onClick: props.onClose }),
      props.eligible
        ? jsx.jsx(Button, {
            children: "Reduce message limits",
            onClick: () => {
              props.onOptOut();
              props.onClose();
            },
          })
        : null,
      jsx.jsx(Button, {
        children: "Upgrade to Plus",
        onClick: () => {
          props.onUpgrade();
          props.onClose();
        },
      }),
    ],
  });
}

function HistoryView(props: {
  accountId: string;
  service: AdsControlsService;
  snapshot?: PagedSnapshot<AdsHistoryPage>;
}): unknown {
  const [pages, setPages] = React.useState<readonly AdsHistoryPage[]>(
    props.snapshot?.pages ??
      (props.snapshot?.data == null ? [] : [props.snapshot.data]),
  );
  const [loading, setLoading] = React.useState(
    props.snapshot?.loading ?? props.snapshot == null,
  );
  const [error, setError] = React.useState<string | null>(
    props.snapshot?.error ?? null,
  );
  const load = (cursor?: string): void => {
    setLoading(true);
    setError(null);
    props.service
      .loadHistory(props.accountId, cursor)
      .then((page) =>
        setPages((current) => (cursor ? [...current, page] : [page])),
      )
      .catch(() => setError("load-error"))
      .finally(() => setLoading(false));
  };
  React.useEffect(() => {
    if (props.snapshot == null) load();
  }, [props.accountId, props.service, props.snapshot]);
  const items = pages.flatMap((page) => page.history);
  const cursor = pages.at(-1)?.cursor ?? undefined;
  return jsx.jsx(Section, {
    subtitle:
      "See the ads you’ve viewed or interacted with. You’re always in control — you can clear your history whenever you choose.",
    children: jsx.jsxs(React.Fragment, {
      children: [
        loading && items.length === 0
          ? jsx.jsx(Status, { loading: true, onRetry: load })
          : null,
        error && items.length === 0
          ? jsx.jsx(Status, { error, onRetry: load })
          : null,
        !loading && !error && items.length === 0
          ? jsx.jsxs("div", {
              children: [
                jsx.jsx("p", { children: "No ad history" }),
                jsx.jsx("p", {
                  children: "Ads you view in ChatGPT will appear here",
                }),
              ],
            })
          : null,
        ...items.map((item) =>
          jsx.jsxs(
            "article",
            {
              children: [
                jsx.jsx("strong", {
                  children: `${item.ad_data.advertiser_brand.name} — ${item.ad_data.title}`,
                }),
                jsx.jsx("span", {
                  children: `${new Date(item.occurred_at).toLocaleDateString()} · ${item.action === "opened" ? "Opened" : "Viewed"}`,
                }),
              ],
            },
            item.id,
          ),
        ),
        error && items.length > 0
          ? jsx.jsx(Status, { error, onRetry: () => load(cursor) })
          : null,
        cursor
          ? jsx.jsx(Button, {
              children: loading ? "Loading more…" : "Load more",
              disabled: loading,
              onClick: () => load(cursor),
            })
          : null,
      ],
    }),
  });
}

function TopicsView(props: {
  accountId: string;
  enabled: boolean;
  service: AdsControlsService;
  snapshot?: PagedSnapshot<AdsTopicsPage>;
}): unknown {
  const [pages, setPages] = React.useState<readonly AdsTopicsPage[]>(
    props.snapshot?.pages ??
      (props.snapshot?.data == null ? [] : [props.snapshot.data]),
  );
  const [loading, setLoading] = React.useState(
    props.snapshot?.loading ?? (props.snapshot == null && props.enabled),
  );
  const [error, setError] = React.useState<string | null>(
    props.snapshot?.error ?? null,
  );
  const load = (cursor?: string): void => {
    if (!props.enabled) return;
    setLoading(true);
    setError(null);
    props.service
      .loadTopics(props.accountId, cursor)
      .then((page) =>
        setPages((current) => (cursor ? [...current, page] : [page])),
      )
      .catch(() => setError("load-error"))
      .finally(() => setLoading(false));
  };
  React.useEffect(() => {
    if (props.snapshot == null && props.enabled) load();
  }, [props.accountId, props.enabled, props.service, props.snapshot]);
  const topics = pages.flatMap((page) => page.preferences);
  const cursor = pages.at(-1)?.cursor ?? undefined;
  if (!props.enabled || (!loading && !error && topics.length === 0)) {
    return jsx.jsxs("div", {
      children: [
        jsx.jsx("p", { children: "No topics yet" }),
        jsx.jsx("p", {
          children:
            "ChatGPT may use topics to make ads more relevant. Topics may be based on your activity or feedback on ads.",
        }),
      ],
    });
  }
  return jsx.jsx(Section, {
    title: "Topics inspired by your activity",
    subtitle:
      "ChatGPT may use these topics to choose ads that are more relevant to you.",
    children: jsx.jsxs(React.Fragment, {
      children: [
        loading && topics.length === 0
          ? jsx.jsx(Status, { loading: true, onRetry: load })
          : null,
        error ? jsx.jsx(Status, { error, onRetry: () => load(cursor) }) : null,
        ...topics.map((topic, index) =>
          jsx.jsx("p", { children: topic.content }, String(index)),
        ),
        cursor
          ? jsx.jsx(Button, {
              children: loading ? "Loading more…" : "Load more",
              disabled: loading,
              onClick: () => load(cursor),
            })
          : null,
      ],
    }),
  });
}

function AdsControlsContent(
  props: Omit<AdsControlsSettingsProps, "accountId"> & { accountId: string },
): unknown {
  const [runtimeParameters, setRuntimeParameters] = useSearchParams();
  const runtimeFreeOptOutEligible = useGate("1613860123");
  const parameters = props.searchParams ?? runtimeParameters;
  const view = resolveView(parameters);
  const service = props.service ?? defaultService;
  const freeOptOutEligible =
    props.freeOptOutEligible ?? runtimeFreeOptOutEligible;
  const [settings, setSettings] = React.useState(props.settingsSnapshot?.data);
  const [loading, setLoading] = React.useState(
    props.settingsSnapshot?.loading ?? props.settingsSnapshot == null,
  );
  const [error, setError] = React.useState<string | null>(
    props.settingsSnapshot?.error ?? null,
  );
  const [pending, setPending] = React.useState(false);
  const [dialog, setDialog] = React.useState<Dialog>(null);
  const [updateError, setUpdateError] = React.useState(false);
  const loadSettings = (): void => {
    setLoading(true);
    setError(null);
    service
      .loadSettings(props.accountId)
      .then(setSettings)
      .catch(() => setError("load-error"))
      .finally(() => setLoading(false));
  };
  React.useEffect(() => {
    if (props.settingsSnapshot == null) loadSettings();
  }, [props.accountId, props.settingsSnapshot, service]);
  const navigate = (nextView: PageView): void => {
    const next = new URLSearchParams(parameters);
    next.delete("adsView");
    if (nextView === "ads") next.set("view", "ads");
    else next.set("view", nextView);
    setRuntimeParameters(next);
  };
  const update = async (
    feature: "bazaar_personalization_enabled" | "free_ads_opt_out",
    value: boolean,
  ): Promise<void> => {
    if (pending) return;
    setPending(true);
    setUpdateError(false);
    try {
      if (await service.updateSetting(props.accountId, { feature, value })) {
        setSettings((current) => ({
          ...current,
          ...(feature === "free_ads_opt_out"
            ? { freeAdsOptOut: value }
            : { bazaarPersonalizationEnabled: value }),
        }));
      } else setUpdateError(true);
    } catch {
      setUpdateError(true);
    } finally {
      setPending(false);
    }
  };
  const personalizationUnavailable =
    settings?.bazaarPersonalizationUnavailable === true;
  const adsOff = freeOptOutEligible && settings?.freeAdsOptOut === true;
  const topicsEnabled =
    settings != null &&
    settings.bazaarPersonalizationEnabled !== false &&
    !personalizationUnavailable &&
    !adsOff;
  const title =
    view === "ads-history"
      ? "Ads history"
      : view === "ads-topics"
        ? "Topics"
        : "Ads controls";
  const back = (): void => {
    if (view !== "ads") navigate("ads");
    else props.onBack?.();
  };
  return jsx.jsxs("main", {
    children: [
      jsx.jsxs("header", {
        children: [
          view !== "ads" || props.onBack != null
            ? jsx.jsx(Button, { children: "Back", onClick: back })
            : null,
          jsx.jsx("h1", { children: title }),
        ],
      }),
      settings == null && view !== "ads-history"
        ? jsx.jsx(Status, { error, loading, onRetry: loadSettings })
        : null,
      view === "ads-history"
        ? jsx.jsx(HistoryView, {
            accountId: props.accountId,
            service,
            snapshot: props.historySnapshot,
          })
        : null,
      view === "ads-topics" &&
      settings != null &&
      !personalizationUnavailable &&
      !adsOff
        ? jsx.jsx(TopicsView, {
            accountId: props.accountId,
            enabled: topicsEnabled,
            service,
            snapshot: props.topicsSnapshot,
          })
        : null,
      view === "ads" && settings != null && adsOff
        ? jsx.jsx(Section, {
            title: "Ads are off",
            subtitle:
              "You’re using ChatGPT ad-free with reduced usage. Expand your access by upgrading your plan or turning on ads.",
            children: jsx.jsx(Button, {
              children: "Turn on ads",
              loading: pending,
              onClick: () => void update("free_ads_opt_out", false),
            }),
          })
        : null,
      view === "ads" && settings != null && !adsOff
        ? jsx.jsxs(React.Fragment, {
            children: [
              jsx.jsx(Section, {
                children: jsx.jsxs(React.Fragment, {
                  children: [
                    jsx.jsx(Button, {
                      children: "History",
                      onClick: () => navigate("ads-history"),
                    }),
                    personalizationUnavailable
                      ? null
                      : jsx.jsx(Button, {
                          children: "Topics",
                          onClick: () => navigate("ads-topics"),
                        }),
                    jsx.jsxs("div", {
                      children: [
                        jsx.jsx("strong", { children: "Delete ads data" }),
                        jsx.jsx("p", {
                          children: personalizationUnavailable
                            ? "Delete your ad history associated with you. This won’t delete or change your chats."
                            : "Clear all ads history and topics data. This won't affect your chats.",
                        }),
                        jsx.jsx(Button, {
                          children: "Delete",
                          onClick: () => setDialog("delete"),
                        }),
                      ],
                    }),
                  ],
                }),
              }),
              jsx.jsx(Section, {
                title: "Ads personalization",
                children: jsx.jsxs("label", {
                  children: [
                    jsx.jsx("span", { children: "Personalize ads" }),
                    jsx.jsx("input", {
                      "aria-disabled": personalizationUnavailable || pending,
                      checked:
                        settings.bazaarPersonalizationEnabled !== false &&
                        !personalizationUnavailable,
                      disabled: pending,
                      onChange: (event: { target: { checked: boolean } }) => {
                        if (!personalizationUnavailable)
                          void update(
                            "bazaar_personalization_enabled",
                            event.target.checked,
                          );
                      },
                      type: "checkbox",
                    }),
                    jsx.jsx("p", {
                      children: personalizationUnavailable
                        ? "Personalized ads currently aren’t available in your region. You’ll still see ads based on limited data like general location, context, and device type."
                        : "Allow ChatGPT to use your past chats, activity, and preferences to select ads. Ads may still be based on your current chat.",
                    }),
                  ],
                }),
              }),
              props.showPlanUpsell === false
                ? null
                : jsx.jsx(Section, {
                    children: jsx.jsxs("div", {
                      children: [
                        jsx.jsx("span", {
                          children: "Change plan to go ad-free",
                        }),
                        jsx.jsx(Button, {
                          children: "Change plan",
                          disabled: pending,
                          onClick: () => setDialog("ad-free"),
                        }),
                      ],
                    }),
                  }),
            ],
          })
        : null,
      updateError
        ? jsx.jsx("p", {
            role: "alert",
            children: "Couldn’t update ads controls. Please try again",
          })
        : null,
      dialog === "delete"
        ? jsx.jsx(DeleteDialog, {
            accountId: props.accountId,
            historyOnly: personalizationUnavailable,
            onClose: () => setDialog(null),
            service,
          })
        : null,
      dialog === "ad-free"
        ? jsx.jsx(AdFreeDialog, {
            eligible: freeOptOutEligible,
            onClose: () => setDialog(null),
            onOptOut: () => void update("free_ads_opt_out", true),
            onUpgrade: () => {
              const url =
                "https://chatgpt.com/pricing?openModalLocation=ads_controls_change_plan&targetPlan=plus";
              if (props.onOpenExternal) props.onOpenExternal(url);
              else if (typeof globalThis.open === "function")
                globalThis.open(url, "_blank", "noopener,noreferrer");
            },
          })
        : null,
    ],
  });
}

function AdsControlsSettings(props: AdsControlsSettingsProps = {}): unknown {
  const runtimeAccountId = useSignalValue(currentAccountIdSignal);
  const accountId = "accountId" in props ? props.accountId : runtimeAccountId;
  if (accountId == null || props.available === false) return null;
  return jsx.jsx(AdsControlsContent, { ...props, accountId });
}

initializeJsxRuntime();
React = getReactRuntime();
jsx = getJsxRuntime();

export { AdsControlsSettings };
