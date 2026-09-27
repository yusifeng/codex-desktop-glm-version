import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const jsx={Fragment:Symbol("Fragment"),jsx:(type,props,key)=>({type,props:props??{},key}),jsxs:(type,props,key)=>({type,props:props??{},key})};globalThis.__jsx=jsx;
async function load(name){const result=await esbuild.build({entryPoints:[path.join(ROOT,`src/renderer/${name}/index.ts`)],bundle:true,format:"esm",platform:"node",target:"node22",write:false,logLevel:"silent",plugins:[{name:"mocks",setup(build){build.onResolve({filter:/^@rchunk\/plugin-detail-view$/},()=>({path:path.join(ROOT,"src/renderer/plugin-detail-view/index.ts")}));build.onResolve({filter:/^@rchunk\//},({path:modulePath})=>({path:modulePath.slice(8),namespace:"mock"}));build.onLoad({filter:/.*/,namespace:"mock"},({path:modulePath})=>modulePath==="app-shared"?{loader:"js",contents:"export const I3=()=>globalThis.__jsx;"}:{loader:"js",contents:"export {};"});}}]});return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${name}`)}

const connection=await load("requested-plugin-connection");connection.t();
assert.deepEqual(await connection.n({requiresAppSetup:false}),{kind:"ready"});
assert.deepEqual(await connection.n({requiresAppSetup:true}),{kind:"ready"});
assert.deepEqual(await connection.n({requiresAppSetup:true,requestedConnectorId:"drive"}),{kind:"unavailable"});
const active={requiresAppSetup:true,requestedConnectorId:"drive",fetchConnector:async()=>({name:"Drive",description:"Files"}),fetchLink:async()=>({auth_status:"ACTIVE"})};
assert.deepEqual(await connection.n(active),{kind:"ready"});
const auth=await connection.n({...active,fetchLink:async()=>({auth_status:"PENDING"})});
assert.equal(auth.kind,"needsAuth");assert.equal(auth.app.id,"drive");assert.equal(auth.app.name,"Drive");assert.equal(auth.app.description,"Files");
assert.deepEqual(await connection.n({...active,fetchConnector:async()=>({name:"Drive",status:"DISABLED_BY_ADMIN"})}),{kind:"unavailable"});
assert.deepEqual(await connection.n({...active,fetchConnector:async()=>{throw Error("offline")}}),{kind:"unavailable"});

const overrides=await load("recommended-skill-statsig-overrides");overrides.n();
assert.deepEqual(overrides.r({skill_markdown_by_id:{pdf:"# PDF",empty:" ",bad:4}}),{pdf:"# PDF"});
assert.deepEqual(overrides.r(null),{});assert.equal(overrides.t({pdf:"text"},"pdf"),"text");assert.equal(overrides.t({},"pdf"),undefined);

const data=await load("skill-data");
assert.equal(data.getSkillName({id:"pdf",name:"PDF tools"}),"PDF tools");assert.equal(data.getSkillName({id:"pdf",name:" "}),"pdf");
assert.equal(data.getSkillSafetyStatus({id:"x",safety_scan:{status:"blocked"}},{blockUnsafe:true}),"blocked");
assert.equal(data.getSkillSafetyStatus({id:"x",safety_scan:{status:"blocked"}},{blockUnsafe:false}),null);
assert.equal(data.getSkillSafetyStatus({id:"x",safety_scan:{status:"needs_review"}}),"needs-review");assert.equal(data.getSkillSafetyStatus({id:"x"}),null);
assert.deepEqual(await data.setSkillInstalled({}, {id:"pdf"},true),{id:"pdf",enabled:true});assert.equal(data.skillDetail$.key,"skill-detail");assert.equal(data.skillFile$.key,"skill-file");assert.equal(data.skillsAccess$.key,"skills-access");assert.equal(data.skillsCollection$.key,"skills-collection");

const installation=await load("use-plugin-installation");
assert.deepEqual(await installation.installPlugin({id:"one",name:"One"}),{id:"one",name:"One",installed:true});
assert.equal(await installation.installPlugin({id:"two"},async(plugin)=>plugin.id),"two");

const profile=await load("profile-plugin-details");
const direct=profile.ProfilePluginDetails({invocation:{plugin_id:"calendar",plugin_name:"Calendar"},plugin:{id:"calendar",name:"Calendar"},onClose(){}});
assert.equal(direct.type,"dialog");assert.equal(direct.props.open,true);assert.equal(direct.props.children[0].props.children,"Calendar");assert.equal(direct.props.children[1].props["data-plugin-id"],"calendar");
const found=profile.ProfilePluginDetails({invocation:{plugin_id:"reports@workspace-directory",plugin_name:"Reports"},searchResults:[{name:"reports",scope:"WORKSPACE",installedPlugin:{id:"reports",name:"Reports"}}],onClose(){}});
assert.equal(found.props.children[1].props["data-plugin-id"],"reports");
const loading=profile.ProfilePluginDetails({invocation:{plugin_name:"Missing"},searchLoading:true,onClose(){}});assert.equal(loading.props.children[1].type.name,"PluginDetailView");assert.equal(loading.props.children[1].props.state,"loading");
const failed=profile.ProfilePluginDetails({invocation:{plugin_name:"Missing"},searchError:Error("network"),onClose(){}});assert.equal(failed.props.children[1].props.state,"error");assert.equal(failed.props.children[1].props.errorMessage,"network");
const missing=profile.ProfilePluginDetails({invocation:{plugin_name:"Missing"},onClose(){}});assert.equal(missing.props.children[1].props.state,"missing");

const showcase=await load("plugin-showcase-skill-details");
const denied=showcase.PluginShowcaseSkillDetails({item:{pin:{artifact_id:"pdf"}},skillsAccess:false,onClose(){}});assert.equal(denied.props.children.props.role,"alert");
const pending=showcase.PluginShowcaseSkillDetails({item:{pin:{artifact_id:"pdf"}},onClose(){}});assert.equal(pending.props.children.props["aria-busy"],true);
let installed=null;const skill={id:"pdf",name:"PDF",description:"Read files",files:{"docs/SKILL.md":{},"README.md":{}},permissions:{can_read:true}};
const skillDialog=showcase.PluginShowcaseSkillDetails({item:{pin:{artifact_id:"pdf"}},skill,onClose(){},onInstall:(value)=>{installed=value}});
assert.equal(skillDialog.type,"dialog");assert.equal(skillDialog.props.children[0].props.children,"PDF");assert.equal(skillDialog.props.children[1].props.children,"Read files");assert.equal(skillDialog.props.children[3].props["data-skill-file"],"docs/SKILL.md");assert.equal(skillDialog.props.children[4].props.children,"Install skill");skillDialog.props.children[4].props.onClick();assert.equal(installed,skill);
const blocked=showcase.PluginShowcaseSkillDetails({item:{pin:{artifact_id:"unsafe"}},skill:{id:"unsafe",files:{"SKILL.md":{}},safetyStatus:"blocked"},onClose(){}});assert.equal(blocked.props.children[2].props.role,"alert");assert.match(blocked.props.children[2].props.children,/blocked/);assert.equal(blocked.props.children[4].props.disabled,true);
const unreadable=showcase.PluginShowcaseSkillDetails({item:{pin:{artifact_id:"private"}},skill:{id:"private",files:{"SKILL.md":{}},permissions:{can_read:false}},onClose(){}});assert.equal(unreadable.props.children[3].props.role,"status");
const already=showcase.PluginShowcaseSkillDetails({item:{pin:{artifact_id:"ready"}},skill:{id:"ready",enabled:true,files:{"SKILL.md":{}}},onClose(){}});assert.equal(already.props.children[4].props.children,"Installed");assert.equal(already.props.children[4].props.disabled,true);
console.log("plugin profile data cluster complete");
