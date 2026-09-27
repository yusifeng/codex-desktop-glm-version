import * as appSharedChunk from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/rolldown-runtime";
import type { JsxRuntime } from "@rchunk/app-shared";
const {I3:jsxExport}=appSharedChunk as unknown as {I3:JsxRuntime|(()=>JsxRuntime)};let jsx:JsxRuntime;
type Destination="bottom"|"left"|"right";
function dropZoneStyle(destination:Destination,size:number){return destination==="bottom"?{height:size}:{width:size};}
function QuickChatDropZone({destination,onDrop}: {destination:Destination;onDrop?(destination:Destination):void}):unknown{initializeQuickChatDropZones();return jsx.jsx("button",{"aria-label":`Move chat to ${destination}`,"data-unified-workspace-drop-indicator":destination,onClick:()=>onDrop?.(destination),type:"button"});}
function QuickChatDropZones({destinations=["left","right","bottom"],onDrop}:{destinations?:Destination[];onDrop?(destination:Destination):void}={}):unknown{initializeQuickChatDropZones();return jsx.jsx("div",{"data-quick-chat-drop-zones":true,children:destinations.map(destination=>jsx.jsx("button",{"aria-label":`Move chat to ${destination}`,"data-unified-workspace-drop-indicator":destination,onClick:()=>onDrop?.(destination),type:"button"},destination))});}
function initializeQuickChatDropZones():void{if(jsx==null)jsx=typeof jsxExport==="function"?jsxExport():jsxExport;}
initializeQuickChatDropZones();export{QuickChatDropZones as n,initializeQuickChatDropZones as r,dropZoneStyle as t};
