// appgen-change-slug-dialog —— 修改 Site 托管 URL 名称的校验与提交弹窗。
// 原版：app/webview/assets/appgen-change-slug-dialog-547ba9f25982.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";

void runtimeChunk;

type SlugStatusState =
  | "available"
  | "checking"
  | "error"
  | "invalid-format"
  | "requirements"
  | "unavailable"
  | null;

interface ReactRuntime {
  useState<Value>(
    initialValue: Value,
  ): [Value, (value: Value | ((current: Value) => Value)) => void];
}

interface JsxRuntime {
  jsx(component: unknown, props: Record<string, unknown>): unknown;
  jsxs(component: unknown, props: Record<string, unknown>): unknown;
}

interface SlugAvailability extends Record<string, unknown> {
  available: boolean;
  slug: string;
}

interface AppgenChangeSlugDialogProps {
  currentSlug: string;
  hostedDomainSuffix?: string | null;
  onClose(): void;
  projectId: string;
}

interface SlugInputProps {
  describedBy: string;
  disabled: boolean;
  hasValidationError: boolean;
  hostedDomainSuffix?: string | null;
  label: string;
  onChange(value: string): void;
  value: string;
}

interface SlugStatusProps {
  onRetry(): void;
  state: SlugStatusState;
}

interface FormSubmitEvent {
  preventDefault(): void;
}

interface TextInputChangeEvent {
  target: { value: string };
}

interface PlainIntl {
  formatMessage(
    descriptor: import("@rchunk/app-shared").MessageDescriptor,
  ): string;
}

const {
  $3: initializeRuntimeLazy,
  I3: jsxRuntimeFactory,
  e6: reactRuntimeFactory,
  lk: initializeSlugDialogAssets,
} = appSharedChunk as unknown as {
  $3(): void;
  I3(): JsxRuntime;
  e6(): ReactRuntime;
  lk(): void;
};
const {
  Ah: DialogHeader,
  BX: useScopedMutation,
  FX: initializeMaitaiRuntime,
  G2: defineMessages,
  Ih: Dialog,
  K2: initializeMessageRuntime,
  Lh: DialogDescription,
  LX: useScope,
  Oh: DialogBody,
  Ph: initializeDialogLayout,
  QI: initializeAppScope,
  Rh: DialogTitle,
  Y2: FormattedMessage,
  Yh: Button,
  ZI: appScopeRoot,
  Zh: initializeButton,
  _L: useQuery,
  gL: initializeUseQuery,
  h4: initializeIntlHook,
  jh: DialogSection,
  kh: DialogFooter,
  m4: classNames,
  n4: useIntl,
  pk: toastManagerSignal,
  zh: initializeDialog,
} = appSharedChunk;
const {
  Cht: useDebouncedValue,
  Sht: initializeDebouncedValue,
  Xin: appgenSlugAvailabilityQueryKey,
  _an: initializeAppgenQueries,
  ean: changeSlugMutation,
  pan: checkSlugAvailability,
} = appInitialChunk as unknown as {
  Cht(value: string, delay: number): string;
  Sht(): void;
  Xin: readonly unknown[];
  _an(): void;
  ean: import("@rchunk/app-shared").ScopedMutationFamily<
    unknown,
    string,
    unknown,
    Error,
    string,
    unknown
  >;
  pan(projectId: string, slug: string): Promise<SlugAvailability>;
};

let React: ReactRuntime;
let jsx: JsxRuntime;
let SLUG_PATTERN: RegExp;
let DOMAIN_DESCRIPTION_ID: string;
let STATUS_DESCRIPTION_ID: string;
let STATUS_MESSAGES: Record<
  Exclude<SlugStatusState, null>,
  import("@rchunk/app-shared").MessageDescriptor
>;

