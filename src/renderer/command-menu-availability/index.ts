import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
import "@rchunk/app-shared";
import { t as shouldSuppressAds } from "@rchunk/command-menu-holdout";
interface AvailabilityContext { activeAccountId?: string | null; activeUserId?: string | null; client?: Parameters<typeof shouldSuppressAds>[0] | null; commandMenuEnabled?: boolean; isBrowserWindow?: boolean; isLocked?: boolean }
function isCommandMenuAvailable(context: AvailabilityContext): boolean { return context.activeAccountId != null && context.activeUserId != null && context.commandMenuEnabled === true && context.isBrowserWindow !== true && context.isLocked !== true && !(context.client != null && shouldSuppressAds(context.client)); }
function initialize(): void {}
export { initialize as n, isCommandMenuAvailable as t };
