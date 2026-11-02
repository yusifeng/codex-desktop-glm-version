#!/usr/bin/env node
// Move evidence-backed, single-export business helpers off the three aggregate
// renderer hubs.  This is deliberately conservative: multi-export owners and
// UI/runtime initializers keep their compressed ABI until their exact mapping
// has been recovered separately.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RENDERER = path.join(ROOT, "src/renderer");
const CLASSIFICATIONS = path.join(ROOT, "docs/renderer-hub-line-classification.json");
const HUBS = ["app-shared", "app-initial", "app-primary"];
const WRITE = process.argv.includes("--write");
const CHECK = process.argv.includes("--check");
const EXPLICIT_EXPORTS = new Map([
  ["app-shared:h4", ["src/renderer/app-shared/ui/class-names.ts", "initializeClassNames"]],
  ["app-shared:m4", ["src/renderer/app-shared/ui/class-names.ts", "classNames"]],
  ["app-primary:yf", ["src/renderer/app-primary/runtime/is-site-url-match.ts", "isSiteUrlMatch"]],
  ["app-primary:vg", ["src/renderer/app-primary/runtime/extract-skill-kind.ts", "extractSkillKindFromDocument"]],
  ["app-primary:Hi", ["src/renderer/app-primary/runtime/is-browser-comment-for-tab.ts", "isBrowserCommentForTab"]],
  ["app-primary:Gs", ["src/renderer/app-primary-browser-comment-runtime/index.ts", "subscribeBrowserCommentReadiness"]],
  ["app-primary:Bs", ["src/renderer/app-primary-browser-comment-runtime/index.ts", "setBrowserTabUrlState"]],
  ["app-primary:Rs", ["src/renderer/app-primary-browser-comment-runtime/index.ts", "getBrowserTabUrlState"]],
  ["app-primary:Us", ["src/renderer/app-primary-browser-comment-runtime/index.ts", "hasBrowserCommentHandler"]],
  ["app-primary:Hs", ["src/renderer/app-primary-browser-comment-runtime/index.ts", "resolveBrowserContext"]],
  ["app-primary:Ks", ["src/renderer/app-primary-browser-comment-runtime/index.ts", "waitForBrowserCommentHandler"]],
  ["app-primary:Vs", ["src/renderer/app-primary-browser-comment-runtime/index.ts", "submitBrowserComment"]],
]);

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === "types" ? [] : walk(file);
    return entry.isFile() && /\.tsx?$/.test(entry.name) ? [file] : [];
  });
}

function valueExports(modulePath) {
  const source = fs.readFileSync(modulePath, "utf8");
  const exports = new Set(
    [...source.matchAll(/export\s+(?:async\s+)?(?:function|const|class|let|var)\s+([A-Za-z_$][\w$]*)/g)]
      .map((match) => match[1]),
  );
  for (const match of source.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const part of match[1].split(",")) {
      const binding = part.trim().match(/^(?:[A-Za-z_$][\w$]*\s+as\s+)?([A-Za-z_$][\w$]*)$/);
      if (binding) exports.add(binding[1]);
    }
  }
  return [...exports];
}

const classifications = JSON.parse(fs.readFileSync(CLASSIFICATIONS, "utf8"));
const eligible = new Map();
for (const entry of classifications) {
  if (entry.classification !== "semantic-business-logic") continue;
  // Runtime owners are focused semantic modules. Recovered chunk entrypoints
  // can contain one public export while owning several unrelated hub aliases,
  // so they are intentionally outside this mechanical migration.
  if (!entry.module.includes("/runtime/")) continue;
  const modulePath = path.join(ROOT, entry.module);
  const exports = valueExports(modulePath);
  if (exports.length !== 1) continue;
  eligible.set(`${entry.hub}:${entry.alias}`, {
    modulePath,
    exportName: exports[0],
  });
}
for (const [key, [module, exportName]] of EXPLICIT_EXPORTS) {
  eligible.set(key, { modulePath: path.join(ROOT, module), exportName });
}

function relativeModule(fromFile, targetFile) {
  let relative = path.relative(path.dirname(fromFile), targetFile).replaceAll(path.sep, "/");
  relative = relative.replace(/\.tsx?$/, "");
  return relative.startsWith(".") ? relative : `./${relative}`;
}

let changedFiles = 0;
let migratedBindings = 0;
const migratedAliases = new Set();

for (const file of walk(RENDERER)) {
  const original = fs.readFileSync(file, "utf8");
  const additions = new Map();
  let source = original;

  for (const hub of HUBS) {
    const importPattern = new RegExp(
      `import\\s*\\{([^}]*)\\}\\s*from\\s*["']@rchunk/${hub}["'];?`,
      "g",
    );
    source = source.replace(importPattern, (statement, body) => {
      const retained = [];
      for (const rawPart of body.split(",")) {
        const part = rawPart.trim();
        if (!part) continue;
        const binding = part.match(/^([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/);
        const migration = binding && eligible.get(`${hub}:${binding[1]}`);
        if (!migration || path.resolve(file) === path.resolve(migration.modulePath)) {
          retained.push(part);
          continue;
        }
        const localName = binding[2] ?? binding[1];
        const moduleName = relativeModule(file, migration.modulePath);
        const imports = additions.get(moduleName) ?? [];
        imports.push(
          migration.exportName === localName
            ? migration.exportName
            : `${migration.exportName} as ${localName}`,
        );
        additions.set(moduleName, imports);
        migratedBindings += 1;
        migratedAliases.add(`${hub}:${binding[1]}`);
      }
      if (retained.length === 0) return "";
      return `import {\n${retained.map((part) => `  ${part},`).join("\n")}\n} from "@rchunk/${hub}";`;
    });
  }

  if (additions.size === 0) continue;
  const semanticImports = [...additions]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([moduleName, imports]) => `import { ${[...new Set(imports)].sort().join(", ")} } from "${moduleName}";`)
    .join("\n");
  const firstImport = source.search(/^import\s/m);
  source = firstImport === -1
    ? `${semanticImports}\n${source}`
    : `${source.slice(0, firstImport)}${semanticImports}\n${source.slice(firstImport)}`;
  changedFiles += 1;
  if (WRITE) fs.writeFileSync(file, source);
}

console.log(
  `${WRITE ? "migrated" : "would migrate"} ${migratedBindings} bindings across ${changedFiles} files; ` +
    `${migratedAliases.size}/${eligible.size} eligible compressed aliases removed from direct imports`,
);
if (CHECK && migratedBindings > 0) process.exitCode = 1;
