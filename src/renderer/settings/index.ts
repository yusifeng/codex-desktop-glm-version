// settings —— ChatGPT parental-controls settings route and member detail composition.

import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import * as invitationsChunk from "@rchunk/invitations";
import * as legacyStudyHoursScheduleChunk from "@rchunk/legacy-study-hours-schedule";
import * as presentationChunk from "@rchunk/settings-parental-presentation";
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as settingsLoadingRowChunk from "@rchunk/settings-loading-row";

type IntlShape = import("@rchunk/app-shared").IntlShape;
type JsxRuntime = import("@rchunk/app-shared").JsxRuntime;
type ReactRuntime = import("@rchunk/app-shared").ReactRuntime;

type AccessStatus = "allowed" | "denied" | "error" | "loading";
type FamilyRole = "child" | "member_role" | "owner" | string;

interface AccessState {
  accountId?: string;
  status: AccessStatus;
  userId?: string;
}

interface QueryState<Data> {
  data?: Data;
  error?: unknown;
  isError: boolean;
  isFetching?: boolean;
  isPending: boolean;
  refetch(): Promise<unknown> | unknown;
}

interface QueryOptions<Data> {
  enabled?: boolean;
  queryFn?: unknown;
  queryKey: readonly unknown[];
  staleTime?: number;
}

interface FamilySummary {
  id?: string | null;
  role?: FamilyRole;
}

interface FamilyMember {
  account_identifier?: string | null;
  email?: string | null;
  name?: string | null;
  profile_picture_url?: string | null;
  role: FamilyRole;
  status: "accepted" | "invited" | string;
  user_id?: string | null;
}

interface MembersData {
  items: FamilyMember[];
}

interface SettingOption {
  description?: string;
  label: string;
  value: string;
}

interface LayoutItem {
  default_value?: string[];
  description?: string;
  id: string;
  kind?: "permission" | "setting";
  label: string;
  options?: SettingOption[];
  permission?: string;
  setting?: string;
  settings?: string[];
  target_page_id?: string;
  type?: "multi_select" | "navigation";
}

interface LayoutSection {
  id: string;
  items: LayoutItem[];
  label?: string;
}

interface LayoutPage {
  description?: string;
  heading?: string;
  id: string;
  sections: LayoutSection[];
}

interface MemberLayout {
  pages: LayoutPage[];
  root_page_id: string;
}

interface MemberSettings {
  permissions: string[];
  settings: Record<string, unknown>;
}

interface ParentalQueries {
  current: QueryOptions<FamilySummary>;
  layout: QueryOptions<MemberLayout>;
  members(familyId: string): QueryOptions<MembersData>;
  settings(familyId: string, memberId: string): QueryOptions<MemberSettings>;
}

interface SharedRuntime {
  $3(): void;
  HX<Value>(signal: unknown): Value;
  I3(): JsxRuntime;
  LX(scope: unknown): {
    queryClient: {
      invalidateQueries(options: {
        queryKey: readonly unknown[];
      }): Promise<unknown> | unknown;
    };
  };
  Y2(props: Record<string, unknown>): unknown;
  ZI: unknown;
  _L<Data>(options: QueryOptions<Data>): QueryState<Data>;
  e6: (() => ReactRuntime) & ReactRuntime;
  n4(): IntlShape;
}

interface InitialRuntime {
  Xl(): void;
  au(props: Record<string, unknown>): unknown;
  bL: unknown;
  d_n(): [
    URLSearchParams,
    (search: URLSearchParams, options?: { replace?: boolean }) => void,
  ];
  o_n(): (to: string) => void;
  su(): void;
}

interface PresentationRuntime {
  a(): void;
  d(userId: string, accountId: string, locale?: string): ParentalQueries;
  u(): void;
}

interface InvitationsRuntime {
  i(): void;
  m(): void;
  n(props: Record<string, unknown>): unknown;
}

interface LoadingRuntime {
  n(): void;
  t(props: { children?: unknown }): unknown;
}

const {
  $3: initializeRuntimeLazy,
  HX: useSignalValue,
  I3: getJsxRuntime,
  LX: useScope,
  Y2: FormattedMessage,
  ZI: AppScope,
  _L: useQuery,
  e6: getReactRuntime,
  n4: useIntl,
} = appSharedChunk as unknown as SharedRuntime;
const {
  Xl: initializeSettingsPage,
  au: SettingsPage,
  bL: accessSignal,
  d_n: useSearchParams,
  o_n: useNavigate,
  su: initializeSettingsRuntime,
} = appInitialChunk as unknown as InitialRuntime;
const {
  a: initializeParentalPresentation,
  d: createParentalQueries,
  u: initializeParentalQueries,
} = presentationChunk as unknown as PresentationRuntime;
const {
  i: initializeInvitationComponents,
  m: initializeInvitationRuntime,
  n: AddFamilyMemberDialog,
} = invitationsChunk as unknown as InvitationsRuntime;
const { r: initializeLegacySchedule } =
  legacyStudyHoursScheduleChunk as unknown as { r(): void };
