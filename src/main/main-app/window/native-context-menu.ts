import { fileURLToPath } from "node:url";

type NativeContextMenuDependencies = {
  window: any;
  createContextMenu: (options: any) => (() => void) | void;
  revealLabel: string;
  showItemInFolder: (path: string) => void;
  sendVisualContentAction: (action: `copy-image` | `save-image`) => void;
  allowInspectElement: boolean;
};

/** Install the image-aware native context menu and release it with its window. */
function installNativeContextMenu(deps: NativeContextMenuDependencies) {
  const { window } = deps;
  const disposeMenu = deps.createContextMenu({
    window,
    prepend: (menu: any, params: any) => {
      menu.cut({}).accelerator = `CmdOrCtrl+X`;
      menu.copy({}).accelerator = `CmdOrCtrl+C`;
      menu.paste({}).accelerator = `CmdOrCtrl+V`;
      if (params.mediaType !== `image`) return [];

      const items: any[] = [];
      const imagePath = decodeFileUrl(params.srcURL);
      if (imagePath != null) {
        items.push({
          label: deps.revealLabel,
          click: () => deps.showItemInFolder(imagePath),
        });
      }

      const copyImage = menu.copyImage({});
      items.push({
        ...copyImage,
        click: (...args: any[]) => {
          copyImage.click?.(...args);
          deps.sendVisualContentAction(`copy-image`);
        },
      });

      if (params.frame == null || params.frame === window.webContents.mainFrame) {
        const saveImage = menu.saveImageAs({});
        items.push({
          ...saveImage,
          click: (...args: any[]) => {
            saveImage.click?.(...args);
            deps.sendVisualContentAction(`save-image`);
          },
        });
      }
      return items;
    },
    showCopyImage: false,
    showInspectElement: deps.allowInspectElement,
  });

  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    if (typeof disposeMenu === `function`) disposeMenu();
  };
  window.on(`closed`, dispose);
  return dispose;
}

function decodeFileUrl(value: unknown) {
  if (typeof value !== `string`) return null;
  try {
    return value.startsWith(`file:`) ? fileURLToPath(value, { windows: false }) : null;
  } catch {
    return null;
  }
}

export { decodeFileUrl, installNativeContextMenu };
if (typeof module !== `undefined`)
  module.exports = { decodeFileUrl, installNativeContextMenu };
