// @ts-expect-error The app-initial surface is declared incrementally by the shared manifest owner.
import { Hv as initializeMcpExtensionContextMenu, Vv as getMcpExtensionContextMenuItems } from "@rchunk/app-initial";

initializeMcpExtensionContextMenu();

export { getMcpExtensionContextMenuItems };
