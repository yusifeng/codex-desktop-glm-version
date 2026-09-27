import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/rolldown-runtime";

export type SecretNamespace = "not_sensitive" | "sensitive";
let jsx: JsxRuntime;

function SecretEntryTypeLabel({
  namespace,
}: {
  namespace: SecretNamespace;
}): unknown {
  return ensureJsx().jsx("span", {
    children:
      namespace === "not_sensitive" ? "Environment variable" : "Network secret",
  });
}

function initializeSecretEntryType(): void {
  jsx = getJsxRuntime();
}

function ensureJsx(): JsxRuntime {
  if (jsx == null) jsx = getJsxRuntime();
  return jsx;
}

export { initializeSecretEntryType as n, SecretEntryTypeLabel as t };
