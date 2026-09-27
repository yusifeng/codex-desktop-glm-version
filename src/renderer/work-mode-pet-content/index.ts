import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/codex-pet-assets";
export interface WorkModePetContentProps { accessoryId?: string | null; alt?: string; builtInAssets?: Readonly<Record<string, string>>; customPets?: readonly { id: string; spritesheetUrl: string; expiresAt?: string | null }[]; enabled?: boolean }
let runtime: JsxRuntime | undefined; function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function normalizeAccessoryId(value?: string | null): string { const normalized = value?.replace(/^uploaded:(?=pet_)/u, ""); return normalized?.startsWith("pet_") || normalized === "default" ? normalized : "default"; }
function WorkModePetContent({ accessoryId, alt = "Work mode pet", builtInAssets = {}, customPets = [], enabled = true }: WorkModePetContentProps): unknown { if (!enabled) return null; const id = normalizeAccessoryId(accessoryId); const custom = customPets.find(pet => pet.id === id); const customValid = custom && (custom.expiresAt == null || Number.isFinite(Date.parse(custom.expiresAt)) && Date.parse(custom.expiresAt) > Date.now()); const src = customValid ? custom.spritesheetUrl : builtInAssets[id] ?? builtInAssets.default; return src ? jsx().jsx("img", { alt, "data-pet-id": id, src }) : null; }
export { WorkModePetContent };
