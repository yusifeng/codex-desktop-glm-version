export function buildTypeScriptServerInitializationOptions(tsserverPath: string) {
  return { tsserver: { path: tsserverPath, useSyntaxServer: `never` } };
}

if (typeof module !== `undefined`) module.exports = { buildTypeScriptServerInitializationOptions };
