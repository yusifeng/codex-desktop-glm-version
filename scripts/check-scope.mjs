// 作用域级「自由变量」分析器：找出一个 JS 语法文件中未被任何局部作用域绑定的标识符。
// 用途：vendor 提取后的 wiring 检查——vendor 代码引用了已被移走的顶层符号时会暴露出来。
//
//   node scripts/check-scope.mjs <file.js/ts> [--names n1,n2,...]
//     默认输出全部自由变量及出现次数；--names 只关心指定名字。
// 只支持纯 JS 语法（vendor.ts）；TS 模块由 tsc 把关。
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
});

// ---- 单遍迭代 DFS：作用域分配 + 绑定收集 ----
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
  n.type === "Program" ||
  n.type === "FunctionDeclaration" ||
  n.type === "FunctionExpression" ||
  n.type === "ArrowFunctionExpression";

const nodeScope = new Map(); // 节点 -> 直接包含它（不含自身）的作用域
const scopeParent = new Map(); // 作用域 -> 父作用域
const bindings = new Map(); // 作用域 -> Set<name>
const parents = new Map(); // 节点 -> 父节点（引用位置判断用）

const addBinding = (scope, name) => {
  let set = bindings.get(scope);
  if (!set) bindings.set(scope, (set = new Set()));
  set.add(name);
};
const nearestFunctionScope = (scope) => {
  let s = scope;
  while (s && !isFunctionScope(s)) s = scopeParent.get(s);
  return s ?? ast;
};

// 从解构模式（ArrayPattern/ObjectPattern/AssignmentPattern/RestElement）中提取绑定的名字
function patternNames(node, out = []) {
  if (!node) return out;
  switch (node.type) {
    case "Identifier": out.push(node.name); break;
    case "ArrayPattern": node.elements.forEach((e) => patternNames(e, out)); break;
    case "ObjectPattern": node.properties.forEach((p) => patternNames(p.value, out)); break;
    case "AssignmentPattern": patternNames(node.left, out); break;
    case "RestElement": patternNames(node.argument, out); break;
  }
  return out;
}

function declare(node, scope) {
  switch (node.type) {
    case "VariableDeclaration": {
      const names = node.declarations.flatMap((d) => patternNames(d.id));
      for (const name of names)
        addBinding(node.kind === "var" ? nearestFunctionScope(scope) : scope, name);
      break;
    }
    case "FunctionDeclaration":
      if (node.id) addBinding(scope, node.id.name);
      for (const p of node.params) for (const name of patternNames(p)) addBinding(node, name);
      break;
    case "FunctionExpression":
    case "ArrowFunctionExpression":
      for (const p of node.params) for (const name of patternNames(p)) addBinding(node, name);
      break;
    case "ClassDeclaration":
      if (node.id) addBinding(scope, node.id.name);
      break;
    case "CatchClause":
      if (node.param) for (const name of patternNames(node.param)) addBinding(node, name);
      break;
  }
}

const stack = [{ node: ast, scope: null, keys: Object.keys(ast), i: 0 }];
while (stack.length) {
  const frame = stack[stack.length - 1];
  const { node } = frame;
  if (frame.i === 0) {
    const parentScope = frame.scope;
    nodeScope.set(node, isScopeNode(node) && parentScope === null ? ast : parentScope);
    // 若父帧的节点本身是作用域（且当前不是它的 id/params），子节点的作用域就是它
    declare(node, nodeScope.get(node) ?? ast);
  }
  if (frame.i < frame.keys.length) {
    const key = frame.keys[frame.i++];
    const child = node[key];
    // 子节点的作用域：若当前节点是作用域节点，则为它自身；否则沿用当前作用域。
    // 例外：FunctionDeclaration 的 id/params 属于外层作用域——精度足够，忽略。
    const childScope = isScopeNode(node) ? node : nodeScope.get(node);
    const visit = (c) => {
      if (c && typeof c.type === "string") {
        parents.set(c, node);
        scopeParent.set(c, isScopeNode(c) ? childScope : scopeParent.get(c) ?? null);
        if (isScopeNode(c)) scopeParent.set(c, childScope);
        stack.push({ node: c, scope: childScope, keys: Object.keys(c), i: 0 });
      }
    };
    if (Array.isArray(child)) child.forEach(visit);
    else visit(child);
  } else {
    stack.pop();
  }
}

// ---- 引用位置判定与自由变量收集 ----
function isReferencePosition(node) {
  const p = parents.get(node);
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
  return true;
}

function isBound(node) {
  for (let s = nodeScope.get(node); s; s = scopeParent.get(s))
    if (bindings.get(s)?.has(node.name)) return true;
  return false;
}

const free = new Map();
const stack2 = [ast];
while (stack2.length) {
  const node = stack2.pop();
  if (node.type === "Identifier" && isReferencePosition(node) && !isBound(node))
    free.set(node.name, (free.get(node.name) ?? 0) + 1);
  for (const key in node) {
    const child = node[key];
    if (Array.isArray(child)) {
      for (const c of child) if (c && typeof c.type === "string") stack2.push(c);
    } else if (child && typeof child.type === "string") stack2.push(child);
  }
}

for (const [name, count] of [...free].sort((a, b) => b[1] - a[1])) {
  if (filter && !filter.has(name)) continue;
  console.log(`${name}\t${count}`);
}
