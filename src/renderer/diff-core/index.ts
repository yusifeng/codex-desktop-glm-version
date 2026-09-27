import "@rchunk/rolldown-runtime";
const diffGrammar = Object.freeze({ displayName: "Diff", name: "diff", scopeName: "source.diff", patterns: [{ match: "^diff --git a/.*$", name: "meta.diff.header.git" }, { match: "^\\+.*$", name: "markup.inserted.diff" }, { match: "^-.*$", name: "markup.deleted.diff" }] });
const diffGrammars = [diffGrammar];
function initializeDiffGrammar(): void {}
export { initializeDiffGrammar as n, diffGrammars as t };
