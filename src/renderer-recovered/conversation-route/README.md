# Recovered runtime route graphs

This directory records the former release-derived conversation compatibility graph. Its manifest is now empty: all application modules that previously lived here have checked-in owners under `src/renderer/`, and the renderer build neither reads `.reference` nor copies published JavaScript into the runtime tree. The remaining 33 route dependencies are explicitly classified vendor/generated sources under `src/renderer-preserved/route-runtime` and are compiled from checked-in TypeScript.
