# Original Comparison Inputs

The files under `src/webview/assets/` are published renderer asset inputs, not
application source to be type-checked or rewritten. They are therefore excluded
explicitly by the root `tsconfig.json`; the build still copies/transforms them
through the existing `scripts/build.mjs` webview job. This is the repository
equivalent of moving comparison-only inputs out of the application source tree:
the exclusion is explicit, reviewable, and covered by the build verification
commands rather than relying on an accidental glob.
