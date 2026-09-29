// flight-search-form —— 对话输入区中的结构化航班搜索表单。
// 发布版：app/webview/assets/form-888969b4117e.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as datePickerChunk from "@rchunk/date-picker-runtime";
import * as platformProviderChunk from "@rchunk/platform-ui-kit-provider";
import type { IntlShape, JsxRuntime, ReactRuntime } from "@rchunk/app-shared";

void runtimeChunk;
void appInitialChunk;
void appPrimaryChunk;
void datePickerChunk;

type TripType = "one_way" | "round_trip";
type CabinClass = "economy" | "premium_economy" | "business" | "first";

interface FlightSearchDraft {
  trip_type?: TripType;
  origin?: string;
  destination?: string;
  departure_date?: string;
  return_date?: string;
  party_size?: number;
  cabin_class?: CabinClass;
  max_connections?: number;
}

interface NormalizedFlightSearchDraft {
  trip_type: TripType;
  origin: string;
  destination: string;
  departure_date: string;
  return_date: string;
  party_size: number;
  cabin_class: CabinClass;
  max_connections?: number;
}

interface FlightSearchSession {
  draft: NormalizedFlightSearchDraft;
  adjustment: string;
  editor: "origin" | "destination" | "dates" | "travelers" | null;
}

interface FlightSearchFormProps {
  draft: FlightSearchDraft;
  initialSession?: FlightSearchSession | null;
  onDismiss(): void;
  onSessionChange?(session: FlightSearchSession): void;
  onSubmit(message: string): void;
}

interface SharedBindings {
  I3(): JsxRuntime;
  e6(): ReactRuntime;
  n4(): IntlShape;
}

interface PlatformProviderBindings {
  n?: (props: { children?: unknown; locale?: string; timeZone?: string }) => unknown;
}

const { I3: getJsxRuntime, e6: getReactRuntime, n4: useIntl } =
  appSharedChunk as unknown as SharedBindings;
const { n: PlatformUIKitProvider } =
  platformProviderChunk as unknown as PlatformProviderBindings;
const jsx = getJsxRuntime();
const React = getReactRuntime();

function isConnectionLimit(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 9;
}

function normalizeDraft(input: FlightSearchDraft): NormalizedFlightSearchDraft {
  const tripType = input.trip_type ?? (input.return_date ? "round_trip" : "one_way");
  const partySize =
    input.party_size != null && Number.isSafeInteger(input.party_size) && input.party_size >= 1
      ? input.party_size
      : 1;
  const maxConnections =
    input.max_connections != null && isConnectionLimit(input.max_connections)
      ? input.max_connections
      : undefined;
  return {
    trip_type: tripType,
    origin: input.origin?.trim() ?? "",
    destination: input.destination?.trim() ?? "",
    departure_date: input.departure_date ?? "",
    return_date: tripType === "round_trip" ? (input.return_date ?? "") : "",
    party_size: partySize,
    cabin_class: input.cabin_class ?? "economy",
    ...(maxConnections == null ? {} : { max_connections: maxConnections }),
  };
}

function isIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match == null) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const length = month === 2 ? (leap ? 29 : 28) : [4, 6, 9, 11].includes(month) ? 30 : 31;
  return day <= length;
}

function localIsoDate(): string {
  const today = new Date();
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
}

function canSearch(draft: NormalizedFlightSearchDraft, today: string): boolean {
  const origin = draft.origin.trim();
  const destination = draft.destination.trim();
  const routeValid =
    origin.length > 0 && origin.length <= 120 &&
    destination.length > 0 && destination.length <= 120 &&
    origin.toLocaleLowerCase("en-US") !== destination.toLocaleLowerCase("en-US");
  const datesValid =
    isIsoDate(draft.departure_date) && draft.departure_date >= today &&
    (draft.trip_type === "one_way" ||
      (isIsoDate(draft.return_date) && draft.return_date >= draft.departure_date));
  const travelersValid =
    Number.isInteger(draft.party_size) && draft.party_size >= 1 && draft.party_size <= 9 &&
    (draft.max_connections == null || isConnectionLimit(draft.max_connections));
  return routeValid && datesValid && travelersValid;
}

function cabinLabel(value: CabinClass): string {
  if (value === "premium_economy") return "Premium economy";
  if (value === "business") return "Business";
  if (value === "first") return "First";
  return "Economy";
}

function connectionLabel(value: number | undefined): string {
  if (value == null) return "Any number of connections is fine.";
  if (value === 0) return "Only nonstop flights.";
  if (value === 1) return "At most one connection in each direction.";
  return "At most " + value + " connections in each direction.";
}

function submissionMessage(
  intl: IntlShape,
  draft: NormalizedFlightSearchDraft,
  adjustment: string,
): string {
  const changes = adjustment.trim();
  if (changes) {
    return String(intl.formatMessage(
      {
        id: "flightSearch.submission.adjustment",
        defaultMessage: "Please update my flight search. Current details: {tripType}; from {origin} to {destination}; departure {departureDate}; return {returnDate}; adults {partySize}; {cabinClass}; {connections}. My changes: {changes}",
      },
      {
        tripType: draft.trip_type === "round_trip" ? "Round trip" : "One way",
        origin: draft.origin || "Not specified",
        destination: draft.destination || "Not specified",
        departureDate: draft.departure_date || "Not specified",
        returnDate: draft.trip_type === "one_way" ? "No return flight" : draft.return_date || "Not specified",
        partySize: draft.party_size,
        cabinClass: cabinLabel(draft.cabin_class),
        connections: connectionLabel(draft.max_connections),
        changes,
      },
    ));
  }
  const route = draft.trip_type === "round_trip"
    ? "flights from " + draft.origin + " to " + draft.destination + ", departing " + draft.departure_date + " and returning " + draft.return_date
    : "one-way flights from " + draft.origin + " to " + draft.destination + ", departing " + draft.departure_date;
  return "Search for " + cabinLabel(draft.cabin_class) + " " + route + ", for " +
    draft.party_size + " " + (draft.party_size === 1 ? "adult" : "adults") + ". " +
    connectionLabel(draft.max_connections);
}

