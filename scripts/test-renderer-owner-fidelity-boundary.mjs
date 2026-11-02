#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CHUNKS, REWRITTEN } from "./renderer-chunk-manifest.mjs";
import { EXACT_ROUTE_SOURCE_OWNERS } from "./renderer-route-recovery.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const releaseAssets = path.join(root, ".reference/app-original/webview/assets");
const failures = [];
let checkedOwners = 0;
let largeOwners = 0;

function existingOwnerFiles(name) {
  return ["index.ts", "index.tsx", "index.js", "exact.js"]
    .map((file) => path.join(root, "src/renderer", name, file))
    .filter((file) => fs.existsSync(file));
}

for (const name of REWRITTEN) {
  const chunk = CHUNKS[name];
  const owners = existingOwnerFiles(name);
  if (owners.length === 0) {
    failures.push(`${name}: no checked-in renderer owner`);
    continue;
  }
  const releaseFile = path.join(releaseAssets, chunk);
  if (!fs.existsSync(releaseFile)) {
    failures.push(`${name}: release evidence is missing (${chunk})`);
    continue;
  }
  const releaseBytes = fs.statSync(releaseFile).size;
  checkedOwners += 1;
  if (releaseBytes >= 10_000) largeOwners += 1;
  const ownerBytes = owners.reduce((total, file) => total + fs.statSync(file).size, 0);
  if (ownerBytes < releaseBytes * 0.8) {
    failures.push(`${name}: suspiciously reduced owner (${ownerBytes}/${releaseBytes} bytes)`);
  }
}

if (EXACT_ROUTE_SOURCE_OWNERS.size !== 0) failures.push("exact route owners are forbidden after TypeScript promotion");
const exactFiles = fs.readdirSync(path.join(root, "src/renderer"), { recursive: true })
  .filter((file) => file.endsWith("exact.js"));
if (exactFiles.length > 0) failures.push(`unexpected exact owner files: ${exactFiles.join(", ")}`);

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(
  `renderer owner fidelity boundary: ${REWRITTEN.size}/${REWRITTEN.size} rewritten owners present, ` +
  `${checkedOwners} owners above the reduction floor (${largeOwners} at least 10 KB), ` +
  `0 exact owners`,
);
