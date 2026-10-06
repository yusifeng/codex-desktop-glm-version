function isAnnotationShadowRoot(value: any, deps: { documentFragmentNodeType: number; isElement: (value: any) => boolean }): boolean {
  return value?.nodeType === deps.documentFragmentNodeType && `host` in value && deps.isElement(value.host) && value.host.shadowRoot === value;
}

export { isAnnotationShadowRoot };
if (typeof module !== `undefined`) module.exports = { isAnnotationShadowRoot };
