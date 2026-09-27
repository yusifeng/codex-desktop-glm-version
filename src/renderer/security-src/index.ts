import "@rchunk/rolldown-runtime";

export interface SecurityPermissionMessage {
  defaultMessage: string;
  description: string;
  id: string;
}

const identityPermission: SecurityPermissionMessage = {
  id: "signInWithChatGPTConsent.resourcePermission.identity",
  defaultMessage: "Access your basic profile information",
  description:
    "Label for identity permissions requested or granted by a third-party app. Covers the openid, profile, and email OAuth scopes.",
};
const permissionTitles: Record<string, SecurityPermissionMessage> = {
  openid: identityPermission,
  profile: identityPermission,
  email: identityPermission,
  "resource.invoke": {
    id: "signInWithChatGPTConsent.resourcePermission.resourceInvoke",
    defaultMessage: "Resource actions",
    description: "Label for permission to invoke an OAuth resource, requested or granted by a third-party app.",
  },
  "chatgpt.plugins.invoke": {
    id: "signInWithChatGPTConsent.resourcePermission.chatgptPlugins",
    defaultMessage: "Use the apps you’ve connected to ChatGPT",
    description: "Label for permission to invoke the user's connected ChatGPT apps, requested or granted by a third-party app.",
  },
  "chatpass.enable.request": {
    id: "signInWithChatGPTConsent.resourcePermission.chatgptAllowance",
    defaultMessage: "Use your ChatGPT plan",
    description: "Label explaining that a third-party app can consume the user's ChatGPT plan allowance for API requests.",
  },
  "ads.admin.all.read": {
    id: "signInWithChatGPTConsent.resourcePermission.adsRead",
    defaultMessage: "View Ads Manager data",
    description: "Label for read access to Ads Manager data requested or granted by a third-party app.",
  },
  "ads.admin.all.write": {
    id: "signInWithChatGPTConsent.resourcePermission.adsWrite",
    defaultMessage: "Manage Ads Manager data",
    description: "Label for write access to Ads Manager data requested or granted by a third-party app.",
  },
  offline_access: {
    id: "signInWithChatGPTConsent.resourcePermission.offlineAccess",
    defaultMessage: "Offline Access",
    description: "Label for offline access requested or granted by a third-party app.",
  },
};
for (const alias of [
  "chatgpt.tokens.use.obo",
  "chatpass.enable.request.direct",
  "chatgpt.tokens.use.direct",
]) {
  permissionTitles[alias] = permissionTitles["chatpass.enable.request"];
}

const identityDescription: SecurityPermissionMessage = {
  id: "signInWithChatGPTConsent.resourcePermission.identity.description",
  defaultMessage: "Basic information including your name, email, and profile picture.",
  description:
    "Description beneath the shared identity permission title in SIWC consent and linked-app settings. The openid, profile, and email scopes share this one description.",
};
const permissionDescriptions: Record<string, SecurityPermissionMessage | undefined> = {
  openid: identityDescription,
  profile: identityDescription,
  email: identityDescription,
  "resource.invoke": undefined,
  "chatgpt.plugins.invoke": {
    id: "signInWithChatGPTConsent.resourcePermission.chatgptPlugins.description",
    defaultMessage: "{appName} will be able to use apps you’ve connected to ChatGPT to work on your requests.",
    description: "Description beneath the connected-app permission title in SIWC consent and linked-app settings.",
  },
  "chatpass.enable.request": {
    id: "oauthConsentChoices.tokensAndCredits",
    defaultMessage: "Complete your AI requests in {appName} with usage included in your ChatGPT plan or credits balance.",
    description: "Description beneath the ChatPass permission title in SIWC consent and linked-app settings.",
  },
  "ads.admin.all.read": undefined,
  "ads.admin.all.write": undefined,
  offline_access: {
    id: "signInWithChatGPTConsent.adsOfflineDescription",
    defaultMessage: "Keep this connection active when you’re not using the app.",
    description: "Description beneath the offline-access permission title in SIWC consent and linked-app settings.",
  },
};
for (const alias of [
  "chatgpt.tokens.use.obo",
  "chatpass.enable.request.direct",
  "chatgpt.tokens.use.direct",
]) {
  permissionDescriptions[alias] = permissionDescriptions["chatpass.enable.request"];
}

function getPermissionTitle(scope: string): SecurityPermissionMessage | undefined {
  return permissionTitles[scope];
}

function getPermissionDescription(scope: string): SecurityPermissionMessage | undefined {
  return permissionDescriptions[scope];
}

function initializeSecurityPermissionMessages(): void {}
function initializeSecurityPermissionDescriptions(): void {}
function initializeSecurityPermissions(): void {}

export {
  getPermissionTitle as a,
  getPermissionDescription as i,
  permissionDescriptions as n,
  initializeSecurityPermissionMessages as o,
  permissionTitles as r,
  initializeSecurityPermissions as t,
};
