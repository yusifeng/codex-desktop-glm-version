import "@rchunk/rolldown-runtime";
import {
  $3 as initializeCompilerCache,
  FX as initializeSignalRuntime,
  HX as useSignalValue,
  I3 as getJsxRuntime,
  lw as initializeBrowserIcons,
} from "@rchunk/app-shared";
import {
  $4t as initializeKnownAppIds,
  Dlt as AppLogo,
  L9t as getGoogleDriveResourceKindFromMimeType,
  Olt as initializeAppLogo,
  X4t as getKnownAppId,
  _Z as initializeExternalResourceIcons,
  gZ as ProvidedResourceIcon,
  n0 as initializeLinkIcon,
  t0 as LinkIcon,
  z9t as getGoogleDriveResourceKindFromUrl,
} from "@rchunk/app-initial";
import {
  n as initializeGoogleDriveResourceIcon,
  t as GoogleDriveResourceIcon,
} from "@rchunk/google-drive-resource-icon";

export interface ExternalResourceProvider {
  id: string;
  logoUrl?: string;
  logoUrlDark?: string;
  name: string;
  pluginDisplayNames: string[];
}

export interface ExternalResource {
  activities: string[];
  mimeType?: string | null;
  provider?: ExternalResourceProvider | null;
  url: string;
}

export interface LocalConversationExternalResourceIconProps {
  className?: string;
  resource: ExternalResource;
}

function findKnownAppId(provider: ExternalResourceProvider): string | null {
  for (const candidate of [provider.id, provider.name, ...provider.pluginDisplayNames]) {
    if (getKnownAppId(candidate) != null) return candidate;
  }
  return null;
}

function initializeExternalResourceProviderIds(): void {
  initializeKnownAppIds();
}

function LocalConversationExternalResourceIcon({
  className = "icon-sm",
  resource,
}: LocalConversationExternalResourceIconProps): unknown {
  useSignalValue(null);
  const jsx = getJsxRuntime();
  if (resource.activities.includes("provided")) {
    return jsx.jsx(ProvidedResourceIcon, { "aria-hidden": true, className });
  }

  const driveKind =
    getGoogleDriveResourceKindFromMimeType(resource.mimeType) ??
    getGoogleDriveResourceKindFromUrl(resource.url);
  if (driveKind != null) {
    return jsx.jsx(GoogleDriveResourceIcon, {
      className,
      resourceKind: driveKind,
    });
  }

  const fallback = jsx.jsx(LinkIcon, { className, href: resource.url });
  const provider = resource.provider;
  if (provider == null) return fallback;
  return jsx.jsx(AppLogo, {
    alt: "",
    className,
    fallback,
    knownAppId: findKnownAppId(provider),
    logoDarkUrl: provider.logoUrlDark,
    logoUrl: provider.logoUrl,
  });
}

function initializeLocalConversationExternalResourceIcon(): void {
  initializeCompilerCache();
  initializeSignalRuntime();
  initializeAppLogo();
  initializeLinkIcon();
  initializeBrowserIcons();
  initializeExternalResourceIcons();
  initializeGoogleDriveResourceIcon();
  initializeExternalResourceProviderIds();
  getJsxRuntime();
}

export {
  initializeExternalResourceProviderIds as i,
  initializeLocalConversationExternalResourceIcon as n,
  findKnownAppId as r,
  LocalConversationExternalResourceIcon as t,
};
