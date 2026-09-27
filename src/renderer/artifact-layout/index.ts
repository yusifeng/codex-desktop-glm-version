import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
interface ArtifactLayoutProps { content: unknown; header: unknown; headerPlacement?: string; renderLayout?(parts: { content: unknown; header: unknown; headerPlacement?: string }): unknown }
let runtime: JsxRuntime | undefined; function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function t(props: ArtifactLayoutProps): unknown { return props.renderLayout?.({ header: props.header, headerPlacement: props.headerPlacement, content: props.content }) ?? jsx().jsx(jsx().Fragment, { children: [props.header, props.content] }); }
function n(): void {}
export { n, t };
