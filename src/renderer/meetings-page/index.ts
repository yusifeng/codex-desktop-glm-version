import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, e6 as getReactRuntime, type JsxRuntime, type ReactRuntime } from "@rchunk/app-shared";
import { l_n as useRouteParams, o_n as useNavigate } from "@rchunk/app-initial";
import "@rchunk/app-primary";
import { n as AppConnectModalById, r as initializeAppConnectModalById } from "@rchunk/app-connect-modal-by-id";

type MeetingStatus = "completed" | "inProgress" | "unsuccessful";
type LoadState = "error" | "idle" | "loading" | "ready";
interface Attendee { email?: string; name?: string }
interface MeetingRecord { attendees?: Attendee[]; date?: string; id: string; isEmpty?: boolean; privateNote?: boolean; status: MeetingStatus; summary?: string; title: string; transcript?: string }
interface CalendarEvent { attendeeCount?: number; declined?: boolean; end?: string; id: string; meetingId?: string; meetingUrl?: string; responseStatus?: string; start: string; title: string }
interface PageResult<Item> { items: Item[]; nextCursor?: string | null; stale?: boolean }
interface MeetingFilters { completed: boolean; inProgress: boolean; showEmpty: boolean; unsuccessful: boolean }
interface MeetingsService {
  deleteNote?(meetingId: string): Promise<void>;
  loadCalendar?(day: string, cursor?: string): Promise<PageResult<CalendarEvent>>;
  loadMeeting?(meetingId: string): Promise<MeetingRecord>;
  loadMeetings?(filters: MeetingFilters, cursor?: string): Promise<PageResult<MeetingRecord>>;
  refreshCalendar?(): Promise<void>;
  sendFeedback?(meetingId: string, input: { category: string; details: string; includeContent: boolean }): Promise<void>;
  shareMeeting?(meetingId: string, email: string): Promise<void>;
}
interface MeetingsPageProps {
  access?: "allowed" | "denied" | "loading"; accountId?: string; calendarConnected?: boolean; calendarError?: boolean; calendarLoading?: boolean; connectorId?: string; hostId?: string;
  initialCalendarEvents?: CalendarEvent[]; initialCalendarNextCursor?: string | null; initialCalendarStale?: boolean; initialMeeting?: MeetingRecord | null; initialMeetings?: MeetingRecord[]; initialNextCursor?: string | null; initialSearch?: string;
  meetingId?: string | null; onConnectCalendar?(): void; onJoinMeeting?(url: string): void; onNavigate?(path: string): void; service?: MeetingsService; showCalendar?: boolean;
}

let React: ReactRuntime;
let jsx: JsxRuntime;
const defaultFilters: MeetingFilters = { completed: true, inProgress: true, showEmpty: false, unsuccessful: false };
const attendeeText = (meeting: MeetingRecord) => (meeting.attendees ?? []).flatMap((attendee) => [attendee.name ?? "", attendee.email ?? ""]).join(" " ).toLowerCase();
function matchesSearch(meeting: MeetingRecord, query: string): boolean {
  const people = attendeeText(meeting);
  const content = (meeting.title + " " + (meeting.summary ?? "") + " " + (meeting.transcript ?? "")).toLowerCase();
  return query.trim().toLowerCase().split(/\s+/).filter(Boolean).every((term) => term.startsWith("@") ? people.includes(term.slice(1)) : content.includes(term));
}
const matchesFilters = (meeting: MeetingRecord, filters: MeetingFilters) => filters[meeting.status] && (filters.showEmpty || !meeting.isEmpty);
function formatDay(value: string): string { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { dateStyle: "medium" }); }
function shiftDay(day: string, amount: number): string { const date = new Date(day + "T12:00:00"); date.setDate(date.getDate() + amount); return date.toISOString().slice(0, 10); }
const currentDay = () => new Date().toISOString().slice(0, 10);
async function startConversationFromMeeting(meeting: MeetingRecord): Promise<void> {
  // @ts-expect-error The semantic module is emitted by the renderer chunk build.
  const module = await import("@rchunk/use-start-new-conversation");
  const prompt = "Meeting: " + meeting.title + "\n\nNotes:\n" + (meeting.summary ?? "") + "\n\nTranscript:\n" + (meeting.transcript ?? "") + "\n\nUsing this meeting and transcript, tell me about ";
  module.startNewConversation(null, { activeProject: null, codexAppMode: "codex", prefillPrompt: prompt });
}

