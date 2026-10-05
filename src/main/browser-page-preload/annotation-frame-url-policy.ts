function matchesAnnotationFrameUrl(expected: string | null | undefined, frameWindow: { location: { href: string } }): boolean { return expected == null || frameWindow.location.href === expected; }
export { matchesAnnotationFrameUrl };
if (typeof module !== `undefined`) module.exports = { matchesAnnotationFrameUrl };
