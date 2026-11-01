// appgen-access-state-messages —— Site 访问状态图标与本地化描述符。
// 原版：app/webview/assets/appgen-access-state-messages-ba11f4e596b6.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as lockChunk from "@rchunk/lock";
import * as appgenAccessChunk from "@rchunk/appgen-access";
import * as buildingChunk from "@rchunk/building";
import type {
  AppgenAccessPolicy,
  AppgenAccessSummary,
} from "@rchunk/appgen-access";
import type { JsxRuntime, MessageDescriptor } from "@rchunk/app-shared";

const once = runtimeChunk.n as (initializer: () => void) => () => void;
const {
  $3: initializeReactRuntime,
  A_: PublicIcon,
  G2: defineMessages,
  I3: getJsxRuntime,
  K2: initializeInternationalization,
  e6: initializeReact,
  j_: initializePublicIcon,
} = appSharedChunk;
const { n: initializeLockIcon, t: LockIcon } = lockChunk;
const {
  c: isEmptyRestrictedAccess,
  r: summarizeAccessPolicy,
  s: initializeAppgenAccess,
} = appgenAccessChunk;
const { n: initializeBuildingIcon, t: BuildingIcon } = buildingChunk;

type AccessStateKey =
  | "groups"
  | "owner_only"
  | "people"
  | "people_and_groups"
  | "public"
  | "workspace_all";

interface AccessStateIconProps extends Record<string, unknown> {
  accessPolicy?: AppgenAccessPolicy | null;
  accessState?: AppgenAccessSummary;
}

interface SvgIconProps extends Record<string, unknown> {
  className?: string;
}

let jsx: JsxRuntime;
let PeopleIcon: (props: SvgIconProps) => unknown;
let fullMessages: Record<AccessStateKey, MessageDescriptor>;
let shortMessages: Record<AccessStateKey, MessageDescriptor>;
let siteMessages: Record<AccessStateKey, MessageDescriptor>;

const initializePeopleIcon = once((): void => {
  initializeReact();
  jsx = getJsxRuntime();
  PeopleIcon = (props: SvgIconProps) =>
    jsx.jsx("svg", {
      width: 16,
      height: 13,
      viewBox: "0 0 16 13",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
      ...props,
      children: jsx.jsx("path", {
        d: "M1.19707 11.7413C1.19712 10.5109 1.65242 9.63179 2.30186 9.05449C2.96226 8.46747 3.85986 8.16159 4.77686 8.16152C5.69398 8.16152 6.59225 8.46737 7.25273 9.05449C7.90211 9.63179 8.35747 10.5109 8.35752 11.7413C8.35752 12.0719 8.62551 12.3398 8.95605 12.3398C9.28646 12.3397 9.55459 12.0718 9.55459 11.7413C9.55454 10.1861 8.96474 8.97533 8.04727 8.15977C7.14081 7.35416 5.94889 6.96445 4.77686 6.96445C3.60478 6.96452 2.41287 7.35403 1.50645 8.15977C0.588974 8.97533 5.14984e-05 10.1861 0 11.7413C0 12.0719 0.267993 12.3398 0.598535 12.3398C0.929078 12.3398 1.19707 12.0719 1.19707 11.7413ZM15.8221 11.0452C15.8221 9.44591 15.0886 8.27774 14.0326 7.61045C12.9989 6.95726 11.6905 6.80379 10.5346 7.12969C10.2164 7.2194 10.0309 7.55071 10.1206 7.86885C10.2104 8.18673 10.5409 8.37141 10.8589 8.28193C11.7108 8.04169 12.6661 8.16236 13.3937 8.62207C14.0989 9.06778 14.625 9.85234 14.625 11.0452C14.6251 11.3757 14.893 11.6437 15.2235 11.6437C15.554 11.6437 15.822 11.3757 15.8221 11.0452ZM9.90264 3.38467C9.90264 2.56133 10.5699 1.89318 11.3933 1.89316C12.2166 1.89316 12.8839 2.56132 12.8839 3.38467C12.8837 4.20784 12.2165 4.87529 11.3933 4.87529C10.5701 4.87528 9.90285 4.20783 9.90264 3.38467ZM2.93818 3.03574C2.93836 2.02032 3.76143 1.19723 4.77686 1.19707C5.79241 1.19707 6.61623 2.02022 6.61641 3.03574C6.61641 4.05141 5.79252 4.87529 4.77686 4.87529C3.76133 4.87513 2.93818 4.05131 2.93818 3.03574ZM8.70557 3.38467C8.70578 4.86891 9.90897 6.07235 11.3933 6.07236C12.8776 6.07236 14.0807 4.86892 14.081 3.38467C14.081 1.90023 12.8777 0.696094 11.3933 0.696094C9.90884 0.69611 8.70557 1.90024 8.70557 3.38467ZM1.74111 3.03574C1.74111 4.71239 3.10024 6.0722 4.77686 6.07236C6.45361 6.07236 7.81348 4.71249 7.81348 3.03574C7.8133 1.35914 6.4535 0 4.77686 0C3.10035 0.000159546 1.74129 1.35924 1.74111 3.03574Z",
        fill: "currentColor",
      }),
    });
});

function AccessStateIcon(props: AccessStateIconProps): unknown {
  const { accessPolicy, accessState, ...iconProps } = props;
  const state = accessState ?? summarizeAccessPolicy(accessPolicy);
  switch (state.accessMode) {
    case "admins_only":
    case "custom":
      return jsx.jsx(
        isEmptyRestrictedAccess(state) ? LockIcon : PeopleIcon,
        iconProps,
      );
    case "workspace_all":
      return jsx.jsx(BuildingIcon, iconProps);
    case "public":
      return jsx.jsx(PublicIcon, iconProps);
  }
}

