# Recovered runtime route graphs

This directory is the checked-in, formatted source recovery of the release conversation, settings, composer, and home/onboarding route graphs plus their eager runtime dependencies. The renderer build consumes these files directly; it does not read `.reference` or copy release assets at build time. Semantic rewrites remain under `src/renderer/` and can replace these exact-recovery modules one graph segment at a time.
