type ThemeWindow = { matchMedia?: (query: string) => { matches: boolean } };
/** Resolves the stable light/dark annotation theme variant. */
function resolveAnnotationThemeVariant(windowLike: ThemeWindow): `dark` | `light` {
  return windowLike.matchMedia?.(`(prefers-color-scheme: dark)`)?.matches ? `dark` : `light`;
}
export { resolveAnnotationThemeVariant };
if (typeof module !== `undefined`) module.exports = { resolveAnnotationThemeVariant };
