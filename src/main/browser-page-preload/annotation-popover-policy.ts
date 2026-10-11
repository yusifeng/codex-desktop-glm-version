function setAnnotationPopoverOpen(element: any, hideFirst: boolean, deps: any): boolean { if (!deps.isConnected(element) || !deps.hasMethod(element, `showPopover`)) return false; try { if (hideFirst && deps.isOpen(element)) { if (!deps.hasMethod(element, `hidePopover`)) return false; deps.hide(element); } if (!deps.isOpen(element)) deps.show(element); return deps.isOpen(element); } catch { return false; } }
function closeAnnotationPopover(element: any, deps: any): void { if (!deps.hasMethod(element, `hidePopover`)) return; try { if (deps.isOpen(element)) deps.hide(element); } catch {} }
export { setAnnotationPopoverOpen, closeAnnotationPopover };
if (typeof module !== `undefined`) module.exports = { setAnnotationPopoverOpen, closeAnnotationPopover };
