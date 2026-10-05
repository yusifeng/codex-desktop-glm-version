/** Shared page identity rules for browser annotation anchors and frames. */
function areAnnotationUrlsEquivalent(left: unknown, right: unknown): boolean {
  const leftUrl = parseAnnotationUrl(left);
  const rightUrl = parseAnnotationUrl(right);
  if (leftUrl == null || rightUrl == null) return left === right;
  const isHttp = (protocol: string): boolean => protocol === `http:` || protocol === `https:`;
  if (isHttp(leftUrl.protocol) && isHttp(rightUrl.protocol))
    return leftUrl.origin === rightUrl.origin && leftUrl.pathname === rightUrl.pathname && leftUrl.search === rightUrl.search;
  if (leftUrl.protocol === `file:` && rightUrl.protocol === `file:`)
    return leftUrl.pathname === rightUrl.pathname && leftUrl.search === rightUrl.search;
  return left === right;
}

function getCurrentAnnotationPageUrl(windowLike: { location: { href: string } }): string {
  return windowLike.location.href;
}

export { areAnnotationUrlsEquivalent, getCurrentAnnotationPageUrl, parseAnnotationUrl };
if (typeof module !== `undefined`) module.exports = { areAnnotationUrlsEquivalent, getCurrentAnnotationPageUrl, parseAnnotationUrl };
import { parseAnnotationUrl } from "./annotation-url-parser-policy";
