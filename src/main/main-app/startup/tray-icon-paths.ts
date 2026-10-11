import { join } from "node:path";

export function resolveTrayIconCandidates({
  platform,
  flavor,
  packaged,
  resourcesPath,
  repoRoot,
  dark,
  templateNames,
  iconBaseName,
  windowsIconNames,
}: {
  platform: string;
  flavor: string;
  packaged: boolean;
  resourcesPath: string;
  repoRoot: string;
  dark?: boolean;
  templateNames: string[];
  iconBaseName: (flavor: string) => string;
  windowsIconNames: (flavor: string) => { dark: string; light: string };
}) {
  const sourceIcons = join(repoRoot, `electron`, `src`, `icons`);
  if (platform === `darwin`) {
    const template = templateNames[0];
    return packaged ? [join(resourcesPath, template), join(sourceIcons, template)] : [join(sourceIcons, template)];
  }
  if (platform === `linux`) {
    const icon = `${iconBaseName(flavor)}.png`;
    return packaged ? [join(resourcesPath, icon), join(sourceIcons, icon)] : [join(sourceIcons, icon)];
  }
  const names = windowsIconNames(flavor);
  const icon = dark ? names.dark : names.light;
  return packaged ? [join(resourcesPath, icon), join(sourceIcons, icon)] : [join(sourceIcons, icon)];
}

export function resolveTrayWindowsIconNames(flavor: string, agentFlavor: string) {
  return flavor === agentFlavor
    ? { dark: `icon-agent.ico`, light: `icon-agent.ico` }
    : { dark: `chatgpt-tray-dark.ico`, light: `chatgpt-tray-light.ico` };
}

export function resolveTrayTemplateNames() {
  return [`chatgptTemplate.png`, `chatgptTemplate@2x.png`];
}

if (typeof module !== `undefined`) module.exports = { resolveTrayIconCandidates, resolveTrayTemplateNames, resolveTrayWindowsIconNames };
