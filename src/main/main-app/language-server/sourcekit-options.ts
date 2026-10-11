export const SOURCEKIT_INITIALIZATION_OPTIONS = {
  backgroundIndexing: false,
  swiftPM: { forceResolvedVersions: true, skipPlugins: true },
};

if (typeof module !== `undefined`) module.exports = { SOURCEKIT_INITIALIZATION_OPTIONS };
