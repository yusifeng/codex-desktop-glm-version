import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const p = require("../app/.vite/build/worker/git-commit-message-policy.js");
let n=0; const eq=(...a)=>{n++;assert.equal(...a)};
eq(p.formatCommitAttribution(undefined), "Codex <noreply@openai.com>"); eq(p.formatCommitAttribution("  "), null); eq(p.formatCoAuthorTrailer("A <a@b>"), "Co-authored-by: A <a@b>"); eq(p.endsWithCommitTrailerBlock("Subject\n\nSigned-off-by: A"), true); eq(p.endsWithCommitTrailerBlock("Subject\n\ntext"), false); eq(p.formatCommitMessage("Subject", "A <a@b>", {escapeRegExp:v=>v.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}), "Subject\n\nCo-authored-by: A <a@b>");
console.log(`${n} worker git commit message policy assertions passed`);
