import '@rchunk/rolldown-runtime';
import * as SharedChunk from '@rchunk/app-shared';
import * as InitialChunk from '@rchunk/app-initial';
import * as VoiceMotionChunk from '@rchunk/realtime-voice-motion';
import * as ContentChunk from '@rchunk/content';
import * as VoiceAnalyticsChunk from '@rchunk/chatgpt-voice-analytics-protobuf';
import * as CommentaryChunk from '@rchunk/commentary';
interface Jsx{jsx(type:unknown,props:Record<string,unknown>,key?:unknown):unknown;jsxs(type:unknown,props:Record<string,unknown>,key?:unknown):unknown}
const jsx=(SharedChunk as unknown as{I3():Jsx}).I3();void InitialChunk;void VoiceMotionChunk;void ContentChunk;void VoiceAnalyticsChunk;void CommentaryChunk;
type Content={type:'legacy-text';text:string}|{type:'cot-v5-progress';progress:{id:string;texts:string[]}}|{type:'memory-saved'};
function VoiceCommentaryMessage(props:{message?:{spawnId:string|number;content:Content}|null;memoryUpdate?:unknown}):unknown{const message=props.message??null;const content=message?.content;const text=content?.type==='legacy-text'?content.text:content?.type==='cot-v5-progress'?(content.progress.texts[0]??'Thinking'):null;const visible=text!=null||props.memoryUpdate!=null;return jsx.jsxs('div',{'aria-atomic':'true','aria-live':'polite','data-testid':'voice-commentary-message',role:'status',className:visible?'h-10':'h-0',children:[text==null?null:jsx.jsx('button',{type:'button',children:jsx.jsx('span',{className:'loading-shimmer-pure-text',children:text})}),props.memoryUpdate==null?null:jsx.jsx('div',{'data-memory-update':true,children:'Memory updated'})]})}
export{VoiceCommentaryMessage};
