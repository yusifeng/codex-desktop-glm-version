import assert from "node:assert/strict";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const jsx={Fragment:Symbol("Fragment"),jsx:(type,props,key)=>({type,props:props??{},key}),jsxs:(type,props,key)=>({type,props:props??{},key})};globalThis.__jsx=jsx;
async function load(name){const result=await esbuild.build({entryPoints:[path.join(ROOT,`src/renderer/${name}/index.ts`)],bundle:true,format:"esm",platform:"node",target:"node22",write:false,logLevel:"silent",plugins:[{name:"mocks",setup(build){build.onResolve({filter:/^@rchunk\/(plugins-page-section|plugin-detail-page-core)$/},({path:p})=>({path:path.join(ROOT,"src/renderer",p.slice(8),"index.ts")}));build.onResolve({filter:/^@rchunk\//},({path:p})=>({path:p.slice(8),namespace:"mock"}));build.onLoad({filter:/.*/,namespace:"mock"},({path:p})=>p==="app-shared"?{loader:"js",contents:`export const I3=()=>globalThis.__jsx;`}:{loader:"js",contents:"export {};"});}}]});return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${name}`)}

const section=await load("plugins-page-section");section.d();
const installed=[{skill:{id:"local-imagegen",name:"Imagegen",path:"/skills/imagegen",description:"Create images"}},{skill:{id:"custom",name:"My Skill",path:"/skills/custom",description:"Custom workflow"}}];
const recommended=[{id:"imagegen",name:"Imagegen",description:"Images"},{id:"pdf",name:"PDF",description:"Documents"}];
const keys=section.o(installed);assert.equal(keys.has("imagegen"),true);assert.equal(keys.has("myskill"),true);
assert.equal(section.m({installedSkillMatchKeys:keys,skill:recommended[0]}),true);assert.equal(section.m({installedSkillMatchKeys:keys,skill:recommended[1]}),false);
assert.equal(section.l({installedSkills:installed,skill:recommended[0]}).id,"local-imagegen");assert.equal(section.l({installedSkills:installed,skill:recommended[1]}),null);
assert.deepEqual(section.E({installedRecommendedSkillIds:new Set(),installedSkillMatchKeys:keys,skills:recommended}).map(x=>x.id),["pdf"]);
assert.deepEqual(section.C({installedSkills:installed,recommendedSkills:recommended}).map(x=>x.skill.id),["custom"]);
assert.equal(section.b({skills:installed,query:"custom"}).length,1);assert.equal(section.S({skills:recommended,query:"document"})[0].id,"pdf");
assert.equal(section.v({query:"image",suggestions:[{name:"Image helper",type:"skill",description:"image"},{name:"App",type:"app"}]}).length,1);
assert.deepEqual(section.w([{name:"PDF"},{name:"Other"},{name:"Sora"}]).map(x=>x.name),["Sora","PDF"]);
assert.equal(section.y({apps:[{name:"Calendar",description:"events"},{name:"Mail"}],query:"event"}).length,1);
assert.equal(section.u({name:"my-plugin",marketplaceDisplayName:" My Store "}),"My Store");
const config={marketplaces:{git:{source_type:"git",source:"https://example"},folder:{source_type:"directory",source:"/tmp"}}};
assert.deepEqual([...section.s(config)],["git"]);assert.deepEqual([...section.c(config)],["git","folder"]);
assert.equal(section.f({name:"git"},new Set(["git"])),true);assert.equal(section.f({name:"git",isBuiltIn:true},new Set(["git"])),false);
assert.equal(section.x({configuredMarketplaceNames:new Set(["git"]),marketplaces:[{name:"git",path:"/git"},{name:"other"}],query:""}).length,1);
assert.deepEqual(section.h([{name:"One",isAccessible:true},{name:"Two",isAccessible:false}]).installedApps.map(x=>x.name),["One"]);
assert.equal(section.g({currentTab:"skills",isCurrentTabLoading:false,isManagePage:true,isPluginsEnabled:true,tabCounts:{skills:0,apps:2}}),"apps");
assert.equal(section.g({currentTab:"skills",isCurrentTabLoading:true,isManagePage:true,isPluginsEnabled:true,tabCounts:{skills:0}}),"skills");
assert.equal(section.g({currentTab:"plugins",isCurrentTabLoading:false,isManagePage:true,isPluginsEnabled:false,tabCounts:{}}),"mcps");
assert.deepEqual(section._({pluginResultKeys:["p"],skillResultKeys:["s"],tab:"plugins"}),["p"]);
const pageSection=section.F({id:"featured",title:"Featured",count:2,children:"cards"});assert.equal(pageSection.type,"section");assert.equal(pageSection.props.id,"featured");assert.equal(pageSection.props.children[0].props.children,"Featured");
const expand=section.t({children:"Show more",isExpanded:false});assert.equal(expand.props["aria-expanded"],false);assert.equal(expand.props.children,"Show more");
const progressive=section.n({items:[1,2,3],visibleItemLimit:2,children:(items)=>items,renderExpandRow:({hiddenItems})=>hiddenItems});assert.deepEqual(progressive.props.children[0],[1,2]);assert.deepEqual(progressive.props.children[1],[3]);

assertReleaseOwner("plugin-detail-page-core", [/^\/\/ @ts-nocheck/m, /export \{/]);
assertReleaseOwner("plugins-page", [/^\/\/ @ts-nocheck/m, /export \{/]);
console.log("plugin section behavior and release-faithful page assertions passed");
