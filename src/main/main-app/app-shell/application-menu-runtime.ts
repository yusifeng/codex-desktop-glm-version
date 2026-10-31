// @ts-nocheck

/** Normalizes Electron accelerator aliases for collision/exclusion comparisons. */
export function normalizeMenuAccelerator(accelerator: string, isMacOS: boolean) {
  return accelerator
    .split(`+`)
    .map((part) => {
      switch (part.toLowerCase()) {
        case `cmdorctrl`:
        case `commandorcontrol`:
          return isMacOS ? `command` : `control`;
        case `cmd`:
        case `command`:
          return `command`;
        case `control`:
        case `ctrl`:
          return `control`;
        case `option`:
          return isMacOS ? `alt` : `option`;
        case `alt`:
          return `alt`;
        case `meta`:
        case `super`:
          return isMacOS ? `command` : `super`;
        case `enter`:
        case `return`:
          return `enter`;
        case `esc`:
        case `escape`:
          return `escape`;
        case `plus`:
          return isMacOS ? `=` : `plus`;
        default:
          return part.toLowerCase();
      }
    })
    .sort()
    .join(`+`);
}

/** Stable refresh surface used by focus, locale, browser-state, and feature consumers. */
export class ApplicationMenuManager {
  buildMenu;

  constructor(buildMenu: () => void) {
    this.buildMenu = buildMenu;
  }

  refresh() {
    this.buildMenu();
  }
}

if (typeof module !== "undefined") {
  module.exports = { ApplicationMenuManager, normalizeMenuAccelerator };
}
