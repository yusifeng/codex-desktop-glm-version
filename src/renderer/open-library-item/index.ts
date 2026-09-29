// Library navigation/open behavior. Release chunk: open-library-item-f723e5be688a.js.
import "@rchunk/rolldown-runtime";
import * as AppShared from "@rchunk/app-shared";
import * as AppInitial from "@rchunk/app-initial";

interface LibraryNode {
  id: string;
  kind: string;
  name: string;
}

interface LibraryEntry {
  node: LibraryNode;
}

interface LibraryPageValue extends Record<string, unknown> {
  directoryId?: string | null;
  search?: string;
}

interface LibraryScope {
  value: LibraryPageValue;
  get(key: unknown): unknown;
  set(key: unknown, value: unknown): void;
  query: {
    getData(key: unknown): { items?: Array<{ id: string; name: string; is_root?: boolean }> } | undefined;
  };
}

const sharedRuntime = AppShared as unknown as {
  FX(): void;
  QI(): void;
  ZI: unknown;
  oZ(scope: unknown, initializer: (parameter: unknown) => null): unknown;
  pZ(scope: unknown, initialValue: null): unknown;
};

const libraryRuntime = AppInitial as unknown as {
  AK(scope: LibraryScope, directoryId: string, breadcrumbs: Array<{ id: string; name: string }>): void;
  HLt: { CHATGPT_FILE_LIBRARY_FILE_INTERACTION_TYPE_OPENED: unknown };
  HR(): void;
  IK(): void;
  PK(node: LibraryNode): string | null | undefined;
  UR: unknown;
  WR(scope: LibraryScope, entry: LibraryEntry, interactionType: unknown): void;
  _pn(scope: LibraryScope, route: unknown): void;
  bK(value: LibraryPageValue): unknown;
  fRt(): void;
  gpn(): void;
  hK: unknown;
  lK(): void;
  uK: unknown;
  xK: unknown;
};

let selectedLibraryEntrySignal: unknown;
let libraryEntryFamily: unknown;

function openLibraryItem(scope: LibraryScope, entry: LibraryEntry): void {
  if (entry.node.kind === "directory") {
    const directoryId = libraryRuntime.PK(entry.node) ?? entry.node.id;
    const currentDirectory = scope.get(libraryRuntime.xK) as
      | { directoryId?: string | null; items?: Array<{ id: string; name: string; is_root?: boolean }> }
      | undefined;
    let breadcrumbItems = scope.query
      .getData(libraryRuntime.hK)
      ?.items?.filter((item) => !item.is_root);

    if (breadcrumbItems == null && currentDirectory?.directoryId === scope.value.directoryId) {
      breadcrumbItems = currentDirectory?.items;
    }
    if (scope.value.directoryId == null) {
      breadcrumbItems = [];
    }

    libraryRuntime.AK(scope, directoryId, [
      ...(breadcrumbItems ?? []),
      { id: directoryId, name: entry.node.name },
    ]);
    libraryRuntime._pn(
      scope,
      libraryRuntime.bK({ ...scope.value, directoryId, search: "" }),
    );
    return;
  }

  libraryRuntime.WR(
    scope,
    entry,
    libraryRuntime.HLt.CHATGPT_FILE_LIBRARY_FILE_INTERACTION_TYPE_OPENED,
  );
  scope.set(selectedLibraryEntrySignal, {
    entry,
    analyticsContext: scope.get(libraryRuntime.UR),
  });

  if (!entry.node.id.startsWith("external-")) {
    const apiClient = scope.get(libraryRuntime.uK) as {
      safePost(path: string, options: unknown): Promise<unknown>;
    };
    apiClient
      .safePost("/files/library/files/{library_file_id}/opened", {
        parameters: { path: { library_file_id: entry.node.id } },
      })
      .catch(() => undefined);
  }
}

function initializeOpenLibraryItem(): void {
  libraryRuntime.fRt();
  sharedRuntime.FX();
  libraryRuntime.gpn();
  sharedRuntime.QI();
  libraryRuntime.HR();
  libraryRuntime.IK();
  libraryRuntime.lK();
  selectedLibraryEntrySignal = sharedRuntime.pZ(sharedRuntime.ZI, null);
  libraryEntryFamily = sharedRuntime.oZ(sharedRuntime.ZI, () => null);
}

export {
  openLibraryItem as i,
  libraryEntryFamily as n,
  selectedLibraryEntrySignal as r,
  initializeOpenLibraryItem as t,
};
