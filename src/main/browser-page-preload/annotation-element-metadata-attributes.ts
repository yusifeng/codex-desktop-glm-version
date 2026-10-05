type AnnotationElementMetadataAttributeDependencies = {
  isTopWindow: () => boolean;
  isDocumentRoot: (element: any) => boolean;
  isHtmlElement: (element: any) => boolean;
  isExcluded: (element: any) => boolean;
  hasVisibleRect: (element: any) => boolean;
  hasAttribute: (element: any, name: string) => boolean;
  getAttribute: (element: any, name: string) => string | null;
  parseMetadata: (value: string | null) => any;
  parseName: (value: string | null) => any;
};

function projectAnnotationElementMetadataAttributes(
  element: any,
  base: any,
  enabled: boolean,
  explicitMetadata: any,
  deps: AnnotationElementMetadataAttributeDependencies,
): any {
  if (
    enabled &&
    deps.isTopWindow() &&
    deps.isDocumentRoot(element) &&
    deps.isHtmlElement(element) &&
    !deps.isExcluded(element) &&
    deps.hasVisibleRect(element)
  ) {
    const hasAnnotationAttribute = deps.hasAttribute(element, `oai-annotatable`);
    const name = hasAnnotationAttribute
      ? deps.parseName(deps.getAttribute(element, `oai-annotatable`))
      : undefined;
    const metadata = explicitMetadata ?? (hasAnnotationAttribute
      ? deps.parseMetadata(deps.getAttribute(element, `oai-annotation-metadata`))
      : undefined);
    return { ...base, elementMetadata: metadata, elementName: name };
  }
  return { ...base, elementMetadata: enabled ? explicitMetadata : undefined, elementName: undefined };
}

export { projectAnnotationElementMetadataAttributes };
if (typeof module !== `undefined`) module.exports = { projectAnnotationElementMetadataAttributes };
