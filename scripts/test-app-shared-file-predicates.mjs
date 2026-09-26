import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/app-shared/runtime/file-predicates.ts"),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
});

const predicates = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function equal(actual, expected, message) {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
}

equal(predicates.isDirectoryPath({ path: "/tmp/" }), true, "accepts POSIX directories");
equal(predicates.isDirectoryPath({ path: "C:\\tmp\\" }), true, "accepts Windows directories");
equal(predicates.isDirectoryPath({ path: "/tmp/file" }), false, "rejects file paths");
equal(predicates.isDirectoryPath({ path: "" }), false, "rejects empty paths");

for (const extension of [
  "csv",
  "docx",
  "ipynb",
  "pdf",
  "pptx",
  "tex",
  "tsv",
  "xlsm",
  "xlsx",
]) {
  equal(
    predicates.isRichFilePath({ path: `/tmp/file.${extension}` }),
    true,
    `accepts .${extension}`,
  );
}
equal(predicates.isRichFilePath({ path: "/tmp/file.PDF" }), true, "ignores extension case");
equal(predicates.isRichFilePath({ path: "/tmp/file.txt" }), false, "rejects plain text");
equal(
  predicates.isRichFilePath({ path: "/tmp/file.pdf", startLine: 0 }),
  false,
  "rejects line-specific references",
);
equal(
  predicates.isRichFilePath({ path: "/tmp/file.txt", fsPath: "/tmp/file.xlsx" }),
  true,
  "prefers a non-empty filesystem path",
);
equal(
  predicates.isRichFilePath({ path: "/tmp/file.pdf", fsPath: "" }),
  true,
  "falls back from an empty filesystem path",
);

for (const code of ["ENOENT", "ENOTDIR"]) {
  const error = new Error("failed");
  error.code = code;
  equal(predicates.isMissingFileError(error), true, `accepts ${code} codes`);
}
for (const message of [
  "spawn ENOENT",
  "No such file or directory",
  "Not a directory",
  "failed (os error 2)",
  "failed (os error 3)",
]) {
  equal(
    predicates.isMissingFileError(new Error(message)),
    true,
    `accepts ${message}`,
  );
}
equal(predicates.isMissingFileError(new Error("EACCES")), false, "rejects other errors");
equal(
  predicates.isMissingFileError({ code: "ENOENT", message: "missing" }),
  false,
  "requires an Error instance",
);
equal(predicates.initializeMissingFileError(), undefined, "initializes missing-file errors");

for (const value of ["libfile-abc", "libfile_abc-123", "libfile-A_B"])
  equal(predicates.isLibraryFileId(value), true, `accepts ${value}`);
for (const value of ["libfile-", "libfile_", "prefix-libfile-abc", "libfile/a"])
  equal(predicates.isLibraryFileId(value), false, `rejects ${value}`);
equal(predicates.initializeLibraryFileId(), undefined, "initializes library file IDs");

console.log(
  `app-shared file predicate behavior: ${assertions}/${assertions} assertions passed`,
);
