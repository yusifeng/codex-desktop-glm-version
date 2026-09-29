import "@rchunk/rolldown-runtime";
import {
  $3 as initializeJsxRuntime,
  I3 as getJsxRuntime,
  Qh as LoadingSpinner,
  Yh as Button,
  e6 as getReactRuntime,
  fW as attachAuthHeader,
  type JsxRuntime,
  type ReactRuntime,
} from "@rchunk/app-shared";
import {
  type Account,
  i_n as useLocation,
  o_n as useNavigate,
  ofn as useGate,
  uht as useAccount,
  ytn as gptChatPath,
} from "@rchunk/app-initial";
import { n as initializeTabs, t as Tabs } from "@rchunk/security-tabs";
import {
  n as LoadingGrid,
  r as initializeSkillsGrid,
  t as SkillsGrid,
} from "@rchunk/skills-page-grid";
import { n as initializeCardTile, t as CardTile } from "@rchunk/card-tile";
// @ts-expect-error The recovered direct edge has no shared declaration yet.
import "@rchunk/directory-banner";
import {
  n as initializeGptAboutDialog,
  t as GptAboutDialog,
} from "@rchunk/gpt-about-dialog-core";
// @ts-expect-error The recovered direct edge has no shared declaration yet.
import "@rchunk/gpt-management-access";
import {
  n as initializeManagementUrl,
  t as gptManagementUrl,
} from "@rchunk/gpt-management-url";

interface GptAuthor {
  display_name?: string | null;
  name?: string | null;
}

interface GptItem {
  author?: GptAuthor | null;
  category?: string | null;
  conversation_count?: number | null;
  description?: string | null;
  display_name?: string | null;
  id: string;
  name?: string | null;
  profile_picture_url?: string | null;
  short_url?: string | null;
}

interface PublicResource {
  gizmo?: GptItem & { gizmo_type?: string | null };
}

interface DiscoveryCut {
  display_group?: string | null;
  items?: readonly PublicResource[];
  name?: string | null;
}

interface DiscoveryResponse {
  cuts?: readonly DiscoveryCut[];
  list?: { cursor?: string | null };
  workspace_filtered?: boolean;
}

interface WorkspacePage {
  gizmos?: readonly GptItem[];
  query_continuation?: string | null;
}

interface Creator {
  account_user_id: string;
  name?: string | null;
}

interface CreatorPage {
  items?: readonly Creator[];
  total?: number;
}

interface QuerySnapshot<Data> {
  data?: Data;
  error?: string | null;
  loading?: boolean;
}

interface WorkspaceSnapshot extends QuerySnapshot<WorkspacePage> {
  pages?: readonly WorkspacePage[];
}

interface GptDiscoveryService {
  loadCreators(
    accountId: string,
    query: string,
    offset: number,
  ): Promise<CreatorPage>;
  loadPublic(accountId: string): Promise<DiscoveryResponse>;
  loadWorkspace(input: {
    accountId: string;
    categories: readonly string[];
    continuation?: string;
    creatorIds: readonly string[];
    search: string;
  }): Promise<WorkspacePage>;
}

interface GptDiscoveryPageProps {
  account?: Account;
  creatorsSnapshot?: QuerySnapshot<CreatorPage>;
  gateEnabled?: boolean;
  location?: { pathname: string; search: string };
  navigate?: ReturnType<typeof useNavigate>;
  publicSnapshot?: QuerySnapshot<DiscoveryResponse>;
  service?: GptDiscoveryService;
  workspaceSnapshot?: WorkspaceSnapshot;
}

const categories = [
  "research",
  "writing",
  "programming",
  "education",
  "productivity",
  "lifestyle",
  "other",
] as const;

const defaultService: GptDiscoveryService = {
  async loadCreators(accountId, query, offset) {
    const parameters = new URLSearchParams({
      limit: "30",
      offset: String(offset),
    });
    if (query) parameters.set("query", query);
    return requestJson<CreatorPage>(
      `/accounts/${accountId}/users?${parameters}`,
    );
  },
  async loadPublic() {
    return requestJson<DiscoveryResponse>("/public-api/gizmos/discovery", {
      [attachAuthHeader]: "1",
    });
  },
  async loadWorkspace(input) {
    const parameters = new URLSearchParams({ limit: "10" });
    if (input.continuation)
      parameters.set("query_continuation", input.continuation);
    if (input.search) parameters.set("search", input.search);
    for (const category of input.categories)
      parameters.append("categories", category);
    for (const creatorId of input.creatorIds)
      parameters.append("user_ids", creatorId);
    return requestJson<WorkspacePage>(
      `/workspace-resources/${input.accountId}/gizmos?${parameters}`,
    );
  },
};

