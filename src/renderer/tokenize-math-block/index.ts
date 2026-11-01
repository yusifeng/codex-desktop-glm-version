import { n as onceExport } from "@rchunk/rolldown-runtime";

export type MathToken =
  | { type: "number"; value: number }
  | { type: "identifier" | "function" | "operator" | "paren"; value: string };

export interface MathTokenizerOptions {
  customFunctionNames?: ReadonlySet<string>;
}

export interface ParsedIntegral {
  integrand: MathToken[];
  lowerBound: MathToken[] | null;
  upperBound: MathToken[] | null;
  variable: string;
}

interface BalancedSegment {
  content: string;
  endIndex: number;
}

const BUILT_IN_FUNCTIONS = new Set([
  "arccos",
  "arcsin",
  "arctan",
  "sin",
  "cos",
  "sinh",
  "cosh",
  "tan",
  "tanh",
  "ln",
  "log",
  "sqrt",
  "abs",
  "exp",
  "neg",
  "sigmoid",
  "relu",
]);
const GREEK_IDENTIFIERS = new Set(
  "alpha.beta.gamma.delta.epsilon.varepsilon.zeta.eta.theta.vartheta.iota.kappa.lambda.mu.nu.xi.rho.varrho.sigma.varsigma.tau.upsilon.phi.varphi.chi.psi.omega".split(
    ".",
  ),
);
const KNOWN_IDENTIFIERS = new Set(["pi", ...GREEK_IDENTIFIERS]);
const KNOWN_SYMBOLS = new Set([
  ...BUILT_IN_FUNCTIONS,
  ...KNOWN_IDENTIFIERS,
  "cbrt",
  "cot",
  "csc",
  "e",
  "floor",
  "o",
  "sec",
  "sgn",
  "x",
]);
const SORTED_FUNCTIONS = [...BUILT_IN_FUNCTIONS].sort(
  (left, right) => right.length - left.length,
);
const SORTED_IDENTIFIERS = [...KNOWN_IDENTIFIERS].sort(
  (left, right) => right.length - left.length,
);
const FUNCTION_CALL = /^[a-z][a-z0-9_]*\([^)]*\)$/i;
const FUNCTION_OF_X = /^([a-z][a-z0-9_]*)\(x\)$/i;
const UNKNOWN_FUNCTION_CALL = /(^|[^a-zA-Z0-9_])(?:f|g|h|y)\s*\(/i;
const MAX_TOKENS = 5_000;

function stripMathDelimiters(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("\\(") && trimmed.endsWith("\\)")) ||
    (trimmed.startsWith("\\[") && trimmed.endsWith("\\]"))
  )
    return trimmed.slice(2, -2).trim();
  return trimmed.startsWith("$") && trimmed.endsWith("$")
    ? trimmed.slice(1, -1).trim()
    : trimmed;
}

function unwrapBoxed(value: string): string {
  const trimmed = value.trim();
  return (
    trimmed.match(/^\\boxed\{(?<inner>.*)\}$/)?.groups?.inner?.trim() ?? trimmed
  );
}

function removeLatexSpacing(value: string): string {
  return value
    .replace(/\\(?:,|;|:|!| )/g, "")
    .replace(/\\(?:quad|qquad)(?![a-zA-Z])/g, "")
    .replace(/\\left(?![a-zA-Z])\s*/g, "")
    .replace(/\\right(?![a-zA-Z])\s*/g, "");
}

function unwrapBraces(value: string): string {
  let trimmed = value.trim();
  while (trimmed.startsWith("{") && trimmed.endsWith("}"))
    trimmed = trimmed.slice(1, -1).trim();
  return trimmed;
}

function normalizeLeftHandSide(value: string): string {
  return removeLatexSpacing(unwrapBraces(value)).replace(/\s+/g, "");
}

function isCustomFunctionOfX(value: string): boolean {
  const name = value.match(FUNCTION_OF_X)?.[1]?.toLowerCase();
  return name != null && !KNOWN_SYMBOLS.has(name);
}

function isDependentVariable(value: string): boolean {
  return value === "y" || isCustomFunctionOfX(value);
}

function isNonDependentFunctionCall(value: string): boolean {
  return FUNCTION_CALL.test(value) && !isDependentVariable(value);
}

