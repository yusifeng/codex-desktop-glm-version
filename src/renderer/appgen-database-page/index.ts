// appgen-database-page —— Site 数据库浏览器、表选择与游标分页页面。
// 原版：app/webview/assets/appgen-database-page-4ea3e3cfefe8.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as siteDetailLayoutChunk from "@rchunk/appgen-site-detail-layout";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
const appInitial = appInitialChunk as Record<string, any>;
const siteDetailLayout = siteDetailLayoutChunk as Record<string, any>;
let React: any;
let jsx: any;

function DatabaseContent({ initialPageOffset = 0, projectId }: any) {
  const intl = appShared.n4();
  const [bindingOverride, setBindingOverride] = React.useState(null);
  const [tableOverride, setTableOverride] = React.useState(null);
  const [pagination, setPagination] = React.useState(() => ({
    key: null,
    offsets: initialPageOffset === 0 ? [0] : [0, initialPageOffset],
  }));
  const overviewQuery = appInitial.ban(projectId, bindingOverride);
  const refreshSelection = appInitial.xan(projectId);
  const selectedBindingName = overviewQuery.data?.selected_binding_name ?? null;
  const selectedTable =
    overviewQuery.data?.tables.find(
      (table: string) => table === tableOverride,
    ) ??
    overviewQuery.data?.tables[0] ??
    null;
  const paginationKey =
    selectedBindingName == null || selectedTable == null
      ? null
      : JSON.stringify([projectId, selectedBindingName, selectedTable]);
  if (pagination.key !== paginationKey) {
    setPagination({
      key: paginationKey,
      offsets: pagination.key == null ? pagination.offsets : [0],
    });
  }
  const offsets =
    pagination.key === paginationKey || pagination.key == null
      ? pagination.offsets
      : [0];
  const offset = offsets.at(-1) ?? 0;
  const rowsQuery = appInitial.San({
    bindingName: selectedBindingName,
    offset,
    projectId,
    tableName: selectedTable,
  });
  const fetching = overviewQuery.isFetching || rowsQuery.isFetching;
  const refreshing =
    overviewQuery.isRefetching ||
    (rowsQuery.isRefetching && !rowsQuery.isPlaceholderData);
  const refresh = () => refreshSelection(bindingOverride);
  const useDefaultBinding = () => {
    setBindingOverride(null);
    setTableOverride(null);
    setPagination({ key: null, offsets: [0] });
    refreshSelection(null);
  };
  const previousPage = () => {
    setPagination((current: any) => {
      const currentOffsets =
        current.key === paginationKey ? current.offsets : [0];
      return {
        key: paginationKey,
        offsets:
          currentOffsets.length > 1
            ? currentOffsets.slice(0, -1)
            : currentOffsets,
      };
    });
  };
  const nextPage = (nextOffset: number) => {
    setPagination((current: any) => {
      const currentOffsets =
        current.key === paginationKey ? current.offsets : [0];
      return { key: paginationKey, offsets: [...currentOffsets, nextOffset] };
    });
  };
  const refreshLabel = intl.formatMessage({
    id: refreshing
      ? "appgenSettings.database.refreshing.ariaLabel"
      : "appgenSettings.database.refresh.ariaLabel",
    defaultMessage: refreshing ? "Refreshing database" : "Refresh database",
    description: refreshing
      ? "Accessible label while refreshing live Site database data"
      : "Accessible label for refreshing live Site database data",
  });
  const refreshButton = jsx.jsxs(appShared.Yh, {
    "aria-label": refreshLabel,
    color: "outline",
    disabled: fetching,
    loading: refreshing,
    size: "toolbar",
    type: "button",
    onClick: refresh,
    children: [
      refreshing ? null : jsx.jsx(appShared.S_, { asset: appShared.mO }),
      msg(
        "appgenSettings.database.refresh",
        "Refresh",
        "Button label for refreshing live Site database data",
      ),
    ],
  });
  const header = jsx.jsx(appInitial.aa.Header, {
    actions: refreshButton,
    subtitle: msg(
      "appgenSettings.database.description",
      "View the data used by your live site",
      "Description for the Site database viewer",
    ),
    title: msg(
      "appgenSettings.database.title",
      "Database",
      "Heading for the Site database viewer",
    ),
  });
  const database =
    overviewQuery.data == null
      ? null
      : jsx.jsx(DatabaseBrowser, {
          overview: overviewQuery.data,
          selectedBindingName,
          selectedTable,
          onBindingChange: (binding: string) => {
            setBindingOverride(binding);
            setTableOverride(null);
            setPagination({ key: null, offsets: [0] });
          },
          onTableChange: (table: string) => {
            setTableOverride(table);
            setPagination({ key: null, offsets: [0] });
          },
          children: jsx.jsx(DatabaseRows, {
            canGoPrevious: offsets.length > 1,
            isError: rowsQuery.isError,
            isFetching: rowsQuery.isFetching,
            isLoading: rowsQuery.isLoading,
            isPlaceholderData: rowsQuery.isPlaceholderData,
            rows: rowsQuery.data,
            selectedTable,
            onNext: nextPage,
            onPrevious: previousPage,
            onRetry: () => void rowsQuery.refetch(),
          }),
        });
  const body = jsx.jsx(appInitial.aa.Content, {
    children: jsx.jsx(appShared.Zc, {
      children: jsx.jsx(DatabaseOverviewState, {
        isError: overviewQuery.isError,
        isFetching: overviewQuery.isFetching,
        isLoading: overviewQuery.isLoading,
        overview: overviewQuery.data,
        onRetry: refresh,
        onUseDefaultBinding:
          bindingOverride == null ? undefined : useDefaultBinding,
        children: database,
      }),
    }),
  });
  return jsx.jsxs(appInitial.aa, { children: [header, body] });
}

