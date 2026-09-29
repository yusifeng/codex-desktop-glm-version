import "@rchunk/rolldown-runtime";
import {
  $3 as initializeJsxRuntime,
  I3 as getJsxRuntime,
  Qh as LoadingSpinner,
  Yh as Button,
  _L as useQuery,
  e6 as getReactRuntime,
  gL as initializeQueryRuntime,
  iL as useMutation,
  rL as initializeMutationRuntime,
  type JsxRuntime,
  type ReactRuntime,
} from "@rchunk/app-shared";
import {
  cJt as initializeApiClient,
  i_n as useLocation,
  o_n as useNavigate,
  rJt as apiClient,
} from "@rchunk/app-initial";
import {
  n as initializeTrustedContactHero,
  t as TrustedContactHero,
} from "@rchunk/trusted-contact-hero";

type LinkMode = "decline" | "nominee" | "remove";
type LinkView =
  | "accept"
  | "accepted"
  | "decline"
  | "declined"
  | "error"
  | "loading"
  | "removed";

interface TrustedContactLinkPageProps {
  country?: string | null;
  mode: LinkMode;
}

interface NomineeDetails {
  account_id?: string | null;
  deadline_timestamp?: number | null;
  name?: string | null;
}

type LinkLoadResult =
  | ({ status: "ready" } & NomineeDetails)
  | { name?: string | null; status: "removed" }
  | { invalidLink: boolean; status: "error" };

type LinkMutationResult =
  | { ownerName?: string | null; status: "success" }
  | { invalidLink: boolean; status: "error" };

interface StatusError {
  status?: number;
}

let React: ReactRuntime;
let jsx: JsxRuntime;

const HELP_CENTER_URL = "https://help.openai.com/articles/20001105";

function invalidLinkError(error: unknown, removal: boolean): boolean {
  if (typeof error !== "object" || error == null) return false;
  const status = (error as StatusError).status;
  return status === 400 || status === 404 || (!removal && status === 410);
}

function formatDeadline(timestamp: number | null | undefined): string | null {
  if (timestamp == null) return null;
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(timestamp * 1000));
}

