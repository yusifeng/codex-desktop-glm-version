export interface MessageDescriptor {
  id: string;
  defaultMessage?: string;
  description?: string | Record<string, unknown>;
}

export type MessagePrimitive =
  boolean | Date | null | number | string | undefined;
export type MessageValue =
  MessagePrimitive | ((chunks: readonly unknown[]) => unknown);
export type MessageValues = Record<string, MessageValue>;

export interface IntlShape {
  locale?: string;
  textComponent?: unknown;
  formatMessage(
    descriptor: MessageDescriptor,
    values?: MessageValues,
    options?: { ignoreTag?: boolean },
  ): string | readonly unknown[];
  formatMessage(
    descriptor: MessageDescriptor,
    values?: Record<string, unknown>,
    options?: { ignoreTag?: boolean },
  ): string;
}

export interface FormattedMessageProps extends MessageDescriptor {
  values?: MessageValues;
  children?: (chunks: readonly unknown[]) => unknown;
  tagName?: unknown;
  ignoreTag?: boolean;
}

interface ContextLike<T> {
  Provider: unknown;
  _defaultValue?: T;
}

interface ReactLike {
  Fragment: unknown;
  createContext<T>(defaultValue: T): ContextLike<T>;
  createElement(
    type: unknown,
    props: Record<string, unknown> | null,
    ...children: unknown[]
  ): unknown;
  useContext<T>(context: ContextLike<T>): T;
}

let intlContext: ContextLike<IntlShape | null> | undefined;

function reactOf(): ReactLike {
  return (
    (globalThis as { __RENDERER_REACT__?: ReactLike }).__RENDERER_REACT__ ??
    (require("react") as ReactLike)
  );
}

function intlContextOf(): ContextLike<IntlShape | null> {
  return (intlContext ??= reactOf().createContext<IntlShape | null>(null));
}

/** React Intl 的 defineMessages；原 `oae` / 压缩导出 `G2`。 */
export function defineMessages<
  const Messages extends Record<string, MessageDescriptor>,
>(messages: Messages): Messages {
  return messages;
}

/** React Intl 的 defineMessage；原 `sae` / 压缩导出 `W2`。 */
export function defineMessage<const Descriptor extends MessageDescriptor>(
  descriptor: Descriptor,
): Descriptor {
  return descriptor;
}

/** 原 `zg` / 压缩导出 `n4`。 */
export function useIntl(): IntlShape {
  const injected = (globalThis as { __RENDERER_INTL__?: IntlShape })
    .__RENDERER_INTL__;
  const intl = injected ?? reactOf().useContext(intlContextOf());
  if (intl == null) {
    throw new Error("An IntlProvider must be mounted before useIntl");
  }
  return intl;
}

export interface IntlProviderProps {
  children?: unknown;
  value: IntlShape;
}

export function IntlProvider({ children, value }: IntlProviderProps): unknown {
  return reactOf().createElement(intlContextOf().Provider, { value }, children);
}

/** 原 `eae/Gg` / 压缩导出 `Y2`。 */
export function FormattedMessage({
  id,
  description,
  defaultMessage,
  values,
  children,
  tagName,
  ignoreTag,
}: FormattedMessageProps): unknown {
  const intl = useIntl();
  const formatted = intl.formatMessage(
    { id, description, defaultMessage },
    values,
    { ignoreTag },
  );
  if (typeof children === "function") {
    return children(Array.isArray(formatted) ? formatted : [formatted]);
  }
  const Component =
    tagName === undefined
      ? (intl.textComponent ?? reactOf().Fragment)
      : tagName;
  return Component
    ? reactOf().createElement(Component, null, formatted)
    : reactOf().createElement(reactOf().Fragment, null, formatted);
}

/** 原 `Kg` / 压缩导出 `K2`。 */
export function initializeIntl(): void {}
