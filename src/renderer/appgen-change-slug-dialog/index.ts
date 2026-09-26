// appgen-change-slug-dialog —— 修改 Site 托管 URL 名称的校验与提交弹窗。
// 原版：app/webview/assets/appgen-change-slug-dialog-547ba9f25982.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
const appInitial = appInitialChunk as Record<string, any>;
let React: any;
let jsx: any;
let SLUG_PATTERN: RegExp;
let DOMAIN_DESCRIPTION_ID: string;
let STATUS_DESCRIPTION_ID: string;
let STATUS_MESSAGES: Record<string, any>;

function AppgenChangeSlugDialog({
  currentSlug,
  hostedDomainSuffix,
  onClose,
  projectId,
}: any) {
  const scope = appShared.LX(appShared.ZI);
  const intl = appShared.n4();
  const mutation = appShared.BX(appInitial.ean, projectId);
  const [inputValue, setInputValue] = React.useState(currentSlug);
  const normalizedSlug = inputValue.trim().toLowerCase();
  const debouncedSlug = appInitial.Cht(normalizedSlug, 400);
  const unchanged = normalizedSlug === currentSlug;
  const invalidFormat =
    normalizedSlug.length > 0 && !SLUG_PATTERN.test(normalizedSlug);
  const validChangedSlug = !unchanged && SLUG_PATTERN.test(normalizedSlug);
  const queryKey = [...appInitial.Xin, projectId, debouncedSlug];
  const queryFn = () => appInitial.pan(projectId, debouncedSlug);
  const queryEnabled = validChangedSlug && debouncedSlug === normalizedSlug;
  const availabilityQuery = appShared._L({
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

  let status = "requirements";
  if (unchanged) status = null as any;
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
  const onSubmit = (event: any) => {
    event.preventDefault();
    if (available && !mutation.isPending) {
      mutation.mutateAsync(normalizedSlug).then(
        () => onClose(),
        () => {
          scope.get(appShared.pk).danger(
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

  const title = jsx.jsx(appShared.Rh, {
    children: jsx.jsx(appShared.Y2, {
      id: "appgenSettings.general.url.changeDialog.title",
      defaultMessage: "Change URL",
      description: "Title of the dialog for changing a Site's hosted URL",
    }),
  });
  const header = jsx.jsx(appShared.Ah, {
    title,
    subtitle: jsx.jsx(appShared.Lh, {
      children: jsx.jsx(appShared.Y2, {
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
  const content = jsx.jsxs(appShared.jh, {
    className: "gap-2",
    children: [field, statusMessage],
  });
  const cancel = jsx.jsx(appShared.Yh, {
    color: "ghostSecondary",
    disabled: mutation.isPending,
    onClick: onClose,
    children: jsx.jsx(appShared.Y2, {
      id: "appgenSettings.general.url.changeDialog.cancel",
      defaultMessage: "Cancel",
      description:
        "Button that closes the Site URL change dialog without saving",
    }),
  });
  const submit = jsx.jsx(appShared.Yh, {
    disabled: !available,
    loading: mutation.isPending,
    type: "submit",
    children: jsx.jsx(appShared.Y2, {
      id: "appgenSettings.general.url.changeDialog.submit",
      defaultMessage: "Change URL",
      description: "Button that submits a new hosted URL name for a Site",
    }),
  });
  const footer = jsx.jsxs(appShared.kh, {
    className: "mt-10",
    children: [cancel, submit],
  });
  const form = jsx.jsxs(appShared.Oh, {
    as: "form",
    className: "gap-0 px-4 pt-3.5 pb-4",
    onSubmit,
    children: [header, content, footer],
  });

  return jsx.jsx(appShared.Ih, {
    open: true,
    size: "compact",
    shouldIgnoreClickOutside: mutation.isPending,
    showDialogClose: !mutation.isPending,
    onOpenChange,
    children: form,
  });
}

function isPresent(value: unknown): boolean {
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
}: any) {
  const className = appShared.m4(
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
    onChange: (event: any) => onChange(event.target.value),
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

function SlugStatus({ onRetry, state }: any) {
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
      ? jsx.jsx(appShared.Yh, {
          color: "ghost",
          size: "compact",
          onClick: onRetry,
          children: jsx.jsx(appShared.Y2, {
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
    children: [jsx.jsx(appShared.Y2, { ...STATUS_MESSAGES[state] }), retry],
  });
}

function initializeAppgenChangeSlugDialog(): void {
  appShared.$3();
  appShared.gL();
  appShared.h4();
  appShared.FX();
  React = appShared.e6();
  appShared.K2();
  appShared.Zh();
  appShared.zh();
  appShared.Ph();
  appShared.lk();
  appShared.QI();
  appInitial.Sht();
  appInitial._an();
  jsx = appShared.I3();
  SLUG_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;
  DOMAIN_DESCRIPTION_ID = "appgen-site-slug-domain";
  STATUS_DESCRIPTION_ID = "appgen-site-slug-status";
  STATUS_MESSAGES = appShared.G2({
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
