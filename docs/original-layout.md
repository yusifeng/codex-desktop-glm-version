# Original Comparison Inputs

The original main-process comparison chunks now live under
`.reference/originals/main/`. `scripts/build.mjs` compiles that directory to the
historical output basenames, so source navigation no longer mixes the compressed
inputs with semantic modules while the packaged module graph remains unchanged.

The files under `src/webview/assets/` are published renderer asset inputs, not
application source to be type-checked or rewritten. They remain explicitly
excluded by the root `tsconfig.json` and are handled by the existing webview job.
