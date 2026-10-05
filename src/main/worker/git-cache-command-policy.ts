/** Pure command/argument policy for cacheable Git reads. */
function isCacheableGitCommand(args: string[]): boolean {
  switch (args[0]) {
    case `check-ignore`: case `for-each-ref`: case `merge-base`: case `rev-list`:
    case `rev-parse`: case `show-ref`: case `status`: return true;
    case `cat-file`: return args.includes(`-e`);
    case `ls-files`: return args.includes(`--others`) && !args.includes(`--cached`) && !args.includes(`--ignored`);
    case `config`: return args.some((arg) => [`--get`, `--get-all`, `--get-regexp`, `--list`].includes(arg));
    case `remote`: return args[1] === `get-url`;
    case `worktree`: return args[1] === `list`;
    default: return false;
  }
}
export { isCacheableGitCommand };
if (typeof module !== `undefined`) module.exports = { isCacheableGitCommand };
