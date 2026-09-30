import '@rchunk/rolldown-runtime';
import * as SharedChunk from '@rchunk/app-shared';
import * as InitialChunk from '@rchunk/app-initial';
import * as WebviewChunk from '@rchunk/webview';
interface Jsx{jsx(type:unknown,props:Record<string,unknown>,key?:unknown):unknown}
const jsx=(SharedChunk as unknown as{I3():Jsx}).I3();
function HiddenBrowserUseWebviewHost(props:{browserUseTabIdsKey:string;conversationId:string;mountedBrowserTabIds?:string[]}):unknown{const mounted=new Set(props.mountedBrowserTabIds??[]);const ids=props.browserUseTabIdsKey.split('\0').filter(Boolean).filter(id=>!mounted.has(id));if(ids.length===0)return null;const Webview=(WebviewChunk as unknown as{t:(props:Record<string,unknown>)=>unknown}).t;return jsx.jsx(Symbol.for('react.fragment'),{children:ids.map(id=>jsx.jsx(Webview,{bounds:null,browserTabId:id,conversationId:props.conversationId,hostKind:'hidden-browser-use',initialUrl:'about:blank',isVisible:false,scale:1,shouldBootstrapWhenHidden:true,shouldPaint:false},id))})}
export{HiddenBrowserUseWebviewHost};
