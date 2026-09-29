import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/chatgpt-shared-post-page/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const dependencies = new Set([...source.matchAll(/(?:from|import)\s+"@rchunk\/([^"/]+)"/g)].map((match) => match[1]));
assert.deepEqual([...dependencies].sort(), ["analytics","app-initial","app-primary","app-shared","browser-composer-disclaimer","chatgpt-conversation-page","chatgpt_image_home","document-title","image-validation-session","right-panel-composer-overlay","rolldown-runtime","thread-scroll-layout","use-chatgpt-composer-controller","viewer"]);
assert.doesNotMatch(source, /\bany\b/);
assert.doesNotMatch(source, /\b(?:analyticsChunk|appInitialChunk|appPrimaryChunk|appSharedChunk|browserDisclaimerChunk|conversationPageChunk|imageHomeChunk|documentTitleChunk|imageValidationChunk|rightPanelChunk|threadScrollChunk|composerControllerChunk|viewerChunk)\s*\./);

const state={
  postId:"post-1", identity:{accountId:"account-1",userId:"user-1",authMethod:"chatgpt",isLoading:false}, status:{data:{status:"available"},isPending:false}, post:null, gate:false, conversation:null, stateValues:[],stateIndex:0,refIndex:0,initializers:[], navigations:[], toasts:[], analytics:[], promptAnalytics:[], hydrations:[], hints:[], loginCalls:0, composerControllers:[], submitEvents:[], focusCalls:0, promptTexts:[], setStateCalls:[], dropFiles:[], fileDialogs:[],
};
state.scope={get(signal){if(signal==="toast")return{info:message=>state.toasts.push({type:"info",message}),warning:(message,options)=>state.toasts.push({type:"warning",message,options})};return undefined;}};
globalThis.__sharedPostTest=state;
const marker="const state=globalThis.__sharedPostTest; const marker=name=>()=>state.initializers.push(name);";
const mocks={
  "rolldown-runtime":"export {};",
  "app-shared":[marker,
    "export const $3=marker('runtime'); export const FX=marker('signals'); export const K2=marker('ui'); export const Zh=marker('button'); export const lk=marker('links'); export const lw=marker('layout');",
    "export const Ah='DialogHeader'; export const Ih='Dialog'; export const Oh='DialogBody'; export const Ph='DialogTitle'; export const Rh='DialogSubtitle'; export const UX='ScopeProvider'; export const hy='Chevron'; export const kh='DialogActions'; export const Y2='FormattedMessage'; export const Yh='Button'; export const pk='toast';",
    "export const I3=()=>({Fragment:'Fragment',jsx:(type,props,key)=>({type,props,key}),jsxs:(type,props,key)=>({type,props,key})}); export const e6=()=>({useEffect(effect){effect();},useRef(value){return{current:value};},useState(value){const i=state.stateIndex++; const fallback=typeof value==='function'?value():value; const selected=i<state.stateValues.length?state.stateValues[i]:fallback; return[selected,next=>state.setStateCalls.push({i,next})];}});",
    "export const n4=()=>({formatMessage:(descriptor,values)=>values?.title?descriptor.defaultMessage.replace('{title}',String(values.title)):descriptor.defaultMessage}); export const LX=()=>state.scope; export const HX=signal=>signal; export const BX=(family)=>family==='statusFamily'?state.status:family==='postFamily'?state.post:family==='gateFamily'?state.gate:null;",
  ].join('\n'),
  "app-initial":[marker,
    "export const Aet=marker('post-model'); export const M6t=marker('account'); export const Qgn=marker('identity'); export const Ret=marker('loading'); export const Rht=marker('post-query'); export const Wvt=marker('tabs'); export const cJt=marker('api'); export const oqt=marker('routing'); export const pfn=marker('gate'); export const ypn=marker('analytics');",
    "export const $en='routeScope'; export const Pe='statusFamily'; export const yR='postFamily'; export const mfn='gateFamily'; export const Let='Loading'; export const ket='EmptyState'; export const pk='toast'; export const f7={MainContentLayout:'MainContentLayout',RightPanelOutlet:'RightPanelOutlet',RightPanelTabs:'RightPanelTabs'};",
    "export const N6t=()=>state.identity; export const l_n=()=>({postId:state.postId}); export const o_n=()=>((destination,options)=>state.navigations.push({destination,options})); export const CR=()=>state.conversation; export const gln=id=>'/conversation/'+id;",
    "export const xpn=(_scope,event,fields)=>state.analytics.push({event,fields}); export const Kun=()=>state.loginCalls++; export const aHt=(_scope,input)=>state.hydrations.push(input); export const GIt=(_scope,id,hints)=>state.hints.push({id,hints});",
  ].join('\n'),
  "app-primary":[marker,"export const H='Dropzone'; export const Oo='ComposerSurface'; export const U='Header'; export const Ui='Composer'; export const nt='PageLayout'; export const Wi=marker('primary-header'); export const au=marker('primary-share'); export const iu=marker('primary-composer'); export const ko=marker('primary-layout'); export const rt=marker('primary-route'); export const su=marker('primary-dropzone');"].join('\n'),
  "use-chatgpt-composer-controller":[marker,"export const n=marker('controller'); export const t=input=>{const controller={input,view:{isDestroyed:false},eventEmitter:{emit:event=>state.submitEvents.push(event)},focus:()=>state.focusCalls++,setPromptText:text=>state.promptTexts.push(text),getPersistedText:()=>''}; state.composerControllers.push(controller); return controller;};"].join('\n'),
  "document-title":[marker,"export const r=marker('title'); export const t='DocumentTitle';"].join('\n'),
  "right-panel-composer-overlay":[marker,"export const n=marker('right-panel'); export const t='RightPanelOverlay';"].join('\n'),
  "thread-scroll-layout":[marker,"export const n=marker('thread-scroll'); export const t='ThreadScrollLayout';"].join('\n'),
  "chatgpt-conversation-page":[marker,"export const c=marker('conversation-header'); export const u=marker('conversation-page'); export const d='ConversationHeader'; export const f='ConversationFooter'; export const l='Link'; export const t='SharedConversation';"].join('\n'),
  "browser-composer-disclaimer":[marker,"export const n=marker('disclaimer'); export const t='BrowserDisclaimer';"].join('\n'),
  viewer:[marker,"export const c=marker('viewer'); export const l='DropTarget'; export const s='ImageViewer'; export const u=async()=>({});"].join('\n'),
  "image-validation-session":[marker,"export const a=marker('image-validation'); export const i=()=>({}); export const r=()=>[];"].join('\n'),
  analytics:[marker,"export const i=marker('share-analytics'); export const r=(_scope,input,length)=>state.promptAnalytics.push({input,length}); export const t={};"].join('\n'),
  chatgpt_image_home:[marker,"export const a='images-surface'; export const o=marker('image-home'); export const r=marker('image-events'); export const t={};"].join('\n'),
};
const result=await esbuild.build({entryPoints:[sourcePath],bundle:true,format:"esm",platform:"node",target:"node22",write:false,logLevel:"silent",plugins:[{name:"shared-post-mocks",setup(build){build.onResolve({filter:/^@rchunk\//},({path:importPath})=>({path:importPath.slice(8),namespace:"mock"}));build.onLoad({filter:/.*/,namespace:"mock"},({path:importPath})=>({loader:"js",contents:mocks[importPath]??"export {};"}));}}]});
const module=await import("data:text/javascript;base64,"+Buffer.from(result.outputFiles[0].text).toString("base64"));
let assertions=3;function check(value,message){assert.ok(value,message);assertions+=1;}
function reset(){state.postId="post-1";state.identity={accountId:"account-1",userId:"user-1",authMethod:"chatgpt",isLoading:false};state.status={data:{status:"available"},isPending:false};state.post=null;state.gate=false;state.conversation=null;state.stateValues=[];state.stateIndex=0;state.navigations=[];state.toasts=[];state.analytics=[];state.promptAnalytics=[];state.hydrations=[];state.hints=[];state.loginCalls=0;state.composerControllers=[];state.submitEvents=[];state.focusCalls=0;state.promptTexts=[];state.setStateCalls=[];state.dropFiles=[];state.fileDialogs=[];}
function page(){state.stateIndex=0;return module.ChatGptSharedPostPage();}function body(root){const node=root.props.children[1];return node.type(node.props);}function promptPost(action={submission:"auto_send",image_input:"optional"},prompt="paint a fox"){return{id:"share-1",preview_image_url:"fallback.png",text:null,attachments:[{kind:"prompt_share",prompt_share:{prompt_share_id:"prompt-1",content:{title:"Fox",prompt,generated_image:{image_url:"fox.png",prompt_match:"matches"}},recipient_action:action}}]};}

check(Object.keys(module).join(",")==="ChatGptSharedPostPage","preserves the sole export");
check(state.initializers.length>=25,"initializes the direct dependency surfaces");
check(state.initializers.includes("controller")&&state.initializers.includes("viewer")&&state.initializers.includes("share-analytics"),"initializes composer, viewer, and analytics helpers");

reset();let root=page();check(root.props.children[0].props.title==="ChatGPT - Privately Shared Content","uses private title before content loads");check(root.props.children[1].key==="post-1:user-1:account-1","keys content by post and identity");
reset();state.identity.isLoading=true;check(body(page()).type==="Loading","shows loading while identity resolves");
reset();state.status.isPending=true;check(body(page()).props.debugName==="SharedContent","shows loading while status query resolves");
reset();state.status={data:{status:"unavailable",reason:"workspace"},isPending:false};let workspaceError=body(page());check(typeof workspaceError.type==="function"&&workspaceError.props.reason==="workspace","shows workspace access dialog");let dialog=workspaceError.type(workspaceError.props);dialog.props.onOpenChange(false);check(state.navigations[0].destination==="/","closing the workspace dialog returns home");
reset();state.status={data:{status:"unavailable",reason:"deleted"},isPending:false};let deleted=body(page());check(deleted.type==="Loading"&&deleted.props.debugName==="SharedContentRedirect","keeps redirect state mounted for deleted shares");check(state.toasts[0].type==="warning"&&state.navigations[0].options.replace===true,"warns and replaces navigation for deleted shares");
reset();state.post=promptPost(undefined,"");body(page());check(state.toasts[0].type==="info"&&state.navigations[0].destination==="/","redirects empty prompt shares");
reset();state.post=promptPost();state.gate=true;let gated=body(page());check(typeof gated.type==="function"&&gated.props.reason==="general","blocks prompt shares behind the availability gate");
reset();state.post=promptPost();root=page();check(root.props.children[0].props.title==="ChatGPT - Fox","uses prompt share title in document title");let promptBranch=body(root);check(typeof promptBranch.props.children[0].type==="function","renders prompt share header surface");let scopeNode=promptBranch.props.children[1];let scopeTree=scopeNode.type(scopeNode.props);let promptContentNode=scopeTree.props.children;let promptContent=promptContentNode.type(promptContentNode.props);check(state.analytics[0].fields.primaryAttachmentType==="prompt_share","tracks shared prompt view");let layout=promptContent.props.children[1];let dropTarget=layout.props.children.props.children;let contentContainer=dropTarget.props.children;let previewNode=contentContainer.props.children[0];let preview=previewNode.type(previewNode.props);check(preview.props.children[0].type==="nav"&&preview.props.children[1].props.children[0].props.src==="fox.png","renders logged-in breadcrumb and preview image");previewNode.props.onTryPrompt(false);check(state.hydrations.length===1&&state.promptTexts[0]==="paint a fox","hydrates the shared prompt into the composer");check(state.submitEvents[0]==="submit"&&state.promptAnalytics[0].input.promptId==="prompt-1","auto-sends eligible shared prompts and records analytics");
let composerSurface=contentContainer.props.children[1].props.children;let composer=composerSurface.props.children;composer.props.onSubmitAccepted("conversation-2");check(state.navigations.at(-1).destination==="/conversation/conversation-2","navigates to the accepted conversation");

reset();state.identity.authMethod=null;state.post=promptPost();promptBranch=body(page());scopeNode=promptBranch.props.children[1];scopeTree=scopeNode.type(scopeNode.props);promptContentNode=scopeTree.props.children;promptContent=promptContentNode.type(promptContentNode.props);layout=promptContent.props.children[1];dropTarget=layout.props.children.props.children;previewNode=dropTarget.props.children.props.children[0];previewNode.props.onTryPrompt(false);check(state.loginCalls===1&&state.hydrations.length===0,"prompts anonymous recipients to log in");

reset();state.post=promptPost({submission:"auto_send",image_input:"required"});const fileTarget={canOpenImagePicker:true,disabled:false,openFileDialog:multiple=>state.fileDialogs.push(multiple),onFilesDropped:files=>state.dropFiles.push(files)};state.stateValues=[true,fileTarget];promptBranch=body(page());scopeNode=promptBranch.props.children[1];scopeTree=scopeNode.type(scopeNode.props);promptContentNode=scopeTree.props.children;promptContent=promptContentNode.type(promptContentNode.props);layout=promptContent.props.children[1];dropTarget=layout.props.children.props.children;previewNode=dropTarget.props.children.props.children[0];previewNode.props.onTryPrompt(false);check(state.fileDialogs[0]===true&&state.submitEvents.length===0,"opens image picker for required-image auto-send shares");

reset();state.post={id:"share-2",text:"A shared answer",attachments:[{kind:"message_slice"}]};state.conversation={id:"conversation"};root=page();check(root.props.children[0].props.title==="ChatGPT - A shared answer","uses text content for document title");let conversation=body(root);check(conversation.type==="SharedConversation"&&conversation.props.conversation===state.conversation,"routes normalized shared posts to the conversation view");

reset();state.post={id:"share-3",text:null,attachments:[{kind:"media_generation",generation_type:"image_gen",title:"Sunset",output_blocked:false}]};let imageBranch=body(page());check(typeof imageBranch.type==="function"&&imageBranch.props.attachments.length===1,"routes image generations to the image layout");let imageLayout=imageBranch.type(imageBranch.props);check(imageLayout.props.children[1].type==="RightPanelOutlet","renders the right panel for image shares");let imageThread=imageLayout.props.children[2].props.children;check(imageThread.props.threadEndContent.type==="BrowserDisclaimer"&&imageThread.props.footer.type==="ComposerSurface","renders disclaimer and logged-in composer for image shares");

reset();state.post={id:"share-4",text:null,attachments:[]};let empty=body(page());check(empty.type==="EmptyState"&&empty.props.title.includes("shared content"),"renders generic unavailable empty state");empty.props.actions.props.onClick();check(state.navigations[0].destination==="/","empty-state action returns to ChatGPT home");
reset();state.post={id:"share-5",text:null,attachments:[{kind:"media_generation",generation_type:"image_gen",output_blocked:true}]};empty=body(page());check(empty.props.title.includes("shared image"),"uses image-specific unavailable copy");

console.log(`${assertions} ChatGPT shared post assertions passed`);
