type BrowserInputBridgeDependencies = {
  windowLike: {
    addEventListener: (type: string, listener: (event: any) => void, capture: boolean) => void;
  };
  imageElementConstructor: new (...args: any[]) => any;
  invokeHost: (message: any) => unknown;
};

function getMouseNavigationDirection(event: { button?: number }) {
  return event.button === 3 ? `back` : event.button === 4 ? `forward` : null;
}

function findImageInEventPath(event: any, imageElementConstructor: BrowserInputBridgeDependencies[`imageElementConstructor`]) {
  for (const target of event.composedPath()) {
    if (target instanceof imageElementConstructor) return target;
  }
  return event.target instanceof imageElementConstructor ? event.target : null;
}

function installBrowserInputBridge(deps: BrowserInputBridgeDependencies) {
  let imageDragActive = false;

  const suppressMouseNavigation = (event: any) => {
    if (getMouseNavigationDirection(event) == null) return;
    event.preventDefault();
    event.stopPropagation();
  };
  const onMouseUp = (event: any) => {
    const direction = getMouseNavigationDirection(event);
    if (direction == null || !event.isTrusted) return;
    suppressMouseNavigation(event);
    deps.invokeHost({ type: `browser-sidebar-runtime-mouse-navigation`, direction });
  };
  const onDragStart = (event: any) => {
    if (!event.isTrusted) return;
    const image = findImageInEventPath(event, deps.imageElementConstructor);
    const sourceUrl = image?.currentSrc || image?.src;
    if (sourceUrl == null || sourceUrl.length === 0) return;
    imageDragActive = true;
    deps.invokeHost({ type: `browser-sidebar-runtime-image-drag-started`, sourceUrl });
  };
  const onDragEnd = (event: any) => {
    if (!event.isTrusted || !imageDragActive) return;
    imageDragActive = false;
    deps.invokeHost({ type: `browser-sidebar-runtime-image-drag-ended` });
  };

  deps.windowLike.addEventListener(`mousedown`, suppressMouseNavigation, true);
  deps.windowLike.addEventListener(`mouseup`, onMouseUp, true);
  deps.windowLike.addEventListener(`auxclick`, suppressMouseNavigation, true);
  deps.windowLike.addEventListener(`dragstart`, onDragStart, true);
  deps.windowLike.addEventListener(`dragend`, onDragEnd, true);
}

export { findImageInEventPath, getMouseNavigationDirection, installBrowserInputBridge };
if (typeof module !== `undefined`) module.exports = { findImageInEventPath, getMouseNavigationDirection, installBrowserInputBridge };
