import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/use-git-recent-branches";

interface ReviewCommand { description?: string; disabled?: boolean; id: string; title: string; onSelect?(): void }
interface ReviewSlashCommandSubmenuRegistrationProps { commands?: ReviewCommand[]; register?(definition: { description: string; id: string; requiresEmptyComposer: boolean; submenu: ReviewCommand[]; title: string }): void }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function ReviewSlashCommandSubmenuRegistration({ commands = [], register }: ReviewSlashCommandSubmenuRegistrationProps): unknown { const definition = { id: "review", title: "Review", description: "Review changes in a branch or pull request", requiresEmptyComposer: true, submenu: commands }; register?.(definition); return jsx().jsx("div", { hidden: true, "data-command": definition.id, children: commands.map(command => jsx().jsx("code", { children: command.title }, command.id)) }); }
export { ReviewSlashCommandSubmenuRegistration };
