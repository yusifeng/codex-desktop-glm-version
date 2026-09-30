import '@rchunk/rolldown-runtime';
import * as SharedChunk from '@rchunk/app-shared';
import * as InitialChunk from '@rchunk/app-initial';
import * as DetailLayoutChunk from '@rchunk/use-hotkey-window-detail-layout';
import * as DismissChunk from '@rchunk/use-hotkey-window-dismiss-on-escape';
interface Jsx{jsx(type:unknown,props:Record<string,unknown>,key?:unknown):unknown;jsxs(type:unknown,props:Record<string,unknown>,key?:unknown):unknown}
const jsx=(SharedChunk as unknown as{I3():Jsx}).I3();
function HotkeyWindowDetailLayout(props:{detail?:{title:string;mainWindowPath:string;canCollapseToHome?:boolean;onBack?:()=>void}|null;children?:unknown;onDismiss?:()=>void;onCollapse?:()=>void;onOpenMainWindow?:(path:string)=>void}):unknown{void InitialChunk;void DetailLayoutChunk;void DismissChunk;const detail=props.detail??null;const collapse=():void=>{if(detail?.canCollapseToHome!==false)props.onCollapse?.()};const keyDown=(event:{preventDefault():void;stopPropagation():void}):void=>{event.preventDefault();event.stopPropagation();collapse()};return jsx.jsxs('div',{'data-hotkey-window-detail-layout':true,onKeyDown:keyDown,children:[detail==null?null:jsx.jsxs('header',{children:[jsx.jsx('button',{onClick:props.onDismiss,children:'Dismiss'}),detail.onBack?jsx.jsx('button',{onClick:detail.onBack,children:'Back'}):null,jsx.jsx('h1',{children:detail.title}),jsx.jsx('button',{onClick:()=>props.onOpenMainWindow?.(detail.mainWindowPath),children:'Open in Main Window'})]}),jsx.jsx('main',{children:props.children})]})}
export{HotkeyWindowDetailLayout};
