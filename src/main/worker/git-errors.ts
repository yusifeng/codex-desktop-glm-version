export type GitErrorCategory =
  | "invalid_config"
  | "index_locked"
  | "authentication"
  | "permission_denied"
  | "resource_exhausted"
  | "repository_missing"
  | "ambiguous_revision"
  | "bad_revision"
  | "corrupt_repository"
  | "remote_transport"
  | "unknown";

const errorPatterns: Array<[Exclude<GitErrorCategory, "unknown">, RegExp]> = [
  ["invalid_config", /bad (?:boolean |numeric )?config value|bad config line|invalid (?:config|key)|could not parse config|bogus format in git_config_parameters/i],
  ["index_locked", /unable to create .*\.lock['"]?: file exists|another git process seems to be running|cannot lock ref|could not lock (?:config file|.*ref)/i],
  ["authentication", /authentication failed|could not read username|permission denied \(publickey\)|http basic: access denied|invalid username or password|repository access denied|requested url returned error: (?:401|403)\b|support for password authentication was removed|terminal prompts disabled/i],
  ["permission_denied", /permission denied|operation not permitted|access is denied/i],
  ["resource_exhausted", /no space left on device|disk quota exceeded|cannot allocate memory|too many open files|resource temporarily unavailable/i],
  ["repository_missing", /not a git repository|does not appear to be a git repository|cannot (?:change to|chdir to).*no such file or directory/i],
  ["ambiguous_revision", /ambiguous argument|short object id .* is ambiguous/i],
  ["bad_revision", /bad revision|bad object|needed a single revision|not a valid object name|unknown revision or path not in the working tree/i],
  ["corrupt_repository", /corrupt|index file smaller than expected|bad signature|object file .* is empty|inflate: data stream error|pack has bad object/i],
  ["remote_transport", /could not resolve host|failed to connect|connection (?:timed out|reset|refused)|network is unreachable|early eof|remote end hung up unexpectedly|rpc failed|http\/2 stream .* was not closed cleanly|ssh: connect to host|unable to access/i],
];

const gitCommands = new Set(
  "--version.add.apply.archive.blame.branch.cat-file.check-attr.check-ignore.check-ref-format.checkout.cherry-pick.clean.clone.commit.config.count-objects.diff.fetch.for-each-ref.fsck.gc.grep.hash-object.init.log.ls-files.ls-remote.merge.merge-base.mv.pull.push.rebase.remote.reset.restore.rev-list.rev-parse.rm.show.show-ref.sparse-checkout.stash.status.submodule.switch.tag.update-index.version.worktree".split("."),
);

export function classifyGitError(stderr: string): GitErrorCategory {
  for (const [category, pattern] of errorPatterns) if (pattern.test(stderr)) return category;
  return "unknown";
}

export function gitSubcommand(args: unknown, startIndex: number): string {
  if (!Array.isArray(args)) return "other";
  let index = startIndex;
  while (args[index] === "-c" && args[index + 1] != null) index += 2;
  const command = args[index];
  return typeof command === "string" && gitCommands.has(command) ? command : "other";
}

module.exports = { classifyGitError, gitSubcommand };
