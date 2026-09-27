import "@rchunk/rolldown-runtime";
interface Rect {height:number;width:number;x:number;y:number}
const hostId="codex-main-thread"; const alignments=["top-left","top-right","bottom-left","bottom-right"] as const;
function anchorPoint(alignment:string,host:Rect){const left=alignment.endsWith("left")?24:host.width-274;const top=alignment.startsWith("top")?24:host.height-274;return{x:left+125,y:top+125};}
function computePipLayout({homeSurfaceRect,hostId:requestedHostId,hostRect,isCodexHomeAvailable,obstacleRects}:{homeSurfaceRect?:Rect|null;hostId:string;hostRect:Rect;isCodexHomeAvailable:boolean;obstacleRects:Rect[]}){void obstacleRects;return{anchorRect:hostRect,anchors:alignments.map(alignment=>({alignment,point:anchorPoint(alignment,hostRect)})),animated:false,hostId:requestedHostId,homeSurfaceWidth:homeSurfaceRect?.width??null,isCodexHomeAvailable,interactionPassthroughRect:null,presentationScope:"thread"};}
function startRemoteHostedPipAnchorBridge(scale=1){void scale;return{computeLayout:computePipLayout,setCodexHomeAvailable(_available:boolean){},stop(){}};}
function initializePipGeometry():void{}
function initializeRemoteHostedPipBridge():void{}
export{initializePipGeometry as i,startRemoteHostedPipAnchorBridge as n,hostId as r,initializeRemoteHostedPipBridge as t};
