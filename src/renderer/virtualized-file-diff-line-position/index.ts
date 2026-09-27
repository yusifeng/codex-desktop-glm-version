import {
  L_n as initializeVirtualizedFileDiff,
  PSn as virtualizedFileDiffSelector,
  hvn as VirtualizedFileDiffController,
} from "@rchunk/app-initial";

interface LinePosition {
  height: number;
  top: number;
}

const controllers = new WeakMap<Element, VirtualizedFileDiffController>();

function registerVirtualizedFileDiffController(
  element: Element,
  controller: unknown,
): void {
  if (controller instanceof VirtualizedFileDiffController) {
    controllers.set(element, controller);
  }
}

function getController(root: Element): VirtualizedFileDiffController | undefined {
  const element = root.querySelector(virtualizedFileDiffSelector);
  return element == null ? undefined : controllers.get(element);
}

function getVirtualizedLinePosition(
  root: Element,
  line: number,
  side: string,
): LinePosition | undefined {
  const controller = getController(root);
  const position = controller?.getLinePosition(line, side);
  if (controller?.top != null && position != null) {
    return { height: position.height, top: controller.top + position.top };
  }
}

function setSelectedDiffLines(root: Element, selection: unknown): void {
  getController(root)?.setSelectedLines(selection, { notify: true });
}

function initializeVirtualizedLinePosition(): void {
  initializeVirtualizedFileDiff();
}

export {
  setSelectedDiffLines as i,
  initializeVirtualizedLinePosition as n,
  registerVirtualizedFileDiffController as r,
  getVirtualizedLinePosition as t,
};
