import '@rchunk/rolldown-runtime';
import * as SharedChunk from '@rchunk/app-shared';
import * as InitialChunk from '@rchunk/app-initial';
interface Jsx{jsx(type:unknown,props:Record<string,unknown>,key?:unknown):unknown;jsxs(type:unknown,props:Record<string,unknown>,key?:unknown):unknown}
const jsx=(SharedChunk as unknown as{I3():Jsx}).I3();
function preload(){void import('@rchunk/upgrade-plan-dialog').catch(()=>undefined)}
function GetPlusHeaderButton(props:{onClick?:()=>void;rejoinPlus?:boolean}):unknown{return jsx.jsxs('button',{type:'button','data-header-upgrade':true,onClick:props.onClick,onFocus:preload,onPointerEnter:preload,children:[jsx.jsx('span',{'aria-hidden':true,children:'✦'}),props.rejoinPlus?'Rejoin Plus':'Get Plus']})}
export{GetPlusHeaderButton};
