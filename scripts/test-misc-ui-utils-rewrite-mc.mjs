import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetRoot = path.join(root, "src/webview/assets");
const modules = [
  [
    "metric-helpers-107c5da7f8a5.js",
    "analytics-metric-helpers",
    [
      "A",
      "C",
      "D",
      "E",
      "F",
      "M",
      "N",
      "O",
      "P",
      "S",
      "T",
      "_",
      "a",
      "b",
      "c",
      "d",
      "f",
      "g",
      "h",
      "i",
      "j",
      "k",
      "l",
      "m",
      "n",
      "o",
      "p",
      "r",
      "s",
      "t",
      "u",
      "v",
      "w",
      "x",
      "y",
    ],
  ],
  [
    "rosalind-helix-db030adb2faf.js",
    "life-sciences-helix-background",
    ["LifeSciencesHelixBackground"],
  ],
  [
    "tsrx.types-and-jsx-7076429c22c1.js",
    "tsrx-types-and-jsx",
    [
      "brackets",
      "comment",
      "default",
      "directives",
      "docblock",
      "jsdoctype",
      "jsx",
      "regex",
      "regexp",
      "string",
      "template",
      "type",
    ],
  ],
];
const dependencyAliases = { "analytics-middleware": "middleware" };
const dependencies = (source, pattern) =>
  [...source.matchAll(pattern)].map((match) => {
    const name = match[1].replace(/-[a-f0-9]{12}$/u, "");
    return dependencyAliases[name] ?? name;
  });

