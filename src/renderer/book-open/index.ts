import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, e6 as getReactRuntime } from "@rchunk/app-shared";
const jsx = getJsxRuntime();
function BookOpenIcon(props: Record<string, unknown> = {}): unknown { return jsx.jsx("svg", { width: 20, height: 20, viewBox: "0 0 20 20", fill: "currentColor", "data-rtl-flip": "", ...props, children: jsx.jsx("path", { d: "M10 5.6C8.9 3.5 7.4 2.2 5.8 2v11.1c1.6.4 3 1.2 4.2 2.4V5.6Zm1.3 0v9.9a10 10 0 0 1 5.1-1.8V4.8a8.4 8.4 0 0 0-5.1.8ZM3.5 3.5l1 .1v9.1c0 .7.4 1.3 1 1.5 1.4.5 2.6 1.5 3.4 2.7a12 12 0 0 0-5.2-1.2 1.5 1.5 0 0 1-1.5-1.5V5a1.5 1.5 0 0 1 1.3-1.5Z" }) }); }
function initializeBookOpenIcon(): void { getReactRuntime(); }
export { initializeBookOpenIcon as n, BookOpenIcon as t };
