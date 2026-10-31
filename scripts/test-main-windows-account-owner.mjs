import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const source = fs.readFileSync(new URL("../src/main/main-app/platform/windows-account.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
const fn = (name) => ast.body.find((node) => node.type === "FunctionDeclaration" && node.id?.name === name);
for (const name of ["loadWindowsAccountAddon", "isAdministratorCapable", "getWindowsSystemDiagnostics", "supportsPersistentAcls", "isNetworkDrive", "readRegistryValue", "registerWindowsProcessListProvider"]) {
  assert.ok(fn(name), `${name} must exist`); assertions += 1;
}
const isAdminNode = fn("isAdministratorCapable");
const diagnosticsNode = fn("getWindowsSystemDiagnostics");
const isAdministratorCapable = Function(
  "loadWindowsAccountAddon",
  `${transpiled.code.slice(isAdminNode.start, isAdminNode.end)}; return isAdministratorCapable;`,
)(() => null);
const getWindowsSystemDiagnostics = Function(
  "loadWindowsAccountAddon",
  `${transpiled.code.slice(diagnosticsNode.start, diagnosticsNode.end)}; return getWindowsSystemDiagnostics;`,
)(() => null);
equal(isAdministratorCapable({ platform: "linux" }), "unknown");
equal(isAdministratorCapable({ platform: "win32", loadAddon: () => null }), "unknown");
equal(isAdministratorCapable({ platform: "win32", loadAddon: () => ({ isCurrentAccountAdministratorCapable: () => true }) }), "administrator");
equal(isAdministratorCapable({ platform: "win32", loadAddon: () => ({ isCurrentAccountAdministratorCapable: () => false }) }), "standard");
equal(getWindowsSystemDiagnostics({ platform: "linux" }), null);
equal(getWindowsSystemDiagnostics({ platform: "win32", loadAddon: () => ({ getSystemPerformanceSnapshot: () => ({ memory: 42 }) }) }), { memory: 42 });
equal(getWindowsSystemDiagnostics({ platform: "win32", loadAddon: () => { throw new Error("addon"); } }), null);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('getWindowsSystemDiagnostics: CO'), true);
equal(main.includes('registerWindowsProcessListProvider: DO'), true);
equal(main.includes("function SO("), false);
equal(main.includes("function CO("), false);
equal(main.includes("function kO("), false);
equal(main.includes("getSystemMetrics: CO"), true);
equal(main.includes("DO(), a.u(Z9)"), true);
console.log(`${assertions} main Windows account owner assertions passed`);
