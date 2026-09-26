// gpt-plugin-retirement —— GPT 退役日期与本地化帮助中心链接。
// 原版：app/webview/assets/retirement-67c575376054.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appInitialChunk from "@rchunk/app-initial";

void runtimeChunk;
const appInitial = appInitialChunk as Record<string, any>;
const DEFAULT_RETIREMENT_TIMESTAMP = Date.UTC(2026, 11, 11);

function parseRetirementDate(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return DEFAULT_RETIREMENT_TIMESTAMP;
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(timestamp) &&
    new Date(timestamp).toISOString().slice(0, 10) === value
    ? timestamp
    : DEFAULT_RETIREMENT_TIMESTAMP;
}

function getGptHelpCenterUrl(user: unknown, urlTemplate: string): string {
  const locale = (appInitial.iN?.(user)?.locale ?? "en-US").toLowerCase();
  const language = locale === "en-us" ? "en" : locale;
  const fallback = `https://help.openai.com/${language}/collections/8475420-gpts`;
  try {
    const url = new URL(urlTemplate.replaceAll("{lang}", language));
    return url.protocol === "https:" ? url.href : fallback;
  } catch {
    return fallback;
  }
}

let initialized = false;
function initializeGptPluginRetirement(): void {
  if (initialized) return;
  appInitial.sN?.();
  initialized = true;
}

initializeGptPluginRetirement();
export {
  getGptHelpCenterUrl as n,
  initializeGptPluginRetirement as r,
  parseRetirementDate as t,
};