let sourceAssertions = 0;
for (const [asset, directory] of modules) {
  const original = fs.readFileSync(
    path.join(assetRoot, asset.replace(/\.js$/u, ".ts")),
    "utf8",
  );
  const recovered = fs.readFileSync(
    path.join(root, "src/renderer", directory, "index.ts"),
    "utf8",
  );
  assert.deepEqual(
    dependencies(original, /from "\.\/([^"]+)\.js"/gu),
    dependencies(recovered, /(?:from\s*|import\s*)["']@rchunk\/([^"']+)/gu),
  );
  assert.equal(
    (original.match(/import\(/gu) ?? []).length,
    (recovered.match(/import\(/gu) ?? []).length,
  );
  assert.equal(
    /(?:\bas\s+any\b|:\s*any\b|<any>)|@ts-expect-error/u.test(recovered),
    false,
  );
  assert.ok(recovered.includes(`Release chunk: ${asset}`));
  assert.equal(/from\s+["']\./u.test(recovered), false);
  sourceAssertions += 5;
}

globalThis.window = {
  addEventListener() {},
  removeEventListener() {},
  navigator: { onLine: true },
  localStorage: {
    clear() {},
    getItem() {
      return null;
    },
    key() {
      return null;
    },
    get length() {
      return 0;
    },
    removeItem() {},
    setItem() {},
  },
};
globalThis.document = { documentElement: {}, visibilityState: "visible" };
const jsx = { jsx: (type, props) => ({ type, props }) };
const React = {
  useEffect: (effect) => effect(),
  useRef: (value) => ({ current: value }),
};
class BaseStats {
  increments = [];
  gauges = [];
  gauge(metric, value, tags) {
    this.gauges.push({ metric, value, tags });
  }
  increment(metric, value, tags) {
    this.increments.push({ metric, value, tags });
  }
}
class BaseContext {
  constructor(event, id, stats = new BaseStats()) {
    this.event = event;
    this.id = id;
    this.stats = stats;
    this.logs = [];
  }
  cancel(reason) {
    this.cancelReason = reason;
  }
  log(level, message, detail) {
    this.logs.push({ level, message, detail });
  }
}
class MiddlewareFailure extends Error {
  constructor(type) {
    super(type);
    this.type = type;
  }
}
class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  lerp(target, alpha) {
    this.x += (target.x - this.x) * alpha;
    this.y += (target.y - this.y) * alpha;
    return this;
  }
  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }
}
class Color {
  constructor() {
    this.r = 0.5;
    this.g = 0.5;
    this.b = 0.5;
  }
  copy(color) {
    Object.assign(this, color);
    return this;
  }
}
class Geometry {
  setAttribute() {
    return this;
  }
  dispose() {}
}
class Material {
  constructor(options = {}) {
    this.blending = options.blending ?? 1;
    this.needsUpdate = false;
    this.uniforms = options.uniforms ?? {};
  }
  dispose() {}
}
class SceneObject {
  constructor(geometry, material) {
    this.geometry = geometry;
    this.material = material;
    this.position = { z: 0 };
    this.rotation = { z: 0 };
    this.renderOrder = 0;
    this.frustumCulled = true;
  }
}
class Camera {
  constructor(fov, aspect) {
    this.fov = fov;
    this.aspect = aspect;
    this.position = { z: 0 };
  }
  updateProjectionMatrix() {}
}
class Scene {
  add() {}
  remove() {}
}
class Renderer {
  setClearColor() {}
  setPixelRatio() {}
  setSize() {}
  render() {}
  dispose() {}
}

globalThis.__mcMocks = {
  "@rchunk/rolldown-runtime": {
    n: (initializer) => {
      let initialized = false;
      return () => {
        if (!initialized) {
          initialized = true;
          initializer();
        }
      };
    },
  },
  "@rchunk/app-shared": {
    I3: () => jsx,
    XQ: () => false,
    YQ() {},
    e6: () => React,
    p4() {},
  },
  "@rchunk/analytics-middleware": {
    c: BaseContext,
    d() {},
    l() {},
    s: MiddlewareFailure,
    u: BaseStats,
  },
  "@rchunk/load-script": { p: () => false },
  "@rchunk/three.core": {
    A: Geometry,
    H: Color,
    Hi: Material,
    Ii: Geometry,
    Jn: { degToRad: (degrees) => (degrees * Math.PI) / 180 },
    Kn: Material,
    Nt: class {},
    Or: SceneObject,
    Qn: SceneObject,
    Sr: Camera,
    Va: Vector2,
    Vi: Scene,
  },
  "@rchunk/three.module": { n: Renderer, r() {} },
};

async function bundle(directory) {
  const entry = path.join(root, "src/renderer", directory, "index.ts");
  const result = await esbuild.build({
    bundle: true,
    entryPoints: [entry],
    format: "esm",
    platform: "browser",
    write: false,
    plugins: [
      {
        name: "mc-mocks",
        setup(build) {
          build.onResolve({ filter: /^@rchunk\// }, (args) => ({
            path: args.path,
            namespace: "mc-mock",
          }));
          build.onLoad({ filter: /.*/, namespace: "mc-mock" }, (args) => ({
            contents: `module.exports = globalThis.__mcMocks[${JSON.stringify(args.path)}];`,
            loader: "js",
          }));
        },
      },
    ],
  });
  const code = result.outputFiles[0].text;
  return import(
    `data:text/javascript;base64,${Buffer.from(code).toString("base64")}#${directory}`
  );
}

const metric = await bundle("analytics-metric-helpers");
const helix = await bundle("life-sciences-helix-background");
let grammar;
try {
  grammar = await bundle("tsrx-types-and-jsx");
} catch (error) {
  throw new Error(
    `TSRX bundle import failed: ${error instanceof Error ? error.message.split("\n")[0] : String(error)}`,
  );
}
let runtimeAssertions = 0;
for (const [asset, directory, expectedExports] of modules) {
  const target =
    directory === "analytics-metric-helpers"
      ? metric
      : directory === "life-sciences-helix-background"
        ? helix
        : grammar;
  assert.deepEqual(
    Object.keys(target).sort(),
    [...expectedExports].sort(),
    `${asset} export surface`,
  );
  runtimeAssertions += 1;
}

metric.F();
const deferred = metric.P();
assert.equal(deferred.isSettled(), false);
deferred.resolve(42);
assert.equal(await deferred.promise, 42);
assert.equal(deferred.isSettled(), true);
runtimeAssertions += 3;
metric.N();
const emitter = new metric.M({ maxListeners: 2 });
let emitted = 0;
emitter.once("tick", (value) => {
  emitted += value;
});
emitter.emit("tick", 3).emit("tick", 5);
assert.equal(emitted, 3);
runtimeAssertions += 1;
metric.j();
const queue = new metric.A(2, []);
assert.deepEqual(queue.push({ id: "a" }, { id: "b" }), [true, true]);
assert.equal(queue.length, 2);
assert.equal(queue.push({ id: "a" })[0], false);
assert.equal(queue.pop().id, "b");
runtimeAssertions += 4;
assert.equal(metric.T(), true);
assert.equal(metric.w(), false);
assert.equal(metric.h(), "npm");
assert.equal(metric.v, "1.82.0");
assert.equal(metric.p, "api.segment.io/v1");
runtimeAssertions += 5;
assert.deepEqual(
  metric.i(
    { integrations: { alpha: { base: true }, beta: {} } },
    { integrations: { alpha: { override: true }, beta: false } },
  ),
  { alpha: { base: true, override: true }, beta: {} },
);
runtimeAssertions += 1;
const stats = new BaseStats();
metric.n(stats, {
  integrationName: "demo",
  methodName: "track",
  type: "destination",
  didError: true,
});
assert.equal(
  stats.increments[0].metric,
  "analytics_js.integration.invoke.error",
);
assert.deepEqual(stats.increments[0].tags, [
  "method:track",
  "integration_name:demo",
  "type:destination",
]);
runtimeAssertions += 2;
let repeats = 0;
const repeated = await metric.o(
  (value) => value == null || value < 3,
  async () => ++repeats,
);
assert.equal(repeated, 3);
assert.equal(repeats, 3);
runtimeAssertions += 2;
const context = new BaseContext({ type: "track" });
const pluginResult = await metric.E(context, {
  name: "plugin",
  track: (value) => value,
});
assert.equal(pluginResult, context);
assert.equal(context.stats.gauges[0].metric, "plugin_time");
runtimeAssertions += 2;

const canvas = helix.LifeSciencesHelixBackground({
  className: "helix",
  disableRendering: true,
});
assert.equal(canvas.type, "canvas");
assert.equal(canvas.props.className, "helix");
assert.equal(canvas.props["aria-hidden"], "true");
runtimeAssertions += 3;

assert.equal(Object.keys(grammar.default).length, 75);
runtimeAssertions += 1;
const fragments = [
  "type",
  "string",
  "template",
  "regex",
  "regexp",
  "comment",
  "directives",
  "docblock",
  "brackets",
  "jsdoctype",
  "jsx",
];
for (const name of fragments) {
  assert.equal(grammar.default[name], grammar[name], `${name} identity`);
  runtimeAssertions += 1;
}
assert.deepEqual(
  Object.fromEntries(
    fragments.map((name) => [name, grammar[name].patterns.length]),
  ),
  {
    type: 15,
    string: 3,
    template: 2,
    regex: 2,
    regexp: 8,
    comment: 3,
    directives: 1,
    docblock: 18,
    brackets: 2,
    jsdoctype: 1,
    jsx: 7,
  },
);
runtimeAssertions += 1;
assert.match(grammar.default["type-primitive"].match, /unknown/u);
assert.equal(grammar.default["template-substitution-element"].begin, "\\$\\{");
assert.equal(grammar.default["template-substitution-element"].end, "\\}");
assert.ok(
  grammar.regexp.patterns.some(
    (rule) => rule.name === "meta.group.assertion.regexp",
  ),
);
assert.equal(grammar.default["jsx-tag-fragment"].begin, "(<)(>)");
assert.equal(
  grammar.default["module-declaration"].patterns[0].include,
  "#statements",
);
runtimeAssertions += 6;
const includes = [];
const collectIncludes = (value) => {
  if (Array.isArray(value)) for (const item of value) collectIncludes(item);
  else if (value != null && typeof value === "object") {
    if (typeof value.include === "string") includes.push(value.include);
    for (const nested of Object.values(value)) collectIncludes(nested);
  }
};
collectIncludes([grammar.default, ...fragments.map((name) => grammar[name])]);
assert.equal(includes.length, 224);
assert.deepEqual(
  [...new Set(includes.filter((value) => !value.startsWith("#")))].sort(),
  ["source.css", "source.ts"],
);
const local = new Set(
  includes
    .filter((value) => value.startsWith("#"))
    .map((value) => value.slice(1)),
);
const unresolved = [...local]
  .filter((name) => !(name in grammar.default))
  .sort();
assert.deepEqual(unresolved, [
  "expression",
  "expressionPunctuations",
  "expressionWithoutIdentifiers",
  "field-declaration",
  "function-parameters",
  "identifiers",
  "indexer-declaration",
  "indexer-mapped-type-declaration",
  "method-declaration",
  "numeric-literal",
  "statements",
  "support-function-call-identifiers",
  "tsrx-template-block-directive",
  "tsrx-template-child-directive",
  "tsrx-template-comment",
  "tsrx-template-directive",
  "typeof-operator",
]);
runtimeAssertions += 3;
assert.deepEqual(JSON.parse(JSON.stringify(grammar.default)), grammar.default);
runtimeAssertions += 1;

console.log(
  `${sourceAssertions} source assertions and ${runtimeAssertions} runtime assertions passed`,
);