const { n: initializeSettingsLoadingRow, t: SettingsLoadingRow } =
  settingsLoadingRowChunk as unknown as LoadingRuntime;

void runtimeChunk;

let React: ReactRuntime;
let jsx: JsxRuntime;

function message(id: string, defaultMessage: string): unknown {
  return jsx.jsx(FormattedMessage, { id, defaultMessage });
}

function RetryRow({
  refresh = false,
  onRetry,
}: {
  refresh?: boolean;
  onRetry(): void;
}): unknown {
  return jsx.jsxs("div", {
    className: "settings-row",
    children: [
      jsx.jsx("span", {
        role: "alert",
        children: refresh
          ? "Your family information couldn’t be refreshed"
          : "Your family information couldn’t be loaded",
      }),
      jsx.jsx("button", {
        type: "button",
        onClick: onRetry,
        children: "Retry",
      }),
    ],
  });
}

function AccessBoundary({ access }: { access: AccessState }): unknown {
  const scope = useScope(AppScope);
  if (access.status === "loading") {
    return jsx.jsx(SettingsLoadingRow, {
      children: "Loading parental controls…",
    });
  }
  if (access.status === "error") {
    return jsx.jsx(RetryRow, {
      onRetry: () =>
        void scope.queryClient.invalidateQueries({
          queryKey: ["accounts", "check"],
        }),
    });
  }
  return jsx.jsx("div", {
    className: "settings-row",
    children: message(
      "settings.chatGpt.parentalControls.personalAccountRequired",
      "Parental controls are available in your personal ChatGPT account",
    ),
  });
}

function memberLabel(member: FamilyMember, intl: IntlShape): string {
  return (
    member.name ??
    member.email ??
    member.account_identifier ??
    String(
      intl.formatMessage({
        id: "settingsModal.amphoraMemberFallback",
        defaultMessage: "Family member",
      }),
    )
  );
}

