import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/app-shared/runtime/codex-links.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
});
const links = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

check(links.CODEX_WEB_URL === "https://chatgpt.com/codex", "exposes the Codex web entrypoint");
const threadLink = links.parseCodexDeepLink("codex://threads/thread-123?view=review");
check(threadLink.destination === "threads", "uses the deep-link host as its destination");
check(threadLink.url.searchParams.get("view") === "review", "preserves deep-link query parameters");
check(
  links.parseCodexDeepLink("codex-dev://settings").destination === "settings",
  "accepts development deep links",
);
check(links.parseCodexDeepLink("https://chatgpt.com/codex") === null, "rejects web URLs");
check(links.parseCodexDeepLink("not a url") === null, "rejects malformed URL strings");
const urlObject = new URL("codex://projects/project-1");
check(links.parseCodexDeepLink(urlObject).url === urlObject, "preserves URL object identity");
check(
  links.parseCodexDeepLink("codex://user:secret@threads/thread-1").destination === "unsupported",
  "rejects authenticated destinations",
);
check(
  links.parseCodexDeepLink("codex://threads:1234/thread-1").destination === "unsupported",
  "rejects destinations with explicit ports",
);

const xml = `
  <codex_delegation>
    <source_thread_id> thread-123 </source_thread_id>
    <input>Fix &lt;main&gt; &amp; verify</input>
  </codex_delegation>
`;
const delegation = links.parseCodexDelegation(xml);
check(delegation.sourceThreadId === "thread-123", "extracts and trims the source thread id");
check(delegation.input === "Fix <main> & verify", "decodes supported XML entities");
check(
  links.parseCodexDelegation(
    "<codex_delegation><SOURCE_THREAD_ID>x</SOURCE_THREAD_ID><INPUT>y</INPUT></codex_delegation>",
  ).input === "y",
  "matches inner field tags case-insensitively",
);
check(
  links.parseCodexDelegation(
    "<CODEX_DELEGATION><source_thread_id>x</source_thread_id><input>y</input></CODEX_DELEGATION>",
  ) === null,
  "keeps the outer envelope case-sensitive",
);
check(
  links.parseCodexDelegation("<codex_delegation><input>missing id</input></codex_delegation>") === null,
  "requires a source thread id",
);
check(links.parseCodexDelegation("plain text") === null, "rejects non-delegation text");
check(
  links.parseCodexDelegation(
    "<codex_delegation><source_thread_id>x</source_thread_id><input>&amp;lt;</input></codex_delegation>",
  ).input === "&lt;",
  "decodes entities once in original replacement order",
);

for (const name of ["create_thread", "handoff_thread", "send_message_to_thread"]) {
  check(
    links.extractCodexDelegationToolOutput({ namespace: "codex_app", name, output: xml }) === xml,
    `accepts ${name} delegation output`,
  );
}
check(
  links.extractCodexDelegationToolOutput({ namespace: "other", name: "create_thread", output: xml }) === null,
  "rejects other tool namespaces",
);
check(
  links.extractCodexDelegationToolOutput({ namespace: "codex_app", name: "archive_thread", output: xml }) === null,
  "rejects tools that cannot delegate",
);
check(
  links.extractCodexDelegationToolOutput({ namespace: "codex_app", name: "create_thread", output: 42 }) === null,
  "rejects non-string tool output",
);
check(
  links.extractCodexDelegationToolOutput({ namespace: "codex_app", name: "create_thread", output: "invalid" }) === null,
  "rejects malformed delegation output",
);
check(links.initializeCodexWebUrl() === undefined, "keeps URL initialization idempotent");
check(links.initializeCodexDelegationParser() === undefined, "keeps parser initialization idempotent");

console.log(`app-shared Codex link behavior: ${assertions}/${assertions} assertions passed`);
