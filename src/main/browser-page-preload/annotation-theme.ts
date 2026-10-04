type ThemeWindow = { matchMedia?: (query: string) => { matches: boolean } };

function resolveAnnotationThemeVariant(windowLike: ThemeWindow): `dark` | `light` {
  return windowLike.matchMedia?.(`(prefers-color-scheme: dark)`)?.matches ? `dark` : `light`;
}

export { resolveAnnotationThemeVariant };
if (typeof module !== `undefined`) module.exports = { resolveAnnotationThemeVariant };
