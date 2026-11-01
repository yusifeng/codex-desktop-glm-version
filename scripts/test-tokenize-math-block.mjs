import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const onceRuntime = `export const n=initializer=>{let done=false;return()=>{if(!done){done=true;initializer();}}};`;

async function bundle(entry, exact) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, entry)],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [
      {
        name: "math-tokenizer-runtime",
        setup(build) {
          build.onResolve(
            { filter: exact ? /^\.\/.*\.js$/ : /^@rchunk\// },
            ({ path: modulePath }) => ({
              path: modulePath,
              namespace: "mock",
            }),
          );
          build.onLoad({ filter: /.*/, namespace: "mock" }, () => ({
            contents: onceRuntime,
            loader: "js",
          }));
        },
      },
    ],
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${exact ? "exact" : "semantic"}`
  );
}

const semantic = await bundle(
  "src/renderer/tokenize-math-block/index.ts",
  false,
);
const exact = await bundle(
  ".reference/app-original/webview/assets/tokenize-math-block-92dba400da42.js",
  true,
);
semantic.n();
exact.n();

const equations = [
  "y = 2x + 3",
  String.raw`y=\frac{1}{2}x^2`,
  String.raw`y=\sqrt{x}+\pi`,
  String.raw`y=\sin^2(x)`,
  String.raw`y=\log_{2}{x}`,
  String.raw`y=|x-1|`,
  "y=-x^2+3x",
  "f(x)=x+1",
  "y=f(x)+1",
  "y=(x+1",
  "x+y=2",
  "not an equation",
];
for (const equation of equations)
  assert.deepEqual(
    semantic.r(equation),
    exact.r(equation),
    `equation tokenization differs for ${equation}`,
  );

const customFunctions = { customFunctionNames: new Set(["f"]) };
assert.deepEqual(
  semantic.r("y=f(x)+1", customFunctions),
  exact.r("y=f(x)+1", customFunctions),
);

const integrals = [
  String.raw`\int x\,dx`,
  String.raw`\int_0^1 x^2 dx`,
  String.raw`\int_{0}^{\pi} \sin(x) dx`,
  String.raw`\int t^2 dt`,
  String.raw`\int \frac{dy}{y}`,
  String.raw`\int \frac{1}{1+x^2} dx`,
  String.raw`\int x+y dx`,
  String.raw`\iint x dx`,
  "no integral",
];
for (const integral of integrals)
  assert.deepEqual(
    semantic.i(integral),
    exact.i(integral),
    `integral parsing differs for ${integral}`,
  );

const variables = [
  { type: "identifier", value: "x" },
  { type: "identifier", value: "theta" },
  { type: "identifier", value: "theta" },
  { type: "identifier", value: "e" },
  { type: "identifier", value: "a" },
];
assert.deepEqual(semantic.t(variables), exact.t(variables));
assert.deepEqual(semantic.t(variables), ["theta", "a"]);
assert.equal(typeof semantic.n, "function");

console.log("25 math tokenizer parity assertions passed");
