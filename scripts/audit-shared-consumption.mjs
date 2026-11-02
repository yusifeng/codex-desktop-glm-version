// 审计主进程源码中实际从 @chunk/shared 消费、但尚未接入语义模块的导出别名。
// 只解析来自 @chunk/shared 的 import，避免把其它模块的 `as` 误计入缺口。
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "acorn";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const map = JSON.parse(await fs.readFile(path.join(ROOT, "docs/shared-export-map.json"), "utf8"));
const dts = await fs.readFile(path.join(ROOT, "src/main/types/chunk-modules.d.ts"), "utf8");
const semantic = new Set();
for (const stmt of dts.matchAll(/export\s*\{([^}]*)\}\s*from\s*["']\.\.\/\.\.\/shared\/[^"']+["']/g)) {
  for (const item of stmt[1].split(",")) {
    const match = item.trim().match(/^([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/);
    if (match) semantic.add(match[2] ?? match[1]);
  }
}

const consumed = new Map();
const files = [];
async function walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name.endsWith(".ts") && entry.name !== "src-DldfpmrL.ts") files.push(full);
  }
}
await walk(path.join(ROOT, "src/main"));
for (const file of files) {
  const src = await fs.readFile(file, "utf8");
  for (const stmt of src.matchAll(/import\s*\{([^}]*)\}\s*from\s*["']@chunk\/shared["']/g)) {
    for (const item of stmt[1].split(",")) {
      const match = item.trim().match(/^([A-Za-z_$][\w$]*)(?:\s+as\s+[A-Za-z_$][\w$]*)?$/);
      if (!match) continue;
      const exported = match[1];
      const hit = consumed.get(exported) ?? { count: 0, files: new Set() };
      hit.count++;
      hit.files.add(path.relative(ROOT, file));
      consumed.set(exported, hit);
    }
  }
}

// Exact-recovery process roots are checked-in source too.  Unlike the
// semantic owners above, the recovered main root retains the published
// CommonJS namespace binding (`n = require("./src-DldfpmrL.js")`).  A plain
// `n.foo` regexp is not sufficient here because minified nested functions
// frequently shadow `n`; resolve the namespace through lexical scopes so the
// audit reports only real shared-chunk reads.
const exactRoot = path.join(ROOT, "src/main-recovered/main-C-Mhak1n.ts");
const exactRootSource = await fs.readFile(exactRoot, "utf8");
const exactRootAst = parse(exactRootSource, {
  ecmaVersion: "latest",
  locations: true,
  sourceType: "script",
});

const nodeScopes = new WeakMap();
const programScope = { parent: null, kind: "program", declarations: new Set() };

function childScope(parent, kind) {
  return { parent, kind, declarations: new Set() };
}

function declarePattern(pattern, scope) {
  if (!pattern) return;
  if (pattern.type === "Identifier") scope.declarations.add(pattern.name);
  else if (pattern.type === "RestElement") declarePattern(pattern.argument, scope);
  else if (pattern.type === "AssignmentPattern") declarePattern(pattern.left, scope);
  else if (pattern.type === "ArrayPattern") {
    for (const element of pattern.elements) declarePattern(element, scope);
  } else if (pattern.type === "ObjectPattern") {
    for (const property of pattern.properties) {
      if (property.type === "RestElement") declarePattern(property.argument, scope);
      else declarePattern(property.value, scope);
    }
  }
}

function nearestVarScope(scope) {
  while (scope.kind !== "function" && scope.kind !== "program") scope = scope.parent;
  return scope;
}

function walkAst(node, scope, visit) {
  if (!node || typeof node !== "object") return;
  nodeScopes.set(node, scope);
  visit?.(node, scope);

  let nestedScope = scope;
  const isFunction = node.type === "FunctionDeclaration" ||
    node.type === "FunctionExpression" || node.type === "ArrowFunctionExpression";
  if (node.type === "FunctionDeclaration" && node.id) scope.declarations.add(node.id.name);
  if (node.type === "ClassDeclaration" && node.id) scope.declarations.add(node.id.name);
  if (isFunction) {
    nestedScope = childScope(scope, "function");
    if (node.type === "FunctionExpression" && node.id) nestedScope.declarations.add(node.id.name);
    for (const parameter of node.params) declarePattern(parameter, nestedScope);
  } else if (node.type === "BlockStatement" && node !== exactRootAst) {
    nestedScope = childScope(scope, "block");
  } else if (node.type === "CatchClause") {
    nestedScope = childScope(scope, "block");
    declarePattern(node.param, nestedScope);
  }

  if (node.type === "VariableDeclaration") {
    const declarationScope = node.kind === "var" ? nearestVarScope(scope) : scope;
    for (const declaration of node.declarations) declarePattern(declaration.id, declarationScope);
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === "type" || key === "start" || key === "end" || key === "loc") continue;
    if (Array.isArray(value)) {
      for (const child of value) if (child?.type) walkAst(child, nestedScope, visit);
    } else if (value?.type) walkAst(value, nestedScope, visit);
  }
}

