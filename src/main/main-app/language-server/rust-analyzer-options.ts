const baseRustAnalyzerOptions = {
  cargo: { buildScripts: { enable: false, rebuildOnSave: false }, noDeps: true },
  checkOnSave: false,
  files: { exclude: [`rust-analyzer.toml`] },
  procMacro: { enable: false },
};

export function buildRustAnalyzerOptions(sysroot: string | null) {
  return {
    ...baseRustAnalyzerOptions,
    cargo: { ...baseRustAnalyzerOptions.cargo, sysroot },
  };
}

if (typeof module !== `undefined`) module.exports = { buildRustAnalyzerOptions };
