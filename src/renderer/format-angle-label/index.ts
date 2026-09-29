import "@rchunk/rolldown-runtime";

const GREEK_ANGLE_LABELS: Readonly<Record<string, string>> = {
  "\\theta": "θ", "\\Theta": "Θ", "\\alpha": "α", "\\Alpha": "Α",
  "\\beta": "β", "\\Beta": "Β", "\\phi": "φ", "\\varphi": "φ", "\\gamma": "γ",
};

function formatAngleLabel(value: string): string {
  const match = value.match(/^(?<base>\\[A-Za-z]+)(?<suffix>_[\p{L}0-9]+)$/u);
  if (match?.groups?.base && match.groups.suffix) {
    const translated = GREEK_ANGLE_LABELS[match.groups.base];
    if (translated) return `${translated}${match.groups.suffix}`;
  }
  return GREEK_ANGLE_LABELS[value] ?? value;
}

function initializeFormatAngleLabel(): void {}

export { initializeFormatAngleLabel as n, formatAngleLabel as t };
