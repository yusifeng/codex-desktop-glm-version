// 作用域级「自由变量」分析器：找出一个模块文件中未被任何局部作用域绑定的标识符。
// 用途：vendor 提取后的 wiring 检查——vendor 代码引用了已被移走的顶层符号时会暴露出来。
//
//   node scripts/check-scope.mjs <file.ts> [--names n1,n2,...]
//     默认输出全部自由变量及出现次数；--names 只关心指定名字。
import { parse } from "acorn";
import fs from "node:fs";

const args = process.argv.slice(2);
const file = args[0];
const filterIndex = args.indexOf("--names");
const filter = filterIndex !== -1 ? new Set(args[filterIndex + 1].split(",")) : null;

const src = fs.readFileSync(file, "utf8");
const ast = parse(src, {
  ecmaVersion: "latest",
  sourceType: "module",
  allowReturnOutsideFunction: true,
  allowAwaitOutsideFunction: true,
  allowHashBang: true,
});

// ---- 1. 建父指针 ----
const parent = new Map();
(function dfs(node, p) {
  parent.set(node, p);
  for (const key in node) {
    const child = node[key];
    if (Array.isArray(child))
      child.forEach((c) => c && typeof c.type === "string" && dfs(c, node));
    else if (child && typeof child.type === "string") dfs(child, node);
  }
})(ast, null);

// ---- 2. 作用域划分与绑定收集 ----
// 函数/程序作用域：var + 顶层 function；块作用域：let/const/class/function
const scopeOf = new Map(); // node -> scope node
const bindings = new Map(); // scope node -> Set<name>

const isScopeNode = (n) =>
  n.type === "Program" ||
  n.type === "FunctionDeclaration" ||
  n.type === "FunctionExpression" ||
  n.type === "ArrowFunctionExpression" ||
  n.type === "BlockStatement" ||
  n.type === "StaticBlock" ||
  n.type === "ForStatement" ||
  n.type === "ForInStatement" ||
  n.type === "ForOfStatement" ||
  n.type === "CatchClause" ||
  n.type === "SwitchStatement";

const isFunctionScope = (n) =>
  n.type === "Program" || n.type === "FunctionDeclaration" ||
  n.type === "FunctionExpression" || n.type === "ArrowFunctionExpression";

const addBinding = (scope, name) => {
  if (!bindings.has(scope)) bindings.set(scope, new Set());
  bindings.get(scope).add(name);
};

// 先给所有节点分配最近作用域（var 的归属在步骤 3 修正）
(function assign(node) {
  if (isScopeNode(node)) scopeOf.set(node, node);
  for (const key in node) {
    const child = node[key];
    if (Array.isArray(child)) child.forEach((c) => c && typeof c.type === "string" && assign(c));
    else if (child && typeof child.type === "string") assign(child);
  }
})(ast);

// 每个节点的「声明作用域」= 最近 enclosing scope
function enclosingScope(node) {
  let n = node;
  while (n) {
    if (scopeOf.get(n) === n) return n;
    n = parent.get(n);
  }
  return ast;
}

// 遍历声明，把名字放进正确的绑定集
(function collect(node) {
  const bind = (names, kind) => {
    for (const name of names) {
      let scope = enclosingScope(node);
      if (kind === "var" || kind === "function") {
        while (scope && !isFunctionScope(scope)) scope = enclosingScope(scope);
      }
      addBinding(scope, name);
    }
  };
  switch (node.type) {
    case "VariableDeclaration": {
      const names = node.declarations.filter((d) => d.id.type === "Identifier").map((d) => d.id.name);
      bind(names, node.kind);
      break;
    }
    case "FunctionDeclaration":
      if (node.id) bind([node.id.name], "function");
      for (const p of node.params) if (p.type === "Identifier") bind([p.name], "param");
      break;
    case "FunctionExpression":
    case "ArrowFunctionExpression":
      for (const p of node.params) if (p.type === "Identifier") bind([p.name], "param");
      break;
    case "ClassDeclaration":
      if (node.id) bind([node.id.name], "block");
      break;
    case "CatchClause":
      if (node.param?.type === "Identifier") bind([node.param.name], "block");
      break;
  }
  for (const key in node) {
    const child = node[key];
    if (Array.isArray(child)) child.forEach((c) => c && typeof c.type === "string" && collect(c));
    else if (child && typeof child.type === "string") collect(child);
  }
})(ast);

// ---- 3. 找自由标识符（引用位置） ----
function isReferencePosition(node) {
  const p = parent.get(node);
  if (!p) return false;
  if (p.type === "MemberExpression" && p.property === node && !p.computed) return false;
  if (p.type === "Property" && p.key === node && !p.computed && !p.shorthand) return false;
  if ((p.type === "MethodDefinition" || p.type === "PropertyDefinition") && p.key === node && !p.computed)
    return false;
  if (p.type === "VariableDeclarator" && p.id === node) return false;
  if ((p.type === "FunctionDeclaration" || p.type === "ClassDeclaration" || p.type === "FunctionExpression" || p.type === "ClassExpression") && p.id === node)
    return false;
  if (p.type === "LabeledStatement" && p.label === node) return false;
  if ((p.type === "BreakStatement" || p.type === "ContinueStatement") && p.label === node) return false;
  if (p.type === "ImportSpecifier" || p.type === "ImportDefaultSpecifier" || p.type === "ImportNamespaceSpecifier")
    return false;
  return true;
}

function isBound(node) {
  let scope = enclosingScope(node);
  while (scope) {
    if (bindings.get(scope)?.has(node.name)) return true;
    if (scope === ast) break;
    scope = enclosingScope(parent.get(scope));
  }
  return false;
}

const free = new Map();
(function find(node) {
  if (node.type === "Identifier" && isReferencePosition(node) && !isBound(node)) {
    free.set(node.name, (free.get(node.name) ?? 0) + 1);
  }
  for (const key in node) {
    const child = node[key];
    if (Array.isArray(child)) child.forEach((c) => c && typeof c.type === "string" && find(c));
    else if (child && typeof child.type === "string") find(child);
  }
})(ast);

for (const [name, count] of [...free].sort((a, b) => b[1] - a[1])) {
  if (filter && !filter.has(name)) continue;
  console.log(`${name}\t${count}`);
}
