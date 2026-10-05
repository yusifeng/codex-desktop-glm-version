/** Mutable active/terminal state for the annotation mode controller. */
function createAnnotationModeControllerState() {
  let active = true;
  let disposed = false;
  return {
    get active() { return active; },
    get disposed() { return disposed; },
    setActive(value: boolean) { active = value === true; },
    dispose() { if (disposed) return false; disposed = true; active = false; return true; },
  };
}
export { createAnnotationModeControllerState };
if (typeof module !== `undefined`) module.exports = { createAnnotationModeControllerState };
