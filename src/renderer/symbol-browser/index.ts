import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/color-palette";
import { EMOJI_CATALOG, type EmojiCatalogEntry } from "./emoji-data.generated";

const {
  $3: initializeRuntimeLazy,
  I3: getJsxRuntime,
  e6: getReactRuntime,
  n4: useIntl,
} = appSharedChunk;

type SymbolKind = "emoji" | "icon";
type SelectionSource = "keyboard" | "pointer";

interface EmojiCapability {
  allowedEmojis?: readonly string[];
  getEmojiLabel?(emoji: string): string;
  selectedEmojis?: readonly string[];
}

interface IconCapability {
  allowedIcons?: readonly string[];
  color?: string;
  onColorChange?(color: string): void;
  selectedIcon?: string;
}

interface SymbolCapabilities {
  emoji?: EmojiCapability;
  icons?: IconCapability;
}

interface SymbolChoice {
  kind: SymbolKind;
  metadata: {
    categoryId?: string;
    color?: string;
    keywords?: readonly string[];
    label: string;
  };
  value: string;
}

interface SymbolSelection extends SymbolChoice {
  source: SelectionSource;
}

interface MutableRef<Value> {
  current: Value;
}

type InputRef = MutableRef<HTMLInputElement | null> | ((value: HTMLInputElement | null) => void) | null;

interface SymbolBrowserProps {
  autoFocus?: boolean;
  availableHeight?: number | string;
  capabilities: SymbolCapabilities;
  disabled?: boolean;
  footer?: unknown;
  inputRef?: InputRef;
  inputValue?: string;
  keyboardTarget?: EventTarget | null;
  kind: SymbolKind;
  onClear?(): void;
  onKindChange?(kind: SymbolKind): void;
  onQueryChange(query: string): void;
  onReturnToSearch?(): void;
  onSelect(selection: SymbolSelection): void;
  query: string;
  showSearch?: boolean;
}

interface IconCatalogEntry {
  categoryId: "creative" | "learning" | "nature" | "travel" | "wellbeing" | "work";
  glyph: string;
  id: string;
  keywords: readonly string[];
  label: string;
}

interface ChoiceSection {
  choices: readonly SymbolChoice[];
  heading: string;
  id: string;
}

