import '@rchunk/rolldown-runtime';
import * as SharedChunk from '@rchunk/app-shared';
type Props=Record<string,unknown>&{title?:string;style?:Record<string,unknown>};
interface Jsx{jsx(type:unknown,props:Record<string,unknown>,key?:unknown):unknown}
let jsx:Jsx;
const cylinder={viewBoxWidth:161,strokeInset:.5,centerX:80.5,radiusX:80,capRadiusY:20,topCenterY:20,defaultBodyHeight:160};
const cone={viewBoxWidth:160,assetViewBox:{width:161,height:191},strokeInset:.5,apex:{x:80,y:0},defaultBodyHeight:170,base:{radiusY:20}};
const cube={viewBoxSize:160,frontFace:{leftX:0,rightX:120,bottomY:160}};
function coneLayout(height:number){const baseCenterY=cone.apex.y+height;return{baseCenterY,viewBoxHeight:baseCenterY+cone.base.radiusY}}
function cylinderLayout(height:number){const bottomCenterY=cylinder.topCenterY+height;return{bottomCenterY,topFaceBottomY:cylinder.topCenterY+cylinder.capRadiusY,viewBoxHeight:bottomCenterY+cylinder.capRadiusY+cylinder.strokeInset*2}}
function cylinderInnerHeight(height:number){return Math.max(0,height-cylinder.capRadiusY*2-cylinder.strokeInset*2)}
function cylinderShellPath(height:number){const left=cylinder.centerX-cylinder.radiusX,right=cylinder.centerX+cylinder.radiusX,bottom=cylinder.topCenterY+height,capBottom=bottom+cylinder.capRadiusY;return 'M '+left+' '+cylinder.topCenterY+'V'+bottom+'C'+left+' '+(bottom+11.046)+' 36.3172 '+capBottom+' '+cylinder.centerX+' '+capBottom+'C124.683 '+capBottom+' '+right+' '+(bottom+11.046)+' '+right+' '+bottom+'V'+cylinder.topCenterY+'Z'}
function ShapeSvg(props:Props&{viewBox:string;markup:string}){const hidden=props.title==null&&props['aria-label']==null;return jsx.jsx('svg',{...props,viewBox:props.viewBox,fill:'none',role:hidden?undefined:'img','aria-hidden':hidden?true:undefined,children:jsx.jsx('g',{dangerouslySetInnerHTML:{__html:(props.title?'<title>'+String(props.title).replaceAll('&','&amp;').replaceAll('<','&lt;')+'</title>':'')+props.markup}})})}
function Cube(props:Props){return ShapeSvg({...props,viewBox:'0 0 160 160',markup:'<path d="M160 0V120L120 160H0V40L40 0H160Z" fill="var(--geometry-shape-fill-highlight)" stroke="var(--geometry-shape-stroke)"/>'})}
function Cone(props:Props&{coneBodyHeight?:number}){const height=Number.isFinite(props.coneBodyHeight)?Math.max(0,props.coneBodyHeight as number):cone.defaultBodyHeight;const layout=coneLayout(height);return ShapeSvg({...props,viewBox:'0 0 160 '+layout.viewBoxHeight,markup:'<path d="M80 0L160 '+layout.baseCenterY+'L0 '+layout.baseCenterY+'Z" fill="var(--geometry-shape-fill-highlight)" stroke="var(--geometry-shape-stroke)"/><ellipse cx="80" cy="'+layout.baseCenterY+'" rx="80" ry="20"/>'})}
function Cylinder(props:Props&{cylinderBodyHeight?:number;shellFillOpacity?:number}){const height=Number.isFinite(props.cylinderBodyHeight)?Math.max(0,props.cylinderBodyHeight as number):cylinder.defaultBodyHeight;const layout=cylinderLayout(height);return ShapeSvg({...props,viewBox:'0 0 161 '+layout.viewBoxHeight,markup:'<path d="'+cylinderShellPath(height)+'" fill="var(--geometry-shape-fill-shade)" fill-opacity="'+(props.shellFillOpacity??1)+'"/><ellipse cx="80.5" cy="20" rx="80" ry="20"/>'})}
function Sphere(props:Props){return ShapeSvg({...props,viewBox:'0 0 176 176',markup:'<circle cx="88" cy="88" r="87.5" fill="var(--geometry-shape-fill-highlight)" stroke="var(--geometry-shape-stroke)"/>'})}
function initialize(){jsx=(SharedChunk as unknown as{I3():Jsx}).I3()}
initialize();
export{initialize as a,cylinder as c,cylinderLayout as d,cylinderShellPath as f,Sphere as i,coneLayout as l,Cube as n,cone as o,initialize as p,Cylinder as r,cube as s,Cone as t,cylinderInnerHeight as u};
