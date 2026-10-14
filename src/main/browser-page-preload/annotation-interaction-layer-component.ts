function createAnnotationInteractionLayerComponent(deps: any) {
  const { useRef, useState, useLayoutEffect, jsx, windowLike, showPopover, cleanupPopover } = deps;
  return function AnnotationInteractionLayer({ children, style }: any) {
    const elementRef = useRef(null);
    const [visible, setVisible] = useState(false);
    useLayoutEffect(() => {
      const element = elementRef.current;
      if (element == null) return;
      let animationFrame: any = null;
      const reveal = () => {
        const shown = showPopover(element, false);
        setVisible(shown);
        return shown;
      };
      if (!reveal()) animationFrame = windowLike.requestAnimationFrame(reveal);
      return () => {
        if (animationFrame != null) windowLike.cancelAnimationFrame(animationFrame);
        cleanupPopover(element);
      };
    }, []);
    return jsx(`div`, {
      ref: elementRef,
      popover: `manual`,
      className: `interaction-layer`,
      style: visible ? style : undefined,
      "data-browser-comment-interaction-layer": true,
      children,
    });
  };
}

export { createAnnotationInteractionLayerComponent };
if (typeof module !== `undefined`) module.exports = { createAnnotationInteractionLayerComponent };
