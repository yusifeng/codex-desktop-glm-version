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
  _un as currentUserIdSignal,
  d_n as useSearchParams,
  mun as currentHostIdSignal,
} from "@rchunk/app-initial";
import "@rchunk/app-primary";
import {
  n as initializePageLayout,
  t as PageLayout,
} from "@rchunk/page-layout";
import {
  n as initializeElicitationPanel,
  t as ElicitationRequestPanel,
  // @ts-ignore The recovered direct edge has no shared declaration yet.
} from "@rchunk/mcp-server-elicitation-request-panel";

type ResponseStatus =
  "accepted" | "declined" | "error" | "submitting" | "unavailable";

interface BrowserAuthField {
  autocomplete?: string | null;
  id: string;
  label: string;
  required?: boolean;
  type?: "email" | "password" | "text";
}

interface BrowserAuthOption {
  fieldIds: readonly string[];
  id: string;
  label: string;
}

interface BrowserAuthRequest {
  fields: readonly BrowserAuthField[];
  options?: readonly BrowserAuthOption[] | null;
  origin: string;
}

interface BrowserAuthElicitation {
  browserAuth: BrowserAuthRequest;
  challengeId: string;
  kind: "browserAuth";
}

interface ExistingElicitation {
  kind: string;
  [key: string]: unknown;
}

interface PendingElicitationRequest {
  elicitation: BrowserAuthElicitation | ExistingElicitation;
  requestId: string;
}

interface StandaloneElicitationService {
  connect?(input: {
    hostId: string;
    requestId: string;
    threadId: string;
  }): Promise<PendingElicitationRequest | null>;
  reply(input: {
    action: "accept" | "decline";
    hostId: string;
    requestId: string;
    threadId: string;
  }): Promise<void>;
  submitBrowserAuth(input: {
    challengeId: string;
    conversationId: string;
    fields: Record<string, { value: string }>;
    selectedOption?: string;
  }): Promise<"submitted" | "unavailable">;
}

interface StandaloneElicitationPageProps {
  connectionStatus?: "connecting" | "ready" | "unavailable";
  hostId?: string | null;
  pendingRequest?: PendingElicitationRequest | null;
  reload?: () => void;
  searchParams?: URLSearchParams;
  service?: StandaloneElicitationService;
  userId?: string | null;
}