function DatabaseOverviewState({
  children,
  isError,
  isFetching,
  isLoading,
  overview,
  onRetry,
  onUseDefaultBinding,
}: any) {
  if (isLoading) {
    return jsx.jsx(LoadingBox, {
      children: msg(
        "appgenSettings.database.loading",
        "Loading database…",
        "Loading status while Site database metadata is being loaded",
      ),
    });
  }
  if (isError || overview == null) {
    return jsx.jsx(CenteredBox, {
      children: jsx.jsxs("div", {
        className: "flex flex-col items-center gap-3 text-center",
        children: [
          jsx.jsx("div", {
            className: "text-sm font-medium text-default",
            children: msg(
              "appgenSettings.database.error.title",
              "Unable to load database",
              "Error title when Site database metadata cannot be loaded",
            ),
          }),
          jsx.jsx("div", {
            className: "max-w-sm text-xs text-tertiary",
            children: msg(
              "appgenSettings.database.error.description",
              "Try refreshing to load the latest data",
              "Error description when Site database metadata cannot be loaded",
            ),
          }),
          jsx.jsxs("div", {
            className: "flex items-center gap-2",
            children: [
              jsx.jsx(appShared.Yh, {
                color: "outline",
                loading: isFetching,
                size: "toolbar",
                type: "button",
                onClick: onRetry,
                children: msg(
                  "appgenSettings.database.retry",
                  "Try again",
                  "Button label for retrying a Site database request",
                ),
              }),
              onUseDefaultBinding == null
                ? null
                : jsx.jsx(appShared.Yh, {
                    color: "outline",
                    size: "toolbar",
                    type: "button",
                    onClick: onUseDefaultBinding,
                    children: msg(
                      "appgenSettings.database.useDefaultBinding",
                      "Use default database",
                      "Button label for returning to the default Site database",
                    ),
                  }),
            ],
          }),
        ],
      }),
    });
  }
  if (overview.bindings.length === 0) {
    return jsx.jsx(CenteredBox, {
      children: jsx.jsxs("div", {
        className: "flex max-w-md flex-col items-center gap-1.5 text-center",
        children: [
          jsx.jsx("div", {
            className: "text-sm font-medium text-default",
            children: msg(
              "appgenSettings.database.noBinding.title",
              "No database connected",
              "Empty state title when the live Site has no database",
            ),
          }),
          jsx.jsx("div", {
            className: "text-xs text-tertiary",
            children: msg(
              "appgenSettings.database.noBinding.description",
              "This site doesn't have a database yet",
              "Empty state description when the live Site has no database",
            ),
          }),
        ],
      }),
    });
  }
  return jsx.jsx(jsx.Fragment, { children });
}