function TrustedContactDialog({
  accountIdentifier,
  deadline,
  invalidLink,
  korea,
  onAccept,
  onClose,
  onDecline,
  onGoBack,
  ownerName,
  pending,
  removal,
  view,
}: {
  accountIdentifier?: string | null;
  deadline?: number | null;
  invalidLink?: boolean;
  korea: boolean;
  onAccept(): void;
  onClose(): void;
  onDecline(): void;
  onGoBack(): void;
  ownerName?: string | null;
  pending: boolean;
  removal: boolean;
  view: LinkView;
}): unknown {
  const inviterName = ownerName?.trim() || "Someone";
  const deadlineLabel = formatDeadline(deadline);
  const title: Record<LinkView, string> = {
    accept: `${inviterName} wants to add you as a trusted contact`,
    accepted: "Thanks for confirming",
    decline: "Are you sure you want to decline?",
    declined: "You've declined",
    error: removal
      ? "We couldn't remove you as a trusted contact"
      : "We couldn't complete that request",
    loading: removal ? "Removing trusted contact..." : "Loading invitation",
    removed: "You've been removed as a trusted contact",
  };
  const submit = (event: { preventDefault(): void }): void => {
    event.preventDefault();
    if (pending) return;
    if (view === "accept") onAccept();
    else if (view === "decline") onDecline();
    else if (view !== "loading") onClose();
  };

  return jsx.jsx("div", {
    role: "dialog",
    "aria-label": title[view],
    children: jsx.jsxs("form", {
      onSubmit: submit,
      children: [
        view === "accept" ? jsx.jsx(TrustedContactHero, {}) : null,
        jsx.jsx("h1", { children: title[view] }),
        view === "loading"
          ? jsx.jsxs("div", {
              role: "status",
              children: [
                jsx.jsx(LoadingSpinner, {}),
                removal
                  ? "One moment while we update this trusted contact."
                  : "Getting your trusted contact invitation details.",
              ],
            })
          : null,
        view === "accept"
          ? jsx.jsxs(React.Fragment, {
              children: [
                accountIdentifier
                  ? jsx.jsx("p", { children: accountIdentifier })
                  : null,
                jsx.jsx("p", {
                  children: deadlineLabel
                    ? `Choose whether to participate by ${deadlineLabel}.`
                    : "Choose whether to participate.",
                }),
                jsx.jsx("p", {
                  children:
                    "Having a trusted contact can make it easier for someone to connect with a friend, family member, or trusted adult if they ever discuss suicide in a way that indicates a serious safety risk.",
                }),
                jsx.jsx("p", {
                  children: `This can be a meaningful step toward having support in place, in case ${inviterName} ever needs it.`,
                }),
                jsx.jsxs("details", {
                  children: [
                    jsx.jsx("summary", { children: "What to expect" }),
                    jsx.jsxs("ul", {
                      children: [
                        jsx.jsx("li", {
                          children: `We may notify you if ${inviterName} discusses suicide in a way that indicates a serious safety concern.`,
                        }),
                        jsx.jsx("li", {
                          children:
                            "We won't share chat details or transcripts.",
                        }),
                        jsx.jsx("li", {
                          children:
                            "Your role is to check in, listen, and help them find additional support if needed.",
                        }),
                      ],
                    }),
                  ],
                }),
                jsx.jsxs("details", {
                  children: [
                    jsx.jsx("summary", {
                      children: "Choose whether to participate",
                    }),
                    jsx.jsx("p", {
                      children: korea
                        ? "You and the person who invited you must be 19 or older to participate."
                        : "You must be 18 or older to be a trusted contact.",
                    }),
                    jsx.jsx("button", {
                      type: "button",
                      disabled: pending,
                      onClick: onDecline,
                      children: "Decline",
                    }),
                    jsx.jsx("a", {
                      href: HELP_CENTER_URL,
                      target: "_blank",
                      rel: "noreferrer",
                      children: "Help Center",
                    }),
                  ],
                }),
              ],
            })
          : null,
        view === "decline"
          ? jsx.jsx("p", {
              children: `${inviterName} won't be able to invite you as a trusted contact again, but they can add someone else.`,
            })
          : null,
        view === "accepted"
          ? jsx.jsx("p", {
              children: `You've been added as a trusted contact for ${inviterName}.`,
            })
          : null,
        view === "declined"
          ? jsx.jsx("p", {
              children: `You won’t be added as ${inviterName}’s trusted contact.`,
            })
          : null,
        view === "removed"
          ? jsx.jsx("p", {
              children: ownerName?.trim()
                ? `We'll let ${ownerName.trim()} know.`
                : "We'll let them know.",
            })
          : null,
        view === "error"
          ? jsx.jsx("p", {
              role: "alert",
              children: invalidLink
                ? removal
                  ? "This removal link is invalid or has expired."
                  : "This link is invalid or has expired."
                : removal
                  ? "We couldn't complete that request. Please try again."
                  : "Please try again.",
            })
          : null,
        view === "accept"
          ? jsx.jsxs(React.Fragment, {
              children: [
                jsx.jsx(Button, {
                  type: "button",
                  disabled: pending,
                  onClick: onClose,
                  children: "Close",
                }),
                jsx.jsx(Button, {
                  type: "submit",
                  disabled: pending,
                  loading: pending,
                  children: "Accept",
                }),
              ],
            })
          : view === "decline"
            ? jsx.jsxs(React.Fragment, {
                children: [
                  jsx.jsx(Button, {
                    type: "submit",
                    color: "danger",
                    disabled: pending,
                    loading: pending,
                    children: "Decline",
                  }),
                  jsx.jsx(Button, {
                    type: "button",
                    disabled: pending,
                    onClick: onGoBack,
                    children: "Go back",
                  }),
                ],
              })
            : view === "loading"
              ? null
              : jsx.jsx(Button, { type: "submit", children: "Close" }),
      ],
    }),
  });
}

