import "@rchunk/browser-skills-state";
import "@rchunk/browser-skill-files";

export interface SkillDataRecord { description?: string; enabled?: boolean; id: string; name?: string; safety_scan?: { status?: string }; [key: string]: unknown }
export const getSkillName = (skill: SkillDataRecord): string => skill.name?.trim() || skill.id;
export const getSkillSafetyStatus = (skill: SkillDataRecord, config?: { blockUnsafe?: boolean }): "blocked" | "needs-review" | null => skill.safety_scan?.status === "blocked" && config?.blockUnsafe !== false ? "blocked" : skill.safety_scan?.status === "needs_review" ? "needs-review" : null;
export const setSkillInstalled = async (_scope: unknown, skill: SkillDataRecord, installed: boolean): Promise<SkillDataRecord> => ({ ...skill, enabled: installed });
export const skillDetail$ = { key: "skill-detail" };
export const skillFile$ = { key: "skill-file" };
export const skillSafetyConfig$ = { key: "skill-safety-config" };
export const skillsAccess$ = { key: "skills-access" };
export const skillsCollection$ = { key: "skills-collection" };
