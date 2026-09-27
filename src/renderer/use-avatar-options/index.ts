import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";
export interface AvatarOption { id: string; label?: string; source?: string; type?: "builtin" | "cloud" | "custom" }
export interface AvatarOptionsInput { avatarDirectory?: string | null; cloudAvatars?: readonly AvatarOption[]; includeCloudPets?: boolean; isError?: boolean; isFetching?: boolean; isLoading?: boolean; localAvatars?: readonly AvatarOption[]; selectedAvatarId?: string | null }
function useAvatarOptions(input: AvatarOptionsInput = {}): { avatarDirectory: string | null; avatarOptions: AvatarOption[]; isError: boolean; isFetching: boolean; isLoading: boolean } {
  const byId = new Map<string, AvatarOption>();
  for (const avatar of input.localAvatars ?? []) byId.set(avatar.id, avatar);
  if (input.includeCloudPets !== false) for (const avatar of input.cloudAvatars ?? []) byId.set(avatar.id, avatar);
  if (input.selectedAvatarId && !byId.has(input.selectedAvatarId)) byId.set(input.selectedAvatarId, { id: input.selectedAvatarId, type: "custom" });
  return { avatarDirectory: input.avatarDirectory ?? null, avatarOptions: [...byId.values()], isError: input.isError ?? false, isFetching: input.isFetching ?? false, isLoading: input.isLoading ?? false };
}
function initializeAvatarOptions(): void {}
export { useAvatarOptions as n, initializeAvatarOptions as t };
