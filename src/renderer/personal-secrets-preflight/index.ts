// Cloud-task personal-secrets preflight gate. Release chunk: preflight-4a4cc944d9a1.js.
import * as SharedChunk from "@rchunk/app-shared";
import * as InitialChunk from "@rchunk/app-initial";
import { PersonalSecretsDialog } from "@rchunk/personal-secrets-dialog";
import { n as preflightPersonalSecrets, type PersonalSecretsSelection } from "@rchunk/personal-secrets-service";

interface Scope {
  get(signal: unknown): unknown;
  when(predicate: (scope: Scope) => boolean): Promise<void>;
}
interface InitialRuntime {
  Hzt(scope: Scope, dialog: unknown): boolean;
  Sun(): void;
  Uzt(scope: Scope, dialog: unknown, props: Record<string, unknown>): void;
  Vzt(): void;
  _cn: unknown;
  _un: unknown;
  mun: unknown;
  wcn: unknown;
  yun: unknown;
  zzt(scope: Scope, dialog: unknown): void;
}

const initial = InitialChunk as unknown as InitialRuntime;
let initialized = false;

function initialize(): void {
  if (initialized) return;
  initialized = true;
  initial.Sun();
  initial.Vzt();
  void SharedChunk;
}

function isSelectionCurrent(scope: Scope, selection: PersonalSecretsSelection & { projectId?: string | null }, isConfigCurrent: (scope: Scope, configId: string) => boolean): boolean {
  const auth = scope.get(initial.yun) as { authLoading?: boolean };
  const project = scope.get(initial.wcn) as { projectId?: string | null } | null;
  return !auth.authLoading
    && scope.get(initial.mun) === selection.accountId
    && scope.get(initial._un) === selection.userId
    && isConfigCurrent(scope, selection.config.id)
    && (project?.projectId ?? null) === (selection.projectId ?? null);
}

async function preparePersonalSecrets(
  scope: Scope,
  selection: PersonalSecretsSelection & { projectId?: string | null },
  isConfigCurrent: (scope: Scope, configId: string) => boolean,
): Promise<void> {
  initialize();
  const preflight = await preflightPersonalSecrets(selection);
  if (preflight?.issues.length === 0) return;
  let active = true;
  let closedByDialog = false;
  const isCurrent = (): boolean => active && isSelectionCurrent(scope, selection, isConfigCurrent);
  if (!isCurrent()) return;
  if (initial.Hzt(scope, PersonalSecretsDialog)) {
    throw new DOMException("A Cloud task is already awaiting personal secrets", "AbortError");
  }
  initial.Uzt(scope, PersonalSecretsDialog, {
    initialPreflight: preflight,
    isCurrent,
    onClose: () => { closedByDialog = true; },
    selection,
  });
  try {
    await scope.when((currentScope) => !isCurrent() || !initial.Hzt(currentScope, PersonalSecretsDialog));
    if (!closedByDialog && isCurrent()) {
      throw new DOMException("Personal secrets prompt was interrupted", "AbortError");
    }
  } finally {
    active = false;
    initial.zzt(scope, PersonalSecretsDialog);
  }
}

initialize();
export { preparePersonalSecrets };
