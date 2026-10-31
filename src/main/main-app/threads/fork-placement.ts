import {
  Ca as normalizeThreadOrders,
  Qu as isValidSemver,
  Zu as compareSemver,
  wa as prependThreadToProject,
} from "@chunk/shared";

const SAVED_SECTIONS_KEY = "sidebar-custom-sections-v3";
const LOCAL_THREAD_PREFIX = "codex:thread:local:";
const APP_SERVER_SECTIONS_VERSION = "0.148.0-alpha.7";

type SavedSection = {
  id: string;
  name: string;
  itemKeys: string[];
  hostSectionIds?: Record<string, string>;
  pendingDeletionHostIdsByItemKey?: Record<string, string[]>;
  [key: string]: unknown;
};

type SavedSectionsState = {
  sections: SavedSection[];
  collapsedSectionIds: string[];
  sectionOrder: string[];
  [key: string]: unknown;
};

export type ForkPlacement = {
  prependToManualProject: boolean;
  customSection: null | {
    accountId: string;
    sectionId: string;
    beforeThreadId: string;
    useAppServerSections: boolean;
  };
};

export interface ForkPlacementContext {
  accountId(): string | null;
  hostId: string;
  appServerVersion: string | null;
  readSetting(name: string): boolean | undefined;
  storage: {
    readValue(key: string): unknown;
    writeValue(key: string, value: unknown): unknown;
    updateGlobalState(key: string, transform: (value: unknown) => unknown): Promise<unknown>;
  };
  pinnedThreads(): Promise<any>;
}

function stringRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value != null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function parseSection(value: unknown): SavedSection | null {
  let record = stringRecord(value);
  let hostSectionIds = stringRecord(record?.hostSectionIds);
  let pendingDeletionHostIdsByItemKey = stringRecord(
    record?.pendingDeletionHostIdsByItemKey,
  );
  if (
    record == null ||
    typeof record.id !== "string" ||
    record.id.length === 0 ||
    typeof record.name !== "string" ||
    record.name.length === 0 ||
    !Array.isArray(record.itemKeys) ||
    !record.itemKeys.every((item) => typeof item === "string") ||
    (record.hostSectionIds !== undefined &&
      (hostSectionIds == null ||
        !Object.values(hostSectionIds).every((item) => typeof item === "string"))) ||
    (record.pendingDeletionHostIdsByItemKey !== undefined &&
      (pendingDeletionHostIdsByItemKey == null ||
        !Object.values(pendingDeletionHostIdsByItemKey).every(
          (item) => Array.isArray(item) && item.every((hostId) => typeof hostId === "string"),
        )))
  )
    return null;
  return record as SavedSection;
}

function parseState(value: unknown): SavedSectionsState | null {
  let record = stringRecord(value);
  if (
    record == null ||
    !Array.isArray(record.sections) ||
    !Array.isArray(record.collapsedSectionIds) ||
    !Array.isArray(record.sectionOrder) ||
    !record.collapsedSectionIds.every((item) => typeof item === "string") ||
    !record.sectionOrder.every((item) => typeof item === "string")
  )
    return null;
  let sections = record.sections.map(parseSection);
  return sections.every((section) => section != null)
    ? ({ ...record, sections } as SavedSectionsState)
    : null;
}

function readSavedSections(context: ForkPlacementContext): {
  accounts: Record<string, unknown>;
  state: SavedSectionsState | null;
} {
  let accounts = stringRecord(context.storage.readValue(SAVED_SECTIONS_KEY)) ?? {};
  return {
    accounts,
    state: parseState(accounts[context.accountId() ?? ""]),
  };
}

function normalizedState(state: SavedSectionsState): SavedSectionsState {
  return {
    ...state,
    sections: state.sections.map((section) => ({ ...section, appearance: null })),
  };
}

function moveItemToSection(
  state: SavedSectionsState,
  sectionId: string,
  itemKey: string,
  beforeItemKey?: string,
): SavedSectionsState {
  if (!state.sections.some((section) => section.id === sectionId)) return state;
  let changed = false;
  let sections = state.sections.map((section) => {
    let itemKeys = section.itemKeys.filter((candidate) => candidate !== itemKey);
    if (section.id === sectionId) {
      let index = beforeItemKey == null ? -1 : itemKeys.indexOf(beforeItemKey);
      itemKeys.splice(index === -1 ? itemKeys.length : index, 0, itemKey);
    }
    let pendingDeletionHostIdsByItemKey = section.pendingDeletionHostIdsByItemKey;
    if (pendingDeletionHostIdsByItemKey != null) {
      pendingDeletionHostIdsByItemKey = Object.fromEntries(
        Object.entries(pendingDeletionHostIdsByItemKey).filter(
          ([key]) => key !== itemKey && itemKeys.includes(key),
        ),
      );
    }
    if (
      itemKeys.length === section.itemKeys.length &&
      itemKeys.every((value, index) => value === section.itemKeys[index]) &&
      pendingDeletionHostIdsByItemKey === section.pendingDeletionHostIdsByItemKey
    )
      return section;
    changed = true;
    return { ...section, itemKeys, pendingDeletionHostIdsByItemKey };
  });
  return changed ? { ...state, sections } : state;
}

function supportsAppServerSections(version: string | null): boolean {
  return version != null && isValidSemver(version) && compareSemver(version, APP_SERVER_SECTIONS_VERSION) >= 0;
}

