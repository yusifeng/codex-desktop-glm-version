import "@rchunk/rolldown-runtime";
import {
  $3 as getCompilerRuntime,
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

interface CompilerRuntime {
  c(size: number): unknown[];
}

let compilerRuntime: CompilerRuntime;
let jsx: ReturnType<typeof getJsxRuntime>;

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
  const cache = compilerRuntime.c(23);
  useSignalValue(null);
  if (resource.activities.includes("provided")) {
    if (cache[1] !== className) {
      cache[1] = className;
      cache[2] = jsx.jsx(ProvidedResourceIcon, { "aria-hidden": true, className });
    }
    return cache[2];
  }

  let driveKind: unknown;
  if (cache[3] !== resource.mimeType || cache[4] !== resource.url) {
    driveKind = getGoogleDriveResourceKindFromMimeType(resource.mimeType) ??
      getGoogleDriveResourceKindFromUrl(resource.url);
    cache[3] = resource.mimeType;
    cache[4] = resource.url;
    cache[5] = driveKind;
  } else {
    driveKind = cache[5];
  }
  if (driveKind != null) {
    if (cache[6] !== className || cache[7] !== driveKind) {
      cache[6] = className;
      cache[7] = driveKind;
      cache[8] = jsx.jsx(GoogleDriveResourceIcon, { className, resourceKind: driveKind });
    }
    return cache[8];
  }

  const provider = resource.provider;
  if (provider == null) {
    if (cache[9] !== className || cache[10] !== resource.url) {
      cache[9] = className;
      cache[10] = resource.url;
      cache[11] = jsx.jsx(LinkIcon, { className, href: resource.url });
    }
    return cache[11];
  }
  let fallback: unknown;
  if (cache[12] !== className || cache[13] !== resource.url) {
    fallback = jsx.jsx(LinkIcon, { className, href: resource.url });
    cache[12] = className;
    cache[13] = resource.url;
    cache[14] = fallback;
  } else {
    fallback = cache[14];
  }
  let knownAppId: string | null;
  if (cache[15] !== provider) {
    knownAppId = findKnownAppId(provider);
    cache[15] = provider;
    cache[16] = knownAppId;
  } else {
    knownAppId = cache[16] as string | null;
  }
  if (
    cache[17] !== className ||
    cache[18] !== provider.logoUrl ||
    cache[19] !== provider.logoUrlDark ||
    cache[20] !== fallback ||
    cache[21] !== knownAppId
  ) {
    cache[17] = className;
    cache[18] = provider.logoUrl;
    cache[19] = provider.logoUrlDark;
    cache[20] = fallback;
    cache[21] = knownAppId;
    cache[22] = jsx.jsx(AppLogo, {
      alt: "",
      className,
      fallback,
      knownAppId,
      logoDarkUrl: provider.logoUrlDark,
      logoUrl: provider.logoUrl,
    });
  }
  return cache[22];
}

function initializeLocalConversationExternalResourceIcon(): void {
  compilerRuntime = getCompilerRuntime() as unknown as CompilerRuntime;
  initializeSignalRuntime();
  initializeAppLogo();
  initializeLinkIcon();
  initializeBrowserIcons();
  initializeExternalResourceIcons();
  initializeGoogleDriveResourceIcon();
  initializeExternalResourceProviderIds();
  jsx = getJsxRuntime();
}

export {
  initializeExternalResourceProviderIds as i,
  initializeLocalConversationExternalResourceIcon as n,
  findKnownAppId as r,
  LocalConversationExternalResourceIcon as t,
};