const RECENT_EMOJI_STORAGE_KEY = "emoji-recent-v1";
const CATEGORY_ORDER = [
  "Smileys & Emotion",
  "People & Body",
  "Animals & Nature",
  "Food & Drink",
  "Travel & Places",
  "Activities",
  "Objects",
  "Symbols",
  "Flags",
] as const;
const SUGGESTED_EMOJIS = ["😄", "👍", "❤️", "🎉", "🚀", "👀", "🙏", "🔥"] as const;
const ICON_COLORS = ["black", "orange", "yellow", "green", "blue", "purple", "pink", "red"] as const;
const ICONS: readonly IconCatalogEntry[] = [
  { id: "folder", label: "Folder", glyph: "📁", categoryId: "work", keywords: ["files", "documents", "organize", "project", "workspace"] },
  { id: "currency-dollar", label: "Currency Dollar", glyph: "$", categoryId: "work", keywords: ["money", "finance", "budget", "bank", "payment", "business"] },
  { id: "bar-chart", label: "Bar Chart", glyph: "📊", categoryId: "work", keywords: ["analytics", "data", "statistics", "report", "growth", "business"] },
  { id: "function", label: "Code Brackets", glyph: "ƒ", categoryId: "work", keywords: ["developer", "code", "programming", "software", "math", "formula"] },
  { id: "terminal", label: "Terminal", glyph: ">_", categoryId: "work", keywords: ["developer", "code", "command", "console", "shell", "computer"] },
  { id: "logs", label: "Logs", glyph: "📋", categoryId: "work", keywords: ["notebook", "journal", "records", "notes", "list", "tracking"] },
  { id: "scale", label: "Balancing Scale", glyph: "⚖️", categoryId: "work", keywords: ["law", "legal", "justice", "balance", "decision", "weight"] },
  { id: "wrench", label: "Wrench", glyph: "🔧", categoryId: "work", keywords: ["tools", "repair", "build", "maintenance", "settings", "engineering"] },
  { id: "book", label: "Book", glyph: "📖", categoryId: "learning", keywords: ["reading", "study", "education", "library", "literature"] },
  { id: "graduation-cap", label: "Graduation Cap", glyph: "🎓", categoryId: "learning", keywords: ["school", "university", "college", "education", "degree", "study"] },
  { id: "flask", label: "Flask", glyph: "⚗️", categoryId: "learning", keywords: ["science", "chemistry", "experiment", "laboratory", "research"] },
  { id: "brain", label: "Brain", glyph: "🧠", categoryId: "learning", keywords: ["thinking", "idea", "knowledge", "intelligence", "psychology", "mind"] },
  { id: "edit", label: "Pencil", glyph: "✏️", categoryId: "creative", keywords: ["pencil", "writing", "drawing", "draft", "notes"] },
  { id: "writing", label: "Writing", glyph: "🖋️", categoryId: "creative", keywords: ["pen", "author", "journal", "essay", "story", "draft"] },
  { id: "music", label: "Music", glyph: "♪", categoryId: "creative", keywords: ["audio", "sound", "song", "playlist", "instrument"] },
  { id: "popcorn", label: "Popcorn", glyph: "🍿", categoryId: "creative", keywords: ["movie", "film", "cinema", "entertainment", "snack"] },
  { id: "customize", label: "Customize", glyph: "✨", categoryId: "creative", keywords: ["design", "drawing", "art", "tools", "pens", "personalize"] },
  { id: "palette", label: "Palette", glyph: "🎨", categoryId: "creative", keywords: ["paint", "color", "art", "design", "drawing"] },
  { id: "stethoscope", label: "Stethoscope", glyph: "🩺", categoryId: "wellbeing", keywords: ["doctor", "medical", "medicine", "hospital", "care", "health"] },
  { id: "health", label: "Health", glyph: "⚕️", categoryId: "wellbeing", keywords: ["medical", "medicine", "emergency", "ambulance", "care"] },
  { id: "lotus", label: "Lotus", glyph: "🪷", categoryId: "wellbeing", keywords: ["meditation", "mindfulness", "yoga", "calm", "relax", "wellness"] },
  { id: "kettlebell", label: "Kettlebell", glyph: "🏋️", categoryId: "wellbeing", keywords: ["fitness", "exercise", "gym", "workout", "strength", "weight"] },
  { id: "dumbbell", label: "Dumbbell", glyph: "🏋️", categoryId: "wellbeing", keywords: ["fitness", "exercise", "gym", "workout", "strength", "weight"] },
  { id: "heart", label: "Heart", glyph: "♥", categoryId: "wellbeing", keywords: ["love", "care", "favorite", "relationship", "emotion"] },
  { id: "suitcase", label: "Suitcase", glyph: "💼", categoryId: "travel", keywords: ["vacation", "trip", "luggage", "packing", "holiday", "business"] },
  { id: "desk-globe", label: "Globe Spin", glyph: "🌐", categoryId: "travel", keywords: ["world", "earth", "geography", "map", "countries", "explore"] },
  { id: "plane", label: "Plane", glyph: "✈️", categoryId: "travel", keywords: ["vacation", "flight", "airport", "trip", "holiday", "airplane"] },
  { id: "globe", label: "Globe", glyph: "🌍", categoryId: "travel", keywords: ["world", "earth", "internet", "website", "global", "language"] },
  { id: "paw", label: "Paw", glyph: "🐾", categoryId: "nature", keywords: ["pet", "animal", "dog", "cat", "wildlife"] },
  { id: "plant", label: "Plant", glyph: "🌱", categoryId: "nature", keywords: ["garden", "growth", "leaves", "environment", "ecology", "green"] },
];
const ICON_CATEGORY_LABELS: Record<IconCatalogEntry["categoryId"], string> = {
  creative: "Creative",
  learning: "Learning",
  nature: "Nature",
  travel: "Travel and places",
  wellbeing: "Health and wellbeing",
  work: "Work",
};
const EMOJI_BY_VALUE = new Map(EMOJI_CATALOG.map((entry) => [normalizeEmoji(entry.emoji), entry]));

