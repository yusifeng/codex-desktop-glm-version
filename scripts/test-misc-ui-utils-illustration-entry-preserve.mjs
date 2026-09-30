import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assets = path.join(root, "src/webview/assets");
const appInitial = fs.readFileSync(
  path.join(assets, "app-initial-51da50e6c6e3.ts"),
  "utf8",
);

const entries = [
  ["aime-illustration-entry", "Aime-e93e12a8c91b", "Aime-91ab7b051a2f", "Aime"],
  ["appy-illustration-entry", "Appy-3cec6511ba13", "Appy-2dead6be5548", "Appy"],
  [
    "bloop-illustration-entry",
    "Bloop-baeff79d0bc4",
    "Bloop-56209ce096cd",
    "Bloop",
  ],
  [
    "brief-illustration-entry",
    "Brief-e0e65e580b93",
    "Brief-630d4f63891e",
    "Brief",
  ],
  ["chip-illustration-entry", "Chip-d385aa7a4a4a", "Chip-83dbc51e0b2d", "Chip"],
  [
    "clank-illustration-entry",
    "Clank-2e215b11c8ba",
    "Clank-b77db511676e",
    "Clank",
  ],
  [
    "clippy-illustration-entry",
    "Clippy-faf288dc573a",
    "Clippy-f5e78a7bbf83",
    "Clippy",
  ],
  [
    "collab-illustration-entry",
    "Collab-46c38405cdae",
    "Collab-ff6011978bce",
    "Collab",
  ],
  [
    "dailee-illustration-entry",
    "Dailee-187bdc9d8c74",
    "Dailee-8a251b73d777",
    "Dailee",
  ],
  [
    "digit-illustration-entry",
    "Digit-d2988275dc6b",
    "Digit-b4a775a3ccc5",
    "Digit",
  ],
  ["dot-illustration-entry", "Dot-8f910bbe37cf", "Dot-df6e0d4e452f", "Dot"],
  [
    "fuego-illustration-entry",
    "Fuego-6d2c150cceb3",
    "Fuego-5b01dac6efab",
    "Fuego",
  ],
  ["kit-illustration-entry", "Kit-fcbb2a3b5227", "Kit-100debb1035f", "Kit"],
  [
    "madam-luminary-illustration-entry",
    "MadamLuminary-ce592da60552",
    "MadamLuminary-ba2d4ffb6b96",
    "MadamLuminary",
  ],
  [
    "mailman-illustration-entry",
    "Mailman-7e7912bf627d",
    "Mailman-4f0b44049f71",
    "Mailman",
  ],
  [
    "paige-illustration-entry",
    "Paige-aaae89ef4358",
    "Paige-ca36e15bdf52",
    "Paige",
  ],
  [
    "pocket-illustration-entry",
    "Pocket-f9eee8bee6ec",
    "Pocket-af4c4ccb300e",
    "Pocket",
  ],
  [
    "scout-illustration-entry",
    "Scout-a9979c91000d",
    "Scout-9888dce8b84d",
    "Scout",
  ],
  [
    "scribble-illustration-entry",
    "Scribble-410fea1250b3",
    "Scribble-affdf5c25f92",
    "Scribble",
  ],
  [
    "starry-illustration-entry",
    "Starry-223439111246",
    "Starry-976e236d423e",
    "Starry",
  ],
  ["stax-illustration-entry", "Stax-c33b1e551d02", "Stax-ab6daf072499", "Stax"],
  ["tome-illustration-entry", "Tome-f4be331aca2c", "Tome-87064b654669", "Tome"],
  [
    "whirr-illustration-entry",
    "Whirr-44da1c804282",
    "Whirr-2f001aeee1e0",
    "Whirr",
  ],
  ["yo-illustration-entry", "Yo-f3493b8fd851", "Yo-fa8e77dc63ac", "Yo"],
  ["zapp-illustration-entry", "Zapp-968a97f7ddea", "Zapp-ec77929753b5", "Zapp"],
];

assert.equal(
  entries.length,
  25,
  "all assigned illustration entries are covered",
);
assert.equal(
  new Set(entries.map(([semantic]) => semantic)).size,
  25,
  "semantic names are unique",
);
let assertions = 2;
for (const [semantic, wrapperName, pairedName, exportStem] of entries) {
  const wrapperFile = path.join(assets, wrapperName + ".ts");
  const pairedFile = path.join(assets, pairedName + ".ts");
  assert.ok(fs.existsSync(wrapperFile), semantic + " wrapper exists");
  assert.ok(
    fs.existsSync(pairedFile),
    semantic + " paired illustration exists",
  );
  const wrapper = fs.readFileSync(wrapperFile, "utf8");
  const paired = fs.readFileSync(pairedFile, "utf8");
  assert.match(
    wrapper,
    /^\/\/ @ts-nocheck\nimport "\.\/app-shared-[a-f0-9]{12}\.js";\nimport \{ n as e, r as t, t as n \} from "\.\//u,
  );
  assert.ok(
    wrapper.includes(`from "./${pairedName}.js";`),
    semantic + " imports its paired generated illustration",
  );
  assert.match(
    wrapper,
    /\nt\(\);\nexport \{/u,
    semantic + " runs paired initializer before export",
  );
  assert.ok(
    wrapper.includes(
      `export { n as ${exportStem}Icon, e as ${exportStem}IconSm };`,
    ),
    semantic + " preserves public large/small exports",
  );
  assert.equal(
    (wrapper.match(/import\(/gu) ?? []).length,
    0,
    semantic + " has no dynamic dependency",
  );
  assert.match(
    paired,
    /export \{ [A-Za-z_$][\w$]* as n, [A-Za-z_$][\w$]* as r, [A-Za-z_$][\w$]* as t \};\s*$/u,
    semantic +
      " paired file supplies small/initializer/large compressed contract",
  );
  const consumerNeedle = `import(\`./${wrapperName}.js\`).then(e=>({large:e.${exportStem}Icon,small:e.${exportStem}IconSm}))`;
  assert.ok(
    appInitial.includes(consumerNeedle),
    semantic + " app-initial consumes both public sizes",
  );
  const occurrences = appInitial.split(wrapperName + ".js").length - 1;
  assert.equal(
    occurrences,
    2,
    semantic + " appears once in dependency map and once in lazy consumer",
  );
  assertions += 10;
}
console.log(
  `misc-ui-utils illustration entries: ${assertions} assertions passed; 25 audited preserve`,
);
