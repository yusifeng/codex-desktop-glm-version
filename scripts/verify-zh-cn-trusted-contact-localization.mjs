import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const owner = fs.readFileSync(path.join(root, "src/renderer/trusted-contact-settings/index.ts"), "utf8");
const locale = fs.readFileSync(path.join(root, "src/webview/assets/zh-CN-6b83584f4688.ts"), "utf8");
const messageIds = new Set(
  [...owner.matchAll(/\bid:\s*`((?:settingsModal\.trustedContacts|settings\.chatGpt\.trustedContact|phoneNumberInput)[^`]*)`/g)]
    .map((match) => match[1]),
);
const localeIds = new Set([...locale.matchAll(/^\s*"([^"]+)":/gm)].map((match) => match[1]));
const requiredShellIds = [
  "settingsModal.trustedContacts.sectionTitle",
  "sidebar.meetings",
  "sidebarHelp.privacyCenter",
  "sidebarElectron.pullRequestsRouteNavLink",
];
const missing = [...messageIds, ...requiredShellIds]
  .filter((id, index, ids) => ids.indexOf(id) === index && !localeIds.has(id))
  .sort();

if (missing.length > 0) {
  console.error(`Missing zh-CN translations for ${missing.length} trusted-contact or shell messages:`);
  for (const id of missing) console.error(`- ${id}`);
  process.exit(1);
}

console.log(`${messageIds.size} trusted-contact message IDs and ${requiredShellIds.length} shell IDs covered by zh-CN`);