function MemberSettingsView({
  accountId,
  familyId,
  member,
  onBack,
  queries,
  userId,
}: {
  accountId: string;
  familyId: string;
  member: FamilyMember;
  onBack(): void;
  queries: ParentalQueries;
  userId: string;
}): unknown {
  const intl = useIntl();
  const [pageStack, setPageStack] = React.useState<string[]>([]);
  const layoutQuery = useQuery(queries.layout);
  const settingsQuery = useQuery(
    queries.settings(familyId, member.user_id ?? ""),
  );
  const layout = layoutQuery.data;
  const settings = settingsQuery.data;
  const goBack = (): void => {
    if (pageStack.length === 0) onBack();
    else setPageStack(pageStack.slice(0, -1));
  };

  if (
    (layoutQuery.isPending && layout == null) ||
    (settingsQuery.isPending && settings == null)
  ) {
    return jsx.jsx(SettingsLoadingRow, {
      children: "Loading family member settings…",
    });
  }
  if (layout == null || settings == null) {
    return jsx.jsxs(SettingsPage, {
      children: [
        jsx.jsx("button", {
          type: "button",
          onClick: goBack,
          children: "Back",
        }),
        jsx.jsx(RetryRow, {
          onRetry: () => {
            void layoutQuery.refetch();
            void settingsQuery.refetch();
          },
        }),
      ],
    });
  }

  const pageId = pageStack.at(-1) ?? layout.root_page_id;
  const page =
    layout.pages.find((candidate) => candidate.id === pageId) ??
    layout.pages[0];
  const self = member.user_id === userId;
  const readOnly = self && member.role === "child";
  const displayName = memberLabel(member, intl);

  return jsx.jsxs(SettingsPage, {
    children: [
      jsx.jsx("button", { type: "button", onClick: goBack, children: "Back" }),
      pageStack.length === 0
        ? jsx.jsxs("header", {
            children: [
              jsx.jsx("h1", { children: displayName }),
              jsx.jsx("p", {
                children: member.role === "child" ? "Child" : "Family member",
              }),
            ],
          })
        : null,
      readOnly
        ? jsx.jsx("p", {
            children:
              "Your parent or guardian can adjust these settings to help guide how you use ChatGPT and Sora.",
          })
        : null,
      page == null
        ? jsx.jsx("div", {
            role: "status",
            children: "No settings are available",
          })
        : jsx.jsxs("section", {
            "data-page-id": page.id,
            children: [
              page.heading == null
                ? null
                : jsx.jsx("h2", { children: page.heading }),
              page.description == null
                ? null
                : jsx.jsx("p", { children: page.description }),
              ...page.sections.map((section) =>
                jsx.jsxs(
                  "div",
                  {
                    "data-section-id": section.id,
                    children: [
                      section.label == null
                        ? null
                        : jsx.jsx("h3", { children: section.label }),
                      ...section.items.map((item) => {
                        if (
                          item.type === "navigation" &&
                          item.target_page_id != null
                        ) {
                          return jsx.jsx(
                            "button",
                            {
                              type: "button",
                              onClick: () =>
                                setPageStack([
                                  ...pageStack,
                                  item.target_page_id as string,
                                ]),
                              children: item.label,
                            },
                            item.id,
                          );
                        }
                        if (
                          item.type === "multi_select" &&
                          item.setting != null
                        ) {
                          const selected = Array.isArray(
                            settings.settings[item.setting],
                          )
                            ? (settings.settings[item.setting] as string[])
                            : (item.default_value ?? []);
                          return jsx.jsxs(
                            "label",
                            {
                              children: [
                                jsx.jsx("span", { children: item.label }),
                                jsx.jsx("select", {
                                  multiple: true,
                                  disabled: readOnly,
                                  value: selected,
                                  onChange: () => undefined,
                                  children: (item.options ?? []).map((option) =>
                                    jsx.jsx(
                                      "option",
                                      {
                                        value: option.value,
                                        children: option.label,
                                      },
                                      option.value,
                                    ),
                                  ),
                                }),
                              ],
                            },
                            item.id,
                          );
                        }
                        const keys =
                          item.kind === "permission"
                            ? [item.permission].filter(
                                (value): value is string => value != null,
                              )
                            : (item.settings ?? []);
                        const checked =
                          item.kind === "permission"
                            ? keys.some((key) =>
                                settings.permissions.includes(key),
                              )
                            : keys.some(
                                (key) => settings.settings[key] === true,
                              );
                        return jsx.jsxs(
                          "label",
                          {
                            children: [
                              jsx.jsxs("span", {
                                children: [
                                  jsx.jsx("strong", { children: item.label }),
                                  item.description == null
                                    ? null
                                    : jsx.jsx("small", {
                                        children: item.description,
                                      }),
                                ],
                              }),
                              jsx.jsx("input", {
                                type: "checkbox",
                                checked,
                                disabled: readOnly || keys.length === 0,
                                onChange: () => undefined,
                              }),
                            ],
                          },
                          item.id,
                        );
                      }),
                    ],
                  },
                  section.id,
                ),
              ),
              layoutQuery.isError || settingsQuery.isError
                ? jsx.jsx(RetryRow, {
                    refresh: true,
                    onRetry: () => {
                      void layoutQuery.refetch();
                      void settingsQuery.refetch();
                    },
                  })
                : null,
            ],
          }),
      jsx.jsx("span", { hidden: true, children: accountId }),
    ],
  });
}

