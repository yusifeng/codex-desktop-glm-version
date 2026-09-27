import "@rchunk/app-initial";
interface PluginSummary{summary:{id:string};apps:Array<{id:string}>;mcpServers:Array<{name?:string;server?:string}>}interface View{appId?:string;pluginId?:string;server?:string}
function findView(plugin:PluginSummary|null,views:View[]):View|null{return plugin==null?null:views.find(view=>view.appId!=null?plugin.apps.some(app=>app.id===view.appId):view.pluginId!=null?view.pluginId===plugin.summary.id:plugin.mcpServers.some(server=>(server.name??server.server)===view.server))??null}const initialize=():void=>{};export{initialize as n,findView as t};
