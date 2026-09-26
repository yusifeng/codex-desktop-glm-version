// browser-skills-composer —— 浏览器技能的 composer 命令、mention 同步与提交错误提示。
// 原版：app/webview/assets/composer-ab5081483162.js。

import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/browser-skills-state";
import "@rchunk/composer-browser-skills-state";
import "@rchunk/skill-icon-source";

export interface BrowserSkill {
  id: string;
  name: string;
  displayName?: string;
  description: string;
  short_description?: string | null;
  iconSmall?: unknown;
  [key: string]: unknown;
}

export interface BrowserSkillAccount {
  accountId: string;
  userId?: string | null;
}

export interface BrowserSkillMention {
  kind: "browser-skill";
  name: string;
  displayName: string;
  path: string;
  description: string;
  iconSmall?: unknown;
}

export interface BrowserSkillsComposerProps {
  surface: string;
  installedSkills?: BrowserSkill[] | null;
  account?: BrowserSkillAccount | null;
  commandsEnabled?: boolean;
  submissionFailed?: boolean;
  isSkillEligible?(skill: BrowserSkill, surface: string): boolean;
  isSkillHidden?(skill: BrowserSkill): boolean;
  resolveTitle?(skill: BrowserSkill): string;
  resolveIcon?(skill: BrowserSkill): unknown;
  insertMention?(mention: BrowserSkillMention): void;
  focusComposer?(): void;
  closeCommandMenu?(): void;
}

function browserSkillPath(skillId: string, account: BrowserSkillAccount): string {
  return JSON.stringify({ id: skillId, accountId: account.accountId, userId: account.userId ?? null });
}

function parseBrowserSkillPath(path: string): ({ id: string } & BrowserSkillAccount) | null {
  try {
    const value = JSON.parse(path);
    return typeof value?.id === "string" && typeof value?.accountId === "string" ? value : null;
  } catch {
    return null;
  }
}

function BrowserSkillsComposer(props: BrowserSkillsComposerProps) {
  const eligible = (props.installedSkills ?? []).filter((skill) =>
    (props.isSkillEligible?.(skill, props.surface) ?? true) && !(props.isSkillHidden?.(skill) ?? false),
  );
  const commands = props.commandsEnabled === true
    ? eligible.map((skill) => {
        const title = props.resolveTitle?.(skill) ?? skill.displayName ?? skill.name;
        return {
          id: `browser-skill-${skill.id}`,
          title,
          description: skill.short_description?.trim() || skill.description,
          searchAliases: [skill.name],
          triggers: ["@", "/"] as const,
          requiresEmptyComposer: false,
          group: "Skills",
          select: async () => {
            if (props.account == null) return;
            props.closeCommandMenu?.();
            props.insertMention?.({
              kind: "browser-skill",
              name: title,
              displayName: title,
              path: browserSkillPath(skill.id, props.account),
              description: skill.description,
              iconSmall: props.resolveIcon?.(skill) ?? skill.iconSmall,
            });
            props.focusComposer?.();
          },
        };
      })
    : [];

  return {
    kind: "browser-skills-composer" as const,
    eligibleSkills: eligible,
    commands,
    submissionError: props.submissionFailed === true
      ? "Selected skills couldn't be checked. Please try again."
      : null,
    reconcileMentions(mentions: BrowserSkillMention[]) {
      if (props.account == null) return [];
      return mentions.flatMap((mention) => {
        const parsed = parseBrowserSkillPath(mention.path);
        if (parsed?.accountId !== props.account!.accountId || parsed.userId !== (props.account!.userId ?? null)) {
          return [];
        }
        const skill = props.installedSkills?.find((candidate) => candidate.id === parsed.id);
        if (skill == null) return [mention];
        return [{ ...mention, iconSmall: props.resolveIcon?.(skill) ?? skill.iconSmall }];
      });
    },
  };
}

export { BrowserSkillsComposer };
