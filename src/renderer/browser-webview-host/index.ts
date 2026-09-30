import '@rchunk/rolldown-runtime';
import * as SharedChunk from '@rchunk/app-shared';
import * as InitialChunk from '@rchunk/app-initial';
interface Props{conversationId:string;browserTabId:string;initialUrl?:string;isVisible?:boolean;isExiting?:boolean;shouldBootstrapWhenHidden?:boolean;children?:unknown;bounds?:unknown;hostKind?:string;webviewRef?:unknown;[key:string]:unknown}
interface Jsx{jsx(type:unknown,props:Record<string,unknown>,key?:unknown):unknown}
let jsx:Jsx;
function syncMode(input:{hasManagedWebview:boolean;isPresented:boolean;shouldBootstrapWhenHidden?:boolean}){return input.isPresented?'sync':input.shouldBootstrapWhenHidden?(input.hasManagedWebview?'sync':'bootstrap'):'skip'}
function key(conversationId:string,browserTabId:string){return conversationId+'\0'+browserTabId}
function BrowserWebviewHost(props:Props):unknown{const shared=SharedChunk as unknown as{createPortal?(child:unknown,host:unknown):unknown};const initial=InitialChunk as unknown as{ggt?:{pages?:{getCursorOverlayHost?(conversationId:string,tabId:string):unknown}}};const host=initial.ggt?.pages?.getCursorOverlayHost?.(props.conversationId,props.browserTabId);if(host==null||props.children==null)return null;return shared.createPortal?.(props.children,host)??jsx.jsx('span',{'data-browser-webview-portal':key(props.conversationId,props.browserTabId),children:props.children})}
function initialize(){jsx=(SharedChunk as unknown as{I3():Jsx}).I3()}
initialize();
export{initialize as n,BrowserWebviewHost as t};