function AppgenChangeSlugDialog({
  currentSlug,
  hostedDomainSuffix,
  onClose,
  projectId,
}: AppgenChangeSlugDialogProps): unknown {
  const scope = useScope(appScopeRoot);
  const intl = useIntl() as PlainIntl;
  const mutation = useScopedMutation(changeSlugMutation, projectId);
  const [inputValue, setInputValue] = React.useState(currentSlug);
  const normalizedSlug = inputValue.trim().toLowerCase();
  const debouncedSlug = useDebouncedValue(normalizedSlug, 400);
  const unchanged = normalizedSlug === currentSlug;
  const invalidFormat =
    normalizedSlug.length > 0 && !SLUG_PATTERN.test(normalizedSlug);
  const validChangedSlug = !unchanged && SLUG_PATTERN.test(normalizedSlug);
  const queryKey = [
    ...appgenSlugAvailabilityQueryKey,
    projectId,
    debouncedSlug,
  ];
  const queryFn = () => checkSlugAvailability(projectId, debouncedSlug);
  const queryEnabled = validChangedSlug && debouncedSlug === normalizedSlug;
  const availabilityQuery = useQuery<SlugAvailability>({
    queryKey,
    queryFn,
    enabled: queryEnabled,
    retry: false,
    staleTime: 0,
  });
  const { data, isError, isFetching, refetch } = availabilityQuery;
  const currentResult =
    validChangedSlug &&
    debouncedSlug === normalizedSlug &&
    !isFetching &&
    !isError &&
    data?.slug === normalizedSlug
      ? data
      : undefined;
  const available = currentResult?.available === true;
  const unavailable = currentResult?.available === false;
  const hasValidationError = invalidFormat || unavailable;

  let status: SlugStatusState = "requirements";
  if (unchanged) status = null;
  else if (invalidFormat) status = "invalid-format";
  else if (validChangedSlug && (debouncedSlug !== normalizedSlug || isFetching))
    status = "checking";
  else if (validChangedSlug && isError) status = "error";
  else if (available) status = "available";
  else if (unavailable) status = "unavailable";

  const describedBy = [
    hostedDomainSuffix == null ? null : DOMAIN_DESCRIPTION_ID,
    status == null ? null : STATUS_DESCRIPTION_ID,
  ]
    .filter(isPresent)
    .join(" ");
  const onOpenChange = (open: boolean) => {
    if (!open && !mutation.isPending) onClose();
  };
  const onSubmit = (event: FormSubmitEvent) => {
    event.preventDefault();
    if (available && !mutation.isPending) {
      mutation.mutateAsync(normalizedSlug).then(
        () => onClose(),
        () => {
          scope.get(toastManagerSignal).danger(
            intl.formatMessage({
              id: "appgenSettings.general.url.changeDialog.submitError",
              defaultMessage: "Unable to change site URL",
              description:
                "Error toast shown when a request to change a Site's hosted URL fails",
            }),
            { errorAnalytics: { toastId: "sites_settings_slug_save_error" } },
          );
        },
      );
    }
  };

  const title = jsx.jsx(DialogTitle, {
    children: jsx.jsx(FormattedMessage, {
      id: "appgenSettings.general.url.changeDialog.title",
      defaultMessage: "Change URL",
      description: "Title of the dialog for changing a Site's hosted URL",
    }),
  });
  const header = jsx.jsx(DialogHeader, {
    title,
    subtitle: jsx.jsx(DialogDescription, {
      children: jsx.jsx(FormattedMessage, {
        id: "appgenSettings.general.url.changeDialog.description",
        defaultMessage: "Enter a new web address for your site",
        description:
          "Short explanation in the dialog for changing a Site's hosted URL",
      }),
    }),
  });
  const inputLabel = intl.formatMessage({
    id: "appgenSettings.general.url.changeDialog.inputLabel",
    defaultMessage: "Site URL name",
    description: "Label for the editable portion of a Site's hosted URL",
  });
  const field = jsx.jsx(SlugInput, {
    describedBy,
    disabled: mutation.isPending,
    hasValidationError,
    hostedDomainSuffix,
    label: inputLabel,
    value: inputValue,
    onChange: setInputValue,
  });
  const statusMessage = jsx.jsx(SlugStatus, {
    state: status,
    onRetry: () => void refetch(),
  });
  const content = jsx.jsxs(DialogSection, {
    className: "gap-2",
    children: [field, statusMessage],
  });
  const cancel = jsx.jsx(Button, {
    color: "ghostSecondary",
    disabled: mutation.isPending,
    onClick: onClose,
    children: jsx.jsx(FormattedMessage, {
      id: "appgenSettings.general.url.changeDialog.cancel",
      defaultMessage: "Cancel",
      description:
        "Button that closes the Site URL change dialog without saving",
    }),
  });
  const submit = jsx.jsx(Button, {
    disabled: !available,
    loading: mutation.isPending,
    type: "submit",
    children: jsx.jsx(FormattedMessage, {
      id: "appgenSettings.general.url.changeDialog.submit",
      defaultMessage: "Change URL",
      description: "Button that submits a new hosted URL name for a Site",
    }),
  });
  const footer = jsx.jsxs(DialogFooter, {
    className: "mt-10",
    children: [cancel, submit],
  });
  const form = jsx.jsxs(DialogBody, {
    as: "form",
    className: "gap-0 px-4 pt-3.5 pb-4",
    onSubmit,
    children: [header, content, footer],
  });

  return jsx.jsx(Dialog, {
    open: true,
    size: "compact",
    shouldIgnoreClickOutside: mutation.isPending,
    showDialogClose: !mutation.isPending,
    onOpenChange,
    children: form,
  });
}

function isPresent<Value>(value: Value | null | undefined): value is Value {
  return value != null;
}

