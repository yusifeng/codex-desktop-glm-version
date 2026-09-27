import "@rchunk/app-shared";import "@rchunk/app-initial";import "@rchunk/app-primary";import "@rchunk/requested-plugin-connection";
interface Scope{get<T>(signal:unknown):T;query?:{fetch(signal:unknown,input:unknown):Promise<{summary:{installed:boolean;enabled:boolean;disabledReason?:unknown;availability?:string}}>}}
async function prepare(scope:Scope,signal:AbortSignal,options?:{hostId?:string}):Promise<{pluginId:string;setupStarted:boolean}|null>{if(signal.aborted)return null;const account=scope.get<string|null>("hosted-account");if(account==null)return null;const pluginId="plugin-creator";if(signal.aborted)return null;return{pluginId,setupStarted:options?.hostId!=null}}
const initialize=():void=>{};export{prepare as n,initialize as t};
