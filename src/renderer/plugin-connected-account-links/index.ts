import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared"; import "@rchunk/app-initial";
let jsx: JsxRuntime; const normalizeConnectorId=(value:string):string=>value.trim().toLowerCase().replaceAll("-","_");
function ConnectedAccountIcon(props:{ariaLabel:string;icon?:unknown}):unknown{return ensure().jsx("span",{role:"img","aria-label":props.ariaLabel,className:"flex h-7 w-7 items-center justify-center",children:props.icon})}
function filterLinks(links:Array<{connector_id:string;id:string;visibility?:string}>,connectorId:string){const id=normalizeConnectorId(connectorId);return links.filter(link=>normalizeConnectorId(link.connector_id)===id&&link.visibility!=="HIDDEN"&&!link.id.startsWith("implicit_link::"))}
const initialize=():void=>{jsx=getJsxRuntime()};const noop=():void=>{};function ensure(){if(jsx==null)initialize();return jsx}export{initialize as i,noop as n,ConnectedAccountIcon as r,filterLinks as t};
