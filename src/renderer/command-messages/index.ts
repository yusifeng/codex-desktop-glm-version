import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";

interface MessageDescriptor { defaultMessage: string; description: string; id: string }
interface IntlShape { formatMessage(descriptor: MessageDescriptor, values?: Record<string, unknown>): string }
interface Command { descriptionIntlId?: string; electron?: { menuTitleIntlId: string }; id: string; titleIntlId?: string }
interface CommandOverride { description?: string; title?: string }
const messages: Record<string, MessageDescriptor> = {
  "codex.command.newThread": { id: "codex.command.newThread", defaultMessage: "New chat", description: "Start a new chat" },
  "codex.command.quickChat": { id: "codex.command.quickChat", defaultMessage: "Quick chat", description: "Open quick chat" },
  "codex.command.archiveThread": { id: "codex.command.archiveThread", defaultMessage: "Archive chat", description: "Archive the current chat" },
  "codex.command.composer.submit": { id: "codex.command.composer.submit", defaultMessage: "Send message", description: "Send the current composer message" },
  "codex.commandDescription.composer.submit": { id: "codex.commandDescription.composer.submit", defaultMessage: "Send the current message", description: "Description for send message" },
  "codex.command.toggleMiniOverlay": { id: "codex.command.toggleMiniOverlay", defaultMessage: "Show pet", description: "Show the floating pet overlay" },
  "codex.command.composer.captureAppshot": { id: "codex.command.composer.captureAppshot", defaultMessage: "Capture appshot", description: "Capture an appshot" },
  "codex.commandDescription.composer.captureAppshot": { id: "codex.commandDescription.composer.captureAppshot", defaultMessage: "Capture an appshot for the active composer", description: "Description for appshot capture" },
};
function descriptor(key: string, fallback: string): MessageDescriptor { return messages[key] ?? { id: key, defaultMessage: fallback, description: fallback }; }
function formatCommandTitle(command: Command, intl: IntlShape, petEnabled = false): string {
  if (command.id === "openAvatarOverlay" && petEnabled) return intl.formatMessage(messages["codex.command.toggleMiniOverlay"]);
  if (command.id === "composer.captureAppshot") return intl.formatMessage(messages["codex.command.composer.captureAppshot"]);
  const id = command.titleIntlId ?? command.electron?.menuTitleIntlId ?? `codex.command.${command.id}`;
  return intl.formatMessage(descriptor(id, command.id));
}
function formatCommandMetadata(command: Command, intl: IntlShape, override?: CommandOverride, petEnabled = false): { description: string; title: string } {
  const title = override?.title ?? formatCommandTitle(command, intl, petEnabled);
  const id = command.descriptionIntlId ?? `codex.commandDescription.${command.id}`;
  return { title, description: override?.description ?? intl.formatMessage(descriptor(id, "")) };
}
function initializeCommandMessages(): void {}
export { formatCommandTitle as n, initializeCommandMessages as r, formatCommandMetadata as t };
