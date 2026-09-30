import '@rchunk/rolldown-runtime';
import * as SharedChunk from '@rchunk/app-shared';
import * as InitialChunk from '@rchunk/app-initial';
import * as PersonaChunk from '@rchunk/pepper-persona';
import * as PresentationChunk from '@rchunk/settings-parental-presentation';
import * as InvitationsChunk from '@rchunk/invitations';
import * as U18LoggingChunk from '@rchunk/u18-banner-logging';
type Kind = 'family-invite' | 'family-unlink' | 'setting-updated' | 'setting-defaulted' | 'self-harm';
interface Props { notification: { type: Kind; item: { id: string; payload?: Record<string, unknown> | null } }; account: { userId: string; accountId: string }; initialSurface: 'banner' | 'info'; onClose(): void; onViewInvitation?: () => void; onViewSettings?: (path: string) => void; onLearnMore?: () => void }
interface Jsx { jsx(type: unknown, props: Record<string, unknown>, key?: unknown): unknown; jsxs(type: unknown, props: Record<string, unknown>, key?: unknown): unknown }
const jsx = (SharedChunk as unknown as { I3(): Jsx }).I3();
void InitialChunk; void PersonaChunk; void PresentationChunk; void InvitationsChunk; void U18LoggingChunk;
function settingsPath(type: Kind, account: Props['account'], familyEnabled: boolean): string { const base = familyEnabled ? '/family' : '/settings/parental-controls'; const query = new URLSearchParams(familyEnabled ? { view: 'manage' } : {}); if (type === 'setting-updated') query.set('member', account.userId); return query.size === 0 ? base : base + '?' + query; }
function FamilyNotification(props: Props): unknown {
  const kind = props.notification.type;
  if (kind === 'setting-defaulted') return jsx.jsx('div', { role: 'status', 'data-family-notification': kind, children: 'ChatGPT includes safeguards for teens' });
  const familyEnabled = props.notification.item.payload?.familyEnabled === true;
  const copy = kind === 'family-invite' ? ['Family invitation', 'Review the invitation to join a family group', 'View invitation'] : kind === 'family-unlink' ? ['Family account updated', 'Your family connection has changed', 'View settings'] : kind === 'setting-updated' ? ['Parental controls updated', 'A family setting was changed', 'View settings'] : ['Important safety alert', 'Please review this time-sensitive information about your child’s recent activity', 'Learn more'];
  const action = (): void => { if (kind === 'family-invite') props.onViewInvitation?.(); else if (kind === 'self-harm') props.onLearnMore?.(); else props.onViewSettings?.(settingsPath(kind, props.account, familyEnabled)); };
  return jsx.jsxs('section', { role: kind === 'self-harm' ? 'alert' : 'status', 'data-family-notification': kind, children: [jsx.jsx('h2', { children: copy[0] }), jsx.jsx('p', { children: copy[1] }), jsx.jsx('button', { type: 'button', onClick: action, children: copy[2] }), jsx.jsx('button', { type: 'button', 'aria-label': 'Dismiss', onClick: props.onClose, children: '×' })] }, props.notification.item.id);
}
export { FamilyNotification };