// First pass registers every declaration before resolving reads, including
// lexical declarations that appear later in the same block.
walkAst(exactRootAst, programScope);
const sharedBindings = new Set();
for (const statement of exactRootAst.body) {
  if (statement.type !== "VariableDeclaration") continue;
  for (const declaration of statement.declarations) {
    if (declaration.id.type !== "Identifier" || declaration.init?.type !== "CallExpression") continue;
    const [argument] = declaration.init.arguments;
    if (declaration.init.callee.type === "Identifier" && declaration.init.callee.name === "require" &&
        argument?.type === "Literal" && argument.value === "./src-DldfpmrL.js") {
      sharedBindings.add(declaration.id.name);
    }
  }
}
if (sharedBindings.size !== 1) {
  throw new Error(`Expected exactly one shared namespace binding in main exact root, found ${sharedBindings.size}`);
}

function resolvesToProgramBinding(name, scope) {
  for (let current = scope; current; current = current.parent) {
    if (current.declarations.has(name)) return current === programScope;
  }
  return false;
}

function visitAst(node, visit) {
  if (!node || typeof node !== "object") return;
  visit(node, nodeScopes.get(node));
  for (const [key, value] of Object.entries(node)) {
    if (key === "type" || key === "start" || key === "end" || key === "loc") continue;
    if (Array.isArray(value)) {
      for (const child of value) if (child?.type) visitAst(child, visit);
    } else if (value?.type) visitAst(value, visit);
  }
}

visitAst(exactRootAst, (node, scope) => {
  if (node.type !== "MemberExpression" || node.object?.type !== "Identifier" ||
      !sharedBindings.has(node.object.name) || !resolvesToProgramBinding(node.object.name, scope)) return;
  const exported = !node.computed && node.property.type === "Identifier"
    ? node.property.name
    : node.computed && node.property.type === "Literal" && typeof node.property.value === "string"
      ? node.property.value
      : null;
  if (!exported || !map[exported]) return;
  const hit = consumed.get(exported) ?? { count: 0, files: new Set(), lines: new Set() };
  hit.count++;
  hit.files.add(path.relative(ROOT, exactRoot));
  (hit.lines ??= new Set()).add(node.loc.start.line);
  consumed.set(exported, hit);
});

const todo = [...consumed.keys()].filter((name) => !semantic.has(name));
const byZone = new Map();
for (const name of todo) {
  const zone = map[name]?.zone ?? "unlocated";
  const bucket = byZone.get(zone) ?? [];
  bucket.push(name);
  byZone.set(zone, bucket);
}
for (const [zone, names] of [...byZone].sort((a, b) => b[1].length - a[1].length))
  console.log(`${zone}: ${names.length} -> ${names.sort().join(", ")}`);
console.log(`TOTAL: ${todo.length}`);
if (process.argv.includes("--json"))
  console.log(JSON.stringify(todo.map((name) => ({
    name,
    ...map[name],
    count: consumed.get(name).count,
    files: [...consumed.get(name).files],
    lines: [...(consumed.get(name).lines ?? [])],
  }))));
if (process.argv.includes("--strict") && todo.length > 0) process.exitCode = 1;