function DatabaseBrowser({
  children,
  overview,
  selectedBindingName,
  selectedTable,
  onBindingChange,
  onTableChange,
}: any) {
  const intl = appShared.n4();
  const bindingPicker =
    overview.bindings.length > 1
      ? jsx.jsxs("div", {
          className:
            "flex max-w-full min-w-0 items-center gap-2 text-xs text-tertiary",
          children: [
            jsx.jsx("span", {
              className: "shrink-0",
              children: msg(
                "appgenSettings.database.binding",
                "Database",
                "Label for selecting a Site database",
              ),
            }),
            jsx.jsx(appShared.kf, {
              align: "end",
              contentWidth: "menuBounded",
              triggerButton: jsx.jsx(appInitial.ql, {
                "aria-label": intl.formatMessage({
                  id: "appgenSettings.database.binding.ariaLabel",
                  defaultMessage: "Select database",
                  description: "Accessible label for selecting a Site database",
                }),
                className: "min-w-0",
                contentClassName: "truncate",
                children: jsx.jsx("span", {
                  className: "truncate font-mono",
                  children: selectedBindingName,
                }),
              }),
              children: overview.bindings.map((binding: string) =>
                jsx.jsx(
                  appShared.jf.Item,
                  {
                    rightIconAsset:
                      binding === selectedBindingName
                        ? appShared.bD
                        : undefined,
                    onSelect: () => onBindingChange(binding),
                    children: binding,
                  },
                  binding,
                ),
              ),
            }),
          ],
        })
      : null;
  const header = jsx.jsxs("div", {
    className:
      "flex min-h-11 flex-wrap items-center justify-between gap-2 border-b border-default px-3 py-2",
    children: [
      jsx.jsx("span", {
        className: "text-xs font-medium text-default",
        children: msg(
          "appgenSettings.database.connected",
          "Connected",
          "Status label for a connected Site database",
        ),
      }),
      bindingPicker,
    ],
  });
  const content =
    overview.tables.length === 0
      ? jsx.jsx(CenteredBox, {
          children: jsx.jsxs("div", {
            className: "flex flex-col items-center gap-1.5 text-center",
            children: [
              jsx.jsx("div", {
                className: "text-sm font-medium text-default",
                children: msg(
                  "appgenSettings.database.noTables.title",
                  "Database connected",
                  "Empty state title when a Site database has no data",
                ),
              }),
              jsx.jsx("div", {
                className: "text-xs text-tertiary",
                children: msg(
                  "appgenSettings.database.noTables.description",
                  "No data is available yet",
                  "Empty state description when a Site database has no data",
                ),
              }),
            ],
          }),
        })
      : jsx.jsxs("div", {
          className: "flex min-h-72 min-w-0 max-sm:flex-col",
          children: [
            jsx.jsxs("div", {
              className:
                "flex w-44 min-w-0 shrink-0 flex-col border-r border-default max-sm:max-h-40 max-sm:w-full max-sm:border-r-0 max-sm:border-b",
              children: [
                jsx.jsx("div", {
                  className:
                    "px-3 pt-3 pb-1 text-xs font-medium tracking-wide text-tertiary uppercase",
                  children: msg(
                    "appgenSettings.database.tables",
                    "Tables",
                    "Heading above the list of Site database tables",
                  ),
                }),
                jsx.jsx("div", {
                  className:
                    "flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-1.5",
                  children: overview.tables.map((table: string) => {
                    const selected = table === selectedTable;
                    return jsx.jsx(
                      "button",
                      {
                        "aria-pressed": selected,
                        className: appShared.m4(
                          "cursor-interaction flex min-w-0 items-center justify-between gap-2 rounded-md px-2 py-1.5 text-start text-xs hover:bg-primary-ghost-hover",
                          selected
                            ? "bg-primary-ghost-hover text-default"
                            : "text-secondary",
                        ),
                        type: "button",
                        onClick: () => onTableChange(table),
                        children: jsx.jsx("span", {
                          className: "truncate font-mono",
                          children: table,
                        }),
                      },
                      table,
                    );
                  }),
                }),
              ],
            }),
            jsx.jsx("div", {
              className: "flex min-w-0 flex-1 flex-col",
              children,
            }),
          ],
        });
  return jsx.jsxs("div", {
    className: "flex min-w-0 flex-col",
    children: [header, content],
  });
}

