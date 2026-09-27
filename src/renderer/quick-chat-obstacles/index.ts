import * as appSharedChunk from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/rolldown-runtime";
import type { JsxRuntime } from "@rchunk/app-shared";
type Placement = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "bottom-center" | null;
interface Size { height: number; width: number; }
interface Rect extends Size { left: number; top: number; }
const { I3: jsxExport } = appSharedChunk as unknown as { I3: JsxRuntime | (() => JsxRuntime) };
let jsx: JsxRuntime; const observers = new Set<() => void>();
function positionForPlacement(placement: Placement, size: Size, viewportHeight: number, viewportWidth: number, insetWidth = 0, topInset = 0) { const inset=16-insetWidth/2; let x=placement?.endsWith("left")?inset:viewportWidth-size.width-inset; if(placement==="bottom-center"||placement==null)x=Math.round((viewportWidth-size.width)/2); return {x,y:placement?.startsWith("top")?topInset+inset:viewportHeight-size.height-inset}; }
function placementForRect(rect: Rect, viewportHeight: number, viewportWidth: number): Placement { const cx=rect.left+rect.width/2, cy=rect.top+rect.height/2; if(cy>=viewportHeight/2&&cx>=viewportWidth/4&&cx<=viewportWidth*3/4)return "bottom-center"; return `${cy<viewportHeight/2?"top":"bottom"}-${cx<viewportWidth/2?"left":"right"}` as Placement; }
function nearestPlacement(rect: Rect, viewportHeight: number, viewportWidth: number): Placement { const choices:Placement[]=[null,"bottom-left","bottom-right"]; return choices.reduce((best,next)=>{const a=positionForPlacement(best,rect,viewportHeight,viewportWidth),b=positionForPlacement(next,rect,viewportHeight,viewportWidth);const da=(rect.left-a.x)**2+(rect.top-a.y)**2,db=(rect.left-b.x)**2+(rect.top-b.y)**2;return db<da?next:best;}); }
function clampResizeOffset(placement: Placement, edge:"left"|"right", size:Size, offset:number, targetWidth:number, viewportHeight:number, viewportWidth:number, inset=0){const base=positionForPlacement(placement,size,viewportHeight,viewportWidth,inset).x+offset;const desired=edge==="left"?base+size.width-targetWidth:base;const margin=16-inset/2;return Math.min(viewportWidth-targetWidth-margin,Math.max(margin,desired))-positionForPlacement(placement,{...size,width:targetWidth},viewportHeight,viewportWidth,inset).x;}
function registerObstacle(element: HTMLElement | null){if(element==null)return; return ()=>{};}
function obstacleRects(){return typeof document==="undefined"?[]:[...document.querySelectorAll<HTMLElement>("[data-pip-obstacle=\"quick-chat\"]")].map(e=>e.getBoundingClientRect()).filter(r=>r.width>0&&r.height>0);}
function obstacleSignature(){return obstacleRects().map(r=>[r.left,r.top,r.width,r.height].map(Math.round).join(",")).join(";");}
function subscribeObstacles(callback:()=>void){observers.add(callback);return()=>observers.delete(callback);}
function ResizeHandles():unknown{initializeQuickChatObstacles();return jsx.jsx("div",{"data-quick-chat-resize-handles":true});}
function initializeQuickChatObstacles():void{if(jsx==null)jsx=typeof jsxExport==="function"?jsxExport():jsxExport;}
initializeQuickChatObstacles();
export { subscribeObstacles as a, nearestPlacement as c, placementForRect as d, initializeQuickChatObstacles as f, registerObstacle as i, clampResizeOffset as l, obstacleSignature as n, ResizeHandles as o, initializeQuickChatObstacles as r, initializeQuickChatObstacles as s, obstacleRects as t, positionForPlacement as u };
