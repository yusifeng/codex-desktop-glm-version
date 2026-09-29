import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";

const {
  $3: initializeRuntimeLazy,
  FX: initializeSignalRuntime,
  I3: getJsxRuntime,
  LX: useScope,
  ZI: AppScope,
  _L: useQuery,
  e6: getReactRuntime,
  gL: initializeUseQuery,
  n4: useIntl,
  pk: toastManagerSignal,
  qm: initializeQueryRuntime,
} = appSharedChunk;

interface StorageBreakdown {
  count: number;
  file_type: string;
  used_bytes: number;
}

interface StorageUsage {
  allowed_bytes: number;
  breakdown_by_file_type: StorageBreakdown[];
  is_over_limit: boolean;
  limit_tier?: string | null;
  plan_type?: string | null;
  remaining_bytes: number;
  used_bytes: number;
}

interface StorageApi {
  safeGet<Data>(path: string): Promise<Data>;
}

interface ToastManager {
  info(message: unknown, options: {
    hasCloseButton: boolean;
    id: string;
    variant: string;
  }): void;
}

const storageRuntime = appInitialChunk as unknown as {
  cRt: unknown;
  fRt: () => void;
  o_n: () => (destination: string) => void;
  rJt: StorageApi;
  sRt: unknown;
  xpn: (scope: unknown, event: unknown, payload: Record<string, unknown>) => void;
};
const {
  cRt: storageViewedEvent,
  fRt: initializeStorageApi,
  o_n: useNavigate,
  rJt: storageApi,
  sRt: storageRowClickedEvent,
  xpn: trackStorageEvent,
} = storageRuntime;

const STORAGE_QUERY_KEY = ["4231797315"] as const;
const STORAGE_USAGE_PATH = "/files/library/storage/usage";
const MANAGE_STORAGE_TOAST_ID = "library-storage-manage-storage-guidance";
const MEGABYTE = 1024 * 1024;
const GIGABYTE = 1024 * MEGABYTE;

let React: import("@rchunk/app-shared").ReactRuntime;
let jsx: import("@rchunk/app-shared").JsxRuntime;

function storageFullnessState(usage: StorageUsage): string {
  if (usage.is_over_limit) return "over_limit";
  if (usage.remaining_bytes <= 0) return "full";
  if (usage.allowed_bytes > 0 && Math.max(usage.remaining_bytes, 0) / usage.allowed_bytes <= 0.1) return "almost_full";
  return "normal";
}

function byteBucket(bytes: number): string | undefined {
  if (!Number.isFinite(bytes) || bytes < 0) return undefined;
  if (bytes === 0) return "0";
  if (bytes < MEGABYTE) return "0_1mb";
  if (bytes < 10 * MEGABYTE) return "1_10mb";
  if (bytes < 100 * MEGABYTE) return "10_100mb";
  if (bytes < GIGABYTE) return "100mb_1gb";
  if (bytes < 10 * GIGABYTE) return "1_10gb";
  if (bytes < 100 * GIGABYTE) return "10_100gb";
  return "100gb_plus";
}

function usagePercentBucket(usage: StorageUsage): string | undefined {
  if (usage.allowed_bytes <= 0 || !Number.isFinite(usage.used_bytes) || !Number.isFinite(usage.allowed_bytes)) return undefined;
  const percent = Math.max(0, usage.used_bytes / usage.allowed_bytes * 100);
  if (percent >= 100) return "100_plus";
  const lowerBound = Math.floor(percent / 10) * 10;
  return `${lowerBound}_${lowerBound + 10}`;
}

function analyticsPayload(usage: StorageUsage): Record<string, unknown> {
  return {
    allowedBytesBucket: byteBucket(usage.allowed_bytes),
    fullnessState: storageFullnessState(usage),
    plan: usage.limit_tier ?? usage.plan_type,
    storageUsagePercentBucket: usagePercentBucket(usage),
    usedBytesBucket: byteBucket(usage.used_bytes),
  };
}

function formatBytes(bytes: number, intl: import("@rchunk/app-shared").IntlShape): string {
  const units = ["B", "KB", "MB", "GB", "TB"] as const;
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const options: Intl.NumberFormatOptions = Number.isInteger(value)
    ? { maximumFractionDigits: 0 }
    : { maximumSignificantDigits: 3, minimumSignificantDigits: 3 };
  return `${intl.formatNumber(value, options)} ${units[unitIndex]}`;
}

async function loadStorageUsage(): Promise<StorageUsage> {
  return storageApi.safeGet<StorageUsage>(STORAGE_USAGE_PATH);
}

function LoadingState(): unknown {
  return jsx.jsx("div", {
    role: "status",
    className: "flex min-h-32 items-center justify-center text-sm text-secondary",
    children: "Loading storage usage",
  });
}

function ErrorState({ onRetry }: { onRetry(): void }): unknown {
  return jsx.jsxs("div", {
    className: "flex flex-col items-center gap-3 py-4 text-center",
    children: [
      jsx.jsx("p", { role: "alert", children: "Couldn't load storage usage" }),
      jsx.jsx("button", {
        type: "button",
        className: "rounded-md border px-3 py-1.5 text-sm",
        onClick: onRetry,
        children: "Retry",
      }),
    ],
  });
}

function StorageCategoryRow({
  count,
  label,
  onClick,
  size,
}: {
  count: number;
  label: string;
  onClick(): void;
  size: string;
}): unknown {
  const itemLabel = label === "Images" ? (count === 1 ? "image" : "images") : (count === 1 ? "file" : "files");
  return jsx.jsx("button", {
    type: "button",
    className: "flex min-h-14 w-full items-center justify-between gap-4 px-4 py-3 text-left",
    onClick,
    children: jsx.jsxs("span", {
      className: "min-w-0",
      children: [
        jsx.jsx("span", { className: "block font-medium", children: label }),
        jsx.jsx("span", { className: "block text-sm text-secondary", children: `${size} • ${count} ${itemLabel}` }),
      ],
    }),
  });
}