function DatabaseRows({
  canGoPrevious,
  isError,
  isFetching,
  isLoading,
  isPlaceholderData,
  rows,
  selectedTable,
  onNext,
  onPrevious,
  onRetry,
}: any) {
  const fetchingStatus =
    isFetching && rows != null
      ? jsx.jsxs("span", {
          "aria-live": "polite",
          className: "flex shrink-0 items-center gap-1.5 text-xs text-tertiary",
          role: "status",
          children: [
            jsx.jsx(appShared.Qh, { className: "icon-2xs" }),
            isPlaceholderData
              ? msg(
                  "appgenSettings.database.rows.pageLoading",
                  "Loading page…",
                  "Loading status while the next Site database table page is being fetched",
                )
              : msg(
                  "appgenSettings.database.rows.refreshing",
                  "Refreshing data…",
                  "Loading status while Site database data is being refreshed",
                ),
          ],
        })
      : null;
  const header = jsx.jsxs("div", {
    className:
      "flex min-h-11 items-center justify-between gap-2 border-b border-default px-3 py-2",
    children: [
      jsx.jsx("span", {
        className: "truncate font-mono text-xs font-medium text-default",
        children: selectedTable,
      }),
      fetchingStatus,
    ],
  });
  let content;
  if (isLoading) {
    content = jsx.jsx(LoadingBox, {
      children: msg(
        "appgenSettings.database.rows.loading",
        "Loading data…",
        "Loading status while Site database data is being loaded",
      ),
    });
  } else if (isError || rows == null) {
    content = jsx.jsx(CenteredBox, {
      children: jsx.jsxs("div", {
        className: "flex flex-col items-center gap-3 text-center",
        children: [
          jsx.jsx("div", {
            className: "text-sm text-secondary",
            children: msg(
              "appgenSettings.database.rows.error",
              "Unable to load data",
              "Error message when Site database data cannot be loaded",
            ),
          }),
          jsx.jsxs("div", {
            className: "flex items-center gap-2",
            children: [
              canGoPrevious
                ? jsx.jsxs(appShared.Yh, {
                    color: "outline",
                    size: "toolbar",
                    type: "button",
                    onClick: onPrevious,
                    children: [
                      jsx.jsx(appShared.S_, { asset: appShared.bO }),
                      msg(
                        "appgenSettings.database.pagination.previous",
                        "Previous page",
                        "Label for the previous Site database rows page",
                      ),
                    ],
                  })
                : null,
              jsx.jsx(appShared.Yh, {
                color: "outline",
                loading: isFetching,
                size: "toolbar",
                type: "button",
                onClick: onRetry,
                children: msg(
                  "appgenSettings.database.retry",
                  "Try again",
                  "Button label for retrying a Site database request",
                ),
              }),
            ],
          }),
        ],
      }),
    });
  } else {
    const table =
      rows.rows.length === 0
        ? jsx.jsx(CenteredBox, {
            children: jsx.jsx("div", {
              className: "text-sm text-tertiary",
              children:
                rows.offset === 0
                  ? msg(
                      "appgenSettings.database.rows.empty",
                      "This table is empty",
                      "Empty state for a Site database table",
                    )
                  : msg(
                      "appgenSettings.database.rows.emptyPage",
                      "This page is empty",
                      "Empty state for a stale Site database page",
                    ),
            }),
          })
        : jsx.jsx("div", {
            className: "min-h-0 flex-1 overflow-auto",
            children: jsx.jsxs("table", {
              className: "w-full min-w-max border-collapse text-start text-xs",
              children: [
                jsx.jsx("thead", {
                  className: "sticky top-0 z-10 bg-primary-soft-alpha",
                  children: jsx.jsx("tr", {
                    children: rows.columns.map(renderColumnHeader),
                  }),
                }),
                jsx.jsx("tbody", {
                  children: rows.rows.map((row: any, index: number) =>
                    jsx.jsx(
                      "tr",
                      {
                        className: "border-b border-border/70 last:border-b-0",
                        children: rows.columns.map((column: string) =>
                          jsx.jsx(
                            "td",
                            {
                              className:
                                "max-w-80 px-3 py-2 align-top font-mono break-all whitespace-pre-wrap text-secondary",
                              children: jsx.jsx(DatabaseCellValue, {
                                value: row[column],
                              }),
                            },
                            column,
                          ),
                        ),
                      },
                      rows.offset + index,
                    ),
                  ),
                }),
              ],
            }),
          });
    const pagination =
      rows.rows.length > 0 || rows.offset > 0
        ? jsx.jsx(DatabasePagination, {
            canGoPrevious,
            isPlaceholderData,
            rows,
            onNext: () => onNext(appInitial.gan(rows)),
            onPrevious,
          })
        : null;
    content = jsx.jsxs(jsx.Fragment, { children: [table, pagination] });
  }
  return jsx.jsxs(jsx.Fragment, { children: [header, content] });
}

function renderColumnHeader(column: string) {
  return jsx.jsx(
    "th",
    {
      className:
        "border-b border-default px-3 py-2 text-start font-mono font-medium text-secondary",
      scope: "col",
      children: column,
    },
    column,
  );
}