function TrustedContactLinkPage({
  country,
  mode,
}: TrustedContactLinkPageProps): unknown {
  const location = useLocation();
  const navigate = useNavigate();
  const search = new URLSearchParams(location.search);
  const token = search.get("token");
  const entryPoint =
    search.get("entry_point") ??
    (mode === "decline" ? "public_decline_link" : "public_accept_link");
  const removal = mode === "remove";
  const loadQuery = useQuery<LinkLoadResult>({
    queryKey: [
      "trusted-contact-public-link",
      removal ? "remove" : "nominee",
      token,
    ],
    enabled: token != null && token.length > 0,
    retry: false,
    staleTime: removal ? Infinity : 0,
    gcTime: removal ? Infinity : 300_000,
    queryFn: async () => {
      if (!token) return { status: "error", invalidLink: true };
      try {
        if (removal) {
          const response = await apiClient.safePost<{
            user_name?: string | null;
          }>("/trusted_contact/removal", {
            requestBody: { token, trusted_contact_id: token },
          });
          return { status: "removed", name: response.user_name ?? null };
        }
        const details = await apiClient.safeGet<NomineeDetails>(
          "/trusted_contact/nominee",
          { parameters: { query: { token } } },
        );
        return { status: "ready", ...details };
      } catch (error) {
        return {
          status: "error",
          invalidLink: invalidLinkError(error, removal),
        };
      }
    },
  });
  const action = useMutation<LinkMutationResult>({
    retry: false,
    mutationFn: async () => {
      if (!token) return { status: "error", invalidLink: true };
      try {
        await apiClient.safePost(
          mode === "nominee"
            ? "/trusted_contact/accept"
            : "/trusted_contact/removal",
          { requestBody: { token, trusted_contact_id: token } },
        );
        return {
          status: "success",
          ownerName:
            loadQuery.data?.status === "ready"
              ? (loadQuery.data.name ?? null)
              : null,
        };
      } catch (error) {
        return {
          status: "error",
          invalidLink: invalidLinkError(error, false),
        };
      }
    },
  });

  const invalidWithoutToken = token == null || token.length === 0;
  const queryError = loadQuery.data?.status === "error" ? loadQuery.data : null;
  const mutationError = action.data?.status === "error" ? action.data : null;
  const error = invalidWithoutToken
    ? { status: "error" as const, invalidLink: true }
    : (mutationError ?? queryError);
  let view: LinkView = mode === "nominee" ? "accept" : "decline";
  if (error != null) view = "error";
  else if (action.data?.status === "success")
    view = mode === "nominee" ? "accepted" : "declined";
  else if (loadQuery.isPending) view = "loading";
  else if (loadQuery.data?.status === "removed") view = "removed";

  const details = loadQuery.data?.status === "ready" ? loadQuery.data : null;
  const ownerName =
    action.data?.status === "success"
      ? action.data.ownerName
      : loadQuery.data?.status === "ready" ||
          loadQuery.data?.status === "removed"
        ? loadQuery.data.name
        : null;
  const navigateMode = (nextMode: "decline" | "nominee"): void => {
    navigate(
      `/trusted-contact/${nextMode}?${new URLSearchParams({
        token: token ?? "",
        entry_point: entryPoint,
      })}`,
    );
  };

  return jsx.jsx(TrustedContactDialog, {
    view,
    ownerName,
    accountIdentifier: details?.account_id,
    deadline: details?.deadline_timestamp,
    invalidLink: error?.invalidLink,
    removal,
    pending: action.isPending,
    korea: country?.trim().toUpperCase() === "KR",
    onClose: () => navigate("/", { replace: true }),
    onAccept: () => action.mutate(),
    onDecline:
      mode === "nominee"
        ? () => navigateMode("decline")
        : () => action.mutate(),
    onGoBack: () => navigateMode("nominee"),
  });
}

function initializeTrustedContactLinkPage(): void {
  initializeJsxRuntime();
  initializeQueryRuntime();
  initializeMutationRuntime();
  initializeApiClient();
  initializeTrustedContactHero();
  React = getReactRuntime();
  jsx = getJsxRuntime();
}

initializeTrustedContactLinkPage();

export { TrustedContactLinkPage };