let React: ReactRuntime;
let jsx: JsxRuntime;

async function requestJson<Data>(
  url: string,
  headers?: Record<string, string>,
): Promise<Data> {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return (await response.json()) as Data;
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

function updateSearch(
  pathname: string,
  currentSearch: string,
  navigate: ReturnType<typeof useNavigate>,
  updates: Record<string, string | null>,
): void {
  const parameters = new URLSearchParams(currentSearch);
  for (const [key, value] of Object.entries(updates)) {
    if (value == null || value === "") parameters.delete(key);
    else parameters.set(key, value);
  }
  const search = parameters.toString();
  navigate(
    { hash: "", pathname, search: search ? `?${search}` : "" },
    { replace: true },
  );
}

function statusPanel(text: string, retry?: () => void): unknown {
  return jsx.jsxs("div", {
    className: "gpt-discovery-status",
    children: [
      jsx.jsx("p", { children: text }),
      retry == null
        ? null
        : jsx.jsx(Button, { children: "Retry", onClick: retry }),
    ],
  });
}

function GptCard(props: {
  gpt: GptItem;
  navigate: ReturnType<typeof useNavigate>;
}): unknown {
  const [open, setOpen] = React.useState(false);
  const title = props.gpt.display_name ?? props.gpt.name ?? "Untitled GPT";
  const creator = props.gpt.author?.display_name ?? props.gpt.author?.name;
  const description = [
    props.gpt.description,
    creator ? `By ${creator}` : null,
    props.gpt.conversation_count == null
      ? null
      : `${props.gpt.conversation_count.toLocaleString()} conversations`,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" · ");
  const startChat = (): void => {
    const destination = props.gpt.short_url?.trim() || props.gpt.id;
    setOpen(false);
    props.navigate(gptChatPath(destination));
  };
  return jsx.jsxs(React.Fragment, {
    children: [
      jsx.jsx(CardTile, {
        description,
        icon: props.gpt.profile_picture_url
          ? jsx.jsx("img", { alt: "", src: props.gpt.profile_picture_url })
          : null,
        onClick: () => setOpen(true),
        presentation: "catalog",
        title,
      }),
      open
        ? jsx.jsx(GptAboutDialog, {
            gizmo: props.gpt,
            onClose: () => setOpen(false),
            onOpenChange: setOpen,
            onStartChat: startChat,
            open,
          })
        : null,
    ],
  });
}

function PublicCatalog(props: {
  account: Account;
  navigate: ReturnType<typeof useNavigate>;
  search: string;
  service: GptDiscoveryService;
  snapshot?: QuerySnapshot<DiscoveryResponse>;
}): unknown {
  const [data, setData] = React.useState(props.snapshot?.data);
  const [loading, setLoading] = React.useState(
    props.snapshot?.loading ?? props.snapshot == null,
  );
  const [error, setError] = React.useState<string | null>(
    props.snapshot?.error ?? null,
  );
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    null,
  );
  const load = (): void => {
    setLoading(true);
    setError(null);
    props.service
      .loadPublic(props.account.id)
      .then(setData)
      .catch((reason: unknown) => setError(message(reason)))
      .finally(() => setLoading(false));
  };
  React.useEffect(() => {
    if (props.snapshot == null) load();
  }, [props.account.id, props.service, props.snapshot]);

  if (props.search.trim()) {
    return jsx.jsxs("section", {
      "data-testid": "public-search-results",
      children: [
        jsx.jsx("h2", {
          children: `Search results for “${props.search.trim()}”`,
        }),
        jsx.jsx("p", { children: "Search across public GPTs" }),
      ],
    });
  }
  if (loading) return jsx.jsx(LoadingGrid, { label: "Loading GPTs" });
  if (error) return statusPanel(error, load);

  const cuts = (data?.cuts ?? [])
    .map((cut) => ({
      ...cut,
      items: (cut.items ?? []).filter(
        (resource) => resource.gizmo?.gizmo_type !== "snorlax",
      ),
    }))
    .filter((cut) => cut.items.length > 0 || data?.list?.cursor != null);
  if (cuts.length === 0) return statusPanel("No GPTs available");
  const categoryTabs = [
    ...new Set(cuts.map((cut) => cut.display_group).filter(Boolean)),
  ] as string[];

  return jsx.jsxs("div", {
    children: [
      data?.workspace_filtered
        ? jsx.jsx("div", {
            role: "status",
            children: "Your workspace only allows approved third-party GPTs.",
          })
        : null,
      categoryTabs.length === 0
        ? null
        : jsx.jsx(Tabs, {
            ariaLabel: "GPT categories",
            onSelect: (key: string) => {
              setSelectedCategory(key);
              if (typeof document !== "undefined") {
                document
                  .getElementById(`gpt-category-${key}`)
                  ?.scrollIntoView({ behavior: "smooth" });
              }
            },
            selectedKey: selectedCategory ?? categoryTabs[0],
            tabs: categoryTabs.map((name) => ({ key: name, name })),
            variant: "browse",
          }),
      ...cuts.map((cut, index) =>
        jsx.jsxs(
          "section",
          {
            id: `gpt-category-${cut.display_group ?? index}`,
            children: [
              jsx.jsx("h2", {
                children: cut.name ?? cut.display_group ?? "Featured",
              }),
              jsx.jsx(SkillsGrid, {
                children: (cut.items ?? []).map((resource) =>
                  resource.gizmo == null
                    ? null
                    : jsx.jsx(
                        GptCard,
                        { gpt: resource.gizmo, navigate: props.navigate },
                        resource.gizmo.id,
                      ),
                ),
              }),
            ],
          },
          cut.name ?? String(index),
        ),
      ),
    ],
  });
}

