type AnnotationPointerEventLifecycleDependencies = {
  documentLike: any;
  windowLike: any;
  auxiliaryEvents: string[];
  handlers: {
    pointerDown: (event: any) => void;
    pointerMove: (event: any) => void;
    pointerUp: (event: any) => void;
    pointerCancel: (event: any) => void;
    mouseMove: (event: any) => void;
    mouseOut: (event: any) => void;
    keyDown: (event: any) => void;
    keyUp: (event: any) => void;
    click: (event: any) => void;
    contextMenu: (event: any) => void;
    wheel: (event: any) => void;
    blur: () => void;
    auxiliary: (event: any) => void;
  };
};

/** Installs and removes the annotation pointer/event surface in deterministic order. */
function installAnnotationPointerEventLifecycle(dependencies: AnnotationPointerEventLifecycleDependencies) {
  const { documentLike, windowLike, auxiliaryEvents, handlers } = dependencies;
  const listener = (type: string, callback: (event: any) => void, capture?: boolean) =>
    documentLike.addEventListener(type, callback, capture);
  listener(`pointerdown`, handlers.pointerDown, true);
  listener(`pointermove`, handlers.pointerMove, true);
  listener(`pointerup`, handlers.pointerUp, true);
  for (const type of auxiliaryEvents) listener(type, handlers.auxiliary, true);
  listener(`pointercancel`, handlers.pointerCancel);
  listener(`mousemove`, handlers.mouseMove);
  listener(`mouseout`, handlers.mouseOut);
  listener(`keydown`, handlers.keyDown, true);
  listener(`keyup`, handlers.keyUp, true);
  listener(`click`, handlers.click, true);
  listener(`contextmenu`, handlers.contextMenu, true);
  listener(`wheel`, handlers.wheel, true);
  windowLike.addEventListener(`blur`, handlers.blur);
  return () => {
    documentLike.removeEventListener(`pointerdown`, handlers.pointerDown, true);
    documentLike.removeEventListener(`pointermove`, handlers.pointerMove, true);
    documentLike.removeEventListener(`pointerup`, handlers.pointerUp, true);
    for (const type of auxiliaryEvents) documentLike.removeEventListener(type, handlers.auxiliary, true);
    documentLike.removeEventListener(`pointercancel`, handlers.pointerCancel);
    documentLike.removeEventListener(`mousemove`, handlers.mouseMove);
    documentLike.removeEventListener(`mouseout`, handlers.mouseOut);
    documentLike.removeEventListener(`keydown`, handlers.keyDown, true);
    documentLike.removeEventListener(`keyup`, handlers.keyUp, true);
    documentLike.removeEventListener(`click`, handlers.click, true);
    documentLike.removeEventListener(`contextmenu`, handlers.contextMenu, true);
    documentLike.removeEventListener(`wheel`, handlers.wheel, true);
    windowLike.removeEventListener(`blur`, handlers.blur);
  };
}

export { installAnnotationPointerEventLifecycle };
if (typeof module !== `undefined`) module.exports = { installAnnotationPointerEventLifecycle };
