import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import { pnt as desktopBridge } from "@rchunk/app-initial";

interface PetPreview { spriteVersionNumber: number; [key: string]: unknown }
interface PetRequest extends Record<string, unknown> { description?: string; imageUrl: string; name: string; spriteVersionNumber?: number }
type PetInstallState = null | (PetRequest & {
  installedAvatarId?: string;
  preview?: PetPreview;
  status: "installError" | "installed" | "installing" | "loading" | "previewError" | "ready";
});
interface PetStateKey { value: PetInstallState }
interface PetScope {
  get<Value>(key: PetStateKey): Value;
  set(key: PetStateKey, value: PetInstallState): void;
}
interface InstalledPet { id: string }

const i: PetStateKey = { value: null };

async function defaultPreview(request: PetRequest): Promise<PetPreview> {
  const previewPetInstall = desktopBridge.customAvatars.previewPetInstall;
  if (previewPetInstall == null) throw new Error("Pet installation is unavailable on this host");
  return previewPetInstall(request) as Promise<PetPreview>;
}

async function defaultInstall(request: PetRequest): Promise<InstalledPet> {
  const installPet = desktopBridge.customAvatars.installPet;
  if (installPet == null) throw new Error("Pet installation is unavailable on this host");
  return installPet(request) as Promise<InstalledPet>;
}

async function a(
  scope: PetScope,
  request: PetRequest,
  preview: (request: PetRequest) => Promise<PetPreview> = defaultPreview,
): Promise<void> {
  if (scope.get<PetInstallState>(i)?.status === "installing") return;
  const loading: PetInstallState = { ...request, status: "loading" };
  scope.set(i, loading);
  try {
    const result = await preview(request);
    if (scope.get<PetInstallState>(i) !== loading) return;
    scope.set(i, { ...request, preview: result, status: "ready" });
  } catch {
    if (scope.get<PetInstallState>(i) !== loading) return;
    scope.set(i, { ...request, status: "previewError" });
  }
}

async function r(
  scope: PetScope,
  refresh: () => Promise<unknown>,
  install: (request: PetRequest) => Promise<InstalledPet> = defaultInstall,
): Promise<void> {
  const current = scope.get<PetInstallState>(i);
  if (current?.status !== "ready" && current?.status !== "installError") return;
  const installing: PetInstallState = { ...current, status: "installing" };
  scope.set(i, installing);
  try {
    const result = await install({
      description: current.description,
      imageUrl: current.imageUrl,
      name: current.name,
      spriteVersionNumber: current.preview?.spriteVersionNumber,
    });
    if (scope.get<PetInstallState>(i) !== installing) return;
    scope.set(i, { ...current, installedAvatarId: result.id, status: "installed" });
    await refresh().catch(() => undefined);
  } catch {
    if (scope.get<PetInstallState>(i) === installing) {
      scope.set(i, { ...current, status: "installError" });
    }
  }
}

function t(scope: PetScope): void { scope.set(i, null); }
function n(): void {}
export { a, i, n, r, t };
