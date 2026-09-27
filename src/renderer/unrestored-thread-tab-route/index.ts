// unrestored-thread-tab-route —— 持久化标签页无法恢复时的可识别回退界面。
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
void runtimeChunk;

const {
  $3: initializeRuntimeLazy,
  I3: getJsxRuntime,
  K2: initializeSharedUi,
  Y2: FormattedMessage,
  Yh: Button,
  Zh: initializeButton,
} = appSharedChunk;
const { Aet: initializeEmptyState, ket: EmptyState } = appInitialChunk;
const {
  Jp: UnrestoredTabIllustration,
  Yp: initializeUnrestoredTabIllustration,
} = appPrimaryChunk;

interface UnrestoredThreadTabRouteProps {
  onClose(): void;
  routeKind: string;
  routeResourceLabel?: string | null;
}

let jsx: import("@rchunk/app-shared").JsxRuntime;

function UnrestoredThreadTabRoute({
  onClose,
  routeKind,
  routeResourceLabel,
}: UnrestoredThreadTabRouteProps): unknown {
  const actions = jsx.jsx(Button, {
    color: "secondary",
    onClick: onClose,
    children: jsx.jsx(FormattedMessage, {
      id: "threadTabRoute.unrestored.dismiss",
      defaultMessage: "Dismiss",
      description:
        "Button label that dismisses a tab which could not be restored",
    }),
  });
  const description =
    routeResourceLabel == null
      ? jsx.jsx(FormattedMessage, {
          id: "threadTabRoute.unrestored.routeKind",
          defaultMessage: "Saved tab type: {routeKind}",
          description:
            "Description identifying the type of a persisted tab that could not be restored",
          values: { routeKind },
        })
      : jsx.jsx(FormattedMessage, {
          id: "threadTabRoute.unrestored.routeResource",
          defaultMessage: "Saved tab: {routeKind} — {routeResource}",
          description:
            "Description identifying the type and resource of a persisted tab that could not be restored",
          values: { routeKind, routeResource: routeResourceLabel },
        });

  return jsx.jsx(EmptyState, {
    className: "h-full",
    actions,
    description,
    illustration: jsx.jsx(UnrestoredTabIllustration, {}),
    illustrationSize: "icon",
    title: jsx.jsx(FormattedMessage, {
      id: "threadTabRoute.unrestored.title",
      defaultMessage: "This tab couldn’t be restored",
      description: "Title shown when a persisted tab cannot be restored",
    }),
  });
}

function initializeUnrestoredThreadTabRoute(): void {
  initializeRuntimeLazy();
  initializeSharedUi();
  initializeButton();
  initializeEmptyState();
  initializeUnrestoredTabIllustration();
  jsx = getJsxRuntime();
}

initializeUnrestoredThreadTabRoute();
export { UnrestoredThreadTabRoute };
