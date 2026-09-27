// composer-browser-skills-state —— Composer 提交时的浏览器技能解析。
//
// 原版：app/webview/assets/composer-state-6ca55b96cbb0.js（1.35KB）。
//
// 三个导出（压缩名 → 语义）：
//   n = browserSkillResolutionFailedFamily（原 `b`）
//   r = submitWithBrowserSkills（原 `y`）
//   t = initializeComposerBrowserSkillsState（原 `x`）

import {
  FX as initializeSharedSignals,
  mZ as getScopedState,
  pZ as createScopedSignal,
  type MaitaiScopeApi,
  type ScopedSignal,
} from "@rchunk/app-shared";
import {
  BPt as initializeComposerState,
  Iht as resolveComposerStateKey,
  Rht as initializeAppState,
  kht as composerStateRoot,
  zPt as extractBrowserSkillMentions,
} from "@rchunk/app-initial";
import {
  a as browserSkillSafetySettings,
  b as supportsSurface,
  c as canUseSystemSkill,
  d as browserSkillsIdentity,
  f as browserSkillsAccount,
  g as supportsSystemSkill,
  n as initializeBrowserSkillsState,
  s as browserSkillsEnabled,
  u as installedBrowserSkillsQuery,
  v as getSafetyStatus,
  y as initializeSystemSkillId,
} from "@rchunk/browser-skills-state";

type SubmitCallback = (browserSkillIds?: string[]) => boolean | void | Promise<boolean | void>;

interface BrowserSkillMention {
  accountId: string;
  userId?: string | null;
  id: string;
}

interface BrowserSkillIdentity {
  accountId: string;
  userId?: string | null;
}

interface BrowserSkillRecord {
  id: string;
  name?: string;
  safety_check_status?: string | null;
  safety_scan?: { risk_score?: number | null } | null;
  surfaces?: string[] | null;
  updated_at?: string;
  [key: string]: unknown;
}

let browserSkillResolutionFailedSignal: ScopedSignal<unknown, boolean>;

/**
 * 原 `y`：提交前把 prompt 中的 browser skill mentions 收敛为当前账号可用的
 * installed skill IDs。账号或认证状态不匹配时降级为空列表；查询失败则阻止
 * 提交并设置失败状态；查询完成后再次核对身份，避免切换账号竞态。
 */
async function submitWithBrowserSkills(
  rootScope: MaitaiScopeApi<unknown>,
  composerStateKey: unknown,
  surface: string,
  input: unknown,
  submit: SubmitCallback,
): Promise<boolean> {
  const scope = getScopedState(rootScope, composerStateRoot, resolveComposerStateKey(composerStateKey));
  scope?.set(browserSkillResolutionFailedSignal, false);
  const mentions = extractBrowserSkillMentions(input) as BrowserSkillMention[];

  if (mentions.length === 0) return (await submit()) !== false;
  if (scope == null) return false;

  const identity = scope.get(browserSkillsIdentity) as BrowserSkillIdentity | null;
  const mentionedIds = mentions
    .filter(
      (mention) =>
        mention.accountId === identity?.accountId && mention.userId === (identity?.userId ?? null),
    )
    .map((mention) => mention.id);
  if (
    identity == null ||
    scope.get(browserSkillsEnabled) !== true ||
    mentionedIds.length !== mentions.length
  ) {
    return (await submit([])) !== false;
  }

  let installedSkills: BrowserSkillRecord[];
  try {
    installedSkills = await scope.query.getOrFetch<BrowserSkillRecord[]>(
      installedBrowserSkillsQuery,
      "installed",
    );
  } catch {
    scope.set(browserSkillResolutionFailedSignal, true);
    return false;
  }

  const currentIdentity = scope.get(browserSkillsIdentity) as BrowserSkillIdentity | null;
  if (
    currentIdentity?.accountId !== identity.accountId ||
    currentIdentity?.userId !== identity.userId ||
    scope.get(browserSkillsEnabled) !== true
  ) {
    return false;
  }

  const safetySettings = scope.get(browserSkillSafetySettings);
  const allowSystemSkill = scope.get(canUseSystemSkill);
  const usableIds = new Set(
    installedSkills
      .filter(
        (skill) =>
          supportsSurface(skill, surface) &&
          supportsSystemSkill(skill, allowSystemSkill) &&
          getSafetyStatus(skill, safetySettings) == null,
      )
      .map((skill) => skill.id),
  );
  const resolvedIds = [...new Set(mentionedIds.filter((id) => usableIds.has(id)))];
  return (await submit(resolvedIds)) !== false;
}

/** 原 `x`：装配依赖并创建按 composer scope 隔离的失败标记。 */
function initializeComposerBrowserSkillsState(): void {
  if (browserSkillResolutionFailedSignal != null) return;
  initializeSharedSignals();
  initializeComposerState();
  initializeAppState();
  initializeSystemSkillId();
  initializeBrowserSkillsState();
  browserSkillResolutionFailedSignal = createScopedSignal(composerStateRoot, false);
}

initializeComposerBrowserSkillsState();

export {
  browserSkillResolutionFailedSignal as n,
  submitWithBrowserSkills as r,
  initializeComposerBrowserSkillsState as t,
};
