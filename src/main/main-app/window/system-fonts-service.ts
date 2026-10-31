// @ts-nocheck

/** Renderer RPC adapter for Electron's system font-family enumeration. */
export function createSystemFontsServiceClass(dependencies: Record<string, any>) {
  const { RpcHandlerBase, getFontFamilies } = dependencies;
  return class SystemFontsService extends RpcHandlerBase {
    getFontFamilies() {
      return getFontFamilies();
    }
  };
}

if (typeof module !== "undefined") {
  module.exports = { createSystemFontsServiceClass };
}
