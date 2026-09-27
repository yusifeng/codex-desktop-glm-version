import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import { i_n as useRouterLocation, o_n as useNavigate } from "@rchunk/app-initial";
import "@rchunk/page-layout";
import "@rchunk/rolldown-runtime";

const supportedErrors = new Set(["default", "AuthRateLimit", "identity_provider_mismatch", "account_deactivated", "unsupported_country", "unsupported_region", "sso_required", "session_expired", "violence_auth_freeze", "AccessDenied"]);
let jsx: JsxRuntime;

function BrowserAuthErrorPage(): unknown {
  const location = useRouterLocation();
  const navigate = useNavigate();
  const parameters = new URLSearchParams(location.search);
  const candidate = parameters.get("error") ?? "default";
  const error = supportedErrors.has(candidate) ? candidate : "default";
  const safetyFreeze = error === "violence_auth_freeze";
  return jsx.jsxs("main", {
    "data-error": error,
    children: [
      jsx.jsx("h1", { children: safetyFreeze ? "For safety reasons, we’ve paused your account" : "Oops!" }),
      jsx.jsx("p", { children: safetyFreeze ? "Your account is temporarily unavailable." : "We couldn’t sign you in. Please try again." }),
      safetyFreeze ? null : jsx.jsx("button", { type: "button", onClick: () => navigate("/auth/login", { replace: true }), children: "Try again" }),
    ],
  });
}

function initializeBrowserAuthErrorPage(): void { jsx = getJsxRuntime(); }
initializeBrowserAuthErrorPage();
export { BrowserAuthErrorPage };