function WorkspaceFilters(props: {
  accountId: string;
  categories: readonly string[];
  creators: readonly Creator[];
  creatorsSnapshot?: QuerySnapshot<CreatorPage>;
  onCategoriesChange(value: readonly string[]): void;
  onCreatorsChange(value: readonly Creator[]): void;
  service: GptDiscoveryService;
}): unknown {
  const [creatorMenuOpen, setCreatorMenuOpen] = React.useState(false);
  const [creatorSearch, setCreatorSearch] = React.useState("");
  const [creatorPage, setCreatorPage] = React.useState(
    props.creatorsSnapshot?.data,
  );
  const [creatorLoading, setCreatorLoading] = React.useState(
    props.creatorsSnapshot?.loading ?? false,
  );
  const [creatorError, setCreatorError] = React.useState<string | null>(
    props.creatorsSnapshot?.error ?? null,
  );
  const loadCreators = (offset = 0): void => {
    setCreatorLoading(true);
    setCreatorError(null);
    props.service
      .loadCreators(props.accountId, creatorSearch.trim(), offset)
      .then((page) =>
        setCreatorPage((current) => ({
          items:
            offset === 0
              ? page.items
              : [...(current?.items ?? []), ...(page.items ?? [])],
          total: page.total,
        })),
      )
      .catch((reason: unknown) => setCreatorError(message(reason)))
      .finally(() => setCreatorLoading(false));
  };
  React.useEffect(() => {
    if (creatorMenuOpen && props.creatorsSnapshot == null) loadCreators();
  }, [
    creatorMenuOpen,
    creatorSearch,
    props.accountId,
    props.creatorsSnapshot,
    props.service,
  ]);
  const toggleCategory = (category: string): void => {
    props.onCategoriesChange(
      props.categories.includes(category)
        ? props.categories.filter((value) => value !== category)
        : [...props.categories, category],
    );
  };
  const toggleCreator = (creator: Creator): void => {
    props.onCreatorsChange(
      props.creators.some(
        (value) => value.account_user_id === creator.account_user_id,
      )
        ? props.creators.filter(
            (value) => value.account_user_id !== creator.account_user_id,
          )
        : [...props.creators, creator],
    );
  };
  const creatorItems = creatorPage?.items ?? [];
  const canLoadMore =
    creatorPage?.total != null && creatorItems.length < creatorPage.total;
  return jsx.jsxs("aside", {
    "aria-label": "Workspace GPT filters",
    children: [
      jsx.jsx("strong", { children: "Categories" }),
      ...categories.map((category) =>
        jsx.jsxs(
          "label",
          {
            children: [
              jsx.jsx("input", {
                checked: props.categories.includes(category),
                onChange: () => toggleCategory(category),
                type: "checkbox",
              }),
              category,
            ],
          },
          category,
        ),
      ),
      jsx.jsx(Button, {
        children: "Creators",
        onClick: () => setCreatorMenuOpen((open) => !open),
      }),
      creatorMenuOpen
        ? jsx.jsxs("div", {
            children: [
              jsx.jsx("input", {
                "aria-label": "Search creators",
                onChange: (event: { target: { value: string } }) =>
                  setCreatorSearch(event.target.value),
                placeholder: "Search creators",
                value: creatorSearch,
              }),
              creatorLoading
                ? jsx.jsx(LoadingSpinner, { label: "Loading creators" })
                : null,
              creatorError
                ? statusPanel(creatorError, () => loadCreators())
                : null,
              !creatorLoading && !creatorError && creatorItems.length === 0
                ? jsx.jsx("p", { children: "No creators found" })
                : null,
              ...creatorItems.map((creator) =>
                jsx.jsxs(
                  "label",
                  {
                    children: [
                      jsx.jsx("input", {
                        checked: props.creators.some(
                          (value) =>
                            value.account_user_id === creator.account_user_id,
                        ),
                        onChange: () => toggleCreator(creator),
                        type: "checkbox",
                      }),
                      creator.name ?? creator.account_user_id,
                    ],
                  },
                  creator.account_user_id,
                ),
              ),
              canLoadMore
                ? jsx.jsx(Button, {
                    children: "Load more creators",
                    disabled: creatorLoading,
                    onClick: () => loadCreators(creatorItems.length),
                  })
                : null,
              props.creators.length > 0
                ? jsx.jsx(Button, {
                    children: "Clear creators",
                    onClick: () => props.onCreatorsChange([]),
                  })
                : null,
            ],
          })
        : null,
    ],
  });
}