export function readForkPlacement(
  context: ForkPlacementContext,
  sourceConversationId: string,
): { status: "ready"; placement: ForkPlacement } | { status: "not-ready"; reason: string } {
  let customSectionsEnabled = context.readSetting("sidebarCustomSectionsEnabled");
  let useAppServerSections = context.readSetting("useAppServerCustomSections");
  if (customSectionsEnabled === undefined || useAppServerSections === undefined)
    return { status: "not-ready", reason: "execution-config-loading" };

  let sortMode = context.storage.readValue("codex-sidebar-sort-mode-v1");
  let flatPreferences = stringRecord(
    context.storage.readValue("flat-project-sidebar-preferences-v1"),
  );
  let accountId = context.accountId();
  let sourceItemKey = `${LOCAL_THREAD_PREFIX}${sourceConversationId}`;
  let section =
    customSectionsEnabled && accountId != null
      ? readSavedSections(context).state?.sections.find(({ itemKeys }) => itemKeys.includes(sourceItemKey))
      : undefined;
  return {
    status: "ready",
    placement: {
      prependToManualProject:
        (typeof sortMode === "string" ? sortMode : flatPreferences?.projectSortMode) === "manual",
      customSection:
        section == null || accountId == null
          ? null
          : {
              accountId,
              sectionId: section.id,
              beforeThreadId: sourceConversationId,
              useAppServerSections,
            },
    },
  };
}

export async function prependForkedProjectThread(
  context: ForkPlacementContext,
  projectId: string,
  conversationId: string,
): Promise<void> {
  await context.storage.updateGlobalState("sidebar-project-thread-orders", (value) =>
    prependThreadToProject(normalizeThreadOrders(value), projectId, conversationId),
  );
}

export async function moveForkedThreadToSection(
  context: ForkPlacementContext,
  conversationId: string,
  placement: NonNullable<ForkPlacement["customSection"]>,
): Promise<void> {
  if (placement.accountId !== context.accountId()) throw Error("Fork placement account retired");
  let { accounts, state } = readSavedSections(context);
  if (state == null) return;

  let itemKey = `${LOCAL_THREAD_PREFIX}${conversationId}`;
  let beforeItemKey = `${LOCAL_THREAD_PREFIX}${placement.beforeThreadId}`;
  let acceptedState = moveItemToSection(state, placement.sectionId, itemKey, beforeItemKey);
  if (acceptedState !== state)
    context.storage.writeValue(SAVED_SECTIONS_KEY, {
      ...accounts,
      [placement.accountId]: normalizedState(acceptedState),
    });
  if (!placement.useAppServerSections || !supportsAppServerSections(context.appServerVersion)) return;

  let section = acceptedState.sections.find(({ id }) => id === placement.sectionId);
  if (section == null) return;
  try {
    let pinnedThreads = await context.pinnedThreads();
    if (pinnedThreads == null || placement.accountId !== context.accountId())
      throw Error("Fork section host is unavailable");
    let hostSectionId = section.hostSectionIds?.[context.hostId];
    if (hostSectionId == null) {
      let created = await pinnedThreads.createSection({
        hostId: context.hostId,
        logicalSectionId: section.id,
        name: section.name,
        threadIdToMove: conversationId,
      });
      if (placement.accountId !== context.accountId()) throw Error("Fork placement account retired");
      let current = readSavedSections(context);
      if (current.state?.sections.some(({ id }) => id === section.id))
        context.storage.writeValue(SAVED_SECTIONS_KEY, {
          ...current.accounts,
          [placement.accountId]: normalizedState({
            ...current.state,
            sections: current.state.sections.map((candidate) =>
              candidate.id === section.id
                ? {
                    ...candidate,
                    hostSectionIds: {
                      ...candidate.hostSectionIds,
                      [context.hostId]: created.id,
                    },
                  }
                : candidate,
            ),
          }),
        });
      return;
    }

    let remoteIds = new Set<string>(
      await pinnedThreads.listSectionThreadIds({ hostId: context.hostId, sectionId: hostSectionId }),
    );
    if (placement.accountId !== context.accountId()) throw Error("Fork placement account retired");
    let beforeThreadId =
      section.itemKeys
        .slice(section.itemKeys.indexOf(itemKey) + 1)
        .flatMap((key) => (key.startsWith(LOCAL_THREAD_PREFIX) ? [key.slice(LOCAL_THREAD_PREFIX.length)] : []))
        .find((threadId) => remoteIds.has(threadId)) ?? null;
    let response = await pinnedThreads.setThreadSection({
      hostId: context.hostId,
      sectionId: hostSectionId,
      threadId: conversationId,
      beforeThreadId,
    });
    if (!response.success) throw Error("Accepted fork could not be placed in its sidebar section");
  } catch (error) {
    let current = readSavedSections(context);
    let currentSection = current.state?.sections.find(({ itemKeys }) => itemKeys.includes(itemKey));
    let acceptedNextItem = section.itemKeys[section.itemKeys.indexOf(itemKey) + 1];
    if (
      current.state != null &&
      currentSection?.id === section.id &&
      currentSection.itemKeys[currentSection.itemKeys.indexOf(itemKey) + 1] === acceptedNextItem
    ) {
      let previousSection = state.sections.find(({ itemKeys }) => itemKeys.includes(itemKey));
      let withoutFork = {
        ...current.state,
        sections: current.state.sections.map((candidate) => ({
          ...candidate,
          itemKeys: candidate.itemKeys.filter((key) => key !== itemKey),
        })),
      };
      let restored =
        previousSection == null
          ? withoutFork
          : moveItemToSection(
              withoutFork,
              previousSection.id,
              itemKey,
              previousSection.itemKeys[previousSection.itemKeys.indexOf(itemKey) + 1],
            );
      context.storage.writeValue(SAVED_SECTIONS_KEY, {
        ...current.accounts,
        [placement.accountId]: normalizedState(restored),
      });
    }
    throw error;
  }
}
