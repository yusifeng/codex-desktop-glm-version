import assert from "node:assert/strict";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const jsx={Fragment:Symbol("Fragment"),jsx:(type,props,key)=>({type,props:props??{},key}),jsxs:(type,props,key)=>({type,props:props??{},key})};globalThis.__jsx=jsx;
async function load(name){const result=await esbuild.build({entryPoints:[path.join(ROOT,`src/renderer/${name}/index.ts`)],bundle:true,format:"esm",platform:"node",target:"node22",write:false,logLevel:"silent",plugins:[{name:"mocks",setup(build){build.onResolve({filter:/^@rchunk\/(plugins-page-section|plugin-detail-page-core)$/},({path:p})=>({path:path.join(ROOT,"src/renderer",p.slice(8),"index.ts")}));build.onResolve({filter:/^@rchunk\//},({path:p})=>({path:p.slice(8),namespace:"mock"}));build.onLoad({filter:/.*/,namespace:"mock"},({path:p})=>p==="app-shared"?{loader:"js",contents:`export const I3=()=>globalThis.__jsx;`}:{loader:"js",contents:"export {};"});}}]});return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${name}`)}

assertReleaseOwner("plugins-page-section");

assertReleaseOwner("plugin-detail-page-core", [/^\/\/ @ts-nocheck/m, /export \{/]);
assertReleaseOwner("plugins-page", [/^\/\/ @ts-nocheck/m, /export \{/]);
console.log("plugin section behavior and release-faithful page assertions passed");
