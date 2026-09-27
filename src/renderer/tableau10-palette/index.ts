import "@rchunk/rolldown-runtime";
function splitHexPalette(value: string): string[] { const count = Math.floor(value.length / 6); return Array.from({ length: count }, (_, index) => `#${value.slice(index * 6, index * 6 + 6)}`); }
const tableau10 = splitHexPalette("4e79a7f28e2ce1575976b7b259a14fedc949af7aa1ff9da79c755fbab0ab");
function initializeColorPaletteRuntime(): void {}
function initializeTableau10(): void {}
export { initializeColorPaletteRuntime as i, initializeTableau10 as n, splitHexPalette as r, tableau10 as t };
