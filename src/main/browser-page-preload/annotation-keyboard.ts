type KeyboardEventLike = {
  isTrusted?: boolean;
  code?: string;
  type?: string;
  isComposing?: boolean;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  composedPath(): unknown[];
  preventDefault(): void;
  stopImmediatePropagation(): void;
};

function interceptAnnotationSpaceKey(
  event: KeyboardEventLike,
  active: boolean,
  preserveTyping: boolean,
  isElement: (value: unknown) => value is { isContentEditable?: boolean; closest(selector: string): unknown },
): boolean | undefined {
  if (!event.isTrusted || event.code !== `Space`) return undefined;
  const typingContext = !active && (
    event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
    (preserveTyping && event.composedPath().some((value) => isElement(value) && (value.isContentEditable || value.closest(`input,textarea,select,[role='textbox'],[data-codex-composer],[data-codex-terminal]`) != null)))
  );
  if (typingContext) return undefined;
  event.preventDefault();
  event.stopImmediatePropagation();
  return event.type === `keydown`;
}

export { interceptAnnotationSpaceKey };
if (typeof module !== `undefined`) module.exports = { interceptAnnotationSpaceKey };
