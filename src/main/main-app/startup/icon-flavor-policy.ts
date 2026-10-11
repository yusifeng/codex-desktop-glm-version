export interface IconFlavorPolicy {
  agent: string;
  nightly: string;
  internalAlpha: string;
  publicBeta: string;
  dev: string;
  prod: string;
}

export function resolveFlavorIconBaseName(flavor: string, policy: IconFlavorPolicy): string | undefined {
  if (flavor === policy.agent) return `icon-agent`;
  if (flavor === policy.nightly) return `icon-chatgpt-nightly`;
  if (flavor === policy.internalAlpha) return `icon-chatgpt-alpha`;
  if (flavor === policy.publicBeta) return `icon-chatgpt-beta`;
  if (flavor === policy.dev || flavor === policy.prod) return `icon-chatgpt`;
  return undefined;
}

export function resolveFlavorIconAssetNames(flavor: string, policy: IconFlavorPolicy) {
  let suffix: string | undefined;
  if (flavor === policy.dev || flavor === policy.prod || flavor === policy.agent) suffix = ``;
  else if (flavor === policy.nightly) suffix = `-nightly`;
  else if (flavor === policy.internalAlpha) suffix = `-alpha`;
  else if (flavor === policy.publicBeta) suffix = `-beta`;
  return {
    dark: `icon-codex-dark-color${suffix}.png`,
    light: `icon-codex-light${suffix}.png`,
  };
}

export function resolveWindowIconResource(flavor: string, policy: IconFlavorPolicy) {
  if (flavor === policy.dev) return { fileName: `icon-dev-outline.png`, allowPackaged: false };
  const baseName = resolveFlavorIconBaseName(flavor, policy);
  return baseName == null ? undefined : { fileName: `${baseName}.png`, allowPackaged: true };
}

if (typeof module !== `undefined`) module.exports = { resolveFlavorIconAssetNames, resolveFlavorIconBaseName, resolveWindowIconResource };
