import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(
  root,
  "src/webview/assets/preset-shape-definitions-ca83985ce9f3.ts",
);
const outputPath = path.join(
  root,
  "src/renderer/artifact-source-bootstrap/shape-presets.generated.ts",
);
let source = fs.readFileSync(sourcePath, "utf8");

source = source
  .replace(
    /^\/\/ @ts-nocheck\nimport \{ d as e, u as t \} from "\.\/registry-a50f1d1438fa\.js";\n/,
    [
      "// Generated pure-data module. Regenerate with scripts/generate-artifact-shape-presets.mjs.",
      "// @ts-nocheck -- published preset geometry is mechanically recovered data.",
      'import { Bt as ShapeGeometry, tt as installPresetShapeDefinitions } from "@rchunk/artifact-workbook-runtime";',
      "",
    ].join("\n"),
  )
  .replaceAll("[e.", "[ShapeGeometry.")
  .replace(
    /function c\(\) \{\n  t\(s\);\n\}\nexport \{ c as installPresetShapeDefinitions \};\n?$/,
    [
      "export const PRESET_SHAPE_DEFINITIONS = s;",
      "export function installArtifactShapePresets() {",
      "  installPresetShapeDefinitions(PRESET_SHAPE_DEFINITIONS);",
      "}",
      "",
    ].join("\n"),
  );

if (!source.includes("export const PRESET_SHAPE_DEFINITIONS = s;")) {
  throw new Error(
    "Preset shape source layout changed; refusing to write a partial generated module.",
  );
}
fs.writeFileSync(outputPath, source);
console.log(`generated ${path.relative(root, outputPath)}`);
