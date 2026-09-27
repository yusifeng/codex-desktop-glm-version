import "@rchunk/rolldown-runtime";
import {
  I3 as getJsxRuntime,
  K2 as initializeInternationalization,
  Qh as LoadingSpinner,
  Y2 as FormattedMessage,
  Yh as Button,
  e6 as getReact,
} from "@rchunk/app-shared";
import { aa as SettingsList, oa as SettingsRow } from "@rchunk/app-initial";
import { r as securityApiClient, t as initializeSecurityClient } from "@rchunk/security-client";
import {
  i as initializeSecurityShared,
  n as SecurityLoadingState,
  r as SecuritySubpage,
} from "@rchunk/security-shared";
import {
  n as initializeSecurityMessages,
  t as securityHistoryMessages,
} from "@rchunk/security-messages";

interface SecurityHistorySettingsProps {
  accountId: string;
  onBack(): void;
}

interface SecurityHistoryEvent {
  device_description?: string;
  event_type: string;
  id: string;
  location_description?: string;
  timestamp_second: number;
}

interface HistoryPage {
  events?: SecurityHistoryEvent[];
  has_more?: boolean;
  next_cursor?: string | null;
}

interface ReactLike {
  useEffect(effect: () => void | (() => void), dependencies: unknown[]): void;
  useState<Value>(value: Value): [Value, (next: Value | ((current: Value) => Value)) => void];
}

const jsx = getJsxRuntime();

function eventTitle(eventType: string): string {
  const type = eventType.toLowerCase();
  if (type.includes("passkey")) return "Passkey updated";
  if (type.includes("password")) return "Password updated";
  if (type.includes("mfa")) return "Multi-factor authentication updated";
  if (type.includes("advanced")) return "Advanced protection updated";
  if (type.includes("lockdown")) return "Lockdown mode updated";
  if (type.includes("logout")) return "Signed out";
  if (type.includes("login")) return "Signed in";
  return "Security setting updated";
}

function groupEvents(events: SecurityHistoryEvent[]): Array<{
  date: Date | null;
  events: SecurityHistoryEvent[];
  key: string;
}> {
  const groups = new Map<string, { date: Date | null; events: SecurityHistoryEvent[]; key: string }>();
  for (const event of events) {
    const date = new Date(event.timestamp_second * 1000);
    const validDate = Number.isNaN(date.getTime()) ? null : date;
    const key = validDate == null
      ? "unavailable"
      : `${validDate.getFullYear()}-${validDate.getMonth() + 1}-${validDate.getDate()}`;
    const group = groups.get(key) ?? { date: validDate, events: [], key };
    group.events.push(event);
    groups.set(key, group);
  }
  return [...groups.values()];
}

function SecurityHistorySettings({ accountId, onBack }: SecurityHistorySettingsProps): unknown {
  const React = getReact() as ReactLike;
  const [events, setEvents] = React.useState<SecurityHistoryEvent[]>([]);
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [hasMore, setHasMore] = React.useState(true);
  const [isFetching, setIsFetching] = React.useState(false);
  const [isError, setIsError] = React.useState(false);

  const fetchPage = async () => {
    if (isFetching) return;
    setIsFetching(true);
    setIsError(false);
    try {
      const query = cursor == null ? "" : `?cursor=${encodeURIComponent(cursor)}`;
      const page = await securityApiClient.safeGet(
        `/accounts/security_settings/history${query}`,
        { additionalHeaders: { "ChatGPT-Account-ID": accountId } },
      ) as HistoryPage;
      setEvents((current) => [...current, ...(page.events ?? [])]);
      setCursor(page.next_cursor ?? null);
      setHasMore(page.has_more === true);
    } catch {
      setIsError(true);
    } finally {
      setIsFetching(false);
    }
  };

  React.useEffect(() => {
    void fetchPage();
  }, [accountId]);

  const body = isError && events.length === 0
    ? jsx.jsx(SecurityLoadingState, { isError: true, onRetry: fetchPage })
    : events.length === 0 && isFetching
      ? jsx.jsx(SecurityLoadingState, { isError: false, onRetry: fetchPage })
      : jsx.jsxs("div", {
          className: "flex flex-col gap-6",
          children: [
            ...groupEvents(events).map((group) =>
              jsx.jsxs("section", {
                "data-history-date": group.key,
                children: [
                  jsx.jsx("h2", {
                    children: group.date == null
                      ? "Date unavailable"
                      : group.date.toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }),
                  }),
                  jsx.jsx(SettingsList as (props: Record<string, unknown>) => unknown, {
                    children: group.events.map((event) =>
                      jsx.jsx(SettingsRow as (props: Record<string, unknown>) => unknown, {
                        label: eventTitle(event.event_type),
                        description: [
                          event.device_description?.trim() || "Unknown device",
                          event.location_description?.trim(),
                        ].filter(Boolean).join(" • "),
                        control: null,
                      }, `${event.event_type}:${event.id}`),
                    ),
                  }),
                ],
              }, group.key),
            ),
            hasMore
              ? jsx.jsx(Button, {
                  color: "secondary",
                  size: "toolbar",
                  loading: isFetching,
                  disabled: isFetching,
                  onClick: fetchPage,
                  children: jsx.jsx(FormattedMessage, {
                    id: "settings.chatGpt.security.history.loadMore",
                    defaultMessage: "Load more",
                  }),
                })
              : null,
            isFetching && events.length > 0 ? jsx.jsx(LoadingSpinner, {}) : null,
          ],
        });

  return jsx.jsx(SecuritySubpage, {
    title: jsx.jsx(FormattedMessage, securityHistoryMessages.title),
    subtitle: jsx.jsx(FormattedMessage, securityHistoryMessages.description),
    onBack,
    children: body,
  });
}

function initializeSecurityHistory(): void {
  initializeInternationalization();
  initializeSecurityClient();
  initializeSecurityShared();
  initializeSecurityMessages();
}

initializeSecurityHistory();

export { SecurityHistorySettings };
