import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { formatReviewSearchPath } = require("../app/.vite/build/worker/git-review-search-path-policy.js");
let n=0; const eq=(...a)=>{n++;assert.equal(...a)};
eq(formatReviewSearchPath({oldPath:"src/a.ts",newPath:"src/a.ts"}), "src/a.ts");
eq(formatReviewSearchPath({oldPath:"src/a.ts",newPath:"src/b.ts"}), "src/a.ts -> src/b.ts");
eq(formatReviewSearchPath({oldPath:"",newPath:"new.ts"}), " -> new.ts");
console.log(`${n} worker review search path policy assertions passed`);
