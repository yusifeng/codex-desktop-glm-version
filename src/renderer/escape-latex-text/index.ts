// LaTeX text escaping helpers. Release chunk: escape-latex-text-77b4ee5f398b.js.
import "@rchunk/rolldown-runtime";

const latexSpecialCharacters = /[\\{}$&#_%^~]/g;
const latexEscapes: Readonly<Record<string, string>> = {
  "\\": "\\textbackslash{}",
  "{": "\\{",
  "}": "\\}",
  $: "\\$",
  "&": "\\&",
  "#": "\\#",
  _: "\\_",
  "%": "\\%",
  "^": "\\textasciicircum{}",
  "~": "\\textasciitilde{}",
};

let wrapLatexText: (text: string) => string;

function n(): void {
  const escapeLatexText = (text: string): string =>
    text.replace(
      latexSpecialCharacters,
      (character) => latexEscapes[character] ?? character,
    );
  wrapLatexText ??= (text) => "\\text{" + escapeLatexText(text) + "}";
}

export { n, wrapLatexText as t };
