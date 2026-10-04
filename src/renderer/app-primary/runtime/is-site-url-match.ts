/**
 * Matches a live Appgen site URL against the URL currently being viewed.
 *
 * The app-primary hub used this as a small URL policy next to the site
 * browser registry. Keep the host aliases and trailing-slash semantics here
 * so callers do not need to load the aggregate primary runtime.
 */
let initialized = false;
let teamSuffix = "";
let publicSuffix = "";

function initializeSiteUrlMatcher(): void {
  if (initialized) return;
  teamSuffix = ".chatgpt-team.site";
  publicSuffix = ".chatgpt.site";
  initialized = true;
}

function normalizeHostname(hostname: string): string {
  initializeSiteUrlMatcher();
  return hostname.endsWith(teamSuffix)
    ? `${hostname.slice(0, -teamSuffix.length)}${publicSuffix}`
    : hostname;
}

function normalizePathname(pathname: string): string {
  return pathname.replace(/\/+$/u, "") || "/";
}

function isSiteUrlMatch(currentUrl: string, candidateUrl: string): boolean {
  initializeSiteUrlMatcher();
  try {
    const current = new URL(currentUrl);
    const candidate = new URL(candidateUrl);
    if (
      current.protocol !== candidate.protocol ||
      current.port !== candidate.port ||
      normalizeHostname(current.hostname) !== normalizeHostname(candidate.hostname)
    ) {
      return false;
    }
    const candidatePath = normalizePathname(candidate.pathname);
    const currentPath = normalizePathname(current.pathname);
    return (
      candidatePath === "/" ||
      currentPath === candidatePath ||
      currentPath.startsWith(`${candidatePath}/`)
    );
  } catch {
    return false;
  }
}

export { initializeSiteUrlMatcher, isSiteUrlMatch };
