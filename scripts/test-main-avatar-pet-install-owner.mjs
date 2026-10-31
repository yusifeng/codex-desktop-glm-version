import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const source = fs.readFileSync(new URL("../src/main/main-app/avatar/pet-install.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
const classNode = (name) => ast.body.find((node) => node.type === "ClassDeclaration" && node.id?.name === name);
const petNode = classNode("PetInstallManager");
const avatarNode = classNode("AvatarManager");
assert.ok(petNode && avatarNode); assertions += 1;
equal(petNode.body.body.length, 7);
equal(avatarNode.body.body.length, 7);

const parsed = [];
const installed = [];
const PetInstallManager = Function(
  "petInstallRequestSchema", "fetchAndValidateSpritesheet", "net", "installPreparedPetAsset",
  `${transpiled.code.slice(petNode.start, petNode.end)}; return PetInstallManager;`,
)(
  { parse: (value) => (parsed.push(value), value) },
  async (_url, version) => ({ spriteVersionNumber: version ?? 2, spritesheetDataUrl: "data:image/png;base64,AA==", bytes: Buffer.from([0]) }),
  { fetch() {} },
  async () => "unused",
);
const pets = new PetInstallManager({
  appServerClient: "client-1",
  fetchAsset: async () => null,
  installPreparedPet: async (value) => (installed.push(value), "pet-1"),
  preferWsl: true,
});
equal(await pets.preview({ name: "Pet", description: null, imageUrl: "https://example.test/pet.png" }), {
  displayName: "Pet", description: null, spriteVersionNumber: 2, spritesheetDataUrl: "data:image/png;base64,AA==",
});
equal(await pets.install({ name: "Pet", description: "Demo", imageUrl: "https://example.test/pet.png", spriteVersionNumber: 1 }), { id: "pet-1" });
equal(installed[0].appServerClient, "client-1");
equal(installed[0].preferWsl, true);
equal(parsed.length, 2);

class EventEmitterBase {}
const loads = [];
const AvatarManager = Function(
  "EventEmitterBase", "PetInstallManager", "loadAvatarState", "loadAvatarById",
  `${transpiled.code.slice(avatarNode.start, avatarNode.end)}; return AvatarManager;`,
)(EventEmitterBase, class { preview(v) { return ["preview", v]; } install(v) { return ["install", v]; } },
  async (value) => (loads.push(value), "state"),
  async (value) => (loads.push(value), "avatar"));
const registry = { get: () => "client-2" };
const avatars = new AvatarManager(registry);
equal(await avatars.load(), "state");
equal(await avatars.loadAvatar("avatar-1"), "avatar");
equal(loads[1].avatarId, "avatar-1");
equal(avatars.previewPetInstall("request"), ["preview", "request"]);
equal(avatars.installPet("request"), ["install", "request"]);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('const { AvatarManager } = require("./main-app/avatar/pet-install.js");'), true);
equal(main.includes("var Eje = AvatarManager;"), true);
equal(main.includes("Eje = class"), false);
equal(main.includes("wje = class"), false);
console.log(`${assertions} main avatar pet install owner assertions passed`);
