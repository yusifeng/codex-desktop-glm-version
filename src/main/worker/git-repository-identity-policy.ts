/** Pure remote URL normalization and repository full-name projection. */

export function buildRepositoryFullName(
  parsed: { host: string; owner: string; repo: string } | null,
  origin: string | null | undefined,
) {
  if (parsed == null) return null;
  const url = origin?.includes(`://`) ? new URL(origin) : null;
  const hostname = parsed.host.toLowerCase();
  const port =
    (url?.port === `22` && (url.protocol === `ssh:` || url.protocol === `git+ssh:` || url.protocol === `ssh+git:`)) ||
    (url?.protocol === `git:` && url.port === `9418`) ? `` : url?.port;
  const path = hostname === `github.com`
    ? `${parsed.owner}/${parsed.repo}`.toLowerCase()
    : `${parsed.owner}/${parsed.repo}`;
  return hostname === `github.com` && !port
    ? path
    : `${hostname}${port ? `:${port}` : ``}/${path}`;
}

if (typeof module !== `undefined`) module.exports = { buildRepositoryFullName };
