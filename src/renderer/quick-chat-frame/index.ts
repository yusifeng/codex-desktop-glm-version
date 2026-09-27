import * as appSharedChunk from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/quick-chat-obstacles";
import "@rchunk/rolldown-runtime";
import type { JsxRuntime } from "@rchunk/app-shared";
const { I3: jsxExport }=appSharedChunk as unknown as {I3:JsxRuntime|(()=>JsxRuntime)}; let jsx:JsxRuntime;
interface Props { background?:"panel"|"window"; children?:unknown; currentSize?:{height:number;width:number}; isCompact?:boolean; isMinimized?:boolean; minimizedContent?:unknown; onResize?(size:{height:number;width:number}):void; sectionProps?:Record<string,unknown>; variant?:"window"|"panel"; }
function QuickChatFrame({background="panel",children,currentSize,isCompact=false,isMinimized=false,minimizedContent,onResize,sectionProps={},variant="panel"}:Props):unknown{initializeQuickChatFrame();return jsx.jsx("section",{...sectionProps,"data-background":background,"data-compact":isCompact,"data-minimized":isMinimized,"data-variant":variant,style:currentSize,onDoubleClick:()=>currentSize&&onResize?.(currentSize),children:isMinimized?minimizedContent:children});}
function initializeQuickChatFrame():void{if(jsx==null)jsx=typeof jsxExport==="function"?jsxExport():jsxExport;}
initializeQuickChatFrame(); export {initializeQuickChatFrame as n,QuickChatFrame as t};
