import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { isOctalDigit, isThreeDigitOctal } = require("../app/.vite/build/worker/git-diff-octal-policy.js");
let n=0; const eq=(...a)=>{n++;assert.equal(...a)};
eq(isOctalDigit("0"), true); eq(isOctalDigit("7"), true); eq(isOctalDigit("8"), false); eq(isOctalDigit(""), false);
eq(isThreeDigitOctal("000"), true); eq(isThreeDigitOctal("707"), true); eq(isThreeDigitOctal("708"), false); eq(isThreeDigitOctal("70"), false); eq(isThreeDigitOctal("７０７"), false);
console.log(`${n} worker diff octal policy assertions passed`);
