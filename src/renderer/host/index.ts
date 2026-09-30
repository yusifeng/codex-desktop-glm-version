import '@rchunk/rolldown-runtime';
import * as SharedChunk from '@rchunk/app-shared';
import * as InitialChunk from '@rchunk/app-initial';
interface Jsx{jsx(type:unknown,props:Record<string,unknown>,key?:unknown):unknown}
const jsx=(SharedChunk as unknown as{I3():Jsx}).I3();
const announcementId='oai/apps/pepperOnboarding';
function PepperOnboardingAnnouncementHost(props:{children:(candidate:null|{id:string;render:(close:()=>void)=>unknown})=>unknown;accountId?:string|null;eligibleAnnouncements?:string[];dismissedAccountIds?:Set<string>}):unknown{void InitialChunk;const eligible=props.accountId!=null&&props.eligibleAnnouncements?.includes(announcementId)&&!props.dismissedAccountIds?.has(props.accountId);if(!eligible)return props.children(null);const accountId=props.accountId as string;return props.children({id:announcementId,render:(close)=>jsx.jsx(LazyModal,{accountId,onClose:close},accountId)})}
function LazyModal(props:Record<string,unknown>):unknown{return jsx.jsx('div',{'data-pepper-onboarding':true,...props})}
function preload(){void import('@rchunk/pepper-onboarding-modal')}
preload();
export{PepperOnboardingAnnouncementHost};