function DatabasePagination({
  canGoPrevious,
  isPlaceholderData,
  rows,
  onNext,
  onPrevious,
}: any) {
  const intl = appShared.n4();
  const summary =
    rows.rows.length > 0
      ? jsx.jsx("span", {
          className: "text-xs text-tertiary tabular-nums",
          children: jsx.jsx(appShared.Y2, {
            id: "appgenSettings.database.pagination.summary",
            defaultMessage: "Showing {start}–{end}",
            description: "Pagination summary for Site database data",
            values: {
              start: rows.offset + 1,
              end: rows.offset + rows.rows.length,
            },
          }),
        })
      : null;
  const previous = jsx.jsx(appShared.Yh, {
    "aria-label": intl.formatMessage({
      id: "appgenSettings.database.pagination.previous",
      defaultMessage: "Previous page",
      description: "Label for the previous Site database rows page",
    }),
    color: "ghost",
    disabled: !canGoPrevious || isPlaceholderData,
    size: "icon",
    type: "button",
    uniform: true,
    onClick: onPrevious,
    children: jsx.jsx(appShared.S_, { asset: appShared.bO }),
  });
  const next = jsx.jsx(appShared.Yh, {
    "aria-label": intl.formatMessage({
      id: "appgenSettings.database.pagination.next",
      defaultMessage: "Next page",
      description: "Accessible label for the next Site database rows page",
    }),
    color: "ghost",
    disabled: isPlaceholderData || !rows.has_more || rows.rows.length === 0,
    size: "icon",
    type: "button",
    uniform: true,
    onClick: onNext,
    children: jsx.jsx(appShared.S_, {
      className: "rotate-180",
      asset: appShared.bO,
    }),
  });
  return jsx.jsxs("div", {
    className:
      "flex min-h-11 flex-wrap items-center justify-between gap-2 border-t border-default px-3 py-2",
    children: [
      summary,
      jsx.jsxs("div", {
        className: "ms-auto flex items-center gap-1",
        children: [previous, next],
      }),
    ],
  });
}

function LoadingBox({ children }: any) {
  return jsx.jsx(CenteredBox, {
    children: jsx.jsx(appInitial.ru, { children }),
  });
}

function CenteredBox({ children }: any) {
  return jsx.jsx("div", {
    className: "flex min-h-40 flex-1 items-center justify-center px-4 py-8",
    children,
  });
}

function DatabaseCellValue({ value }: any) {
  if (value == null) {
    return jsx.jsx("span", {
      className: "text-tertiary italic",
      children: msg(
        "appgenSettings.database.cell.null",
        "No value",
        "Displayed value for a null Site database cell",
      ),
    });
  }
  if (typeof value === "string")
    return jsx.jsx(jsx.Fragment, { children: value });
  if (typeof value === "number" || typeof value === "boolean") {
    return jsx.jsx(jsx.Fragment, { children: String(value) });
  }
  return jsx.jsx(jsx.Fragment, { children: JSON.stringify(value) ?? "" });
}

function msg(id: string, defaultMessage: string, description: string) {
  return jsx.jsx(appShared.Y2, { id, defaultMessage, description });
}

function initializeDatabaseComponents(): void {
  appShared.$3();
  appShared.xO();
  appShared.hO();
  appShared.xD();
  appShared.h4();
  React = appShared.e6();
  appShared.K2();
  appShared.Zh();
  appShared.If();
  appShared.C_();
  appShared.$h();
  appInitial.oa();
  appInitial.iu();
  appInitial.Xl();
  appShared.Qc();
  appInitial._an();
  jsx = appShared.I3();
}

function AppgenDatabasePage() {
  const { projectId } = appInitial.l_n();
  const databaseEnabled = appInitial.ofn("1912312436");
  const { data: availability, isError } = appShared.HX(appInitial.can, {
    enabled: databaseEnabled,
  });
  if (projectId == null) {
    return jsx.jsx(appInitial.Ygn, { replace: true, to: "/sites" });
  }
  if (databaseEnabled && !isError && availability == null) return null;
  if (!databaseEnabled || isError || !availability?.database) {
    return jsx.jsx(appInitial.Ygn, {
      replace: true,
      to: appInitial.cnn(projectId),
    });
  }
  const renderContent = () => jsx.jsx(DatabaseContent, { projectId });
  return jsx.jsx(siteDetailLayout.t, {
    projectId,
    selectedTab: "database",
    children: renderContent,
  });
}

function initializeAppgenDatabasePage(): void {
  appShared.$3();
  appShared.FX();
  appInitial.Qgn();
  appInitial.ifn();
  initializeDatabaseComponents();
  appInitial._an();
  appInitial.lnn();
  siteDetailLayout.n();
  jsx = appShared.I3();
}

initializeAppgenDatabasePage();

export { AppgenDatabasePage };