let React: import("@rchunk/app-shared").ReactRuntime;
let jsx: import("@rchunk/app-shared").JsxRuntime;

function normalizeEmoji(value: string): string {
  return value.replaceAll("️", "");
}

function normalizeQuery(value: string): string[] {
  return value.trim().replace(/^:+|:+$/g, "").toLocaleLowerCase().split(/[\s_-]+/).filter(Boolean);
}

function matchesQuery(label: string, keywords: readonly string[], query: readonly string[]): boolean {
  const normalizedLabel = label.toLocaleLowerCase();
  return query.every((part) => normalizedLabel.includes(part) || keywords.some((keyword) => keyword.includes(part)));
}

function readRecentEmojis(): string[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const value: unknown = JSON.parse(localStorage.getItem(RECENT_EMOJI_STORAGE_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, 16) : [];
  } catch {
    return [];
  }
}

function writeRecentEmojis(values: readonly string[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(RECENT_EMOJI_STORAGE_KEY, JSON.stringify(values));
  } catch {
    // Persistence is best-effort; selection must continue to work in restricted storage contexts.
  }
}

function setInputRef(ref: InputRef | undefined, value: HTMLInputElement | null): void {
  if (typeof ref === "function") ref(value);
  else if (ref != null) ref.current = value;
}

function emojiChoice(entry: EmojiCatalogEntry, capability: EmojiCapability): SymbolChoice {
  return {
    kind: "emoji",
    value: entry.emoji,
    metadata: {
      categoryId: entry.category,
      keywords: entry.keywords,
      label: capability.getEmojiLabel?.(entry.emoji) ?? entry.name,
    },
  };
}

function allowedEmojiChoice(emoji: string, capability: EmojiCapability): SymbolChoice {
  const entry = EMOJI_BY_VALUE.get(normalizeEmoji(emoji));
  return {
    kind: "emoji",
    value: emoji,
    metadata: {
      categoryId: entry?.category,
      keywords: entry?.keywords,
      label: capability.getEmojiLabel?.(emoji) ?? entry?.name ?? emoji,
    },
  };
}

function buildEmojiSections(capability: EmojiCapability, queryText: string, recent: readonly string[]): ChoiceSection[] {
  const query = normalizeQuery(queryText);
  if (capability.allowedEmojis != null) {
    return [{
      id: "allowed",
      heading: "Emojis",
      choices: capability.allowedEmojis.map((emoji) => allowedEmojiChoice(emoji, capability)).filter((choice) =>
        query.length === 0 || matchesQuery(choice.metadata.label, choice.metadata.keywords ?? [], query)),
    }];
  }
  if (query.length > 0) {
    return [{
      id: "results",
      heading: "Results",
      choices: EMOJI_CATALOG.filter((entry) => matchesQuery(entry.name, entry.keywords, query)).map((entry) => emojiChoice(entry, capability)),
    }];
  }
  const recentEntries = recent.flatMap((emoji) => {
    const entry = EMOJI_BY_VALUE.get(normalizeEmoji(emoji));
    return entry == null ? [] : [entry];
  });
  const suggestions = (recentEntries.length > 0 ? recentEntries : SUGGESTED_EMOJIS.flatMap((emoji) => EMOJI_BY_VALUE.get(normalizeEmoji(emoji)) ?? []))
    .filter((entry, index, entries) => entries.findIndex((candidate) => normalizeEmoji(candidate.emoji) === normalizeEmoji(entry.emoji)) === index)
    .slice(0, 8);
  return [
    { id: "suggested", heading: recentEntries.length > 0 ? "Recently used" : "Suggested", choices: suggestions.map((entry) => emojiChoice(entry, capability)) },
    ...CATEGORY_ORDER.map((category) => ({
      id: category.toLocaleLowerCase().replaceAll(/[^a-z]+/g, "-"),
      heading: category,
      choices: EMOJI_CATALOG.filter((entry) => entry.category === category).map((entry) => emojiChoice(entry, capability)),
    })),
  ];
}