function MeetingsPage({ access = "allowed", accountId, calendarConnected = false, calendarError = false, calendarLoading = false, connectorId = "google-calendar", hostId, initialCalendarEvents, initialCalendarNextCursor = null, initialCalendarStale = false, initialMeeting, initialMeetings, initialNextCursor = null, initialSearch = "", meetingId: meetingIdOverride, onConnectCalendar, onJoinMeeting, onNavigate, service, showCalendar = true }: MeetingsPageProps = {}): unknown {
  const routeParams = useRouteParams() as { meetingId?: string };
  const navigate = useNavigate();
  const meetingId = meetingIdOverride === undefined ? routeParams.meetingId ?? null : meetingIdOverride;
  const go = (path: string) => onNavigate?.(path) ?? navigate(path);
  const [query, setQuery] = React.useState(initialSearch);
  const [filters, setFilters] = React.useState<MeetingFilters>(defaultFilters);
  const [meetings, setMeetings] = React.useState(initialMeetings ?? []);
  const [meetingState, setMeetingState] = React.useState<LoadState>(initialMeetings === undefined ? "idle" : "ready");
  const [meetingError, setMeetingError] = React.useState("");
  const [nextCursor, setNextCursor] = React.useState(initialNextCursor);
  const [detail, setDetail] = React.useState<MeetingRecord | null>(initialMeeting ?? null);
  const [detailState, setDetailState] = React.useState<LoadState>(initialMeeting === undefined && meetingId ? "idle" : "ready");
  const [detailError, setDetailError] = React.useState("");
  const [calendarDay, setCalendarDay] = React.useState(currentDay);
  const [calendarEvents, setCalendarEvents] = React.useState(initialCalendarEvents ?? []);
  const [calendarNextCursor, setCalendarNextCursor] = React.useState(initialCalendarNextCursor);
  const [calendarState, setCalendarState] = React.useState<LoadState>(initialCalendarEvents === undefined ? "idle" : "ready");
  const [calendarMessage, setCalendarMessage] = React.useState("");
  const [calendarStale, setCalendarStale] = React.useState(initialCalendarStale);
  const [showDeclined, setShowDeclined] = React.useState(false);
  const [showWithoutLinks, setShowWithoutLinks] = React.useState(false);
  const [connectOpen, setConnectOpen] = React.useState(false);
  const [shareOpen, setShareOpen] = React.useState(false);
  const [shareEmail, setShareEmail] = React.useState("");
  const [shareMessage, setShareMessage] = React.useState("");
  const [feedbackOpen, setFeedbackOpen] = React.useState(false);
  const [feedbackCategory, setFeedbackCategory] = React.useState("incorrect_notes");
  const [feedbackDetails, setFeedbackDetails] = React.useState("");
  const [includeContent, setIncludeContent] = React.useState(true);
  const [actionMessage, setActionMessage] = React.useState("");

  const loadMeetings = async (cursor?: string) => {
    if (service?.loadMeetings == null) return; setMeetingState("loading"); setMeetingError("");
    try { const result = await service.loadMeetings(filters, cursor); setMeetings((current) => cursor == null ? result.items : [...current, ...result.items]); setNextCursor(result.nextCursor ?? null); setMeetingState("ready"); }
    catch (error) { setMeetingError(error instanceof Error ? error.message : "Unable to load meetings"); setMeetingState("error"); }
  };
  const loadDetail = async () => {
    if (meetingId == null || service?.loadMeeting == null) return; setDetailState("loading"); setDetailError("");
    try { setDetail(await service.loadMeeting(meetingId)); setDetailState("ready"); } catch (error) { setDetailError(error instanceof Error ? error.message : "Unable to load meeting"); setDetailState("error"); }
  };
  const loadCalendar = async (cursor?: string) => {
    if (service?.loadCalendar == null) return; setCalendarState("loading"); setCalendarMessage("");
    try { const result = await service.loadCalendar(calendarDay, cursor); setCalendarEvents((current) => cursor == null ? result.items : [...current, ...result.items]); setCalendarNextCursor(result.nextCursor ?? null); setCalendarStale(result.stale ?? false); setCalendarState("ready"); }
    catch (error) { setCalendarMessage(error instanceof Error ? error.message : "Unable to load calendar"); setCalendarState("error"); }
  };
  React.useEffect(() => { if (access !== "allowed") return; if (meetingId != null && initialMeeting === undefined) void loadDetail(); if (meetingId == null && initialMeetings === undefined) void loadMeetings(); }, [access, meetingId]);
  React.useEffect(() => { if (access === "allowed" && meetingId == null && showCalendar && calendarConnected && initialCalendarEvents === undefined) void loadCalendar(); }, [access, calendarConnected, calendarDay, meetingId, showCalendar]);

  if (access === "loading") return jsx.jsx("p", { role: "status", children: "Loading meetings access…" });
  if (access === "denied" || accountId === "") return jsx.jsxs("main", { children: [jsx.jsx("h1", { children: "Meetings" }), jsx.jsx("p", { role: "alert", children: "Meetings aren't available for this account." })] });

  if (meetingId != null) {
    if (detailState === "idle" || detailState === "loading") return jsx.jsx("p", { role: "status", children: "Loading meeting…" });
    if (detailState === "error") return jsx.jsxs("div", { role: "alert", children: ["Couldn't load meeting. Try again.", detailError ? jsx.jsx("small", { children: detailError }) : null, jsx.jsx("button", { type: "button", onClick: () => void loadDetail(), children: "Try again" })] });
    if (detail == null) return jsx.jsx("p", { role: "status", children: "Meeting not found" });
    const submitShare = async () => { if (service?.shareMeeting == null || shareEmail.trim() === "") return; setShareMessage("Sharing…"); try { await service.shareMeeting(detail.id, shareEmail.trim()); setShareMessage("Meeting shared"); } catch { setShareMessage("Couldn't share meeting"); } };
    const submitFeedback = async () => { if (service?.sendFeedback == null) return; setActionMessage("Sending feedback…"); try { await service.sendFeedback(detail.id, { category: feedbackCategory, details: feedbackDetails, includeContent }); setActionMessage("Feedback sent"); } catch { setActionMessage("Couldn't send feedback"); } };
    const deleteNote = async () => { if (service?.deleteNote == null) return; try { await service.deleteNote(detail.id); go("/meetings"); } catch { setActionMessage("Couldn't delete note"); } };
    return jsx.jsxs("main", { className: "meetings-page meetings-detail", children: [
      jsx.jsx("button", { type: "button", onClick: () => go("/meetings"), children: "Back to meetings" }), jsx.jsx("h1", { children: detail.title }),
      detail.date ? jsx.jsx("time", { children: formatDay(detail.date) }) : null, detail.status === "inProgress" ? jsx.jsx("p", { role: "status", children: "Processing" }) : null, detail.status === "unsuccessful" ? jsx.jsx("p", { role: "alert", children: "Meeting processing was unsuccessful" }) : null,
      detail.attendees?.length ? jsx.jsx("p", { children: detail.attendees.map((attendee) => attendee.name ?? attendee.email ?? "Unknown attendee").join(", ") }) : null,
      jsx.jsxs("nav", { "aria-label": "Meeting actions", children: [jsx.jsx("button", { type: "button", onClick: () => void startConversationFromMeeting(detail).catch(() => setActionMessage("Couldn't prepare this meeting. Try again.")), children: "New conversation" }), jsx.jsx("button", { type: "button", onClick: () => setShareOpen(true), children: "Share" }), jsx.jsx("button", { type: "button", onClick: () => setFeedbackOpen(true), children: "Codex feedback" }), detail.privateNote ? jsx.jsx("button", { type: "button", onClick: () => void deleteNote(), children: "Delete note" }) : null] }),
      actionMessage ? jsx.jsx("p", { role: actionMessage.startsWith("Couldn't") ? "alert" : "status", children: actionMessage }) : null,
      jsx.jsxs("section", { children: [jsx.jsx("h2", { children: "Summary" }), jsx.jsx("p", { children: detail.summary || "No summary available" })] }), jsx.jsxs("section", { children: [jsx.jsx("h2", { children: "Transcript" }), jsx.jsx("p", { children: detail.transcript || "No transcript available" })] }),
      shareOpen ? jsx.jsxs("div", { role: "dialog", "aria-label": "Share meeting", children: [jsx.jsx("h2", { children: "Share meeting" }), jsx.jsx("input", { "aria-label": "Email address", type: "email", value: shareEmail, onChange: (event: { currentTarget: { value: string } }) => setShareEmail(event.currentTarget.value) }), jsx.jsx("button", { type: "button", disabled: shareEmail.trim() === "", onClick: () => void submitShare(), children: "Share meeting" }), jsx.jsx("button", { type: "button", onClick: () => setShareOpen(false), children: "Cancel" }), shareMessage ? jsx.jsx("p", { role: shareMessage.startsWith("Couldn't") ? "alert" : "status", children: shareMessage }) : null] }) : null,
      feedbackOpen ? jsx.jsxs("div", { role: "dialog", "aria-label": "Meeting feedback", children: [jsx.jsx("h2", { children: "Codex feedback" }), jsx.jsx("select", { "aria-label": "Issue category", value: feedbackCategory, onChange: (event: { currentTarget: { value: string } }) => setFeedbackCategory(event.currentTarget.value), children: [jsx.jsx("option", { value: "incorrect_notes", children: "Incorrect notes" }), jsx.jsx("option", { value: "missing_content", children: "Missing content" }), jsx.jsx("option", { value: "other", children: "Other" })] }), jsx.jsx("textarea", { "aria-label": "Feedback details", value: feedbackDetails, onChange: (event: { currentTarget: { value: string } }) => setFeedbackDetails(event.currentTarget.value) }), jsx.jsx("label", { children: [jsx.jsx("input", { type: "checkbox", checked: includeContent, onChange: () => setIncludeContent((value) => !value) }), "Include meeting content"] }), jsx.jsx("button", { type: "button", onClick: () => void submitFeedback(), children: "Submit feedback" }), jsx.jsx("button", { type: "button", onClick: () => setFeedbackOpen(false), children: "Cancel" })] }) : null,
    ] });
  }

  const visibleMeetings = meetings.filter((meeting) => matchesFilters(meeting, filters) && matchesSearch(meeting, query));
  const visibleCalendarEvents = calendarEvents.filter((event) => (showDeclined || !event.declined) && (showWithoutLinks || event.meetingUrl != null || event.meetingId != null));
  const meetingStatus = meetingState === "idle" || meetingState === "loading" ? jsx.jsx("p", { role: "status", children: "Loading meetings…" }) : meetingState === "error" ? jsx.jsxs("div", { role: "alert", children: ["Couldn't load meetings. Try again.", meetingError ? jsx.jsx("small", { children: meetingError }) : null, jsx.jsx("button", { type: "button", onClick: () => void loadMeetings(), children: "Try again" })] }) : visibleMeetings.length === 0 ? jsx.jsx("p", { role: "status", children: "No meeting notes found" }) : jsx.jsx("ul", { children: visibleMeetings.map((meeting) => jsx.jsx("li", { children: jsx.jsxs("button", { type: "button", onClick: () => go("/meetings/" + encodeURIComponent(meeting.id) + (query ? "?q=" + encodeURIComponent(query) : "")), children: [jsx.jsx("strong", { children: meeting.title }), meeting.date ? jsx.jsx("time", { children: formatDay(meeting.date) }) : null, meeting.status === "inProgress" ? jsx.jsx("span", { children: "Processing" }) : null, meeting.status === "unsuccessful" ? jsx.jsx("span", { children: "Unsuccessful" }) : null] }) }, meeting.id)) });
  const connectCalendar = () => { onConnectCalendar?.(); setConnectOpen(true); };
  const calendarContent = !showCalendar ? null : !calendarConnected ? jsx.jsx("button", { type: "button", onClick: connectCalendar, children: "Connect Google Calendar" }) : jsx.jsxs("section", { children: [
    jsx.jsx("h2", { children: "Upcoming" }), jsx.jsxs("div", { children: [jsx.jsx("button", { type: "button", onClick: () => setCalendarDay((day) => shiftDay(day, -1)), children: "Previous day" }), jsx.jsx("time", { children: formatDay(calendarDay) }), jsx.jsx("button", { type: "button", onClick: () => setCalendarDay((day) => shiftDay(day, 1)), children: "Next day" }), jsx.jsx("button", { type: "button", onClick: () => void service?.refreshCalendar?.().then(() => loadCalendar()), children: "Refresh calendar" })] }),
    jsx.jsx("label", { children: [jsx.jsx("input", { type: "checkbox", checked: showDeclined, onChange: () => setShowDeclined((value) => !value) }), "Show declined"] }), jsx.jsx("label", { children: [jsx.jsx("input", { type: "checkbox", checked: showWithoutLinks, onChange: () => setShowWithoutLinks((value) => !value) }), "Show events without links"] }),
    calendarStale ? jsx.jsx("p", { role: "alert", children: "Calendar may be out of date" }) : null, calendarLoading || calendarState === "loading" ? jsx.jsx("p", { role: "status", children: "Loading calendar…" }) : calendarError || calendarState === "error" ? jsx.jsxs("div", { role: "alert", children: ["Couldn't load calendar. Try again.", calendarMessage ? jsx.jsx("small", { children: calendarMessage }) : null, jsx.jsx("button", { type: "button", onClick: () => void loadCalendar(), children: "Try again" })] }) : visibleCalendarEvents.length === 0 ? jsx.jsx("p", { role: "status", children: "No upcoming meetings match your settings for this day" }) : jsx.jsx("ul", { children: visibleCalendarEvents.map((event) => jsx.jsxs("li", { "data-calendar-event": event.id, children: [jsx.jsx("strong", { children: event.title }), jsx.jsx("time", { children: event.start + (event.end ? " – " + event.end : "") }), event.responseStatus ? jsx.jsx("span", { children: event.responseStatus }) : null, event.attendeeCount == null ? null : jsx.jsx("span", { children: String(event.attendeeCount) + " attendees" }), event.meetingUrl ? jsx.jsx("button", { type: "button", onClick: () => onJoinMeeting?.(event.meetingUrl as string), children: "Join meeting" }) : event.meetingId ? jsx.jsx("button", { type: "button", onClick: () => go("/meetings/" + encodeURIComponent(event.meetingId as string)), children: "Open meeting" }) : jsx.jsx("span", { children: "No meeting link available" })] }, event.id)) }),
    calendarNextCursor ? jsx.jsx("button", { type: "button", onClick: () => void loadCalendar(calendarNextCursor), children: "Load more upcoming meetings" }) : null,
  ] });
  return jsx.jsxs("main", { className: "meetings-page", children: [
    jsx.jsxs("header", { children: [jsx.jsx("h1", { children: "Meetings" }), jsx.jsx("button", { type: "button", onClick: () => go("/c/new"), children: "Record a meeting" }), jsx.jsx("button", { type: "button", onClick: () => setFeedbackOpen(true), children: "Codex feedback" })] }), calendarContent,
    connectOpen ? jsx.jsx(AppConnectModalById, { connectorId, hostId, onOpenChange: setConnectOpen, productSku: "CONNECTOR_SETTING", redirectAfter: "/meetings?connected=1" }) : null,
    jsx.jsxs("section", { children: [jsx.jsxs("header", { children: [jsx.jsx("h2", { children: "Past notes" }), jsx.jsx("button", { type: "button", onClick: () => void loadMeetings(), children: "Refresh notes" })] }), jsx.jsx("input", { "aria-label": "Search meeting notes", placeholder: "Search notes", value: query, onChange: (event: { currentTarget: { value: string } }) => setQuery(event.currentTarget.value), onKeyDown: (event: { key: string }) => { if (event.key === "Escape") setQuery(""); } }), jsx.jsx("fieldset", { children: (["completed", "inProgress", "unsuccessful", "showEmpty"] as const).map((key) => jsx.jsx("label", { children: [jsx.jsx("input", { type: "checkbox", checked: filters[key], onChange: () => setFilters((current) => ({ ...current, [key]: !current[key] })) }), key === "inProgress" ? "In progress" : key === "showEmpty" ? "Show empty" : key[0].toUpperCase() + key.slice(1)] }, key)) }), meetingStatus, nextCursor ? jsx.jsx("button", { type: "button", onClick: () => void loadMeetings(nextCursor), children: "Load more" }) : null] }),
  ] });
}
function initializeMeetingsPage(): void { React = getReactRuntime(); jsx = getJsxRuntime(); initializeAppConnectModalById(); }
initializeMeetingsPage();
export { MeetingsPage };