function FamilyOverview({
  access,
  family,
  queries,
}: {
  access: Required<Pick<AccessState, "accountId" | "userId">>;
  family: FamilySummary;
  queries: ParentalQueries;
}): unknown {
  const intl = useIntl();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [addOpen, setAddOpen] = React.useState(false);
  const familyId = family.id ?? null;
  const membersQuery = useQuery(
    familyId == null
      ? {
          queryKey: [
            "chatgpt-parental-controls",
            access.userId,
            access.accountId,
            "members-disabled",
          ],
          enabled: false,
        }
      : queries.members(familyId),
  );

  if (familyId != null && membersQuery.isPending && membersQuery.data == null) {
    return jsx.jsx(SettingsLoadingRow, { children: "Loading family members…" });
  }
  if (familyId != null && membersQuery.data == null) {
    return jsx.jsx(RetryRow, { onRetry: () => void membersQuery.refetch() });
  }

  const members = membersQuery.data?.items ?? [];
  const memberId = searchParams.get("member");
  const selectedMember =
    memberId == null
      ? null
      : (members.find(
          (member) =>
            member.status !== "invited" && member.user_id === memberId,
        ) ?? null);
  const clearMember = (): void => {
    const next = new URLSearchParams(searchParams);
    next.delete("member");
    setSearchParams(next, { replace: true });
  };

  if (memberId != null && selectedMember == null) {
    return jsx.jsxs(SettingsPage, {
      children: [
        jsx.jsx("button", {
          type: "button",
          onClick: clearMember,
          children: "Back",
        }),
        jsx.jsx("div", {
          role: "alert",
          children: "This family member is no longer available",
        }),
      ],
    });
  }
  if (selectedMember != null && familyId != null) {
    return jsx.jsx(MemberSettingsView, {
      accountId: access.accountId,
      familyId,
      member: selectedMember,
      onBack: clearMember,
      queries,
      userId: access.userId,
    });
  }

  const sortedMembers = members.toSorted(
    (left, right) =>
      Number(left.status === "invited") - Number(right.status === "invited"),
  );
  const owner = family.role === "owner";
  const restrictedMember =
    family.role === "member_role" || family.role === "child";
  const onlySelf =
    family.role === "member_role" &&
    members.every((member) => member.user_id === access.userId);
  const canAdd = !restrictedMember || onlySelf;

  return jsx.jsxs(SettingsPage, {
    children: [
      jsx.jsx("h1", { children: "Parental controls" }),
      jsx.jsx("p", {
        children:
          "Parents and teens can link accounts, giving parents tools to adjust certain features, set limits, and add safeguards that work for their family.",
      }),
      sortedMembers.length === 0
        ? null
        : jsx.jsxs("section", {
            children: [
              jsx.jsx("h2", { children: "Family members" }),
              ...sortedMembers.map((member) => {
                const label = memberLabel(member, intl);
                return jsx.jsxs(
                  "button",
                  {
                    type: "button",
                    disabled: member.status === "invited",
                    onClick: () => {
                      if (member.user_id == null || member.status === "invited")
                        return;
                      const next = new URLSearchParams(searchParams);
                      next.set("member", member.user_id);
                      setSearchParams(next);
                    },
                    children: [
                      jsx.jsx("span", { children: label }),
                      member.status === "invited"
                        ? jsx.jsx("small", { children: "Invitation sent" })
                        : null,
                      member.role === "owner"
                        ? jsx.jsx("small", { children: "Owner" })
                        : null,
                    ],
                  },
                  member.user_id ??
                    member.email ??
                    member.account_identifier ??
                    label,
                );
              }),
            ],
          }),
      canAdd
        ? jsx.jsx("button", {
            type: "button",
            onClick: () => setAddOpen(true),
            children: owner ? "Add child" : "Add family member",
          })
        : null,
      owner
        ? jsx.jsxs("section", {
            children: [
              jsx.jsx("h2", { children: "Safety notifications" }),
              jsx.jsx("p", {
                children:
                  "We care about your teen's safety. If we detect certain serious safety concerns, we will notify you—though no system is perfect.",
              }),
              jsx.jsx("button", {
                type: "button",
                onClick: () => navigate("/settings/notifications"),
                children: "Manage notifications",
              }),
            ],
          })
        : null,
      addOpen
        ? jsx.jsx(AddFamilyMemberDialog, {
            account: { accountId: access.accountId, userId: access.userId },
            amphoraId: familyId,
            forceParent: onlySelf,
            forceTeen: owner,
            onClose: () => setAddOpen(false),
          })
        : null,
      familyId != null && membersQuery.isError
        ? jsx.jsx(RetryRow, {
            refresh: true,
            onRetry: () => void membersQuery.refetch(),
          })
        : null,
    ],
  });
}

function AllowedParentalControlsSettings({
  access,
}: {
  access: Required<Pick<AccessState, "accountId" | "userId">>;
}): unknown {
  const queries = createParentalQueries(access.userId, access.accountId);
  const currentQuery = useQuery(queries.current);
  if (currentQuery.isPending && currentQuery.data == null) {
    return jsx.jsx(SettingsLoadingRow, {
      children: "Loading parental controls…",
    });
  }
  if (currentQuery.data == null) {
    return jsx.jsx(RetryRow, { onRetry: () => void currentQuery.refetch() });
  }
  return jsx.jsxs(jsx.Fragment, {
    children: [
      currentQuery.isError
        ? jsx.jsx(RetryRow, {
            refresh: true,
            onRetry: () => void currentQuery.refetch(),
          })
        : null,
      jsx.jsx(FamilyOverview, {
        access,
        family: currentQuery.data,
        queries,
      }),
    ],
  });
}

function ChatGptParentalControlsSettings(): unknown {
  const access = useSignalValue<AccessState>(accessSignal);
  return access.status !== "allowed" ||
    access.accountId == null ||
    access.userId == null
    ? jsx.jsx(AccessBoundary, { access })
    : jsx.jsx(AllowedParentalControlsSettings, {
        access: { accountId: access.accountId, userId: access.userId },
      });
}

let initialized = false;
function initializeSettings(): void {
  if (initialized) return;
  initializeRuntimeLazy();
  initializeSettingsPage();
  initializeSettingsRuntime();
  initializeSettingsLoadingRow();
  initializeParentalPresentation();
  initializeParentalQueries();
  initializeLegacySchedule();
  initializeInvitationComponents();
  initializeInvitationRuntime();
  React = getReactRuntime();
  jsx = getJsxRuntime();
  initialized = true;
}

initializeSettings();
export { ChatGptParentalControlsSettings as n, initializeSettings as t };