function buildIconSections(capability: IconCapability, queryText: string): ChoiceSection[] {
  const query = normalizeQuery(queryText);
  const allowed = capability.allowedIcons == null ? null : new Set(capability.allowedIcons);
  const filtered = ICONS.filter((icon) => (allowed == null || allowed.has(icon.id)) && matchesQuery(icon.label, icon.keywords, query));
  if (query.length > 0) {
    return [{ id: "results", heading: "Icons", choices: filtered.map((icon) => iconChoice(icon, capability)) }];
  }
  return (Object.keys(ICON_CATEGORY_LABELS) as IconCatalogEntry["categoryId"][]).flatMap((categoryId) => {
    const icons = filtered.filter((icon) => icon.categoryId === categoryId);
    return icons.length === 0 ? [] : [{ id: categoryId, heading: ICON_CATEGORY_LABELS[categoryId], choices: icons.map((icon) => iconChoice(icon, capability)) }];
  });
}

function iconChoice(icon: IconCatalogEntry, capability: IconCapability): SymbolChoice {
  return {
    kind: "icon",
    value: icon.id,
    metadata: {
      categoryId: icon.categoryId,
      color: capability.color,
      keywords: icon.keywords,
      label: icon.label,
    },
  };
}

function handleGridKeyDown(event: KeyboardEvent, onReturnToSearch?: () => void): void {
  const target = event.currentTarget as HTMLElement;
  const buttons = Array.from(target.querySelectorAll<HTMLButtonElement>("button[data-symbol-choice]:not(:disabled)"));
  const activeIndex = buttons.indexOf(event.target as HTMLButtonElement);
  if (activeIndex < 0) return;
  let nextIndex = activeIndex;
  if (event.key === "ArrowRight") nextIndex += 1;
  else if (event.key === "ArrowLeft") nextIndex -= 1;
  else if (event.key === "ArrowDown") nextIndex += 8;
  else if (event.key === "ArrowUp") {
    if (activeIndex < 8 && onReturnToSearch != null) {
      event.preventDefault();
      onReturnToSearch();
      return;
    }
    nextIndex -= 8;
  } else if (event.key === "Home") nextIndex = 0;
  else if (event.key === "End") nextIndex = buttons.length - 1;
  else return;
  event.preventDefault();
  buttons[Math.max(0, Math.min(buttons.length - 1, nextIndex))]?.focus();
}