function SlugInput({
  describedBy,
  disabled,
  hasValidationError,
  hostedDomainSuffix,
  label,
  onChange,
  value,
}: SlugInputProps): unknown {
  const className = classNames(
    "flex h-9 w-full min-w-0 items-center overflow-hidden rounded-md border border-primary-outline bg-primary-soft text-sm text-default",
    !hasValidationError && "focus-within:border-chart-blue",
    hasValidationError && "border-text-danger ring-2 ring-text-danger/20",
    disabled && "cursor-not-allowed bg-text/5 text-secondary",
  );
  const input = jsx.jsx("input", {
    autoComplete: "off",
    autoFocus: true,
    "aria-describedby": describedBy || undefined,
    "aria-invalid": hasValidationError || undefined,
    "aria-label": label,
    className:
      "h-full min-w-0 flex-1 bg-transparent ps-2.5 outline-none disabled:cursor-not-allowed disabled:text-secondary",
    disabled,
    id: "appgen-site-slug",
    name: "slug",
    spellCheck: false,
    type: "text",
    value,
    onChange: (event: TextInputChangeEvent) => onChange(event.target.value),
  });
  const suffix =
    hostedDomainSuffix == null
      ? null
      : jsx.jsx("span", {
          id: DOMAIN_DESCRIPTION_ID,
          className:
            "max-w-1/2 min-w-0 shrink truncate ps-1 pe-2.5 text-tertiary",
          children: hostedDomainSuffix,
        });
  return jsx.jsxs("div", { className, children: [input, suffix] });
}

function SlugStatus({ onRetry, state }: SlugStatusProps): unknown {
  if (state == null) return null;
  const isError =
    state === "error" || state === "invalid-format" || state === "unavailable";
  const colorClass =
    state === "available"
      ? "text-chart-green"
      : isError
        ? "text-danger"
        : "text-secondary";
  const retry =
    state === "error"
      ? jsx.jsx(Button, {
          color: "ghost",
          size: "compact",
          onClick: onRetry,
          children: jsx.jsx(FormattedMessage, {
            id: "appgenSettings.general.url.changeDialog.retry",
            defaultMessage: "Retry",
            description:
              "Button that retries a failed hosted Site URL availability check",
          }),
        })
      : null;
  return jsx.jsxs("div", {
    id: STATUS_DESCRIPTION_ID,
    className: `flex min-h-6 items-center gap-1 text-xs ${colorClass}`,
    role: isError ? "alert" : "status",
    children: [jsx.jsx(FormattedMessage, { ...STATUS_MESSAGES[state] }), retry],
  });
}

function initializeAppgenChangeSlugDialog(): void {
  initializeRuntimeLazy();
  initializeUseQuery();
  initializeIntlHook();
  initializeMaitaiRuntime();
  React = reactRuntimeFactory();
  initializeMessageRuntime();
  initializeButton();
  initializeDialog();
  initializeDialogLayout();
  initializeSlugDialogAssets();
  initializeAppScope();
  initializeDebouncedValue();
  initializeAppgenQueries();
  jsx = jsxRuntimeFactory();
  SLUG_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;
  DOMAIN_DESCRIPTION_ID = "appgen-site-slug-domain";
  STATUS_DESCRIPTION_ID = "appgen-site-slug-status";
  STATUS_MESSAGES = defineMessages({
    available: {
      id: "appgenSettings.general.url.changeDialog.available",
      defaultMessage: "URL is available",
      description:
        "Confirmation shown when a hosted Site URL name is available",
    },
    checking: {
      id: "appgenSettings.general.url.changeDialog.checking",
      defaultMessage: "Checking availability…",
      description:
        "Status shown while checking whether a hosted Site URL name is available",
    },
    error: {
      id: "appgenSettings.general.url.changeDialog.checkError",
      defaultMessage: "Unable to check availability",
      description:
        "Error shown when the hosted Site URL availability check fails",
    },
    "invalid-format": {
      id: "appgenSettings.general.url.changeDialog.invalidFormat",
      defaultMessage:
        "Start with a letter and use lowercase letters, numbers, or single hyphens",
      description:
        "Validation shown when a hosted Site URL name has an unsupported format",
    },
    requirements: {
      id: "appgenSettings.general.url.changeDialog.requirements",
      defaultMessage:
        "Use lowercase letters, numbers, or single hyphens, starting with a letter",
      description:
        "Slug format guidance shown below the hosted Site URL input.",
    },
    unavailable: {
      id: "appgenSettings.general.url.changeDialog.unavailable",
      defaultMessage: "This URL is not available",
      description:
        "Validation shown when a hosted Site URL name is invalid or already in use",
    },
  });
}

initializeAppgenChangeSlugDialog();

export { AppgenChangeSlugDialog };