function equalityIndexes(value: string): number[] {
  const indexes: number[] = [];
  for (let index = 0; index < value.length; index += 1)
    if (value[index] === "=" && value[index - 1] !== "\\") indexes.push(index);
  return indexes;
}

function stripDependentAssignment(value: string): string {
  const unwrapped = stripMathDelimiters(value);
  const indexes = equalityIndexes(unwrapped);
  if (indexes.length !== 1) return value;
  const equalityIndex = indexes[0] ?? -1;
  const left = unwrapped.slice(0, equalityIndex).trim();
  const right = unwrapped.slice(equalityIndex + 1).trim();
  if (right.length === 0) return value;
  return isDependentVariable(normalizeLeftHandSide(left).toLowerCase())
    ? right
    : value;
}

function balancedSegment(
  value: string,
  startIndex: number,
  opener: string,
  closer: string,
): BalancedSegment | null {
  if (value[startIndex] !== opener) return null;
  let depth = 0;
  for (let index = startIndex; index < value.length; index += 1) {
    if (value[index] === opener) depth += 1;
    else if (value[index] === closer && --depth === 0)
      return {
        content: value.slice(startIndex + 1, index),
        endIndex: index,
      };
  }
  return null;
}

const bracedSegment = (value: string, startIndex: number) =>
  balancedSegment(value, startIndex, "{", "}");
const parenthesizedSegment = (value: string, startIndex: number) =>
  balancedSegment(value, startIndex, "(", ")");

function bareSegment(
  value: string,
  startIndex: number,
): BalancedSegment | null {
  let endIndex = startIndex;
  if (value[endIndex] === "+" || value[endIndex] === "-") endIndex += 1;
  while (endIndex < value.length && /[0-9a-zA-Z.]/.test(value[endIndex] ?? ""))
    endIndex += 1;
  if (endIndex === startIndex) return null;
  if (
    endIndex === startIndex + 1 &&
    (value[startIndex] === "+" || value[startIndex] === "-")
  )
    return null;
  return {
    content: value.slice(startIndex, endIndex),
    endIndex: endIndex - 1,
  };
}

function rewriteLogBases(value: string): string {
  let output = "";
  let cursor = 0;
  while (cursor < value.length) {
    if (!value.startsWith("\\log", cursor)) {
      output += value[cursor] ?? "";
      cursor += 1;
      continue;
    }
    const logStart = cursor;
    let segmentStart = cursor + 4;
    while (value[segmentStart] === " ") segmentStart += 1;
    if (value[segmentStart] !== "_") {
      output += value.slice(logStart, segmentStart);
      cursor = segmentStart;
      continue;
    }
    segmentStart += 1;
    while (value[segmentStart] === " ") segmentStart += 1;
    const base =
      bracedSegment(value, segmentStart) ??
      parenthesizedSegment(value, segmentStart) ??
      bareSegment(value, segmentStart);
    if (base == null) {
      output += "\\log";
      cursor = logStart + 4;
      continue;
    }
    segmentStart = base.endIndex + 1;
    while (value[segmentStart] === " ") segmentStart += 1;
    let argument =
      bracedSegment(value, segmentStart) ??
      parenthesizedSegment(value, segmentStart);
    if (argument == null && /[0-9a-zA-Z.]/.test(value[segmentStart] ?? ""))
      argument = bareSegment(value, segmentStart);
    if (argument == null) {
      output += "\\log";
      cursor = logStart + 4;
      continue;
    }
    output += `(ln(${argument.content.trim()})/ln(${base.content.trim()}))`;
    cursor = argument.endIndex + 1;
  }
  return output;
}

function rewriteFractions(value: string): string {
  let output = "";
  let cursor = 0;
  while (cursor < value.length) {
    if (
      !value.startsWith("\\tfrac", cursor) &&
      !value.startsWith("\\frac", cursor)
    ) {
      output += value[cursor] ?? "";
      cursor += 1;
      continue;
    }
    const marker = value.startsWith("\\tfrac", cursor) ? "\\tfrac" : "\\frac";
    cursor += marker.length;
    while (value[cursor] === " ") cursor += 1;
    const numerator = bracedSegment(value, cursor);
    if (numerator == null) {
      output += marker;
      continue;
    }
    cursor = numerator.endIndex + 1;
    while (value[cursor] === " ") cursor += 1;
    const denominator = bracedSegment(value, cursor);
    if (denominator == null) {
      output += `(${numerator.content})`;
      continue;
    }
    cursor = denominator.endIndex + 1;
    output += `(${numerator.content})/(${denominator.content})`;
  }
  return output;
}

