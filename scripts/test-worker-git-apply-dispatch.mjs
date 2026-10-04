import assert from "node:assert/strict"; import fs from "node:fs/promises"; import * as esbuild from "esbuild";
const source = await fs.readFile("src/main/worker/git-apply-dispatch.ts", "utf8"); const { code } = await esbuild.transform(source, { loader: "ts", format: "cjs" }); const module = { exports: {} }; new Function("module", "exports", code)(module, module.exports);
const { dispatchGitApplyRequest } = module.exports; const deps = { applyChanges: (p) => ({ result: `changes:${p.id}`, refreshRoot: "/r" }), applyPatch: (p) => ({ result: `patch:${p.id}`, refreshRoot: null }), applyReviewSectionChanges: (p) => ({ result: `review:${p.id}`, refreshRoot: "/r2" }) };
assert.deepEqual(await dispatchGitApplyRequest("apply-changes", { id: 1 }, deps), { result: "changes:1", refreshRoot: "/r" });
assert.deepEqual(await dispatchGitApplyRequest("apply-patch", { id: 2 }, deps), { result: "patch:2", refreshRoot: null });
assert.deepEqual(await dispatchGitApplyRequest("apply-review-section-changes", { id: 3 }, deps), { result: "review:3", refreshRoot: "/r2" });
assert.equal(await dispatchGitApplyRequest("unknown", {}, deps), undefined);
console.log("worker Git apply dispatch tests passed (4 assertions)");
