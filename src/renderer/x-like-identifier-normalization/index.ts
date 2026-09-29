// Normalize a single x-like identifier (x or x_<digits>) to x. Release chunk: x-like-435c693d8722.js.
import "@rchunk/rolldown-runtime";

interface ExpressionToken {
  type: string;
  value: string;
  [key: string]: unknown;
}
let collectXLikeIdentifiers: (
  tokens: readonly ExpressionToken[],
) => Set<string>;
let normalizeSingleXLikeIdentifier: (
  tokens: ExpressionToken[],
) => ExpressionToken[];
let containsIndexIdentifier: (tokens: readonly ExpressionToken[]) => boolean;
let initialized = false;
function initializeXLikeIdentifierNormalization(): void {
  if (initialized) return;
  initialized = true;
  const xLikePattern = /^x_\d+$/u;
  const isXLike = (value: string): boolean =>
    value === "x" || xLikePattern.test(value);
  collectXLikeIdentifiers = (tokens) => {
    const identifiers = new Set<string>();
    for (const token of tokens)
      if (token.type === "identifier" && isXLike(token.value))
        identifiers.add(token.value);
    return identifiers;
  };
  normalizeSingleXLikeIdentifier = (tokens) => {
    const identifiers = collectXLikeIdentifiers(tokens);
    if (identifiers.size !== 1) return tokens;
    const [identifier] = identifiers;
    if (identifier === "x") return tokens;
    return tokens.map((token) =>
      token.type === "identifier" && token.value === identifier
        ? { ...token, value: "x" }
        : token,
    );
  };
  containsIndexIdentifier = (tokens) =>
    tokens.some((token) => token.type === "identifier" && token.value === "i");
}
export {
  normalizeSingleXLikeIdentifier as i,
  containsIndexIdentifier as n,
  initializeXLikeIdentifierNormalization as r,
  collectXLikeIdentifiers as t,
};
