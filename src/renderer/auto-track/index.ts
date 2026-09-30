// Automatic link and form analytics tracking. Release chunk: auto-track-c4c9b822fca3.js.
import "@rchunk/rolldown-runtime";
import { r as withTimeout } from "@rchunk/callback-utility";

interface Tracker {
  settings: { timeout?: number };
  track(
    event: unknown,
    properties: unknown,
    options: Record<string, unknown>,
  ): Promise<unknown>;
}
type Value<T extends Element> = unknown | ((element: T) => unknown);
function modifiedClick(event: MouseEvent): boolean {
  return Boolean(
    event.ctrlKey ||
    event.shiftKey ||
    event.metaKey ||
    (event.button && event.button === 1),
  );
}
function opensNewWindow(element: Element, href: string | null): boolean {
  return element.getAttribute("target") === "_blank" && Boolean(href);
}
function link(
  this: Tracker,
  elements: Element | Element[] | { toArray(): Element[] } | null | undefined,
  event: Value<Element>,
  properties: Value<Element>,
  options?: Record<string, unknown>,
): Tracker {
  if (!elements) return this;
  const list =
    elements instanceof Element
      ? [elements]
      : "toArray" in elements
        ? elements.toArray()
        : elements;
  for (const element of list) {
    element.addEventListener("click", (clickEvent) => {
      const name = typeof event === "function" ? event(element) : event;
      const props =
        typeof properties === "function" ? properties(element) : properties;
      const href =
        element.getAttribute("href") ||
        element.getAttributeNS("http://www.w3.org/1999/xlink", "href") ||
        element.getAttribute("xlink:href") ||
        element.getElementsByTagName("a")[0]?.getAttribute("href") ||
        null;
      const tracked = withTimeout(
        this.track(name, props, options ?? {}),
        this.settings.timeout ?? 500,
      );
      if (
        !opensNewWindow(element, href) &&
        !modifiedClick(clickEvent as MouseEvent) &&
        href
      ) {
        clickEvent.preventDefault();
        tracked
          .catch(console.error)
          .then(() => {
            window.location.href = href;
          })
          .catch(console.error);
      }
    });
  }
  return this;
}
function form(
  this: Tracker,
  elements: HTMLFormElement | ArrayLike<Element> | null | undefined,
  event: Value<Element>,
  properties: Value<Element>,
  options?: Record<string, unknown>,
): Tracker {
  if (!elements) return this;
  const list: Element[] =
    elements instanceof HTMLFormElement ? [elements] : Array.from(elements);
  for (const element of list) {
    if (!(element instanceof Element))
      throw new TypeError("Must pass HTMLElement to trackForm/trackSubmit.");
    const handler = (submitEvent: Event) => {
      submitEvent.preventDefault();
      const name = typeof event === "function" ? event(element) : event;
      const props =
        typeof properties === "function" ? properties(element) : properties;
      withTimeout(
        this.track(name, props, options ?? {}),
        this.settings.timeout ?? 500,
      )
        .catch(console.error)
        .then(() => (element as HTMLFormElement).submit())
        .catch(console.error);
    };
    element.addEventListener("submit", handler);
  }
  return this;
}

export { form, link };
