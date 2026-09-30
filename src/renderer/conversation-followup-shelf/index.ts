import '@rchunk/rolldown-runtime';
import * as SharedChunk from '@rchunk/app-shared';
import * as InitialChunk from '@rchunk/app-initial';
import * as PrimaryChunk from '@rchunk/app-primary';
import * as ScrollControllerChunk from '@rchunk/thread-scroll-controller-context-value';
import * as NavigationStateChunk from '@rchunk/conversation-navigation-state';
interface Suggestion { id: string; title: string; body: string; tier: 't1' | 't2' | 't3'; source_id?: string | null }
interface Props { conversationId: string; loading?: boolean; suggestions?: Suggestion[]; visible?: boolean; onSelect?: (index: number, suggestion: Suggestion) => void }
interface Jsx { jsx(type: unknown, props: Record<string, unknown>, key?: unknown): unknown; jsxs(type: unknown, props: Record<string, unknown>, key?: unknown): unknown }
const jsx = (SharedChunk as unknown as { I3(): Jsx }).I3();
void InitialChunk; void PrimaryChunk; void ScrollControllerChunk; void NavigationStateChunk;
function ConversationFollowupShelf(props: Props): unknown {
  const items: Array<Suggestion | null> = props.loading ? [null, null, null] : (props.suggestions ?? []);
  if (!props.loading && items.length === 0) return null;
  const visible = props.visible !== false;
  return jsx.jsxs('div', { role: 'group', 'aria-label': 'Follow-up suggestions', 'aria-hidden': !visible, 'aria-busy': props.loading === true, inert: !visible, 'data-conversation-followup-shelf': true, children: [props.loading ? jsx.jsx('span', { role: 'status', className: 'sr-only', children: 'Loading suggestions' }) : null, jsx.jsx('div', { className: 'flex items-center gap-2 overflow-x-auto', children: items.map((suggestion, index) => suggestion == null ? jsx.jsx('span', { 'data-followup-skeleton': true }, index) : jsx.jsx('button', { type: 'button', 'data-suggestion-index': index, disabled: !visible, onClick: () => { if (visible) props.onSelect?.(index, suggestion); }, children: suggestion.title }, suggestion.id)) })] });
}
export { ConversationFollowupShelf };