function SymbolBrowser(props: SymbolBrowserProps): unknown {
  initializeSymbolBrowser();
  const intl = useIntl();
  const {
    autoFocus = true,
    availableHeight = "100vh",
    capabilities,
    disabled = false,
    footer,
    inputRef,
    inputValue,
    keyboardTarget,
    kind,
    onClear,
    onKindChange,
    onQueryChange,
    onReturnToSearch,
    onSelect,
    query,
    showSearch = true,
  } = props;
  const [recentEmojis, setRecentEmojis] = React.useState<string[]>(readRecentEmojis);
  const localInputRef = React.useRef<HTMLInputElement | null>(null);
  const sections = React.useMemo(() => kind === "emoji"
    ? buildEmojiSections(capabilities.emoji ?? {}, query, recentEmojis)
    : buildIconSections(capabilities.icons ?? {}, query), [capabilities.emoji, capabilities.icons, kind, query, recentEmojis]);
  const choices = sections.flatMap((section) => section.choices);
  const selectedValues = kind === "emoji" ? capabilities.emoji?.selectedEmojis ?? [] : capabilities.icons?.selectedIcon == null ? [] : [capabilities.icons.selectedIcon];
  const selected = new Set(selectedValues);
  const searchValue = inputValue ?? query;
  const baseId = React.useId();

  React.useEffect(() => {
    if (keyboardTarget == null) return;
    const listener = (event: Event) => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key === "/" && showSearch) {
        keyboardEvent.preventDefault();
        localInputRef.current?.focus();
      }
    };
    keyboardTarget.addEventListener("keydown", listener);
    return () => keyboardTarget.removeEventListener("keydown", listener);
  }, [keyboardTarget, showSearch]);

  const selectChoice = (choice: SymbolChoice, source: SelectionSource) => {
    if (disabled) return;
    if (choice.kind === "emoji") {
      setRecentEmojis((current) => {
        const next = [choice.value, ...current.filter((emoji) => emoji !== choice.value)].slice(0, 16);
        writeRecentEmojis(next);
        return next;
      });
    }
    onSelect({ ...choice, source });
  };

  const header = jsx.jsxs("div", {
    className: "flex flex-col gap-2 border-b border-token-border-light p-2",
    children: [
      capabilities.emoji != null && capabilities.icons != null ? jsx.jsxs("div", {
        className: "grid grid-cols-2 gap-1 rounded-lg bg-surface-secondary p-1",
        children: [
          jsx.jsx("button", { type: "button", disabled, "aria-pressed": kind === "emoji", className: "rounded-md px-3 py-1.5 text-sm", onClick: () => onKindChange?.("emoji"), children: "Emoji" }),
          jsx.jsx("button", { type: "button", disabled, "aria-pressed": kind === "icon", className: "rounded-md px-3 py-1.5 text-sm", onClick: () => onKindChange?.("icon"), children: "Icons" }),
        ],
      }) : null,
      showSearch ? jsx.jsxs("div", {
        className: "flex items-center gap-2",
        children: [
          jsx.jsx("input", {
            ref: (value: HTMLInputElement | null) => { localInputRef.current = value; setInputRef(inputRef, value); },
            autoFocus,
            disabled,
            type: "search",
            value: searchValue,
            placeholder: kind === "emoji" ? "Search emoji" : "Search icons",
            "aria-label": kind === "emoji" ? "Search emoji" : "Search icons",
            className: "min-w-0 flex-1 rounded-lg border border-token-border-light bg-surface-primary px-3 py-2 outline-none",
            onChange: (event: Event) => onQueryChange((event.currentTarget as HTMLInputElement).value),
            onKeyDown: (event: KeyboardEvent) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                ((event.currentTarget as HTMLInputElement).closest("[data-symbol-browser]")?.querySelector("button[data-symbol-choice]") as HTMLButtonElement | null)?.focus();
              } else if (event.key === "Enter") {
                const first = choices[0];
                if (first != null) {
                  event.preventDefault();
                  selectChoice(first, "keyboard");
                }
              }
            },
          }),
          query.length > 0 || onClear != null ? jsx.jsx("button", { type: "button", disabled, className: "rounded-md px-2 py-1 text-sm text-secondary", onClick: () => { onQueryChange(""); onClear?.(); }, children: "Clear" }) : null,
        ],
      }) : null,
      kind === "icon" && capabilities.icons?.onColorChange != null ? jsx.jsx("div", {
        className: "flex items-center gap-1",
        role: "group",
        "aria-label": "Icon color",
        children: ICON_COLORS.map((color) => jsx.jsx("button", {
          type: "button",
          disabled,
          title: color,
          "aria-label": color,
          "aria-pressed": (capabilities.icons?.color ?? "black") === color,
          className: "size-6 rounded-full border border-token-border-light",
          style: { backgroundColor: color === "black" ? "currentColor" : color },
          onClick: () => capabilities.icons?.onColorChange?.(color),
        }, color)),
      }) : null,
      query.trim().length === 0 && sections.length > 1 ? jsx.jsx("div", {
        className: "flex gap-1 overflow-x-auto",
        role: "navigation",
        "aria-label": kind === "emoji" ? "Emoji categories" : "Icon categories",
        children: sections.map((section) => jsx.jsx("button", {
          type: "button",
          className: "shrink-0 rounded-md px-2 py-1 text-xs text-secondary",
          onClick: () => typeof document === "undefined" ? undefined : document.getElementById(baseId + "-" + section.id)?.scrollIntoView({ block: "start" }),
          children: section.heading,
        }, section.id)),
      }) : null,
    ],
  });

  const content = choices.length === 0 ? jsx.jsx("div", {
    role: "status",
    className: "py-6 text-center text-sm text-secondary",
    children: kind === "emoji" ? "No matching emoji" : "No matching icons",
  }) : jsx.jsx("div", {
    role: "grid",
    tabIndex: -1,
    "aria-label": kind === "emoji" ? "Emoji" : "Icons",
    onKeyDown: (event: KeyboardEvent) => handleGridKeyDown(event, onReturnToSearch ?? (() => localInputRef.current?.focus())),
    children: sections.map((section) => jsx.jsxs("section", {
      id: baseId + "-" + section.id,
      className: "scroll-mt-2 py-2",
      children: [
        jsx.jsx("h2", { className: "mb-1 px-1 text-xs font-medium text-secondary", children: section.heading }),
        jsx.jsx("div", {
          role: "row",
          className: "grid grid-cols-8 gap-1",
          children: section.choices.map((choice) => {
            const icon = choice.kind === "icon" ? ICONS.find((entry) => entry.id === choice.value) : null;
            return jsx.jsx("button", {
              type: "button",
              role: "gridcell",
              disabled,
              "data-symbol-choice": choice.value,
              "aria-label": choice.metadata.label,
              "aria-pressed": selected.has(choice.value),
              title: choice.metadata.label,
              className: "flex size-9 items-center justify-center rounded-lg text-xl hover:bg-surface-secondary aria-pressed:bg-surface-secondary",
              style: choice.kind === "icon" && choice.metadata.color != null && choice.metadata.color !== "black" ? { color: choice.metadata.color } : undefined,
              onClick: () => selectChoice(choice, "pointer"),
              children: choice.kind === "emoji" ? choice.value : icon?.glyph ?? choice.value.slice(0, 2),
            }, choice.kind + ":" + choice.value);
          }),
        }),
      ],
    }, section.id)),
  });

  return jsx.jsxs("div", {
    "data-symbol-browser": "",
    role: "presentation",
    className: "no-drag flex min-w-0 max-w-full flex-col overflow-hidden rounded-xl bg-surface-elevated-secondary text-default shadow-lg ring-[0.5px] ring-border",
    style: { maxHeight: typeof availableHeight === "number" ? availableHeight + "px" : availableHeight },
    onKeyDown: (event: KeyboardEvent) => {
      if (disabled || !showSearch || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.key.length !== 1 || event.key.trim() === "") return;
      const target = event.target;
      if (!(target instanceof HTMLElement) || target.closest("input, textarea, [contenteditable]") != null) return;
      event.preventDefault();
      onQueryChange(searchValue + event.key);
      localInputRef.current?.focus();
    },
    children: [
      header,
      jsx.jsxs("div", {
        className: "hide-scrollbar min-h-0 overflow-y-auto p-2",
        children: [
          jsx.jsx("div", { className: "sr-only", role: "status", "aria-atomic": "true", children: intl.formatMessage({ id: kind === "emoji" ? "emoji.search.count" : "symbolPicker.icons.count", defaultMessage: choices.length + (kind === "emoji" ? " emoji" : " icons") }) }),
          content,
        ],
      }),
      query.trim().length === 0 && footer != null ? jsx.jsx("div", { "data-symbol-picker-footer": "", className: "border-t border-token-border-light p-2", children: footer }) : null,
    ],
  });
}

let initialized = false;
function initializeSymbolBrowser(): void {
  if (initialized) return;
  initializeRuntimeLazy();
  React = getReactRuntime();
  jsx = getJsxRuntime();
  initialized = true;
}

initializeSymbolBrowser();
export { SymbolBrowser };