function FlightSearchForm({
  draft,
  initialSession,
  onDismiss,
  onSessionChange,
  onSubmit,
}: FlightSearchFormProps): unknown {
  const intl = useIntl();
  const [session, setSession] = React.useState<FlightSearchSession>(() =>
    initialSession ?? { draft: normalizeDraft(draft), adjustment: "", editor: null },
  );
  const today = localIsoDate();
  const updateSession = (patch: Partial<FlightSearchSession>) => {
    const next = { ...session, ...patch };
    setSession(next);
    onSessionChange?.(next);
  };
  const updateDraft = (patch: Partial<NormalizedFlightSearchDraft>) => {
    const nextDraft = { ...session.draft, ...patch };
    if (patch.trip_type === "one_way") nextDraft.return_date = "";
    updateSession({ draft: nextDraft });
  };
  const enabled = canSearch(session.draft, today) || session.adjustment.trim().length > 0;
  const submit = () => {
    if (enabled) onSubmit(submissionMessage(intl, session.draft, session.adjustment));
  };

  const field = (
    label: string,
    testId: string,
    value: string | number,
    onChange: (value: string) => void,
    options?: { type?: string; min?: string | number; max?: number },
  ) => jsx.jsxs("label", {
    children: [label, jsx.jsx("input", {
      "data-testid": testId,
      type: options?.type,
      min: options?.min,
      max: options?.max,
      value,
      onChange: (event: { currentTarget: { value: string } }) => onChange(event.currentTarget.value),
    })],
  });

  const content = jsx.jsxs("section", {
    role: "region",
    "aria-label": "Flight search",
    "data-testid": "flight-search-form",
    children: [
      jsx.jsxs("header", { children: [
        jsx.jsx("h2", { children: "Flight search" }),
        jsx.jsx("button", { type: "button", "aria-label": "Close flight search", onClick: onDismiss, children: "Close" }),
      ] }),
      jsx.jsxs("form", {
        onSubmit: (event: { preventDefault(): void }) => { event.preventDefault(); submit(); },
        children: [
          jsx.jsxs("label", { children: ["Trip type", jsx.jsxs("select", {
            "data-testid": "trip-type",
            value: session.draft.trip_type,
            onChange: (event: { currentTarget: { value: string } }) => updateDraft({ trip_type: event.currentTarget.value as TripType }),
            children: [
              jsx.jsx("option", { value: "round_trip", children: "Round trip" }),
              jsx.jsx("option", { value: "one_way", children: "One way" }),
            ],
          })] }),
          field("Departing from", "origin", session.draft.origin, value => updateDraft({ origin: value })),
          field("Arriving at", "destination", session.draft.destination, value => updateDraft({ destination: value })),
          field("Departure date", "departure-date", session.draft.departure_date, value => updateDraft({ departure_date: value }), { type: "date", min: today }),
          session.draft.trip_type === "round_trip"
            ? field("Return date", "return-date", session.draft.return_date, value => updateDraft({ return_date: value }), { type: "date", min: session.draft.departure_date || today })
            : null,
          field("Adults", "party-size", session.draft.party_size, value => updateDraft({ party_size: Number(value) }), { type: "number", min: 1, max: 9 }),
          jsx.jsxs("label", { children: ["Cabin", jsx.jsxs("select", {
            "data-testid": "cabin-class",
            value: session.draft.cabin_class,
            onChange: (event: { currentTarget: { value: string } }) => updateDraft({ cabin_class: event.currentTarget.value as CabinClass }),
            children: ["economy", "premium_economy", "business", "first"].map(value => jsx.jsx("option", { value, children: cabinLabel(value as CabinClass) }, value)),
          })] }),
          jsx.jsxs("label", { children: ["Maximum connections", jsx.jsxs("select", {
            "data-testid": "max-connections",
            value: session.draft.max_connections == null ? "any" : String(session.draft.max_connections),
            onChange: (event: { currentTarget: { value: string } }) => updateDraft({ max_connections: event.currentTarget.value === "any" ? undefined : Number(event.currentTarget.value) }),
            children: [
              jsx.jsx("option", { value: "any", children: "Any" }),
              jsx.jsx("option", { value: "0", children: "Nonstop" }),
              jsx.jsx("option", { value: "1", children: "At most one" }),
              jsx.jsx("option", { value: "2", children: "At most two" }),
            ],
          })] }),
          field("Adjust your flight search", "adjustment", session.adjustment, value => updateSession({ adjustment: value })),
          jsx.jsx("button", { type: "submit", "data-testid": "search", disabled: !enabled, children: "Search" }),
        ],
      }),
    ],
  });
  return PlatformUIKitProvider == null
    ? content
    : jsx.jsx(PlatformUIKitProvider, { locale: intl.locale, children: content });
}

export { FlightSearchForm };
