import '@rchunk/rolldown-runtime';
import * as SharedChunk from '@rchunk/app-shared';
import * as InitialChunk from '@rchunk/app-initial';
import * as PrimaryChunk from '@rchunk/app-primary';
import * as PanelVisibilityChunk from '@rchunk/panel-visibility';

interface OpenMessage { conversationId?: string | null; open?: boolean; returnToSettingsOrigin?: boolean; source?: string; url?: string | null }
interface Capability { isCapable: boolean; isError?: boolean; isLoading?: boolean }
interface Api { useCapability?(name: { name: string }): Capability; useScope?(): { get<T>(key: unknown): T }; unsavedSettings?: unknown; queueOpen?(message: OpenMessage): void; dispatchHostMessage?(message: Record<string, unknown>): void; useHostMessage?(type: string, handler: (message: OpenMessage) => void): void; showUnavailable?(): void; showUnsavedWarning?(): void }
const shared = SharedChunk as unknown as Api;
const initial = InitialChunk as unknown as Api;
void PrimaryChunk; void PanelVisibilityChunk;

function BrowserOpenHandler(): null {
  const useCapability = shared.useCapability ?? initial.useCapability;
  const useHostMessage = shared.useHostMessage ?? initial.useHostMessage;
  const useScope = shared.useScope ?? initial.useScope;
  if (useCapability == null || useHostMessage == null || useScope == null) return null;
  const capability = useCapability({ name: 'browser.in-app' });
  const scope = useScope();
  useHostMessage('toggle-browser-panel', (message) => {
    if (capability.isLoading && !capability.isError) return;
    if (capability.isError || !capability.isCapable) { (shared.showUnavailable ?? initial.showUnavailable)?.(); return; }
    const unsaved = initial.unsavedSettings == null ? 0 : scope.get<Set<unknown>>(initial.unsavedSettings).size;
    if (message.returnToSettingsOrigin === true && unsaved > 0) { (shared.showUnsavedWarning ?? initial.showUnsavedWarning)?.(); return; }
    (initial.queueOpen ?? shared.queueOpen)?.({ ...message, source: message.source ?? 'manual' });
    if (message.open === true && message.url != null && message.conversationId == null) (shared.dispatchHostMessage ?? initial.dispatchHostMessage)?.({ type: 'navigate-to-route', path: '/' });
  });
  return null;
}
export { BrowserOpenHandler };
