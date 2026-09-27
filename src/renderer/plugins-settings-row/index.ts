import "@rchunk/rolldown-runtime";
import {
  BX as useSignalFamilyValue,
  I3 as getJsxRuntime,
  K2 as initializeInternationalization,
  Lf as Switch,
  Y2 as FormattedMessage,
  e6 as getReact,
  n4 as useCurrentAccount,
  rl as SettingsRow,
} from "@rchunk/app-shared";
import {
  Mdn as applicationName,
  cnt as useUpdateFeatureMutation,
  ont as hostFeaturesQuery,
} from "@rchunk/app-initial";

interface PluginsSettingsRowProps {
  hostId: string;
}

interface HostFeature {
  enabled?: boolean;
  name?: string;
}

interface ReactLike {
  useState<Value>(value: Value): [Value, (next: Value) => void];
}

interface UpdateFeatureMutation {
  isPending: boolean;
  mutate(
    input: { enabled: boolean; featureName: string },
    options: { onSuccess(): void },
  ): void;
}

const jsx = getJsxRuntime();

function PluginsSettingsRow({ hostId }: PluginsSettingsRowProps): unknown {
  const React = getReact() as ReactLike;
  const intl = useCurrentAccount();
  const result = useSignalFamilyValue(hostFeaturesQuery, hostId) as {
    data?: HostFeature[];
  };
  const mutation = useUpdateFeatureMutation({ hostId }) as unknown as UpdateFeatureMutation;
  const [restartRequired, setRestartRequired] = React.useState(false);
  if (!result.data?.some((feature) => feature.name === "apps" && feature.enabled)) {
    return null;
  }
  const plugins = result.data.find((feature) => feature.name === "plugins");
  const checked = plugins?.enabled ?? true;
  const description = restartRequired
    ? jsx.jsx(FormattedMessage, {
        id: "settings.general.plugins.restartNotice",
        defaultMessage: "Restart {appName} to apply this change",
        values: { appName: applicationName },
      })
    : jsx.jsx(FormattedMessage, {
        id: "settings.general.plugins.description",
        defaultMessage: "Allow ChatGPT to use installed plugins",
      });
  return jsx.jsx(SettingsRow, {
    label: jsx.jsx(FormattedMessage, {
      id: "settings.general.plugins.label",
      defaultMessage: "Plugins",
    }),
    description,
    control: jsx.jsx(Switch, {
      checked,
      disabled: mutation.isPending,
      onChange: (enabled: boolean) => {
        mutation.mutate(
          { featureName: "plugins", enabled },
          { onSuccess: () => setRestartRequired(true) },
        );
      },
      ariaLabel: intl.formatMessage({
        id: "settings.general.plugins.toggle",
        defaultMessage: "Toggle plugins",
      }),
    }),
  });
}

function initializePluginsSettingsRow(): void {
  initializeInternationalization();
}

export { initializePluginsSettingsRow as n, PluginsSettingsRow as t };
