// composer-tip —— Composer 教育 tip 的资格判断、展示事件和 action 执行。
import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/ambient-suggestion-apps";
import "@rchunk/home-beacon";
import "@rchunk/catalog";

export type ComposerTipAction =
  | { type: "prefill"; prompt: string }
  | { type: "prefill-with-skill"; prompt: string; skillName: string }
  | { type: "prefill-with-plugin"; prompt: string; pluginId: string }
  | { type: "navigate"; path: string; state?: unknown }
  | { type: "new-chat" }
  | { type: "open-notification-settings" }
  | { type: "start-voice" }
  | { type: "switch-to-work" };

export interface ComposerTipDefinition {
  id: string; badgeLabel: unknown; content: unknown; actionLabel: unknown; action: ComposerTipAction;
  isEligible?(capabilities: Record<string, unknown>): boolean;
}

function useComposerTip(input: {
  conversationId: string; enabled?: boolean; isWorkMode?: boolean;
  event?: { beaconId: string; messageId?: string | null; conversationId?: string; dismissVariant?: string } | null;
  tips?: ComposerTipDefinition[]; capabilities?: Record<string, unknown>;
  composer?: { appendText(text: string): void; insertTextAtSelection(text: string): void; insertSkillMentionAtSelection(skill: unknown): void; insertMentionAtSelection(plugin: unknown): void; focus(): void } | null;
  skills?: Array<{ name: string; enabled: boolean }>; plugins?: Array<{ plugin: { id: string }; [key: string]: unknown }>;
  navigate?(path: string, options?: { state?: unknown }): void; openNotificationSettings?(): void; onStartVoice?(): void;
  onSwitchToWork?(): void; onShown?(tip: ComposerTipDefinition): void; onDismiss?(tip: ComposerTipDefinition): void; onClick?(tip: ComposerTipDefinition): void;
}) {
  if (input.enabled === false || input.event == null) return null;
  const tip = input.tips?.find((candidate) => candidate.id === input.event!.beaconId);
  if (tip == null || tip.isEligible?.(input.capabilities ?? {}) === false) return null;
  if (input.event.dismissVariant !== "persistent" && input.event.messageId == null) return null;
  const run = () => {
    const action = tip.action;
    switch (action.type) {
      case "prefill": input.composer?.appendText(action.prompt); input.composer?.focus(); break;
      case "prefill-with-skill": {
        const skill = input.skills?.find((item) => item.enabled && item.name.toLowerCase() === action.skillName);
        if (skill != null && input.composer != null) { input.composer.appendText(action.prompt); input.composer.insertTextAtSelection(" "); input.composer.insertSkillMentionAtSelection(skill); input.composer.focus(); }
        break;
      }
      case "prefill-with-plugin": {
        const plugin = input.plugins?.find((item) => item.plugin.id === action.pluginId);
        if (plugin != null && input.composer != null) { input.composer.appendText(action.prompt); input.composer.insertTextAtSelection(" "); input.composer.insertMentionAtSelection(plugin); input.composer.focus(); }
        break;
      }
      case "navigate": input.navigate?.(action.path, { state: action.state }); break;
      case "new-chat": input.navigate?.("/"); break;
      case "open-notification-settings": input.openNotificationSettings?.(); break;
      case "start-voice": input.onStartVoice?.(); break;
      case "switch-to-work": input.onSwitchToWork?.(); input.navigate?.("/"); break;
    }
  };
  return {
    kind: "composer-tip" as const, impressionId: `${tip.id}:${input.event.conversationId ?? input.conversationId}:${input.event.messageId ?? ""}`,
    tip, ariaLive: "polite", role: "status", dismissLabel: "Dismiss tip",
    shown: () => input.onShown?.(tip), dismiss: () => input.onDismiss?.(tip),
    primaryAction() { input.onClick?.(tip); run(); },
  };
}

export { useComposerTip };
