import assert from "node:assert/strict";

import { projectAnnotationElementMetadataAttributes } from "../app/.vite/build/browser-page-preload/annotation-element-metadata-attributes.js";

const makeElement = (attrs = {}) => ({
  ownerDocument: `document`,
  namespaceURI: `http://www.w3.org/1999/xhtml`,
  hasAttribute: (name) => Object.hasOwn(attrs, name),
  getAttribute: (name) => attrs[name] ?? null,
});
const deps = {
  isTopWindow: () => true,
  isDocumentRoot: (element) => element.ownerDocument === `document`,
  isHtmlElement: (element) => element.namespaceURI === `http://www.w3.org/1999/xhtml`,
  isExcluded: () => false,
  hasVisibleRect: () => true,
  hasAttribute: (element, name) => element.hasAttribute(name),
  getAttribute: (element, name) => element.getAttribute(name),
  parseMetadata: (value) => ({ parsed: value }),
  parseName: (value) => `name:${value}`,
};

assert.deepEqual(
  projectAnnotationElementMetadataAttributes(
    makeElement({ "oai-annotatable": `button`, "oai-annotation-metadata": `{"x":1}` }),
    { id: 1 },
    true,
    undefined,
    deps,
  ),
  { id: 1, elementMetadata: { parsed: `{"x":1}` }, elementName: `name:button` },
);
assert.deepEqual(
  projectAnnotationElementMetadataAttributes(makeElement(), { id: 2 }, true, { explicit: true }, deps),
  { id: 2, elementMetadata: { explicit: true }, elementName: undefined },
);
assert.deepEqual(
  projectAnnotationElementMetadataAttributes(makeElement(), { id: 3 }, false, undefined, deps),
  { id: 3, elementMetadata: undefined, elementName: undefined },
);

console.log(`test-preload-annotation-element-metadata-attributes: 3 assertions passed`);