function rewriteSquareRoots(value: string): string {
  let output = "";
  let cursor = 0;
  while (cursor < value.length) {
    const trailing = value[cursor + 5];
    if (
      value.startsWith("\\sqrt", cursor) &&
      (trailing == null || !/[a-zA-Z]/.test(trailing))
    ) {
      cursor += 5;
      while (value[cursor] === " ") cursor += 1;
      const argument = bracedSegment(value, cursor);
      if (argument == null) {
        output += "sqrt";
        continue;
      }
      cursor = argument.endIndex + 1;
      output += `sqrt(${argument.content})`;
      continue;
    }
    output += value[cursor] ?? "";
    cursor += 1;
  }
  return output;
}

function rewriteAbsoluteValues(value: string): string {
  if ((value.match(/\|/g) ?? []).length % 2 !== 0) return value;
  let output = "";
  let open = false;
  for (const character of value) {
    if (character === "|") {
      output += open ? ")" : "abs(";
      open = !open;
    } else output += character;
  }
  return output;
}

const TRIG_FUNCTIONS = [
  "sinh",
  "cosh",
  "tanh",
  "sin",
  "cos",
  "tan",
  "sec",
  "csc",
  "cot",
];
const INVERSE_TRIG: Record<string, string> = {
  sin: "arcsin",
  cos: "arccos",
  tan: "arctan",
  sec: "arcsec",
};
const isWordCharacter = (value: string | undefined) =>
  value != null && /[0-9a-zA-Z_.]/.test(value);

function numberSegment(
  value: string,
  startIndex: number,
): BalancedSegment | null {
  const match = value.slice(startIndex).match(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)/);
  if (match == null) return null;
  return {
    content: match[0],
    endIndex: startIndex + match[0].length - 1,
  };
}

function wordSegment(
  value: string,
  startIndex: number,
): BalancedSegment | null {
  let endIndex = startIndex;
  if (value[endIndex] === "+" || value[endIndex] === "-") endIndex += 1;
  while (endIndex < value.length && isWordCharacter(value[endIndex]))
    endIndex += 1;
  if (endIndex === startIndex) return null;
  if (
    endIndex === startIndex + 1 &&
    (value[startIndex] === "+" || value[startIndex] === "-")
  )
    return null;
  return {
    content: value.slice(startIndex, endIndex),
    endIndex: endIndex - 1,
  };
}

function rewriteTrigPowers(value: string): string {
  let output = "";
  let cursor = 0;
  const isLetter = (character: string | undefined) =>
    character != null && /[a-zA-Z]/.test(character);
  const wordStart = (index: number) => {
    while (index > 0 && isLetter(value[index - 1])) index -= 1;
    return index;
  };
  const wordEnd = (index: number) => {
    while (index < value.length && isLetter(value[index])) index += 1;
    return index;
  };

  while (cursor < value.length) {
    const name = TRIG_FUNCTIONS.find((candidate) =>
      value.startsWith(candidate, cursor),
    );
    if (name == null) {
      output += value[cursor] ?? "";
      cursor += 1;
      continue;
    }
    if (value[cursor + name.length] !== "^") {
      output += value[cursor] ?? "";
      cursor += 1;
      continue;
    }
    const arcStart = cursor - 3;
    if (
      arcStart >= 0 &&
      value.slice(arcStart, cursor + name.length).toLowerCase() === `arc${name}`
    ) {
      output += value[cursor] ?? "";
      cursor += 1;
      continue;
    }
    const previousIsLetter = isLetter(value[cursor - 1]);
    const start = previousIsLetter ? wordStart(cursor) : cursor;
    const end = wordEnd(cursor);
    const prefix = value.slice(start, cursor).toLowerCase();
    const fullWord = value.slice(start, end).toLowerCase();
    const recognizedFullWord =
      cursor > start &&
      (BUILT_IN_FUNCTIONS.has(fullWord) || KNOWN_IDENTIFIERS.has(fullWord));
    const recognizedPrefix =
      prefix.length === 1 ||
      KNOWN_IDENTIFIERS.has(prefix) ||
      BUILT_IN_FUNCTIONS.has(prefix);
    if (previousIsLetter && (recognizedFullWord || !recognizedPrefix)) {
      output += value[cursor] ?? "";
      cursor += 1;
      continue;
    }
    let segmentStart = cursor + name.length + 1;
    while (value[segmentStart] === " ") segmentStart += 1;
    const power =
      bracedSegment(value, segmentStart) ?? numberSegment(value, segmentStart);
    if (power == null) {
      output += value[cursor] ?? "";
      cursor += 1;
      continue;
    }
    segmentStart = power.endIndex + 1;
    while (value[segmentStart] === " ") segmentStart += 1;
    const argument =
      bracedSegment(value, segmentStart) ??
      parenthesizedSegment(value, segmentStart) ??
      wordSegment(value, segmentStart);
    if (argument == null) {
      output += value[cursor] ?? "";
      cursor += 1;
      continue;
    }
    const exponent = power.content.trim();
    const argumentText = argument.content.trim();
    if (exponent === "-1") {
      const inverse = INVERSE_TRIG[name];
      if (inverse == null) return "";
      output += `${inverse}(${argumentText})`;
    } else output += `(${name}(${argumentText}))^(${exponent})`;
    cursor = argument.endIndex + 1;
  }
  return output;
}

