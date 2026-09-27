import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/profile-view";

export interface ProfilePageProps {
  today?: Date | string;
  username?: string;
  editPaneOpen?: boolean;
  header?: unknown;
  children?: unknown;
  onUsernameChanged?(username: string): void;
}

let jsx: JsxRuntime;
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }

function ProfilePage(props: ProfilePageProps): unknown {
  const runtime = ensureJsx();
  return runtime.jsxs("main", { className: "profile-page", "data-profile-v2-enabled": true, children: [
    props.editPaneOpen ? null : (props.header ?? runtime.jsx("header", { children: runtime.jsx("h1", { children: props.username ? `${props.username}'s profile` : "Profile" }) })),
    runtime.jsxs("section", { "data-today": props.today instanceof Date ? props.today.toISOString() : props.today, children: [props.children, runtime.jsx("input", { "aria-label": "Username", value: props.username ?? "", onChange: (event: { currentTarget: { value: string } }) => props.onUsernameChanged?.(event.currentTarget.value) })] }),
  ] });
}

export { ProfilePage };
