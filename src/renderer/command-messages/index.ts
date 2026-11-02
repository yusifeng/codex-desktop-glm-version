import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import {
  commandMessageCatalog,
  type CommandMessageDescriptor,
} from "./catalog.generated";

interface IntlShape {
  formatMessage(
    descriptor: CommandMessageDescriptor,
    values?: Record<string, unknown>,
  ): string;
}
interface Command {
  descriptionIntlId?: string;
  electron?: { menuTitleIntlId: string };
  id: string;
  titleIntlId?: string;
}
interface CommandOverride {
  description?: string;
  title?: string;
}

const shared = appSharedChunk as unknown as Record<string, unknown>;
const initial = appInitialChunk as unknown as Record<string, unknown>;
let initialized = false;

function initializeCommandMessages(): void {
  if (initialized) return;
  initialized = true;
  for (const value of [shared.Ep, shared.K2, initial.Ndn]) {
    if (typeof value === "function") (value as () => void)();
  }
}

function fallbackDescriptor(
  id: string,
  defaultMessage = "",
): CommandMessageDescriptor {
  return { id, defaultMessage, description: defaultMessage };
}

function descriptor(id: string, defaultMessage = ""): CommandMessageDescriptor {
  return commandMessageCatalog[id] ?? fallbackDescriptor(id, defaultMessage);
}

function formatCommandTitle(
  command: Command,
  intl: IntlShape,
  petEnabled = false,
): string {
  initializeCommandMessages();
  if (command.id === "openAvatarOverlay" && petEnabled) {
    return intl.formatMessage(
      descriptor("codex.command.toggleMiniOverlay", "Show pet"),
    );
  }
  if (command.id === "composer.captureAppshot") {
    return intl.formatMessage(
      descriptor("codex.command.composer.captureAppshot", "Capture appshot"),
    );
  }

  const id =
    command.titleIntlId ??
    command.electron?.menuTitleIntlId ??
    `codex.command.${command.id}`;
  const message = descriptor(id);
  return message.defaultMessage === ""
    ? command.id
    : intl.formatMessage(message);
}

function formatCommandMetadata(
  command: Command,
  intl: IntlShape,
  override?: CommandOverride,
  petEnabled = false,
): { description: string; title: string } {
  initializeCommandMessages();
  const title =
    override?.title ?? formatCommandTitle(command, intl, petEnabled);
  const descriptionId =
    command.descriptionIntlId ?? `codex.commandDescription.${command.id}`;
  const descriptionMessage = descriptor(descriptionId);
  const appName = initial.Mdn;
  const description =
    override?.description ??
    (descriptionMessage.defaultMessage === ""
      ? ""
      : intl.formatMessage(descriptionMessage, { appName }));
  return { title, description };
}

initializeCommandMessages();
export {
  formatCommandTitle as n,
  initializeCommandMessages as r,
  formatCommandMetadata as t,
};