function accessStateKey(
  state: AppgenAccessSummary,
): AccessStateKey | undefined {
  if (isEmptyRestrictedAccess(state)) return "owner_only";
  const { accessMode, groupCount, userCount } = state;
  switch (accessMode) {
    case "admins_only":
    case "custom":
      return userCount > 0 && groupCount > 0
        ? "people_and_groups"
        : userCount > 0
          ? "people"
          : groupCount > 0
            ? "groups"
            : "people";
    case "public":
    case "workspace_all":
      return accessMode;
  }
}

function fullAccessMessage(
  state: AppgenAccessSummary,
): MessageDescriptor | undefined {
  const key = accessStateKey(state);
  return key == null ? undefined : fullMessages[key];
}

function shortAccessMessage(
  state: AppgenAccessSummary,
): MessageDescriptor | undefined {
  const key = accessStateKey(state);
  return key == null ? undefined : shortMessages[key];
}

function siteAccessMessage(
  state: AppgenAccessSummary,
): MessageDescriptor | undefined {
  const key = accessStateKey(state);
  return key == null ? undefined : siteMessages[key];
}

const initializeAccessStateIcon = once((): void => {
  initializeReactRuntime();
  initializeBuildingIcon();
  initializePublicIcon();
  initializeLockIcon();
  initializePeopleIcon();
  initializeAppgenAccess();
  jsx = getJsxRuntime();
});

const initializeAccessStateMessages = once((): void => {
  initializeInternationalization();
  initializeAppgenAccess();
  fullMessages = defineMessages({
    groups: {
      id: "appgenAccess.state.visibleToGroups",
      defaultMessage:
        "Visible to {groupCount, plural, one {# group} other {# groups}}",
      description: "Label for a site shared with one or more groups",
    },
    owner_only: {
      id: "appgenAccess.state.onlyVisibleToYou",
      defaultMessage: "Only visible to you",
      description: "Label for a site whose access is limited to its owner",
    },
    people: {
      id: "appgenAccess.state.visibleToPeople",
      defaultMessage:
        "Visible to {userCount, plural, one {# person} other {# people}}",
      description: "Label for a site shared with one or more people",
    },
    people_and_groups: {
      id: "appgenAccess.state.visibleToPeopleAndGroups",
      defaultMessage: "Visible to people and groups",
      description: "Label for a site shared with both people and groups",
    },
    public: {
      id: "appgenAccess.state.visibleToEveryone",
      defaultMessage: "Visible to everyone",
      description: "Label for a site shared publicly on the internet",
    },
    workspace_all: {
      id: "appgenAccess.state.visibleToWorkspace",
      defaultMessage: "Visible to your workspace",
      description: "Label for a site shared with anyone in the workspace",
    },
  });
  shortMessages = defineMessages({
    groups: {
      id: "appgenAccess.shortState.groups",
      defaultMessage: "{groupCount, plural, one {# group} other {# groups}}",
      description: "Concise label for a site shared with one or more groups",
    },
    owner_only: {
      id: "appgenAccess.shortState.ownerOnly",
      defaultMessage: "Only you",
      description:
        "Concise label for a site whose access is limited to its owner",
    },
    people: {
      id: "appgenAccess.shortState.people",
      defaultMessage: "{userCount, plural, one {# person} other {# people}}",
      description: "Concise label for a site shared with one or more people",
    },
    people_and_groups: {
      id: "appgenAccess.shortState.peopleAndGroups",
      defaultMessage: "People and groups",
      description:
        "Concise label for a site shared with both people and groups",
    },
    public: {
      id: "appgenAccess.shortState.public",
      defaultMessage: "Everyone",
      description: "Concise label for a site shared publicly on the internet",
    },
    workspace_all: {
      id: "appgenAccess.shortState.workspace",
      defaultMessage: "Your workspace",
      description:
        "Concise label for a site shared with anyone in the workspace",
    },
  });
  siteMessages = defineMessages({
    groups: {
      id: "appgenAccess.siteState.visibleToGroups",
      defaultMessage:
        "This site is visible to {groupCount, plural, one {# group} other {# groups}}",
      description: "Tooltip for a site link shared with one or more groups",
    },
    owner_only: {
      id: "appgenAccess.siteState.onlyVisibleToYou",
      defaultMessage: "This site is only visible to you",
      description:
        "Tooltip for a site link whose access is limited to its owner",
    },
    people: {
      id: "appgenAccess.siteState.visibleToPeople",
      defaultMessage:
        "This site is visible to {userCount, plural, one {# person} other {# people}}",
      description: "Tooltip for a site link shared with one or more people",
    },
    people_and_groups: {
      id: "appgenAccess.siteState.visibleToPeopleAndGroups",
      defaultMessage: "This site is visible to people and groups",
      description: "Tooltip for a site link shared with both people and groups",
    },
    public: {
      id: "appgenAccess.siteState.visibleToEveryone",
      defaultMessage: "This site is visible to everyone",
      description: "Tooltip for a site link shared publicly on the internet",
    },
    workspace_all: {
      id: "appgenAccess.siteState.visibleToWorkspace",
      defaultMessage: "This site is visible to your workspace",
      description:
        "Tooltip for a site link shared with anyone in the workspace",
    },
  });
});

export {
  AccessStateIcon as a,
  initializeAccessStateMessages as i,
  shortAccessMessage as n,
  initializeAccessStateIcon as o,
  siteAccessMessage as r,
  fullAccessMessage as t,
};
