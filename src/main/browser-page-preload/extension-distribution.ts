type ExtensionDistribution = {
  distribution: string;
  extensionIds: string[];
  outputModes: string[];
  releaseChannel: string;
  signingIdentity: string | null;
  storeUrl?: string;
};

const chromeBeta: ExtensionDistribution = {
  distribution: `chrome-web-store`,
  extensionIds: [`lfkehkpjohcoelkpembgemeipeppanef`],
  outputModes: [],
  releaseChannel: `beta`,
  signingIdentity: null,
  storeUrl: `https://chromewebstore.google.com/detail/codex/lfkehkpjohcoelkpembgemeipeppanef`,
};
const chromeStable: ExtensionDistribution = {
  distribution: `chrome-web-store`,
  extensionIds: [`hehggadaopoacecdllhhajmbjkdcmajg`],
  outputModes: [],
  releaseChannel: `stable`,
  signingIdentity: null,
  storeUrl: `https://chromewebstore.google.com/detail/chatgpt/hehggadaopoacecdllhhajmbjkdcmajg`,
};
const edgeStable: ExtensionDistribution = {
  distribution: `microsoft-edge-add-ons`,
  extensionIds: [`odlomjlbamekndcpllcnffbgeohgkmjh`],
  outputModes: [],
  releaseChannel: `stable`,
  signingIdentity: null,
  storeUrl: `https://microsoftedge.microsoft.com/addons/detail/odlomjlbamekndcpllcnffbgeohgkmjh`,
};

const localDev = (): ExtensionDistribution => ({
  distribution: `local-development`, extensionIds: [], outputModes: [`file`],
  releaseChannel: `dev`, signingIdentity: `development`,
});
const managedDev = (): ExtensionDistribution => ({
  distribution: `managed-self-hosted`, extensionIds: [], outputModes: [`file`],
  releaseChannel: `dev`, signingIdentity: `development`,
});
const managedBeta = (): ExtensionDistribution => ({
  distribution: `managed-self-hosted`, extensionIds: [], outputModes: [`file`, `blobstore`],
  releaseChannel: `beta`, signingIdentity: `beta`,
});
const managedStable = (): ExtensionDistribution => ({
  distribution: `managed-self-hosted`, extensionIds: [], outputModes: [`file`],
  releaseChannel: `stable`, signingIdentity: `stable`,
});

const extensionDistribution = {
  chrome: {
    dev: [localDev(), managedDev(), chromeBeta],
    internal: [managedBeta(), chromeBeta],
    prod: [managedStable(), chromeStable],
  },
  edge: {
    dev: [localDev(), managedDev(), chromeBeta],
    internal: [managedBeta(), edgeStable, chromeBeta],
    prod: [managedStable(), edgeStable, chromeStable],
  },
} as const;

export { extensionDistribution };
if (typeof module !== `undefined`) module.exports = { extensionDistribution };
