import { isForwardedAnnotationMessage } from "./annotation-forwarded-message-policy";

function getMountedAnnotationMessageAction(type: string) {
  if (type === `browser-sidebar-runtime-sync`) return `sync`;
  return isForwardedAnnotationMessage(type) ? `forward` : `ignore`;
}

function getPreMountAnnotationMessageAction(type: string) {
  if (type === `browser-sidebar-runtime-annotation-permission-result`) return `permission-result`;
  if (type === `browser-site-annotation-feature-preview`) return `preview`;
  if (type === `browser-sidebar-runtime-sync`) return `sync`;
  if (type === `browser-sidebar-runtime-capture-text-selection`) return `capture-text-selection`;
  if (isQueuedEditorAnnotationMessage(type)) return `queue-editor-message`;
  if (type === `browser-sidebar-runtime-close-editor`) return `close-editor`;
  return `ignore`;
}

export { getMountedAnnotationMessageAction, getPreMountAnnotationMessageAction };
if (typeof module !== `undefined`) module.exports = {
  getMountedAnnotationMessageAction,
  getPreMountAnnotationMessageAction,
};
import { isQueuedEditorAnnotationMessage } from "./annotation-message-queue-policy";
