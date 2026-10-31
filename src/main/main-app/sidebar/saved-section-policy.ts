// @ts-nocheck

/** Pure state projection, undo guards, and host reconciliation for saved sidebar sections. */
export function createSavedSectionPolicy({
  dedupe,
  deepEqual,
  isInternalThreadId,
  pinnedThreadIdsKey,
}: Record<string, any>) {
  const collectionKeys = [
    `threadHostIds`,
    `collapsedSectionIds`,
    `sectionOrder`,
    `appServerLegacySectionIds`,
    `appServerMigratedHostIds`,
  ];

  const retainPendingForItems = (pending: any, itemKeys: string[]) =>
    pending == null
      ? undefined
      : Object.fromEntries(
          Object.entries(pending).filter(([itemKey]) =>
            itemKeys.includes(itemKey),
          ),
        );

  function mapSections(state: any, transform: (section: any) => any): any {
    const sections = state.sections.map((section: any) => {
      const next = transform(section);
      return next === section || next.pendingDeletionHostIdsByItemKey == null
        ? next
        : {
            ...next,
            pendingDeletionHostIdsByItemKey: retainPendingForItems(
              next.pendingDeletionHostIdsByItemKey,
              next.itemKeys,
            ),
          };
    });
    return sections.some(
      (section: any, index: number) => section !== state.sections[index],
    )
      ? { ...state, sections }
      : state;
  }

  const stripSectionAppearance = (state: any) => ({
    ...state,
    sections: state.sections.map((section: any) => ({
      ...section,
      appearance: null,
    })),
  });

  function moveItem(
    state: any,
    sectionId: string,
    itemKey: string,
    beforeItemKey?: string,
  ) {
    if (!state.sections.some(({ id }: any) => id === sectionId)) return state;
    return mapSections(state, (section) => {
      const itemKeys = section.itemKeys.filter(
        (key: string) => key !== itemKey,
      );
      if (section.id !== sectionId)
        return itemKeys.length === section.itemKeys.length
          ? section
          : { ...section, itemKeys };
      const beforeIndex =
        beforeItemKey == null ? -1 : itemKeys.indexOf(beforeItemKey);
      itemKeys.splice(
        beforeIndex === -1 ? itemKeys.length : beforeIndex,
        0,
        itemKey,
      );
      let pending = section.pendingDeletionHostIdsByItemKey;
      if (pending != null) delete (pending = { ...pending })[itemKey];
      return { ...section, itemKeys, pendingDeletionHostIdsByItemKey: pending };
    });
  }

  function createSection(state: any, section: any) {
    const name = section.name.trim();
    if (
      name.length === 0 ||
      state.sections.some(({ id }: any) => id === section.id)
    )
      return state;
    const movedItems = new Set(section.itemKeys);
    const insertionIndex = state.sectionOrder.findIndex(
      (key: string) => key === `chats` || key === `threads`,
    );
    const sectionOrder = [...state.sectionOrder];
    sectionOrder.splice(
      insertionIndex === -1 ? sectionOrder.length : insertionIndex,
      0,
      `custom:${section.id}`,
    );
    return {
      ...state,
      sectionOrder,
      sections: [
        ...state.sections.map((candidate: any) => {
          const itemKeys = candidate.itemKeys.filter(
            (itemKey: string) => !movedItems.has(itemKey),
          );
          return itemKeys.length === candidate.itemKeys.length
            ? candidate
            : {
                ...candidate,
                itemKeys,
                pendingDeletionHostIdsByItemKey: retainPendingForItems(
                  candidate.pendingDeletionHostIdsByItemKey,
                  itemKeys,
                ),
              };
        }),
        { ...section, name },
      ],
    };
  }

  function renameSection(state: any, sectionId: string, nameValue: string) {
    const name = nameValue.trim();
    return name.length === 0
      ? state
      : mapSections(state, (section) =>
          section.id === sectionId ? { ...section, name } : section,
        );
  }

  const deleteSection = (state: any, sectionId: string) => ({
    ...state,
    sections: state.sections.filter(({ id }: any) => id !== sectionId),
    collapsedSectionIds: state.collapsedSectionIds.filter(
      (id: string) => id !== sectionId,
    ),
    sectionOrder: state.sectionOrder.filter(
      (key: string) => key !== `custom:${sectionId}`,
    ),
  });

  const removeItem = (state: any, itemKey: string) =>
    mapSections(state, (section) =>
      section.itemKeys.includes(itemKey)
        ? {
            ...section,
            itemKeys: section.itemKeys.filter((key: string) => key !== itemKey),
          }
        : section,
    );

  function reorderItems(
    state: any,
    sectionId: string,
    requestedItemKeys: string[],
  ) {
    const requested = new Set(requestedItemKeys);
    return mapSections(state, (section) =>
      section.id === sectionId
        ? {
            ...section,
            itemKeys: [
              ...requestedItemKeys.filter((itemKey) =>
                section.itemKeys.includes(itemKey),
              ),
              ...section.itemKeys.filter(
                (itemKey: string) => !requested.has(itemKey),
              ),
            ],
          }
        : section,
    );
  }

  function reorderSectionKeys(state: any, sectionOrder: string[]) {
    const orderedCustomIds = sectionOrder.flatMap((key) =>
      key.startsWith(`custom:`) ? [key.slice(7)] : [],
    );
    const sectionsById = new Map(
      state.sections.map((section: any) => [section.id, section]),
    );
    const orderedIds = new Set(orderedCustomIds);
    return {
      ...state,
      sectionOrder,
      sections: [
        ...orderedCustomIds.flatMap((id) => {
          const section = sectionsById.get(id);
          return section == null ? [] : [section];
        }),
        ...state.sections.filter(({ id }: any) => !orderedIds.has(id)),
      ],
    };
  }

  function replaceItem(
    state: any,
    previousItemKey: string,
    nextItemKey: string,
  ) {
    if (
      previousItemKey === nextItemKey ||
      !state.sections.some(({ itemKeys }: any) =>
        itemKeys.includes(previousItemKey),
      )
    )
      return state;
    return mapSections(state, (section) => {
      if (section.itemKeys.includes(previousItemKey)) {
        const previousPending =
          section.pendingDeletionHostIdsByItemKey?.[previousItemKey];
        const pending =
          previousPending == null
            ? section.pendingDeletionHostIdsByItemKey
            : {
                ...section.pendingDeletionHostIdsByItemKey,
                [nextItemKey]: previousPending,
              };
        if (previousPending != null) delete pending[previousItemKey];
        return {
          ...section,
          pendingDeletionHostIdsByItemKey: pending,
          itemKeys: section.itemKeys
            .filter((itemKey: string) => itemKey !== nextItemKey)
            .map((itemKey: string) =>
              itemKey === previousItemKey ? nextItemKey : itemKey,
            ),
        };
      }
      return section.itemKeys.includes(nextItemKey)
        ? {
            ...section,
            itemKeys: section.itemKeys.filter(
              (key: string) => key !== nextItemKey,
            ),
          }
        : section;
    });
  }

  function readPinnedThreadIds(settings: any): string[] {
    const value = settings.get(pinnedThreadIdsKey);
    return Array.isArray(value)
      ? dedupe(value.filter((entry: unknown) => typeof entry === `string`))
      : [];
  }

  const isRpcErrorCode = (error: any, code: any) =>
    (`jsonRpcCode` in error && error.jsonRpcCode === code) ||
    (`code` in error && error.code === code);

  function applySavedSectionOperation(state: any, operation: any): any {
    switch (operation.type) {
      case `create`: {
        const next = createSection(state, {
          id: operation.sectionId,
          name: operation.name,
          itemKeys: operation.itemKeys,
        });
        if (next === state) return state;
        return operation.legacy
          ? {
              ...next,
              appServerLegacySectionIds:
                state.appServerLegacySectionIds == null
                  ? undefined
                  : [...state.appServerLegacySectionIds, operation.sectionId],
              appServerMigratedHostIds: undefined,
            }
          : {
              ...next,
              appServerLegacySectionIds:
                state.appServerLegacySectionIds ??
                state.sections.map(({ id }: any) => id),
            };
      }
      case `rename`:
        return renameSection(state, operation.sectionId, operation.name);
      case `delete`:
        return deleteSection(state, operation.sectionId);
      case `collapse`:
        return !state.sections.some(
          ({ id }: any) => id === operation.sectionId,
        ) ||
          state.collapsedSectionIds.includes(operation.sectionId) ===
            operation.collapsed
          ? state
          : {
              ...state,
              collapsedSectionIds: operation.collapsed
                ? [...state.collapsedSectionIds, operation.sectionId]
                : state.collapsedSectionIds.filter(
                    (id: string) => id !== operation.sectionId,
                  ),
            };
      case `reorder`: {
        const validCustomKeys = new Set(
          state.sections.map(({ id }: any) => `custom:${id}`),
        );
        const visibleKeys = new Set(
          operation.visibleSectionKeys.filter(
            (key: string) =>
              !key.startsWith(`custom:`) || validCustomKeys.has(key),
          ),
        );
        const requestedKeys = operation.sectionKeys.filter((key: string) =>
          visibleKeys.has(key),
        );
        let requestedIndex = 0;
        return reorderSectionKeys(state, [
          ...state.sectionOrder.flatMap((key: string) => {
            if (!visibleKeys.has(key)) return [key];
            const replacement = requestedKeys[requestedIndex++];
            return replacement == null ? [] : [replacement];
          }),
          ...requestedKeys.slice(requestedIndex),
        ]);
      }
      case `move`:
        return operation.onlyIfUnassigned &&
          state.sections.some(({ itemKeys }: any) =>
            itemKeys.includes(operation.itemKey),
          )
          ? state
          : moveItem(
              state,
              operation.sectionId,
              operation.itemKey,
              operation.beforeItemKey,
            );
      case `remove`:
        return removeItem(state, operation.itemKey);
      case `reorderItems`:
        return reorderItems(state, operation.sectionId, operation.itemKeys);
      case `replaceItem`:
        return replaceItem(
          state,
          operation.previousItemKey,
          operation.nextItemKey,
        );
      case `resolvePendingDeletion`: {
        let next = state;
        for (const section of state.sections) {
          const pendingHosts =
            section.pendingDeletionHostIdsByItemKey?.[operation.itemKey];
          if (pendingHosts == null) continue;
          const remainingPending = {
            ...section.pendingDeletionHostIdsByItemKey,
          };
          delete remainingPending[operation.itemKey];
          const itemKeys = pendingHosts.includes(operation.hostId)
            ? section.itemKeys.filter(
                (key: string) => key !== operation.itemKey,
              )
            : section.itemKeys;
          next =
            itemKeys.length === 0 &&
            Object.keys(section.hostSectionIds ?? {}).length === 0
              ? deleteSection(next, section.id)
              : {
                  ...next,
                  sections: next.sections.map((candidate: any) =>
                    candidate.id === section.id
                      ? {
                          ...section,
                          itemKeys,
                          pendingDeletionHostIdsByItemKey:
                            Object.keys(remainingPending).length === 0
                              ? undefined
                              : remainingPending,
                        }
                      : candidate,
                  ),
                };
        }
        return next;
      }
    }
  }

  function applyOperationWithHostIds(state: any, operation: any): any {
    const next = applySavedSectionOperation(state, operation);
    if (operation.type === `create` && next === state) return state;
    let itemKey;
    if (
      operation.type === `move` ||
      operation.type === `resolvePendingDeletion`
    )
      itemKey = operation.itemKey;
    else if (operation.type === `replaceItem`) itemKey = operation.nextItemKey;
    let hostId;
    if (operation.type === `resolvePendingDeletion`) hostId = operation.hostId;
    else if (operation.type === `move` || operation.type === `replaceItem`)
      hostId = operation.threadHostId;
    const retainedKeys = new Set(
      next.sections.flatMap(({ itemKeys }: any) => itemKeys),
    );
    const threadHostIds = Object.fromEntries(
      Object.entries({
        ...state.threadHostIds,
        ...(operation.type === `create` ? operation.threadHostIds : undefined),
        ...(itemKey?.startsWith(`codex:thread:local:`) && hostId != null
          ? { [itemKey.slice(19)]: hostId }
          : {}),
      }).filter(([threadId]) =>
        retainedKeys.has(`codex:thread:local:${threadId}`),
      ),
    );
    return Object.keys(threadHostIds).length ===
      Object.keys(state.threadHostIds ?? {}).length &&
      Object.entries(threadHostIds).every(
        ([threadId, value]) => state.threadHostIds?.[threadId] === value,
      )
      ? next
      : {
          ...next,
          threadHostIds:
            Object.keys(threadHostIds).length === 0 ? undefined : threadHostIds,
        };
  }

  function describeAffectedState(before: any, after: any): any {
    return {
      sections: [
        ...new Set(
          [...before.sections, ...after.sections].map(({ id }: any) => id),
        ),
      ].flatMap((id) => {
        const previous = before.sections.find(
          (section: any) => section.id === id,
        );
        const next = after.sections.find((section: any) => section.id === id);
        return deepEqual(previous, next)
          ? []
          : [{ id, before: previous, after: next }];
      }),
      collections: collectionKeys.filter(
        (key) => !deepEqual(before[key], after[key]),
      ),
      structure: !deepEqual(
        before.sections.map(({ id }: any) => id),
        after.sections.map(({ id }: any) => id),
      ),
    };
  }

  function captureAffectedStateGuards(state: any, affected: any): any {
    return {
      memberships: new Map(
        affected.sections.flatMap(({ before, after }: any) =>
          [...(before?.itemKeys ?? []), ...(after?.itemKeys ?? [])].map(
            (itemKey) => [
              itemKey,
              state.sections
                .filter(({ itemKeys }: any) => itemKeys.includes(itemKey))
                .map(({ id }: any) => id),
            ],
          ),
        ),
      ),
      sections: new Map(
        affected.sections.map(({ id }: any) => [
          id,
          state.sections.find((section: any) => section.id === id),
        ]),
      ),
      collections: new Map(
        affected.collections.map((key: string) => [key, state[key]]),
      ),
      structure: affected.structure ? new WeakRef(state.sections) : undefined,
    };
  }

  function affectedStateGuardsMatch(state: any, guards: any): boolean {
    return (
      [...guards.memberships].every(([itemKey, memberships]) =>
        deepEqual(
          memberships,
          state.sections
            .filter(({ itemKeys }: any) => itemKeys.includes(itemKey))
            .map(({ id }: any) => id),
        ),
      ) &&
      (guards.structure == null ||
        state.sections === guards.structure.deref()) &&
      [...guards.collections].every(([key, value]) => state[key] === value) &&
      [...guards.sections].every(
        ([id, section]) =>
          state.sections.find((candidate: any) => candidate.id === id) ===
          section,
      )
    );
  }

  function projectAffectedState(state: any, affected: any): any {
    const sectionIds = new Set(affected.sections.map(({ id }: any) => id));
    return {
      sections: state.sections.filter(({ id }: any) => sectionIds.has(id)),
      threadHostIds: affected.collections.includes(`threadHostIds`)
        ? state.threadHostIds
        : undefined,
      collapsedSectionIds: affected.collections.includes(`collapsedSectionIds`)
        ? state.collapsedSectionIds
        : [],
      sectionOrder: affected.collections.includes(`sectionOrder`)
        ? state.sectionOrder
        : [],
      appServerLegacySectionIds: affected.collections.includes(
        `appServerLegacySectionIds`,
      )
        ? state.appServerLegacySectionIds
        : undefined,
      appServerMigratedHostIds: affected.collections.includes(
        `appServerMigratedHostIds`,
      )
        ? state.appServerMigratedHostIds
        : undefined,
    };
  }

  function applyAffectedState(
    state: any,
    replacement: any,
    affected: any,
    sectionOrder = replacement.sections.map(({ id }: any) => id),
  ): any {
    const affectedSectionIds = new Set(
      affected.sections.map(({ id }: any) => id),
    );
    const sections = affected.structure
      ? sectionOrder.map((id: string) => {
          const section = affectedSectionIds.has(id)
            ? replacement.sections.find((candidate: any) => candidate.id === id)
            : state.sections.find((candidate: any) => candidate.id === id);
          if (section == null) throw Error(`Saved section structure changed`);
          return affectedSectionIds.has(id)
            ? { ...section, itemKeys: [...section.itemKeys] }
            : section;
        })
      : state.sections.map((section: any) => {
          if (!affectedSectionIds.has(section.id)) return section;
          const next = replacement.sections.find(
            (candidate: any) => candidate.id === section.id,
          );
          return next == null
            ? section
            : { ...next, itemKeys: [...next.itemKeys] };
        });
    const collapsedSectionIds = affected.collections.includes(
      `collapsedSectionIds`,
    )
      ? [...replacement.collapsedSectionIds]
      : state.collapsedSectionIds;
    return {
      ...state,
      sections,
      threadHostIds: affected.collections.includes(`threadHostIds`)
        ? replacement.threadHostIds
        : state.threadHostIds,
      collapsedSectionIds: affected.structure
        ? collapsedSectionIds.filter((id: string) =>
            sections.some((section: any) => section.id === id),
          )
        : collapsedSectionIds,
      sectionOrder: affected.collections.includes(`sectionOrder`)
        ? [...replacement.sectionOrder]
        : state.sectionOrder,
      appServerLegacySectionIds: affected.collections.includes(
        `appServerLegacySectionIds`,
      )
        ? replacement.appServerLegacySectionIds?.slice()
        : state.appServerLegacySectionIds,
      appServerMigratedHostIds: affected.collections.includes(
        `appServerMigratedHostIds`,
      )
        ? replacement.appServerMigratedHostIds?.slice()
        : state.appServerMigratedHostIds,
    };
  }

  function commitReconciledState(
    source: any,
    before: any,
    after: any,
    operationId: any,
    hostId: any,
  ) {
    if (!source.isSourceCurrent()) return `unavailable`;
    const affected = describeAffectedState(before, after);
    const current = source.read();
    const changedThreadHostIds = Object.keys({
      ...before.threadHostIds,
      ...after.threadHostIds,
    }).filter(
      (threadId) =>
        before.threadHostIds?.[threadId] !== after.threadHostIds?.[threadId],
    );
    affected.collections = affected.collections.filter(
      (key: string) => key !== `threadHostIds`,
    );
    if (
      !affectedStateGuardsMatch(
        current,
        captureAffectedStateGuards(before, affected),
      ) ||
      changedThreadHostIds.some(
        (threadId) =>
          current.threadHostIds?.[threadId] !==
          before.threadHostIds?.[threadId],
      )
    )
      return `conflict`;
    source.getConnection(hostId);
    if (deepEqual(before, after)) return `unchanged`;
    const next = applyAffectedState(current, after, affected);
    if (changedThreadHostIds.length !== 0) {
      const threadHostIds = { ...current.threadHostIds };
      for (const threadId of changedThreadHostIds) {
        const value = after.threadHostIds?.[threadId];
        value == null
          ? delete threadHostIds[threadId]
          : (threadHostIds[threadId] = value);
      }
      next.threadHostIds =
        Object.keys(threadHostIds).length === 0 ? undefined : threadHostIds;
    }
    source.write(next, operationId);
    return `applied`;
  }

  function threadIdFromItemKey(itemKey: string): string | null {
    if (!itemKey.startsWith(`codex:thread:local:`)) return null;
    const threadId = itemKey.slice(19);
    return isInternalThreadId(threadId) ? null : threadId;
  }

  const itemKeyFromThreadId = (threadId: string) =>
    `codex:thread:local:${threadId}`;

  function updateSectionItems(
    section: any,
    itemKeys: any[],
    hostThreadIds: Set<string>,
    bindings: any,
  ) {
    const pending = section.pendingDeletionHostIdsByItemKey;
    const retainedPending =
      pending == null
        ? undefined
        : Object.fromEntries(
            itemKeys.flatMap((itemKey) => {
              const hosts = pending[itemKey];
              const threadId =
                bindings[itemKey] ?? threadIdFromItemKey(itemKey);
              return hosts == null ||
                (threadId != null && hostThreadIds.has(threadId))
                ? []
                : [[itemKey, hosts]];
            }),
          );
    return {
      ...section,
      itemKeys,
      pendingDeletionHostIdsByItemKey:
        retainedPending != null && Object.keys(retainedPending).length !== 0
          ? retainedPending
          : undefined,
    };
  }

  function pruneThreadHostIds(state: any, threadHostIds: any, bindings: any) {
    const retained = Object.fromEntries(
      state.sections.flatMap(({ itemKeys }: any) =>
        itemKeys.flatMap((itemKey: string) => {
          const threadId = bindings[itemKey] ?? threadIdFromItemKey(itemKey);
          const hostId =
            threadId == null
              ? undefined
              : (threadHostIds[threadId] ?? state.threadHostIds?.[threadId]);
          return threadId == null || hostId == null ? [] : [[threadId, hostId]];
        }),
      ),
    );
    return {
      ...state,
      threadHostIds: Object.keys(retained).length === 0 ? undefined : retained,
    };
  }

  return {
    affectedStateGuardsMatch,
    applyAffectedState,
    applyOperationWithHostIds,
    applySavedSectionOperation,
    captureAffectedStateGuards,
    commitReconciledState,
    describeAffectedState,
    isRpcErrorCode,
    itemKeyFromThreadId,
    createSection,
    deleteSection,
    mapSections,
    moveItem,
    projectAffectedState,
    pruneThreadHostIds,
    readPinnedThreadIds,
    removeItem,
    renameSection,
    reorderItems,
    reorderSectionKeys,
    replaceItem,
    stripSectionAppearance,
    threadIdFromItemKey,
    updateSectionItems,
  };
}
