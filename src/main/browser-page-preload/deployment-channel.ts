const deploymentChannel = {
  Dev: `dev`,
  Agent: `agent`,
  Nightly: `nightly`,
  InternalAlpha: `internal-alpha`,
  PublicBeta: `public-beta`,
  Prod: `prod`,
} as const;

const values = Object.values(deploymentChannel);
const internalValues = [
  deploymentChannel.Dev,
  deploymentChannel.Agent,
  deploymentChannel.Nightly,
  deploymentChannel.InternalAlpha,
];

const deploymentChannelApi = {
  ...deploymentChannel,
  values,
  help: values.join(`, `),
  isValid(value: unknown): boolean {
    return typeof value === `string` && values.includes(value as (typeof values)[number]);
  },
  parse(value: unknown): (typeof values)[number] | null {
    const trimmed = typeof value === `string` ? value.trim() : ``;
    return trimmed && deploymentChannelApi.isValid(trimmed)
      ? (trimmed as (typeof values)[number])
      : null;
  },
  isInternal(value: unknown): boolean {
    return typeof value === `string` && internalValues.includes(value as (typeof internalValues)[number]);
  },
  allowDebugMenu(value: unknown): boolean {
    return deploymentChannelApi.isInternal(value);
  },
  supportsReactScan(value: unknown): boolean {
    return value === deploymentChannelApi.Dev || value === deploymentChannelApi.Agent || value === deploymentChannelApi.Nightly;
  },
};

const webmcpPolicyChannel = `codex_desktop:get-browser-webmcp-policy`;

export { deploymentChannel, deploymentChannelApi, webmcpPolicyChannel };

if (typeof module !== `undefined`) {
  module.exports = { deploymentChannel, deploymentChannelApi, webmcpPolicyChannel };
}
