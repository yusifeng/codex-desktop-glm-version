function isAnnotationSidebarTarget(element: any, deps: { getRoot: () => any }): boolean { const root = deps.getRoot(); return root != null && (root === element || root.contains(element) || root.shadowRoot?.contains(element) === true); }
export { isAnnotationSidebarTarget };
if (typeof module !== `undefined`) module.exports = { isAnnotationSidebarTarget };