const defaultService: StandaloneElicitationService = {
  async reply() {},
  async submitBrowserAuth(input) {
    const response = await fetch("/flora/browser/form-fill", {
      body: JSON.stringify({
        challenge_id: input.challengeId,
        conversation_id: input.conversationId,
        fields: input.fields,
        selected_option: input.selectedOption,
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    const payload = (await response.json()) as { status?: string };
    return payload.status === "submitted" ? "submitted" : "unavailable";
  },
};

let React: ReactRuntime;
let jsx: JsxRuntime;

function requestIdentifiers(parameters: URLSearchParams): {
  requestId: string;
  threadId: string;
} | null {
  const threadId = parameters.get("thread_id")?.trim() ?? "";
  const requestId = parameters.get("request_id")?.trim() ?? "";
  if (!threadId || !requestId || requestId.length > 512) return null;
  return { requestId, threadId };
}

function siteName(origin: string): string {
  try {
    return new URL(origin).hostname.replace(/^www\./, "");
  } catch {
    return origin;
  }
}

function PageFrame(props: {
  children?: unknown;
  presentation?: "existing" | "form";
}): unknown {
  if (props.presentation === "existing") {
    return jsx.jsx(PageLayout, {
      children: props.children,
      showFooter: false,
      title: "Continue your request",
    });
  }
  return jsx.jsx("div", {
    className: "standalone-elicitation-page",
    children: jsx.jsx("main", {
      "aria-label": "Continue your request",
      children: props.children,
    }),
  });
}

function RequestUnavailable(props: {
  connecting?: boolean;
  reload: () => void;
}): unknown {
  if (props.connecting) {
    return jsx.jsxs("div", {
      role: "status",
      children: [
        jsx.jsx(LoadingSpinner, {}),
        jsx.jsx("span", { children: "Connecting to your request…" }),
      ],
    });
  }
  return jsx.jsxs("div", {
    children: [
      jsx.jsx("p", {
        role: "status",
        children:
          "This request is no longer available. It may already be answered or cancelled.",
      }),
      jsx.jsx(Button, { children: "Check again", onClick: props.reload }),
    ],
  });
}

function BrowserAuthHeader(props: {
  browserAuth: BrowserAuthRequest;
  status?: "accepted" | "declined" | "pending";
}): unknown {
  const status = props.status ?? "pending";
  const site = siteName(props.browserAuth.origin);
  const title =
    status === "accepted"
      ? `Signing in to ${site}`
      : status === "declined"
        ? "Sign-in skipped"
        : `Sign in to ${site}`;
  return jsx.jsxs("header", {
    children: [
      jsx.jsx("div", { "aria-hidden": true, children: `ChatGPT ··· ${site}` }),
      jsx.jsx("h1", { children: title }),
      status === "pending"
        ? jsx.jsx("p", { children: props.browserAuth.origin })
        : jsx.jsx("p", { children: "You can return to your conversation" }),
    ],
  });
}

function BrowserAuthForm(props: {
  browserAuth: BrowserAuthRequest;
  challengeId: string;
  conversationId: string;
  disabled?: boolean;
  hostId: string;
  onResponse(status: ResponseStatus): void;
  requestId: string;
  service: StandaloneElicitationService;
}): unknown {
  const [selectedOption, setSelectedOption] = React.useState<string | null>(
    null,
  );
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [visiblePasswords, setVisiblePasswords] = React.useState<
    readonly string[]
  >([]);
  const [status, setStatus] = React.useState<"error" | "ready" | "submitting">(
    "ready",
  );
  const selected = props.browserAuth.options?.find(
    (option) => option.id === selectedOption,
  );
  const fields =
    props.browserAuth.options == null
      ? props.browserAuth.fields
      : selected == null
        ? []
        : props.browserAuth.fields.filter((field) =>
            selected.fieldIds.includes(field.id),
          );
  const valid =
    (props.browserAuth.options == null || selected != null) &&
    fields.every(
      (field) => !field.required || Boolean(values[field.id]?.trim()),
    );
  const clear = (): void => {
    setValues({});
    setVisiblePasswords([]);
    setStatus("ready");
  };
  const respond = async (action: "accept" | "decline"): Promise<void> => {
    setStatus("submitting");
    props.onResponse("submitting");
    try {
      await props.service.reply({
        action,
        hostId: props.hostId,
        requestId: props.requestId,
        threadId: props.conversationId,
      });
      props.onResponse(action === "accept" ? "accepted" : "declined");
    } catch {
      setStatus("error");
      props.onResponse("error");
    }
  };
  const submit = async (option?: BrowserAuthOption): Promise<void> => {
    const chosenOption = option ?? selected;
    const chosenFields =
      props.browserAuth.options == null
        ? fields
        : props.browserAuth.fields.filter((field) =>
            chosenOption?.fieldIds.includes(field.id),
          );
    const chosenValid =
      (props.browserAuth.options == null || chosenOption != null) &&
      chosenFields.every(
        (field) => !field.required || Boolean(values[field.id]?.trim()),
      );
    if (!chosenValid || props.disabled || status === "submitting") return;
    setStatus("submitting");
    props.onResponse("submitting");
    try {
      const result = await props.service.submitBrowserAuth({
        challengeId: props.challengeId,
        conversationId: props.conversationId,
        fields: Object.fromEntries(
          chosenFields
            .filter((field) => Boolean(values[field.id]))
            .map((field) => [field.id, { value: values[field.id] }]),
        ),
        selectedOption: chosenOption?.id,
      });
      if (result === "submitted") await respond("accept");
      else props.onResponse("unavailable");
    } catch {
      setStatus("error");
      props.onResponse("error");
    }
  };
  const chooseOption = (option: BrowserAuthOption): void => {
    clear();
    if (option.fieldIds.length === 0) {
      setSelectedOption(option.id);
      void submit(option);
    } else {
      setSelectedOption(option.id);
    }
  };
  return jsx.jsxs("form", {
    "data-dd-privacy": "mask",
    onSubmit: (event: { preventDefault(): void }) => {
      event.preventDefault();
      void submit();
    },
    children: [
      jsx.jsx(BrowserAuthHeader, { browserAuth: props.browserAuth }),
      selected == null && props.browserAuth.options != null
        ? jsx.jsx("div", {
            children: props.browserAuth.options.map((option) =>
              jsx.jsx(
                "button",
                {
                  children: option.label,
                  disabled: props.disabled || status === "submitting",
                  onClick: () => chooseOption(option),
                  type: "button",
                },
                option.id,
              ),
            ),
          })
        : null,
      selected == null
        ? null
        : jsx.jsx(Button, {
            children: "Change sign-in method",
            onClick: () => {
              clear();
              setSelectedOption(null);
            },
            type: "button",
          }),
      ...fields.map((field) => {
        const visible = visiblePasswords.includes(field.id);
        return jsx.jsxs(
          "label",
          {
            children: [
              jsx.jsx("span", { children: field.label }),
              jsx.jsx("input", {
                autoComplete: field.autocomplete ?? undefined,
                disabled: props.disabled || status === "submitting",
                name: field.id,
                onChange: (event: { target: { value: string } }) =>
                  setValues((current) => ({
                    ...current,
                    [field.id]: event.target.value,
                  })),
                required: field.required,
                type:
                  field.type === "password" && visible
                    ? "text"
                    : (field.type ?? "text"),
                value: values[field.id] ?? "",
              }),
              field.type === "password"
                ? jsx.jsx(Button, {
                    "aria-label": visible ? "Hide password" : "Show password",
                    children: visible ? "Hide" : "Show",
                    onClick: () =>
                      setVisiblePasswords((current) =>
                        current.includes(field.id)
                          ? current.filter((id) => id !== field.id)
                          : [...current, field.id],
                      ),
                    type: "button",
                  })
                : null,
            ],
          },
          field.id,
        );
      }),
      status === "error"
        ? jsx.jsx("p", {
            role: "alert",
            children: "Something went wrong. Please try again.",
          })
        : null,
      jsx.jsx("p", {
        children:
          "ChatGPT securely handles your credentials and keeps you signed in. Your password isn't stored.",
      }),
      jsx.jsx(Button, {
        children: "Sign in",
        disabled: props.disabled || !valid,
        loading: status === "submitting",
        type: "submit",
      }),
      jsx.jsx(Button, {
        children:
          props.browserAuth.options != null || selected != null
            ? "Cancel"
            : "Skip",
        disabled: status === "submitting",
        onClick: () => {
          clear();
          void respond("decline");
        },
        type: "button",
      }),
    ],
  });
}

function ActiveRequest(props: {
  hostId: string;
  pendingRequest: PendingElicitationRequest;
  service: StandaloneElicitationService;
  threadId: string;
}): unknown {
  const [response, setResponse] = React.useState<ResponseStatus | null>(null);
  const elicitation = props.pendingRequest.elicitation;
  if (elicitation.kind !== "browserAuth") {
    return jsx.jsx(PageFrame, {
      presentation: "existing",
      children: jsx.jsx(ElicitationRequestPanel, {
        conversationId: props.threadId,
        hostId: props.hostId,
        pendingRequest: props.pendingRequest,
      }),
    });
  }
  const browserAuth = elicitation as BrowserAuthElicitation;
  if (response === "accepted" || response === "declined") {
    return jsx.jsx(PageFrame, {
      children: jsx.jsx(BrowserAuthHeader, {
        browserAuth: browserAuth.browserAuth,
        status: response,
      }),
    });
  }
  if (response === "unavailable") {
    return jsx.jsx(PageFrame, {
      children: jsx.jsx(RequestUnavailable, {
        reload: () => location.reload(),
      }),
    });
  }
  return jsx.jsx(PageFrame, {
    children: jsx.jsx(BrowserAuthForm, {
      browserAuth: browserAuth.browserAuth,
      challengeId: browserAuth.challengeId,
      conversationId: props.threadId,
      hostId: props.hostId,
      onResponse: setResponse,
      requestId: props.pendingRequest.requestId,
      service: props.service,
    }),
  });
}

function StandaloneElicitationPage(
  props: StandaloneElicitationPageProps = {},
): unknown {
  const [runtimeSearchParams] = useSearchParams();
  const runtimeHostId = useSignalValue(currentHostIdSignal);
  const runtimeUserId = useSignalValue(currentUserIdSignal);
  const parameters = props.searchParams ?? runtimeSearchParams;
  const identifiers = requestIdentifiers(parameters);
  const hostId = "hostId" in props ? props.hostId : runtimeHostId;
  const userId = "userId" in props ? props.userId : runtimeUserId;
  const service = props.service ?? defaultService;
  const reload = props.reload ?? (() => location.reload());
  const [pendingRequest, setPendingRequest] = React.useState(
    props.pendingRequest ?? null,
  );
  const [connectionStatus, setConnectionStatus] = React.useState(
    props.connectionStatus ??
      (identifiers == null || hostId == null || userId == null
        ? "unavailable"
        : "connecting"),
  );
  React.useEffect(() => {
    if (
      identifiers == null ||
      hostId == null ||
      userId == null ||
      service.connect == null
    )
      return;
    setConnectionStatus("connecting");
    service
      .connect({ hostId, ...identifiers })
      .then((request) => {
        setPendingRequest(request);
        setConnectionStatus(request == null ? "unavailable" : "ready");
      })
      .catch(() => setConnectionStatus("unavailable"));
  }, [hostId, identifiers?.requestId, identifiers?.threadId, service, userId]);

  if (identifiers == null || hostId == null || userId == null) {
    return jsx.jsx(PageFrame, {
      children: jsx.jsx(RequestUnavailable, { reload }),
    });
  }
  if (connectionStatus === "connecting") {
    return jsx.jsx(PageFrame, {
      children: jsx.jsx(RequestUnavailable, { connecting: true, reload }),
    });
  }
  if (connectionStatus !== "ready" || pendingRequest == null) {
    return jsx.jsx(PageFrame, {
      children: jsx.jsx(RequestUnavailable, { reload }),
    });
  }
  return jsx.jsx(ActiveRequest, {
    hostId,
    pendingRequest,
    service,
    threadId: identifiers.threadId,
  });
}

initializeJsxRuntime();
initializePageLayout();
initializeElicitationPanel();
React = getReactRuntime();
jsx = getJsxRuntime();

export { StandaloneElicitationPage };
