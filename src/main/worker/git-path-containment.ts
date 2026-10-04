type PathApi = {
  relative(from: string, to: string): string;
  sep: string;
  isAbsolute(value: string): boolean;
};

/** Returns whether a path is the root itself or contained below it. */
function isPathWithinRoot(root: string, candidate: string, host: { isLocal: boolean }, pathApis: { local: PathApi; posix: PathApi }): boolean {
  const pathApi = host.isLocal ? pathApis.local : pathApis.posix;
  const relative = pathApi.relative(root, candidate);
  return relative === `` || (relative !== `..` && !relative.startsWith(`..${pathApi.sep}`) && !pathApi.isAbsolute(relative));
}

export { isPathWithinRoot };
if (typeof module !== `undefined`) module.exports = { isPathWithinRoot };