function StorageContent({ usage }: { usage: StorageUsage }): unknown {
  const scope = useScope(AppScope);
  const intl = useIntl();
  const navigate = useNavigate();
  const progressLabelId = React.useId();
  const recordedView = React.useRef(false);

  React.useEffect(() => {
    if (recordedView.current) return;
    recordedView.current = true;
    trackStorageEvent(scope, storageViewedEvent, {
      ...analyticsPayload(usage),
      source: "settings_storage_page",
      surface: "settings_storage",
    });
  }, [scope, usage]);

  const used = formatBytes(usage.used_bytes, intl);
  const allowed = formatBytes(usage.allowed_bytes, intl);
  const percentage = usage.allowed_bytes > 0
    ? Math.min(usage.used_bytes / usage.allowed_bytes * 100, 100)
    : 0;
  const progressNow = Math.min(usage.used_bytes, usage.allowed_bytes);
  const categoryTotals = usage.breakdown_by_file_type.reduce((totals, item) => {
    const key = item.file_type === "image" ? "images" : "files";
    totals[key].bytes += item.used_bytes;
    totals[key].count += item.count;
    return totals;
  }, {
    files: { bytes: 0, count: 0 },
    images: { bytes: 0, count: 0 },
  });

  const openCategory = (tab: "all" | "images") => {
    const target = tab === "images" ? "images" : "files";
    trackStorageEvent(scope, storageRowClickedEvent, {
      ...analyticsPayload(usage),
      source: "settings_storage_row",
      surface: "settings_storage",
      target,
    });
    const toastManager = scope.get(toastManagerSignal) as unknown as ToastManager;
    toastManager.info("Delete files to free up storage space", {
      hasCloseButton: false,
      id: MANAGE_STORAGE_TOAST_ID,
      variant: "successNeutral",
    });
    navigate(`/library?tab=${tab}&entry_point=settings`);
  };

  return jsx.jsxs("div", {
    className: "flex flex-col gap-10",
    children: [
      jsx.jsxs("section", {
        className: "flex flex-col gap-3",
        children: [
          jsx.jsx("p", {
            id: progressLabelId,
            className: "text-sm font-semibold",
            children: `${used} of ${allowed} used`,
          }),
          jsx.jsx("div", {
            role: "progressbar",
            "aria-labelledby": progressLabelId,
            "aria-valuemin": 0,
            "aria-valuemax": usage.allowed_bytes,
            "aria-valuenow": progressNow,
            className: "h-3 overflow-hidden rounded-full bg-border",
            children: jsx.jsx("div", {
              className: `h-full rounded-full ${usage.used_bytes > 0 ? "min-w-3" : ""} ${usage.is_over_limit ? "bg-background-danger-solid" : "bg-text"}`,
              style: { width: `${percentage}%` },
            }),
          }),
        ],
      }),
      jsx.jsxs("section", {
        className: "overflow-hidden rounded-xl border border-token-border-light",
        children: [
          jsx.jsxs("header", {
            className: "border-b border-token-border-light px-4 py-3",
            children: [
              jsx.jsx("h2", { className: "font-semibold", children: "Manage storage" }),
              jsx.jsx("p", { className: "text-sm text-secondary", children: "Manage your library to free up storage" }),
            ],
          }),
          jsx.jsx("div", {
            className: "divide-y divide-token-border-light",
            children: [
              jsx.jsx(StorageCategoryRow, {
                count: categoryTotals.files.count,
                label: "Files",
                onClick: () => openCategory("all"),
                size: formatBytes(categoryTotals.files.bytes, intl),
              }, "files"),
              jsx.jsx(StorageCategoryRow, {
                count: categoryTotals.images.count,
                label: "Images",
                onClick: () => openCategory("images"),
                size: formatBytes(categoryTotals.images.bytes, intl),
              }, "images"),
            ],
          }),
        ],
      }),
    ],
  });
}

function ChatGptStorageSettings(): unknown {
  initializeStorageSettings();
  const query = useQuery<StorageUsage>({
    queryKey: STORAGE_QUERY_KEY,
    queryFn: loadStorageUsage,
    staleTime: 0,
  });

  return jsx.jsxs("div", {
    className: "flex h-full min-h-0 flex-col",
    children: [
      jsx.jsx("header", {
        className: "border-b border-token-border-light px-5 py-4",
        children: jsx.jsx("h1", { className: "text-lg font-semibold", children: "Storage" }),
      }),
      jsx.jsx("main", {
        className: "flex-1 overflow-auto p-5",
        children: jsx.jsx("div", {
          className: "mx-auto max-w-3xl",
          children: query.isPending
            ? jsx.jsx(LoadingState, {})
            : query.isError || query.data == null
              ? jsx.jsx(ErrorState, { onRetry: () => { void query.refetch(); } })
              : jsx.jsx(StorageContent, { usage: query.data }),
        }),
      }),
    ],
  });
}

let initialized = false;
function initializeStorageSettings(): void {
  if (initialized) return;
  initializeRuntimeLazy();
  initializeSignalRuntime();
  initializeQueryRuntime();
  initializeUseQuery();
  initializeStorageApi();
  React = getReactRuntime();
  jsx = getJsxRuntime();
  initialized = true;
}

initializeStorageSettings();
export { ChatGptStorageSettings };
