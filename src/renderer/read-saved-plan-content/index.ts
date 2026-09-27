import "@rchunk/rolldown-runtime";
import { n as initializeTextFileStorage, r as readTextFile } from "@rchunk/text-file-storage";

export interface ReadSavedPlanContentInput { hostId: string; path: string; save?: (() => boolean | Promise<boolean>) | null }
async function readSavedPlanContent({ hostId, path, save }: ReadSavedPlanContentInput): Promise<string> {
  if (save != null && !(await save())) throw new Error("Could not save the edited plan");
  return (await readTextFile({ filePath: path, hostId })).content;
}
function initializeReadSavedPlanContent(): void { initializeTextFileStorage(); }
export { readSavedPlanContent as n, initializeReadSavedPlanContent as t };