function normalizeSubscripts(value: string): string {
  return value.replace(/([a-zA-Z]+)_\{?([a-zA-Z0-9]+)\}?/g, "$1_$2");
}

function normalizeLatex(value: string): string {
  let normalized = removeLatexSpacing(unwrapBoxed(stripMathDelimiters(value)));
  if (/\\begin\s*\{|\\end\s*\{|\\cases\b/.test(normalized)) return "";
  normalized = rewriteLogBases(normalized);
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const rewritten = rewriteFractions(normalized);
    if (rewritten === normalized) break;
    normalized = rewritten;
    if (!/\\(?:tfrac|frac)/.test(normalized)) break;
  }
  if (/\\sqrt\s*\[/.test(normalized)) return "";
  normalized = rewriteSquareRoots(normalized);
  normalized = rewriteAbsoluteValues(normalized);
  normalized = normalized.replace(/\\sigma\s*(?=\()/g, "sigmoid");
  normalized = normalized.replace(
    /\\(?:operatorname|mathrm|text)\s*\{\s*relu\s*\}/gi,
    "relu",
  );
  normalized = normalized
    .replace(/[−–—]/g, "-")
    .replace(/[×·⋅]/g, "*")
    .replace(/÷/g, "/")
    .replace(/π/g, "pi")
    .replace(/\\arcsin(?![a-zA-Z])/g, "arcsin")
    .replace(/\\arccos(?![a-zA-Z])/g, "arccos")
    .replace(/\\arctan(?![a-zA-Z])/g, "arctan")
    .replace(/\\sin\^\{-1\}/g, "arcsin")
    .replace(/\\cos\^\{-1\}/g, "arccos")
    .replace(/\\tan\^\{-1\}/g, "arctan")
    .replace(/\\pi(?![a-zA-Z])/g, "pi")
    .replace(/\\cdot(?![a-zA-Z])/g, "*")
    .replace(/\\times(?![a-zA-Z])/g, "*")
    .replace(/\\sinh(?![a-zA-Z])/g, "sinh")
    .replace(/\\cosh(?![a-zA-Z])/g, "cosh")
    .replace(/\\sin(?![a-zA-Z])/g, "sin")
    .replace(/\\cos(?![a-zA-Z])/g, "cos")
    .replace(/\\tanh(?![a-zA-Z])/g, "tanh")
    .replace(/\\tan(?![a-zA-Z])/g, "tan")
    .replace(/\\ln(?![a-zA-Z])/g, "ln")
    .replace(/\\log(?![a-zA-Z])/g, "log")
    .replace(/\\exp(?![a-zA-Z])/g, "exp")
    .replace(/sin\^\{-1\}/g, "arcsin")
    .replace(/cos\^\{-1\}/g, "arccos")
    .replace(/tan\^\{-1\}/g, "arctan");
  for (const identifier of GREEK_IDENTIFIERS)
    normalized = normalized.replace(
      new RegExp(String.raw`\\${identifier}(?![a-zA-Z])`, "g"),
      identifier,
    );
  return rewriteTrigPowers(normalizeSubscripts(normalized))
    .replace(/{/g, "(")
    .replace(/}/g, ")");
}

function tokenizeExpression(
  value: string,
  options?: MathTokenizerOptions,
): MathToken[] | null {
  const customFunctions = options?.customFunctionNames;
  const normalized = normalizeLatex(stripDependentAssignment(value));
  if (
    normalized.trim().length === 0 ||
    /\\[a-zA-Z]+/.test(normalized) ||
    (UNKNOWN_FUNCTION_CALL.test(normalized) &&
      [...normalized.matchAll(/([a-z][a-z0-9_]*)\s*\(/gi)].some(
        ([, name]) =>
          name != null &&
          ["f", "g", "h", "y"].includes(name.toLowerCase()) &&
          !customFunctions?.has(name.toLowerCase()),
      ))
  )
    return null;

  const tokens: MathToken[] = [];
  let depth = 0;
  let cursor = 0;
  const isDigit = (character: string | undefined) =>
    character != null && character >= "0" && character <= "9";
  const isLetter = (character: string | undefined) =>
    character != null &&
    ((character >= "a" && character <= "z") ||
      (character >= "A" && character <= "Z"));
  const pushWord = (word: string) => {
    const normalizedWord = word.toLowerCase();
    tokens.push({
      type:
        BUILT_IN_FUNCTIONS.has(normalizedWord) ||
        customFunctions?.has(normalizedWord)
          ? "function"
          : "identifier",
      value: normalizedWord,
    });
  };

  while (cursor < normalized.length) {
    if (tokens.length > MAX_TOKENS) return null;
    const character = normalized[cursor];
    if (/\s/.test(character ?? "")) {
      cursor += 1;
      continue;
    }
    if (character === "(" || character === "[" || character === "{") {
      tokens.push({ type: "paren", value: "(" });
      depth += 1;
      cursor += 1;
      continue;
    }
    if (character === ")" || character === "]" || character === "}") {
      depth -= 1;
      if (depth < 0) return null;
      tokens.push({ type: "paren", value: ")" });
      cursor += 1;
      continue;
    }
    if (character === "_") {
      const previous = tokens.at(-1);
      if (previous?.type === "identifier") {
        const start = cursor + 1;
        let end = start;
        let suffix = "";
        if (isDigit(normalized[start])) {
          while (isDigit(normalized[end])) end += 1;
          suffix = normalized.slice(start, end);
        } else if (isLetter(normalized[start])) {
          const remainder = normalized.slice(start).toLowerCase();
          const identifier = SORTED_IDENTIFIERS.find((candidate) =>
            remainder.startsWith(candidate),
          );
          if (identifier != null) {
            end = start + identifier.length;
            suffix = identifier;
          } else {
            end = start + 1;
            suffix = normalized[start]?.toLowerCase() ?? "";
          }
        }
        if (suffix.length > 0) {
          previous.value = `${previous.value}_${suffix}`;
          cursor = end;
          continue;
        }
      }
      cursor += 1;
      continue;
    }
    if (["+", "-", "*", "/", "^"].includes(character ?? "")) {
      tokens.push({ type: "operator", value: character ?? "" });
      cursor += 1;
      continue;
    }
    if (
      isDigit(character) ||
      (character === "." && isDigit(normalized[cursor + 1]))
    ) {
      const match = normalized
        .slice(cursor)
        .match(/^(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?/);
      const raw = match?.[0];
      const number = raw == null ? Number.NaN : Number(raw);
      if (!Number.isFinite(number)) return null;
      tokens.push({ type: "number", value: number });
      cursor += raw?.length ?? 0;
      continue;
    }
    if (isLetter(character)) {
      let end = cursor + 1;
      while (isLetter(normalized[end])) end += 1;
      const word = normalized.slice(cursor, end).toLowerCase();
      if (
        BUILT_IN_FUNCTIONS.has(word) ||
        customFunctions?.has(word) ||
        KNOWN_IDENTIFIERS.has(word) ||
        word.length === 1
      ) {
        pushWord(word);
        cursor = end;
        continue;
      }
      let offset = 0;
      while (offset < word.length) {
        let matched = false;
        for (const name of SORTED_FUNCTIONS) {
          if (!word.startsWith(name, offset)) continue;
          tokens.push({ type: "function", value: name });
          offset += name.length;
          matched = true;
          break;
        }
        if (!matched) {
          for (const name of SORTED_IDENTIFIERS) {
            if (!word.startsWith(name, offset)) continue;
            tokens.push({ type: "identifier", value: name });
            offset += name.length;
            matched = true;
            break;
          }
        }
        if (!matched) {
          tokens.push({ type: "identifier", value: word[offset] ?? "" });
          offset += 1;
        }
      }
      cursor = end;
      continue;
    }
    return null;
  }
  if (depth !== 0) return null;
  return insertImplicitFunctionParentheses(tokens);
}

function insertImplicitFunctionParentheses(tokens: MathToken[]): MathToken[] {
  const output: MathToken[] = [];
  const isSign = (token: MathToken) =>
    token.type === "operator" && (token.value === "+" || token.value === "-");
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]!;
    output.push(token);
    if (token.type !== "function") continue;
    const next = tokens[index + 1];
    if (next == null || (next.type === "paren" && next.value === "(")) continue;
    output.push({ type: "paren", value: "(" });
    let depth = 0;
    let leadingSign = true;
    let previous: MathToken | null = null;
    let cursor = index + 1;
    for (; cursor < tokens.length; cursor += 1) {
      const candidate = tokens[cursor]!;
      const previousWasFunction = previous?.type === "function";
      if (
        (depth === 0 &&
          candidate.type === "operator" &&
          ["+", "-", "*", "/"].includes(candidate.value) &&
          cursor > index + 1) ||
        (depth === 0 &&
          candidate.type === "paren" &&
          candidate.value === "(" &&
          cursor > index + 1 &&
          !leadingSign &&
          !previousWasFunction) ||
        (depth === 0 && candidate.type === "paren" && candidate.value === ")")
      )
        break;
      output.push(candidate);
      const atTopLevel = depth === 0;
      if (candidate.type === "paren" && candidate.value === "(") depth += 1;
      else if (candidate.type === "paren" && candidate.value === ")")
        depth -= 1;
      if (atTopLevel) {
        if (leadingSign && !isSign(candidate)) leadingSign = false;
        previous = candidate;
      }
    }
    output.push({ type: "paren", value: ")" });
    index = cursor - 1;
  }
  return output;
}

function insertImplicitMultiplication(tokens: MathToken[]): MathToken[] {
  const output: MathToken[] = [];
  const canEndValue = (token: MathToken) =>
    token.type === "number" ||
    token.type === "identifier" ||
    (token.type === "paren" && token.value === ")");
  const canStartValue = (token: MathToken) =>
    token.type === "number" ||
    token.type === "identifier" ||
    token.type === "function" ||
    (token.type === "paren" && token.value === "(");
  for (const token of tokens) {
    const previous = output.at(-1);
    if (previous != null && canEndValue(previous) && canStartValue(token))
      output.push({ type: "operator", value: "*" });
    output.push(token);
  }
  return output;
}

function toPostfix(tokens: MathToken[]): MathToken[] | null {
  const output: MathToken[] = [];
  const operators: MathToken[] = [];
  const precedence = (token: MathToken) => {
    if (token.type !== "operator") return 0;
    if (token.value === "^") return 4;
    if (token.value === "*" || token.value === "/") return 3;
    if (token.value === "+" || token.value === "-") return 2;
    return 0;
  };
  const isUnaryPosition = (token: MathToken | null) =>
    token == null ||
    token.type === "operator" ||
    (token.type === "paren" && token.value === "(") ||
    token.type === "function";
  let previous: MathToken | null = null;

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]!;
    const next = tokens[index + 1] ?? null;
    if (token.type === "number" || token.type === "identifier")
      output.push(token);
    else if (token.type === "function") operators.push(token);
    else if (token.type === "operator") {
      if (token.value === "+" && isUnaryPosition(previous)) {
        previous = token;
        continue;
      }
      if (token.value === "-" && isUnaryPosition(previous)) {
        operators.push({ type: "function", value: "neg" });
        previous = token;
        continue;
      }
      while (operators.length > 0) {
        const top = operators.at(-1)!;
        if (top.type === "function") {
          if (token.value === "^") break;
          output.push(operators.pop()!);
          continue;
        }
        if (
          top.type === "operator" &&
          (precedence(top) > precedence(token) ||
            (precedence(top) === precedence(token) && token.value !== "^"))
        ) {
          output.push(operators.pop()!);
          continue;
        }
        break;
      }
      operators.push(token);
    } else if (token.value === "(") operators.push(token);
    else {
      let foundOpening = false;
      while (operators.length > 0) {
        const top = operators.pop()!;
        if (top.type === "paren" && top.value === "(") {
          foundOpening = true;
          break;
        }
        output.push(top);
      }
      if (!foundOpening) return null;
      const top = operators.at(-1);
      const exponentFollows = next?.type === "operator" && next.value === "^";
      const keepUnaryNegation =
        top?.type === "function" && top.value === "neg" && exponentFollows;
      if (top?.type === "function" && !keepUnaryNegation)
        output.push(operators.pop()!);
    }
    previous = token;
  }
  while (operators.length > 0) {
    const token = operators.pop()!;
    if (token.type === "paren") return null;
    output.push(token);
  }
  return output;
}

function parseExpression(value: string): MathToken[] | null {
  const tokens = tokenizeExpression(value);
  return tokens == null
    ? null
    : toPostfix(insertImplicitMultiplication(tokens));
}

function tokenizeEquation(
  value: string,
  options?: MathTokenizerOptions,
): MathToken[] | null {
  const normalized = normalizeLatex(value);
  const indexes = equalityIndexes(normalized);
  if (indexes.length !== 1) return null;
  const equalityIndex = indexes[0] ?? -1;
  const left = normalized.slice(0, equalityIndex).trim();
  if (isNonDependentFunctionCall(normalizeLeftHandSide(left).toLowerCase()))
    return null;
  const right = normalized.slice(equalityIndex + 1).trim();
  if (right.length === 0) return null;
  const tokens = tokenizeExpression(right, options);
  return tokens == null
    ? null
    : toPostfix(insertImplicitMultiplication(tokens));
}

function replaceIdentifier(
  tokens: MathToken[],
  from: string,
  to: string,
): MathToken[] {
  return tokens.map((token) =>
    token.type === "identifier" && token.value === from
      ? { ...token, value: to }
      : token,
  );
}

const INTEGRAL_MARKER = /\\int(?![a-zA-Z])/;
const DIFFERENTIAL =
  /(?:\\mathrm\s*\(\s*d\s*\)|\\mathrm\s*\{\s*d\s*\}|\\mathrm\s*d|d)\s*(?:\\([a-zA-Z]+)|([a-zA-Z]))\s*$/;
const DIVIDED_DIFFERENTIAL =
  /^((?:\\mathrm\s*\(\s*d\s*\)|\\mathrm\s*\{\s*d\s*\}|\\mathrm\s*d|d)\s*(?:\\[a-zA-Z]+|[a-zA-Z]))\s*\/\s*(.+)$/;
const ALLOWED_INTEGRAL_CONSTANTS = new Set(["e", "pi"]);

function differentialVariable(value: string): string | null {
  const match = value.trim().match(DIFFERENTIAL);
  return match == null || match.index !== 0
    ? null
    : ((match[1] ?? match[2])?.toLowerCase().trim() ?? null);
}

function isCompleteDenominator(value: string, tokens: MathToken[]): boolean {
  const segment = parenthesizedSegment(value, 0) ?? bracedSegment(value, 0);
  if (segment != null && segment.endIndex === value.length - 1) return true;
  const last = tokens.at(-1);
  return (
    last?.type === "number" ||
    last?.type === "identifier" ||
    last?.type === "function" ||
    (last?.type === "operator" && last.value === "^")
  );
}

function parseDifferentialFraction(
  value: string,
): { integrandText: string; variable: string } | null {
  const marker = value.match(/^\\(?:dfrac|tfrac|frac)/)?.[0];
  if (marker != null) {
    let cursor = marker.length;
    while (/\s/.test(value[cursor] ?? "")) cursor += 1;
    const numerator = bracedSegment(value, cursor);
    if (numerator == null) return null;
    const variable = differentialVariable(numerator.content);
    if (variable == null) return null;
    cursor = numerator.endIndex + 1;
    while (/\s/.test(value[cursor] ?? "")) cursor += 1;
    const denominator = bracedSegment(value, cursor);
    const denominatorText = denominator?.content.trim();
    if (
      denominator == null ||
      !denominatorText ||
      value.slice(denominator.endIndex + 1).trim().length > 0 ||
      parseExpression(denominatorText) == null
    )
      return null;
    return {
      integrandText: `\\frac{1}{${denominatorText}}`,
      variable,
    };
  }
  const match = value.match(DIVIDED_DIFFERENTIAL);
  const differential = match?.[1];
  const denominator = match?.[2]?.trim();
  if (!differential || !denominator) return null;
  const variable = differentialVariable(differential);
  const tokens = parseExpression(denominator);
  return variable == null ||
    tokens == null ||
    !isCompleteDenominator(denominator, tokens)
    ? null
    : { integrandText: `\\frac{1}{${denominator}}`, variable };
}

function parseIntegral(value: string): ParsedIntegral | null {
  const unwrapped = stripMathDelimiters(value);
  if (/[∮∬∭]/.test(unwrapped)) return null;
  const normalized = removeLatexSpacing(unwrapped.replaceAll("∫", "\\int"));
  const integralIndex = normalized.search(INTEGRAL_MARKER);
  if (integralIndex === -1) return null;
  const indexes = equalityIndexes(normalized);
  let integral = normalized.slice(integralIndex).trim();
  if (indexes.length === 1 && integralIndex < (indexes[0] ?? -1))
    integral = normalized.slice(integralIndex, indexes[0]).trim();
  if (!integral.startsWith("\\int")) return null;
  let cursor = 4;
  const skipLimits = () => {
    while (integral[cursor] === " ") cursor += 1;
    if (integral.startsWith("\\limits", cursor)) cursor += 7;
    else if (integral.startsWith("\\nolimits", cursor)) cursor += 9;
  };
  skipLimits();
  const readLimit = () =>
    bracedSegment(integral, cursor) ??
    parenthesizedSegment(integral, cursor) ??
    bareSegment(integral, cursor);
  let lowerText: string | null = null;
  let upperText: string | null = null;
  for (let count = 0; count < 2; count += 1) {
    while (integral[cursor] === " ") cursor += 1;
    const marker = integral[cursor];
    if (marker !== "_" && marker !== "^") break;
    cursor += 1;
    while (integral[cursor] === " ") cursor += 1;
    const limit = readLimit();
    if (limit == null) return null;
    if (marker === "_" && lowerText == null) lowerText = limit.content.trim();
    if (marker === "^" && upperText == null) upperText = limit.content.trim();
    cursor = limit.endIndex + 1;
    skipLimits();
  }
  const body = integral.slice(cursor).trim();
  if (body.length === 0 || INTEGRAL_MARKER.test(body)) return null;
  const differential = body.match(DIFFERENTIAL);
  const fraction =
    differential == null ? parseDifferentialFraction(body) : null;
  const variable =
    differential?.[1]?.toLowerCase().trim() ??
    differential?.[2]?.toLowerCase().trim() ??
    fraction?.variable ??
    "x";
  const integrandText =
    differential == null
      ? (fraction?.integrandText ?? body)
      : body.slice(0, differential.index).trim();
  if (integrandText.length === 0) return null;
  const integrand = parseExpression(integrandText);
  if (integrand == null) return null;
  const normalizedVariable = variable.toLowerCase();
  if (
    integrand.some(
      (token) =>
        token.type === "identifier" &&
        token.value !== normalizedVariable &&
        !ALLOWED_INTEGRAL_CONSTANTS.has(token.value),
    )
  )
    return null;
  const lowerBound = lowerText == null ? null : parseExpression(lowerText);
  const upperBound = upperText == null ? null : parseExpression(upperText);
  if (
    (lowerText != null && lowerBound == null) ||
    (upperText != null && upperBound == null)
  )
    return null;
  return {
    integrand:
      normalizedVariable === "x"
        ? integrand
        : replaceIdentifier(integrand, normalizedVariable, "x"),
    lowerBound,
    upperBound,
    variable: normalizedVariable,
  };
}

function collectVariables(tokens: readonly MathToken[]): string[] {
  const seen = new Set<string>();
  const variables: string[] = [];
  for (const token of tokens) {
    if (
      token.type !== "identifier" ||
      ["x", "e", "pi"].includes(token.value) ||
      seen.has(token.value)
    )
      continue;
    seen.add(token.value);
    variables.push(token.value);
  }
  return variables;
}

const once = onceExport as (initializer: () => void) => () => void;
const initializeMathTokenizer = once(() => {});
initializeMathTokenizer();

export {
  parseIntegral as i,
  initializeMathTokenizer as n,
  tokenizeEquation as r,
  collectVariables as t,
};
