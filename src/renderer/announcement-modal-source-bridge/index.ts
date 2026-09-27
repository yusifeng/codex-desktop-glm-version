import {
  $3 as reactCompilerRuntime,
  FX as initializeSignalRuntime,
  I3 as getJsxRuntime,
  LX as useScope,
  QI as initializeScopeRuntime,
  ZI as appScope,
  e6 as getReactRuntime,
} from "@rchunk/app-shared";
import {
  Qp as announcementModalSources,
  em as initializeAnnouncementModalSources,
} from "@rchunk/app-primary";

void reactCompilerRuntime;

export interface AnnouncementModalSourceBridgeProps {
  candidate: unknown;
  source: string;
}

function AnnouncementModalSourceBridge({
  source,
  candidate,
}: AnnouncementModalSourceBridgeProps): unknown {
  const scope = useScope(appScope);
  const id = getReactRuntime().useId();
  return getJsxRuntime().jsx("span", {
    hidden: true,
    ref: (element: unknown) => {
      scope.set(announcementModalSources, (current: Map<string, unknown>) => {
        const next = new Map(current);
        if (element == null) next.delete(id);
        else next.set(id, { source, candidate });
        return next;
      });
    },
  });
}

function initializeAnnouncementModalSourceBridge(): void {
  initializeSignalRuntime();
  initializeScopeRuntime();
  initializeAnnouncementModalSources();
}

export {
  initializeAnnouncementModalSourceBridge as n,
  AnnouncementModalSourceBridge as t,
};
