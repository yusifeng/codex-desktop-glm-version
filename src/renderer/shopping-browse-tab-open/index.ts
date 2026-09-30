import '@rchunk/rolldown-runtime';
import * as SharedChunk from '@rchunk/app-shared';
import * as InitialChunk from '@rchunk/app-initial';

interface ShoppingContext { accountId: string; rootMessageId: string; category?: string | null; turn: { conversationId: string } }
interface Scope { value: { routeKind: string; conversationId?: string | null }; get<T>(family: unknown, parameter?: unknown): T; set(family: unknown, parameter: unknown, value?: unknown): void }
interface Tabs { tabById$: unknown; activateTab(scope: Scope, id: string): void; closeTab(scope: Scope, id: string): void; updateTabState(scope: Scope, id: string, update: (state: unknown) => unknown): void; updateTab(scope: Scope, id: string, patch: unknown): void }
interface Runtime { qvt: Tabs; Tz: unknown; ypn: unknown; mpn: unknown; Mbt(scope: Scope, visible: boolean): void; Wvt(scope: Scope, update: () => void): void; Gvt(scope: Scope, registration: unknown, options: unknown): void; IDt(id: string, component: (props: unknown) => unknown, options: unknown): unknown }
const runtime = InitialChunk as unknown as Runtime;
void SharedChunk;

function contextKey(value: ShoppingContext): string { return JSON.stringify([value.accountId, value.turn.conversationId, value.rootMessageId, value.category]); }
function defaultState(value: ShoppingContext): Record<string, unknown> { return { contextKey: contextKey(value), selectedFilters: null, scrollTop: 0 }; }
function ShoppingBrowseTab(): null { return null; }
let registration: unknown;

function openShoppingBrowseTab(scope: Scope, context: ShoppingContext): void {
  if (scope.value.routeKind !== 'chatgpt-thread' || scope.value.conversationId !== context.turn.conversationId) return;
  const id = 'shopping-browse:' + encodeURIComponent(JSON.stringify([context.accountId, context.turn.conversationId, context.rootMessageId]));
  const existing = scope.get<{ tabId: string } | null>(runtime.qvt.tabById$, id);
  if (existing != null) {
    const previous = scope.get<ShoppingContext | null>(runtime.Tz, existing.tabId);
    if (previous == null || contextKey(previous) !== contextKey(context)) scope.set(runtime.Tz, existing.tabId, context);
    runtime.qvt.activateTab(scope, existing.tabId);
    runtime.Mbt(scope, true);
    return;
  }
  scope.set(runtime.Tz, id, context);
  const resolved = scope.get<ShoppingContext | null>(runtime.ypn, id);
  if (resolved == null) { scope.set(runtime.Tz, id, null); return; }
  const intl = scope.get<{ formatMessage(message: Record<string, string>): string }>(runtime.mpn);
  let current = resolved;
  const onContextChange = (next: ShoppingContext | null): void => {
    if (next == null) { queueMicrotask(() => { if (scope.get(runtime.ypn, id) == null) runtime.qvt.closeTab(scope, id); }); return; }
    if (next === current) return;
    current = next;
    runtime.Wvt(scope, () => { runtime.qvt.updateTabState(scope, id, () => defaultState(next)); runtime.qvt.updateTab(scope, id, { props: { context: next, onContextChange } }); });
  };
  runtime.Gvt(scope, registration, { revealAndFocus: true, id, target: 'right', props: { context: current, onContextChange }, title: intl.formatMessage({ id: 'shopping.browse.title', defaultMessage: 'Browse more', description: 'Title of the expanded shopping product browser' }), requiresWorkspaceReady: false, defaultState: () => defaultState(context), onClose: () => scope.set(runtime.Tz, id, null) });
  if (scope.get(runtime.qvt.tabById$, id) == null) scope.set(runtime.Tz, id, null);
}

registration = runtime.IDt('shopping-browse', ShoppingBrowseTab, { isAvailable: (scope: Scope) => scope.value.routeKind === 'chatgpt-thread', open: openShoppingBrowseTab });
export { openShoppingBrowseTab };
