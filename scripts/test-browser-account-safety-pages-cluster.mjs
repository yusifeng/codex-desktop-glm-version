import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),".."),jsx={Fragment:Symbol("Fragment"),jsx:(type,props,key)=>({type,props:props??{},key}),jsxs:(type,props,key)=>({type,props:props??{},key})};globalThis.__jsx=jsx;
async function load(name){const result=await esbuild.build({entryPoints:[path.join(ROOT,`src/renderer/${name}/index.ts`)],bundle:true,format:"esm",platform:"node",target:"node22",write:false,logLevel:"silent",plugins:[{name:"mocks",setup(build){build.onResolve({filter:/^@rchunk\//},({path:modulePath})=>({path:modulePath.slice(8),namespace:"mock"}));build.onLoad({filter:/.*/,namespace:"mock"},({path:modulePath})=>modulePath==="app-shared"?{loader:"js",contents:"export const I3=()=>globalThis.__jsx;"}:{loader:"js",contents:"export default {};"});}}]});return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${name}`)}

const mobileAge=await load("mobile-age-verification-page");
assert.equal(mobileAge.MobileAgeVerificationPage({}).props["data-status"],"loading");assert.equal(mobileAge.MobileAgeVerificationPage({}).props.children[1].props["aria-live"],"polite");let started=0;const active=mobileAge.MobileAgeVerificationPage({status:"active",onStart:()=>{started++}});active.props.children[1].props.onClick();assert.equal(started,1);let result=null;const success=mobileAge.MobileAgeVerificationPage({status:"success",inquiryId:"inq 1",onResult:(url)=>{result=url}});assert.match(success.props.children[1].props.href,/status=success/);assert.match(result,/inquiry_id=inq\+1/);const failed=mobileAge.MobileAgeVerificationPage({status:"error",inquiryId:"i",errorCode:"bad",errorStatus:"400"});assert.match(failed.props.children[1].props.href,/error_code=bad/);assert.match(failed.props.children[1].props.href,/error_status=400/);

const handoff=await load("browser-mobile-handoff-page");
assert.equal(handoff.BrowserMobileHandoffPage({}).props["data-status"],"loading");assert.equal(handoff.BrowserMobileHandoffPage({status:"account_changed"}).props.children[1].props.children,"This browser account changed. Return to the app and try again");assert.match(handoff.BrowserMobileHandoffPage({status:"unavailable"}).props.children[1].props.children,/no longer available/);let continued=null;const ready=handoff.BrowserMobileHandoffPage({status:"ready",redirectTo:"/checkout",onContinue:(url)=>{continued=url}});assert.equal(ready.props["data-redirect"],true);ready.props.onClick();assert.equal(continued,"/checkout");

const enrollReleaseAssertions=assertReleaseOwner("browser-mfa-enroll-page");

const disableReleaseAssertions=assertReleaseOwner("browser-mfa-disable-page");

const logoutReleaseAssertions=assertReleaseOwner("browser-logout-page");

const releaseAssertions = assertReleaseOwner("verify-guardian-page") + assertReleaseOwner("verify-age-page") + assertReleaseOwner("icloud-hosted-page");

console.log(`browser account safety pages cluster complete (${releaseAssertions + logoutReleaseAssertions + disableReleaseAssertions + enrollReleaseAssertions} release assertions)`);
