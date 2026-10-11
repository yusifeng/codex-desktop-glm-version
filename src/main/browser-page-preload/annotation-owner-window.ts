function getAnnotationOwnerWindow(element: any, fallbackWindow: any): any { return element.ownerDocument.defaultView ?? fallbackWindow; }
export { getAnnotationOwnerWindow };
if (typeof module !== `undefined`) module.exports = { getAnnotationOwnerWindow };
