import assert from "node:assert/strict";
import { resolveAnnotationFrameDocumentUrl } from "../app/.vite/build/browser-page-preload/annotation-frame-document-url.js";
const isFrame = (value) => value?.kind === `frame`;
assert.equal(resolveAnnotationFrameDocumentUrl({ location: { href: `https://child` } }, [], `https://root`, isFrame), null);
assert.equal(resolveAnnotationFrameDocumentUrl({ location: { href: `https://child` } }, [`0`], `https://root`, isFrame), `https://child`);
assert.equal(resolveAnnotationFrameDocumentUrl({ location: { href: `https://root` }, frameElement: { kind: `frame`, src: `https://src` } }, [`0`], `https://root`, isFrame), `https://src`);
console.log("test-preload-annotation-frame-document-url: 3 assertions passed");
