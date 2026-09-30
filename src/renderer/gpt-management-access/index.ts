import '@rchunk/rolldown-runtime';
import * as SharedChunk from '@rchunk/app-shared';
import * as InitialChunk from '@rchunk/app-initial';
const workspacePlans=new Set(['business','enterprise_cbp_usage_based','enterprise_cbp_automation','hc','finserv','ent26','enterprise','education','edu_plus','edu_pro','edu','k12','quorum']);
let accountAccessQuery:unknown;
function initializeQuery(){accountAccessQuery={queryKey:(accountId:string)=>['accounts','check','v4-2023-04-27',accountId],select:(response:{accounts:Record<string,unknown>},accountId:string)=>response.accounts[accountId]};return accountAccessQuery}
function GptManagementAccess(props:{children?:unknown;loadingFallback?:unknown;unavailableFallback?:unknown;account?:{structure?:string;plan_type?:string;account_id?:string};entitlement?:{has_active_subscription?:boolean};permissions?:string[];loading?:boolean;error?:boolean;featureEnabled?:boolean}):unknown{if(props.error)return props.unavailableFallback??null;if(props.loading)return props.loadingFallback??null;const plan=props.account?.plan_type??'free',subscribed=props.entitlement?.has_active_subscription===true||workspacePlans.has(plan)||plan==='free_workspace',workspaceAllowed=props.account?.structure!=='workspace'||props.featureEnabled!==true||props.permissions?.includes('chatgpt.workspace.gpt.crud')===true;return subscribed&&workspaceAllowed?(props.children??null):(props.unavailableFallback??null)}
function initialize(){void SharedChunk;void InitialChunk;initializeQuery()}
initialize();
export{initializeQuery as i,initialize as n,accountAccessQuery as r,GptManagementAccess as t};
