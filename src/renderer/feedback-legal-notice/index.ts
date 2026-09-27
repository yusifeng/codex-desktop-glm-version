import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";import "@rchunk/app-initial";
let jsx:JsxRuntime;function ensureJsx():JsxRuntime{if(jsx==null)jsx=getJsxRuntime();return jsx;}
function FeedbackLegalNotice():unknown{const runtime=ensureJsx();return runtime.jsxs("p",{className:"feedback-legal-notice",children:["Your feedback can be used to improve ChatGPT. ",runtime.jsx("a",{href:"https://help.openai.com/en/articles/5722486-how-your-data-is-used-to-improve-model-performance",target:"_blank",rel:"noreferrer",children:"Learn more"}),"."]});}
const initializeFeedbackLegalNotice=():void=>{jsx=getJsxRuntime();};export{initializeFeedbackLegalNotice as n,FeedbackLegalNotice as t};
