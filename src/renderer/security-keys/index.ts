import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, e6 as getReact } from "@rchunk/app-shared";

interface SecurityKeysIconProps extends Record<string, unknown> {
  className?: string;
}

const jsx = getJsxRuntime();

function SecurityKeysIcon(props: SecurityKeysIconProps): unknown {
  return jsx.jsxs("svg", {
    width: 20,
    height: 20,
    viewBox: "0 0 20 20",
    fill: "currentColor",
    xmlns: "http://www.w3.org/2000/svg",
    ...props,
    children: [
      jsx.jsx("path", {
        d: "M6.667 5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Z",
      }),
      jsx.jsx("path", {
        fillRule: "evenodd",
        clipRule: "evenodd",
        d: "M6.667 2.252a4.832 4.832 0 0 1 2.748 8.802v.613a.667.667 0 0 1-.111.369l-.588.881.588.881a.667.667 0 0 1 .111.369v.56c0 .618-.245 1.212-.683 1.649l-1.3 1.301a1.083 1.083 0 0 1-1.53 0L4.6 16.376a2.333 2.333 0 0 1-.682-1.65v-3.672a4.832 4.832 0 0 1 2.749-8.802Zm0 1.33a3.502 3.502 0 0 0-1.75 6.534.667.667 0 0 1 .331.575v4.036c0 .265.106.52.294.708l1.124 1.124 1.125-1.124c.188-.188.294-.443.294-.708v-.359l-.722-1.082a.667.667 0 0 1 0-.738l.722-1.083v-.774c0-.237.127-.456.332-.575a3.502 3.502 0 0 0-1.75-6.534Z",
      }),
      jsx.jsx("path", {
        d: "M12.291 2.687a4.832 4.832 0 0 1 4.408 7.537l.22.571a.667.667 0 0 1 .028.384l-.234 1.033.865.612a.667.667 0 0 1 .236.305l.2.522c.216.562.2 1.187-.046 1.785l-.748 1.68a1.083 1.083 0 0 1-1.428.548l-1.68-.749a2.333 2.333 0 0 1-1.228-1.294l-1.316-3.427-.137-.033a.667.667 0 0 1 .354-1.283l.378.082a.667.667 0 0 1 .516.419l1.446 3.766a1 1 0 0 0 .527.555l1.453.647.648-1.453a1 1 0 0 0 .02-.766l-.129-.335-1.061-.752a.667.667 0 0 1-.264-.689l.284-1.27-.275-.72a.667.667 0 0 1 .103-.657 3.502 3.502 0 0 0-3.17-5.678.667.667 0 0 1-.172-1.32l.172-.024Z",
      }),
    ],
  });
}

function initializeSecurityKeysIcon(): void {
  void getReact;
}

export { initializeSecurityKeysIcon as n, SecurityKeysIcon as t };
