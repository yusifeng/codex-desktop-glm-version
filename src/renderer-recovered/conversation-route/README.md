# Recovered runtime route graphs

This directory is the checked-in, formatted, release-derived ESM compatibility source for the conversation, settings, composer, home/onboarding, and structural component graphs plus their eager runtime dependencies. The renderer build compiles every module in this graph; it does not read `.reference` or copy published JavaScript directly into the runtime tree. This is not semantic-decompilation completion: readable rewrites under `src/renderer/` replace these modules only after their cross-chunk contracts and React component behavior are complete.