function WorkspaceCatalog(props: {
  account: Account;
  creatorsSnapshot?: QuerySnapshot<CreatorPage>;
  navigate: ReturnType<typeof useNavigate>;
  search: string;
  service: GptDiscoveryService;
  snapshot?: WorkspaceSnapshot;
}): unknown {
  const [selectedCategories, setSelectedCategories] = React.useState<
    readonly string[]
  >([]);
  const [selectedCreators, setSelectedCreators] = React.useState<
    readonly Creator[]
  >([]);
  const [pages, setPages] = React.useState<readonly WorkspacePage[]>(
    props.snapshot?.pages ??
      (props.snapshot?.data == null ? [] : [props.snapshot.data]),
  );
  const [loading, setLoading] = React.useState(
    props.snapshot?.loading ?? props.snapshot == null,
  );
  const [error, setError] = React.useState<string | null>(
    props.snapshot?.error ?? null,
  );
  const creatorIds = selectedCreators.map((creator) => creator.account_user_id);
  const load = (continuation?: string): void => {
    setLoading(true);
    setError(null);
    props.service
      .loadWorkspace({
        accountId: props.account.id,
        categories: selectedCategories,
        continuation,
        creatorIds,
        search: props.search.trim(),
      })
      .then((page) =>
        setPages((current) => (continuation ? [...current, page] : [page])),
      )
      .catch((reason: unknown) => setError(message(reason)))
      .finally(() => setLoading(false));
  };
  React.useEffect(() => {
    if (props.snapshot == null) load();
  }, [
    props.account.id,
    props.search,
    props.service,
    selectedCategories.join(","),
    creatorIds.join(","),
  ]);
  const items = pages.flatMap((page) => page.gizmos ?? []);
  const continuation = pages.at(-1)?.query_continuation ?? undefined;
  return jsx.jsxs("div", {
    className: "workspace-gpt-catalog",
    children: [
      jsx.jsx(WorkspaceFilters, {
        accountId: props.account.id,
        categories: selectedCategories,
        creators: selectedCreators,
        creatorsSnapshot: props.creatorsSnapshot,
        onCategoriesChange: setSelectedCategories,
        onCreatorsChange: setSelectedCreators,
        service: props.service,
      }),
      loading && items.length === 0
        ? jsx.jsx(LoadingGrid, { label: "Loading workspace GPTs" })
        : null,
      error && items.length === 0 ? statusPanel(error, () => load()) : null,
      !loading && !error && items.length === 0
        ? statusPanel("No GPTs found")
        : null,
      items.length === 0
        ? null
        : jsx.jsx(SkillsGrid, {
            children: items.map((gpt) =>
              jsx.jsx(GptCard, { gpt, navigate: props.navigate }, gpt.id),
            ),
          }),
      error && items.length > 0
        ? statusPanel(error, () => load(continuation))
        : null,
      continuation
        ? jsx.jsx(Button, {
            children: loading ? "Loading more…" : "Load more",
            disabled: loading,
            onClick: () => load(continuation),
          })
        : null,
    ],
  });
}

