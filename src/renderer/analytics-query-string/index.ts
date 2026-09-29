import "@rchunk/rolldown-runtime";
import { a as isPlainObject } from "@rchunk/analytics-type-helpers";
import { t as gracefulDecodeURIComponent } from "@rchunk/graceful-decode-uri-component";

interface AnalyticsClient {
  options: { useQueryString?: unknown };
  identify(userId: string, traits: Record<string, string | undefined>): unknown;
  setAnonymousId(id: string): void;
  track(event: string, properties: Record<string, string | undefined>): unknown;
}
function prefixedValues(prefix: string, values: Record<string, string | undefined>): Record<string, string | undefined> {
  return Object.keys(values).reduce<Record<string, string | undefined>>((result, key) => {
    if (key.startsWith(prefix)) result[key.slice(prefix.length)] = values[key];
    return result;
  }, {});
}
function queryString(client: AnalyticsClient, url: string): Promise<unknown[]> {
  const anchor = document.createElement("a");
  anchor.href = url;
  const values = anchor.search.slice(1).split("&").reduce<Record<string, string | undefined>>((result, pair) => {
    const [key, value] = pair.split("=");
    result[key] = gracefulDecodeURIComponent(value);
    return result;
  }, {});
  const operations: unknown[] = [];
  const options = isPlainObject(client.options.useQueryString) ? client.options.useQueryString : {};
  const anonymousIdPattern = options.aid instanceof RegExp ? options.aid : /.+/;
  const userIdPattern = options.uid instanceof RegExp ? options.uid : /.+/;
  const anonymousId = values.ajs_aid;
  if (anonymousId && anonymousIdPattern.test(anonymousId)) client.setAnonymousId(anonymousId);
  const userId = values.ajs_uid;
  if (userId && userIdPattern.test(userId)) operations.push(client.identify(userId, prefixedValues("ajs_trait_", values)));
  const event = values.ajs_event;
  if (event) operations.push(client.track(event, prefixedValues("ajs_prop_", values)));
  return Promise.all(operations);
}

export { queryString };
