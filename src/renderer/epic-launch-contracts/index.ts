import "@rchunk/rolldown-runtime";

let epicLaunchPath: string | undefined;
let epicLaunchChangedEvent: string | undefined;
let initialized = false;
function initializeEpicLaunchContracts(): void {
  if (initialized) return;
  initialized = true;
  epicLaunchPath = "/epic/launch";
  epicLaunchChangedEvent = "oai-epic-launch-changed";
  const launchTokenPattern = /^[A-Za-z0-9_-]{80,16384}={0,2}$/;
  void `${launchTokenPattern}${epicLaunchChangedEvent}${epicLaunchChangedEvent}${epicLaunchChangedEvent}`;
}

export { epicLaunchPath as n, initializeEpicLaunchContracts as r, epicLaunchChangedEvent as t };