function GptDiscoveryPage(props: GptDiscoveryPageProps = {}): unknown {
  const accountQuery = useAccount();
  const runtimeNavigate = useNavigate();
  const runtimeLocation = useLocation();
  const runtimeGateEnabled = useGate("2160578039");
  const account = props.account ?? accountQuery.data;
  const navigate = props.navigate ?? runtimeNavigate;
  const location = props.location ?? runtimeLocation;
  const service = props.service ?? defaultService;
  if (account == null) {
    return jsx.jsx("main", {
      children: jsx.jsx(LoadingSpinner, { label: "Loading GPTs" }),
    });
  }
  const workspaceAvailable =
    account.structure === "workspace" && account.plan_type !== "quorum";
  const parameters = new URLSearchParams(location.search);
  const search = parameters.get("search") ?? "";
  const view =
    workspaceAvailable && parameters.get("view") !== "public"
      ? "workspace"
      : "public";
  const setSearch = (value: string): void =>
    updateSearch(location.pathname, location.search, navigate, {
      search: value.trim() || null,
    });
  const openMyGpts = (): void => {
    if (props.gateEnabled ?? runtimeGateEnabled) navigate("/gpts/mine");
    else if (typeof globalThis.open === "function")
      globalThis.open(
        gptManagementUrl("/gpts/mine"),
        "_blank",
        "noopener,noreferrer",
      );
  };
  return jsx.jsxs("main", {
    className: "gpt-discovery-page",
    children: [
      jsx.jsxs("header", {
        children: [
          jsx.jsx("h1", { children: "Explore GPTs" }),
          jsx.jsx("p", { children: "Discover and use GPTs for your work." }),
          jsx.jsx("input", {
            "aria-label": "Search GPTs",
            id: "gpt-search",
            onChange: (event: { target: { value: string } }) =>
              setSearch(event.target.value),
            placeholder: "Search GPTs",
            value: search,
          }),
          jsx.jsx(Button, { children: "My GPTs", onClick: openMyGpts }),
          workspaceAvailable
            ? jsx.jsx(Tabs, {
                ariaLabel: "GPT directory",
                onSelect: (key: string) =>
                  updateSearch(location.pathname, location.search, navigate, {
                    view: key,
                  }),
                selectedKey: view,
                tabs: [
                  { key: "workspace", name: "Workspace" },
                  { key: "public", name: "Public" },
                ],
                variant: "segmented",
              })
            : null,
        ],
      }),
      view === "workspace"
        ? jsx.jsx(WorkspaceCatalog, {
            account,
            creatorsSnapshot: props.creatorsSnapshot,
            navigate,
            search,
            service,
            snapshot: props.workspaceSnapshot,
          })
        : jsx.jsx(PublicCatalog, {
            account,
            navigate,
            search,
            service,
            snapshot: props.publicSnapshot,
          }),
    ],
  });
}

initializeJsxRuntime();
initializeTabs();
initializeSkillsGrid();
initializeCardTile();
initializeGptAboutDialog();
initializeManagementUrl();
React = getReactRuntime();
jsx = getJsxRuntime();

export { GptDiscoveryPage };
