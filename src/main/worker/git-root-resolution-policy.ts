export function isNonRepositoryError(stderr: string) {
  const message = stderr.toLowerCase();
  return message.includes(`not a git repository`) || message.includes(`cannot use bare repository`) || message.includes(`invalid gitfile format`) || message.includes(`no path in gitfile`) || message.includes(`invalid gitdir`);
}
if (typeof module !== `undefined`) module.exports = { isNonRepositoryError };
