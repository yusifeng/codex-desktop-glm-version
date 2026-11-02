import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";
import assert from"node:assert/strict";import{Buffer}from"node:buffer";import path from"node:path";import{fileURLToPath}from"node:url";import*as esbuild from"esbuild";const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),".."),jsx={Fragment:Symbol("Fragment"),jsx:(type,props,key)=>({type,props:props??{},key}),jsxs:(type,props,key)=>({type,props:props??{},key})};globalThis.__jsx=jsx;globalThis.__openedFeedbackLink=null;globalThis.__submitFeedback=async input=>({feedbackId:"mock",input});async function load(name){const result=await esbuild.build({entryPoints:[path.join(ROOT,`src/renderer/${name}/index.ts`)],bundle:true,format:"esm",platform:"node",target:"node22",write:false,logLevel:"silent",plugins:[{name:"mocks",setup(build){build.onResolve({filter:/^@rchunk\//},({path:modulePath})=>({path:modulePath.slice(8),namespace:"mock"}));build.onLoad({filter:/.*/,namespace:"mock"},({path:modulePath})=>pathModule(modulePath));}}]});return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${name}`)}function pathModule(name){if(name==="app-shared")return{loader:"js",contents:`export const $3=()=>{const cache=[];return{c:size=>{while(cache.length<size)cache.push(Symbol.for("react.memo_cache_sentinel"));return cache}}};export const I3=()=>globalThis.__jsx;export const e6=()=>({useState:value=>[value,()=>{}]});export const K2=()=>{};export const Y2="FormattedMessage";`};if(name==="app-initial")return{loader:"js",contents:`export const Dft=()=>{};export const Oft=input=>{globalThis.__openedFeedbackLink=input};`};if(name==="submit-feedback")return{loader:"js",contents:"export const n=(input)=>globalThis.__submitFeedback(input);"};return{loader:"js",contents:"export default {};"}}

assertReleaseOwner("feedback-form-dialog");

const legal=await load("feedback-legal-notice");legal.n();const notice=legal.t();assert.equal(notice.type,"div");assert.equal(notice.props.className,"text-sm text-codex-description");const legalMessage=notice.props.children;assert.equal(legalMessage.type,"FormattedMessage");assert.match(legalMessage.props.defaultMessage,/improve ChatGPT/);const legalLink=legalMessage.props.values.link("Learn more");assert.equal(legalLink.props.target,"_blank");assert.match(legalLink.props.href,/help\.openai\.com/);legalLink.props.onClick({type:"click"});assert.equal(globalThis.__openedFeedbackLink.openTarget,"external-browser");

assertReleaseOwner("feedback-upload");

assertReleaseOwner("submit-feedback");

assertReleaseOwner("submit-artifact-feedback");

console.log("feedback pipeline cluster complete");
