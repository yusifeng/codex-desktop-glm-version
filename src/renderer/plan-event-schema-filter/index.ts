// Analytics schema filter. Release chunk: schema-filter-d9fe65a26d7e.js.
import "@rchunk/rolldown-runtime";
import { p4 as initializeObjectSpread } from "@rchunk/app-shared";
import { n as isPlanEventEnabled } from "@rchunk/is-plan-event-enabled";

interface SchemaEntry {
  integrations?: Record<string, boolean>;
}
type Schema = Record<string, SchemaEntry | undefined>;
interface RemotePlugin {
  creationName: string;
  name: string;
  settings: {
    subscriptions?: Array<{ partnerAction: string }>;
  };
}
interface AnalyticsContext {
  remotePlugins?: RemotePlugin[];
}
interface AnalyticsEvent {
  event?: string;
  integrations?: Record<string, boolean>;
}
interface AnalyticsFacade {
  event: AnalyticsEvent;
  updateEvent(
    field: "integrations",
    value: Record<string, boolean>,
  ): AnalyticsFacade;
}

function disabledRemoteSubscriptions(
  schemaEntry: SchemaEntry | undefined,
  context: AnalyticsContext,
): Record<string, boolean> {
  if (!schemaEntry || Object.keys(schemaEntry).length === 0) return {};
  const disabledCreationNames = schemaEntry.integrations
    ? Object.keys(schemaEntry.integrations).filter(
        (name) => schemaEntry.integrations?.[name] === false,
      )
    : [];
  const disabledPluginNames: string[] = [];
  for (const plugin of context.remotePlugins ?? []) {
    for (const creationName of disabledCreationNames) {
      if (plugin.creationName === creationName)
        disabledPluginNames.push(plugin.name);
    }
  }
  return (context.remotePlugins ?? []).reduce<Record<string, boolean>>(
    (result, plugin) => {
      if (
        plugin.settings.subscriptions &&
        disabledPluginNames.includes(plugin.name)
      ) {
        for (const subscription of plugin.settings.subscriptions) {
          result[plugin.name + " " + subscription.partnerAction] = false;
        }
      }
      return result;
    },
    {},
  );
}

function schemaFilter(schema: Schema | undefined, context: AnalyticsContext) {
  function filterEvent(facade: AnalyticsFacade): AnalyticsFacade {
    const eventName = facade.event.event;
    if (schema && eventName) {
      const entry = schema[eventName];
      if (isPlanEventEnabled(schema, entry)) {
        facade.updateEvent("integrations", {
          ...facade.event.integrations,
          ...entry?.integrations,
          ...disabledRemoteSubscriptions(entry, context),
        });
      } else {
        facade.updateEvent("integrations", {
          ...facade.event.integrations,
          All: false,
          "Segment.io": true,
        });
        return facade;
      }
    }
    return facade;
  }

  return {
    name: "Schema Filter",
    version: "0.1.0",
    isLoaded: () => true,
    load: () => Promise.resolve(),
    type: "before",
    page: filterEvent,
    alias: filterEvent,
    track: filterEvent,
    identify: filterEvent,
    group: filterEvent,
  };
}

initializeObjectSpread();

export { schemaFilter };
