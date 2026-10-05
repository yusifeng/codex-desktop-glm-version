function isDiskNotFoundError(error: unknown) {
  return error instanceof Error && ((`code` in error && error.code === `ENOENT`) || error.message.includes(`No such file`) || error.message.includes(`cannot open`) || error.message.includes(`not found`));
}
export { isDiskNotFoundError };
if (typeof module !== `undefined`) module.exports = { isDiskNotFoundError };
