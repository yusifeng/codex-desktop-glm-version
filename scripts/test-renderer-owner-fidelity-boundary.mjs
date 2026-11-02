#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CHUNKS, REWRITTEN } from "./renderer-chunk-manifest.mjs";
import { EXACT_ROUTE_SOURCE_OWNERS } from "./renderer-route-recovery.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const releaseAssets = path.join(root, ".reference/app-original/webview/assets");
const failures = [];
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
  if (releaseBytes < 10_000) continue;
  largeOwners += 1;
  const ownerBytes = owners.reduce((total, file) => total + fs.statSync(file).size, 0);
  if (ownerBytes < releaseBytes * 0.8) {
    failures.push(`${name}: suspiciously reduced owner (${ownerBytes}/${releaseBytes} bytes)`);
  }
}

for (const [name, chunk] of EXACT_ROUTE_SOURCE_OWNERS) {
  const exactFile = path.join(root, "src/renderer", name, "exact.js");
  const releaseFile = path.join(releaseAssets, chunk);
  if (!fs.existsSync(exactFile)) failures.push(`${name}: exact owner is missing`);
  if (!fs.existsSync(releaseFile)) failures.push(`${name}: exact release evidence is missing (${chunk})`);
  if (fs.existsSync(exactFile) && fs.existsSync(releaseFile) && fs.statSync(exactFile).size < fs.statSync(releaseFile).size) {
    failures.push(`${name}: exact owner is smaller than its release evidence`);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(
  `renderer owner fidelity boundary: ${REWRITTEN.size}/${REWRITTEN.size} rewritten owners present, ` +
  `${largeOwners} large owners above the reduction floor, ${EXACT_ROUTE_SOURCE_OWNERS.size} exact owners verified`,
);
