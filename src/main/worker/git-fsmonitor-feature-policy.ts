/** Pure parser for Git fsmonitor daemon capability output. */
function hasFsmonitorDaemonFeature(output: string): boolean {
  return output.split(`\n`).some((line) => line.trim() === `feature: fsmonitor--daemon`);
}
export { hasFsmonitorDaemonFeature };
if (typeof module !== `undefined`) module.exports = { hasFsmonitorDaemonFeature };
