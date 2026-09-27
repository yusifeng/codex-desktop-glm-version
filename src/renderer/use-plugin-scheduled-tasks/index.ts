import "@rchunk/app-shared";import "@rchunk/app-initial";
export interface ScheduledTaskOptions{buildFlavor:string;codexHome?:string|null;isOpenAICuratedRemoteMarketplaceEnabled:boolean;workspaceRoots?:string[]}
function usePluginScheduledTasks(input:{hostId:string;capable?:boolean;enabled?:boolean;tasks?:unknown[]}):unknown[]|undefined{return input.capable!==false&&input.enabled!==false&&input.hostId==="local"?input.tasks:undefined}const initialize=():void=>{};export{usePluginScheduledTasks as n,initialize as t};
