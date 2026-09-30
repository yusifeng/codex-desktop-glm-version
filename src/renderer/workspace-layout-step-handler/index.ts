import '@rchunk/rolldown-runtime';
import * as SharedChunk from '@rchunk/app-shared';
import * as InitialChunk from '@rchunk/app-initial';
import * as PanelVisibilityChunk from '@rchunk/panel-visibility';
import * as ViewControlLabelsChunk from '@rchunk/view-control-labels';
function stepWorkspaceLayout(scope:{get<T>(key:unknown,parameter?:unknown):T},keys:{capability:unknown;workspaceTab:unknown;closeTabs():void;toggleBrowser():void}):'browser'|'tabs'{const capable=scope.get<{isCapable:boolean}>(keys.capability,{name:'browser.in-app'}).isCapable;if(scope.get(keys.workspaceTab)==null){if(capable)keys.toggleBrowser();return'browser'}keys.closeTabs();return'tabs'}
function WorkspaceLayoutStepHandler():null{void SharedChunk;void InitialChunk;void PanelVisibilityChunk;void ViewControlLabelsChunk;return null}
export{WorkspaceLayoutStepHandler};
