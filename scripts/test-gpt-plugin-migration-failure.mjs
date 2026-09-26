import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__migrationFailureTest = {
  updatesDisabled: false,
  jsx: {
    jsx: (type, props, key) => ({ type, props, key }),
    jsxs: (type, props, key) => ({ type, props, key }),
  },
};
const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/gpt-plugin-migration-failure/index.ts"),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [
    {
      name: "mock-chunks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath.slice("@rchunk/".length),
          namespace: "mock",
        }));
        build.onLoad(
          { filter: /.*/, namespace: "mock" },
          ({ path: importPath }) => ({
            contents:
              {
                "app-shared": `
                  export const I3 = () => globalThis.__migrationFailureTest.jsx;
                  export const Y2 = "FormattedMessage"; export const om = "Alert";
                  export const ZI = "scope"; export const oZ = (_scope, value) => value;
                  export const FX = () => {}; export const QI = () => {}; export const $3 = () => {};
                  export const K2 = () => {}; export const sm = () => {};
                `,
                "app-initial": `
                  export const afn = () => ({ get: () => globalThis.__migrationFailureTest.updatesDisabled });
                  export const n7 = "Banner"; export const ifn = () => {}; export const r7 = () => {};
                `,
              }[importPath] ?? "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const failure = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);
const knowledge = {
  type: "knowledge_file",
  file_id: "file-1",
  message: "fallback error",
};
const profile = { type: "profile_picture", message: "image error" };
const issues = [
  {
    resource: { type: "knowledge_file", id: "file-1", name: "Guide.pdf" },
    message: "too large",
  },
];
let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

let node = failure.t({
  failedFiles: [knowledge, profile],
  files: [],
  issues,
  migrationSucceeded: false,
});
check(
  node.type === "div" && node.props.children.length === 2,
  "renders both profile and file failures",
);
const profileWarning = node.props.children[0];
check(
  profileWarning.type === "Banner" && profileWarning.props.type === "warning",
  "uses a warning callout for profile copy failure",
);
check(
  profileWarning.props.content.props.children.props.defaultMessage.startsWith(
    "We couldn’t copy",
  ),
  "uses pre-migration profile guidance",
);
const alert = node.props.children[1];
check(
  alert.type === "Alert" && alert.props.level === "danger",
  "uses a danger alert for blocking files",
);
check(
  alert.props.children.props.children[0].props.children.props.values.count ===
    1,
  "reports the failed knowledge-file count",
);
const fileNode = alert.props.children.props.children[2].props.children[0];
const renderedFile = fileNode.type(fileNode.props);
check(
  renderedFile.props.children.props.values.filename === "Guide.pdf",
  "prefers the issue resource filename",
);
check(
  renderedFile.props.children.props.values.message === "too large",
  "prefers the server issue message",
);

stateSafeSet("updatesDisabled", true);
node = failure.t({
  failedFiles: [knowledge],
  files: [
    {
      file_id: "file-1",
      file_response_type: "full_file_response",
      name: "Upload.txt",
    },
  ],
  issues: [],
  migrationSucceeded: false,
});
check(
  node.props.children[1].props.children.props.children[1].props.children.props
    .defaultMessage === "Your plugin wasn’t created. Try again later.",
  "uses readonly recovery guidance when updates are disabled",
);

node = failure.t({
  failedFiles: [knowledge, profile],
  files: [],
  issues: [],
  migrationSucceeded: true,
});
check(
  node.props.children[0].props.content.props.children.props.defaultMessage.startsWith(
    "Your plugin was created",
  ),
  "uses post-success profile guidance",
);
check(
  node.props.children[1].props.children.props.children[1].props.children.props.defaultMessage.startsWith(
    "Your plugin was created without",
  ),
  "explains omitted files after success",
);

node = failure.t({
  failedFiles: [],
  files: [],
  issues: [],
  migrationSucceeded: false,
});
check(
  node.props.children[0] === null && node.props.children[1] === null,
  "renders no warnings without failures",
);
check(
  typeof failure.i === "function",
  "exports the migration failure state atom",
);

function stateSafeSet(key, value) {
  globalThis.__migrationFailureTest[key] = value;
}

assert.equal(assertions, 12);
console.log(`${assertions} GPT plugin migration failure assertions passed`);
