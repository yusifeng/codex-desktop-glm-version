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

if (typeof module !== `undefined`) module.exports = { resolveFlavorIconBaseName };
