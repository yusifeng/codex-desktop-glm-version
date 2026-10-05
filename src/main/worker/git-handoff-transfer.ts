async function getHostHandoffDirectory(host: any, transferId: string) {
  const path = await host.platformPath();
  return path.join(await host.codexHome(), `handoffs`, transferId);
}

async function transferHostFile(
  sourcePath: string,
  sourceHost: any,
  destinationPath: string,
  destinationHost: any,
  signal: AbortSignal,
) {
  if (sourceHost.id === destinationHost.id && sourcePath === destinationPath) return;
  const contents = await sourceHost.readFile(sourcePath);
  await destinationHost.writeFile(destinationPath, contents, { signal });
}

async function cleanupHostHandoffTransfer(rolloutPath: string, host: any) {
  const path = await host.platformPath();
  const transferDirectory = path.dirname(rolloutPath);
  if (!isValidCopiedRolloutPath(
    rolloutPath, path.join(await host.codexHome(), `handoffs`), path,
  )) {
    throw Error(`Host handoff cleanup requires a copied rollout path`);
  }
  await host.remove(transferDirectory, { recursive: true, force: true });
}

export { cleanupHostHandoffTransfer, getHostHandoffDirectory, transferHostFile };
if (typeof module !== `undefined`) module.exports = {
  cleanupHostHandoffTransfer,
  getHostHandoffDirectory,
  transferHostFile,
};
import { isValidCopiedRolloutPath } from './git-handoff-transfer-policy';
