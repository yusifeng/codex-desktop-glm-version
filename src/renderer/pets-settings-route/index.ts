// pets-settings-route —— 宠物选择、预览、显隐与自定义宠物入口。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as appSharedChunk from "@rchunk/app-shared";
import * as avatarMascotButtonChunk from "@rchunk/avatar-mascot-button";
import * as codexPetAssetsChunk from "@rchunk/codex-pet-assets";
// @ts-expect-error The release dependency has not received a semantic declaration yet.
import * as controlsChunk from "@rchunk/controls";
import * as recommendedSkillOverridesChunk from "@rchunk/recommended-skill-statsig-overrides";
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as settingsLoadingRowChunk from "@rchunk/settings-loading-row";
import * as useAvatarOptionsChunk from "@rchunk/use-avatar-options";
import type { IntlShape, JsxRuntime, ReactRuntime } from "@rchunk/app-shared";

void runtimeChunk;

interface AvatarOption {
  description?: string;
  displayName?: string;
  id: string;
  source?: string | { assetRef: string };
  type?: "builtin" | "cloud" | "custom";
  upgradeDirectoryPath?: string | null;
}

interface AvatarOptionsState {
  avatarDirectory: string | null;
  avatarOptions: AvatarOption[];
  isError: boolean;
  isLoading: boolean;
}

interface SelectedAvatarState {
  selectedAvatar: AvatarOption;
  setSelectedAvatarId(id: string): void;
}

interface PetSettings {
  petSize: { default: number; key: string };
  petVisible: { default: boolean; key: string };
  selectedAvatarId: { default: string; key: string };
}

interface SharedRuntime {
  $3(): void;
  $R: PetSettings;
  FX(): void;
  G3: { dispatchMessage(name: string, payload: Record<string, unknown>): void };
  HX<Value>(signal: unknown): Value;
  I3(): JsxRuntime;
  LX(scope: unknown): unknown;
  ZI: unknown;
  e6: (() => ReactRuntime) & ReactRuntime;
  n4(): IntlShape;
}

interface InitialRuntime {
  I8t: unknown;
  Kcn<Value>(setting: { key: string }): Value;
  Ucn(scope: unknown, setting: { key: string }, value: unknown): Promise<void>;
  Vcn(): void;
  bc(options: AvatarOption[]): SelectedAvatarState;
  h2(): (input: Record<string, unknown>) => void;
  ofn(gateId: string): boolean;
}

interface MascotRuntime {
  m(): void;
  r(): void;
  t(props: Record<string, unknown>): unknown;
}

interface AvatarOptionsRuntime {
  n(): AvatarOptionsState;
  t(): void;
}

interface InitializerRuntime {
  n(): void;
}

interface LoadingRuntime {
  n(): void;
  t(props: { children?: unknown }): unknown;
}

const {
  $3: initializeRuntimeLazy,
  $R: petSettings,
  FX: initializeSignalRuntime,
  G3: rendererBridge,
  HX: useSignalValue,
  I3: getJsxRuntime,
  LX: useScope,
  ZI: AppScope,
  e6: getReactRuntime,
  n4: useIntl,
} = appSharedChunk as unknown as SharedRuntime;
const {
  I8t: avatarOverlayOpenSignal,
  Kcn: readSetting,
  Ucn: writeSetting,
  Vcn: initializeSettingsRuntime,
  bc: useSelectedAvatar,
  h2: useNavigateToComposer,
  ofn: isGateEnabled,
} = appInitialChunk as unknown as InitialRuntime;
const {
  m: initializeMascot,
  r: initializeMascotState,
  t: Mascot,
} = avatarMascotButtonChunk as unknown as MascotRuntime;
const { n: initializePetAssets, t: petAssets } = codexPetAssetsChunk;
const { n: initializeControls } =
  controlsChunk as unknown as InitializerRuntime;
const { n: initializeRecommendedSkillOverrides } =
  recommendedSkillOverridesChunk as unknown as InitializerRuntime;
const { n: initializeSettingsLoadingRow, t: SettingsLoadingRow } =
  settingsLoadingRowChunk as unknown as LoadingRuntime;
const { n: useAvatarOptions, t: initializeAvatarOptions } =
  useAvatarOptionsChunk as unknown as AvatarOptionsRuntime;

void appPrimaryChunk;

const MINI_PETS_GATE = "1532120159";
const DEFAULT_PET_SIZE = 144;

let jsx: JsxRuntime;
let React: ReactRuntime;

function petName(avatar: AvatarOption): string {
  return avatar.displayName ?? avatar.id;
}

function petDescription(avatar: AvatarOption): string {
  return avatar.description ?? "Codex companion";
}

function petSource(avatar: AvatarOption): string | { assetRef: string } {
  if (avatar.source != null) return avatar.source;
  if (avatar.id in petAssets) return { assetRef: avatar.id };
  return { assetRef: "codex" };
}

function PetArtwork({
  avatar,
  preview,
}: {
  avatar: AvatarOption;
  preview?: boolean;
}): unknown {
  return jsx.jsx("div", {
    className: preview ? "pet-preview-artwork" : "pet-tile-artwork",
    "data-avatar-id": avatar.id,
    children: jsx.jsx(Mascot, {
      source: petSource(avatar),
      state: "idle",
      style: preview ? { height: "100%", width: "100%" } : undefined,
    }),
  });
}

function PetTile({
  avatar,
  isSelected,
  onSelect,
  onUpgrade,
}: {
  avatar: AvatarOption;
  isSelected: boolean;
  onSelect(): void;
  onUpgrade?(avatar: AvatarOption): void;
}): unknown {
  const name = petName(avatar);
  const upgrade =
    avatar.upgradeDirectoryPath == null || onUpgrade == null
      ? null
      : jsx.jsx("button", {
          type: "button",
          "aria-label": "Update " + name,
          onClick: () => onUpgrade(avatar),
          children: "Update",
        });
  return jsx.jsxs("article", {
    className: isSelected ? "pet-tile pet-tile-selected" : "pet-tile",
    "data-pet-id": avatar.id,
    children: [
      jsx.jsxs("button", {
        type: "button",
        "aria-pressed": isSelected,
        onClick: onSelect,
        children: [
          jsx.jsx(PetArtwork, { avatar }),
          jsx.jsx("strong", { children: name }),
          jsx.jsx("span", { children: petDescription(avatar) }),
        ],
      }),
      upgrade,
    ],
  });
}

function MiniTile({
  isSelected,
  onSelect,
}: {
  isSelected: boolean;
  onSelect(): void;
}): unknown {
  return jsx.jsx("article", {
    className: isSelected ? "pet-tile pet-tile-selected" : "pet-tile",
    "data-pet-id": "mini",
    children: jsx.jsxs("button", {
      type: "button",
      "aria-pressed": isSelected,
      onClick: onSelect,
      children: [
        jsx.jsx("div", { "aria-hidden": true, children: "Mini" }),
        jsx.jsx("strong", { children: "Mini" }),
        jsx.jsx("span", { children: "The lightweight Codex companion" }),
      ],
    }),
  });
}

function PetsCollection({ miniMode }: { miniMode: boolean }): unknown {
  const scope = useScope(AppScope);
  const intl = useIntl();
  const navigateToComposer = useNavigateToComposer();
  const { avatarDirectory, avatarOptions, isError, isLoading } =
    useAvatarOptions();
  const { selectedAvatar, setSelectedAvatarId } =
    useSelectedAvatar(avatarOptions);
  const petVisible =
    readSetting<boolean>(petSettings.petVisible) ??
    petSettings.petVisible.default;
  const petSize =
    readSetting<number>(petSettings.petSize) ??
    petSettings.petSize.default ??
    DEFAULT_PET_SIZE;
  const overlayOpen = useSignalValue<boolean>(avatarOverlayOpenSignal);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const save = async (
    setting: { key: string },
    value: unknown,
  ): Promise<void> => {
    setSaveError(null);
    try {
      await writeSetting(scope, setting, value);
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : String(
              intl.formatMessage({
                id: "settings.pets.saveError",
                defaultMessage: "Unable to save pet settings",
              }),
            ),
      );
    }
  };
  const selectAvatar = (avatar: AvatarOption): void => {
    setSelectedAvatarId(avatar.id);
    if (!petVisible) void save(petSettings.petVisible, true);
  };
  const hidePet = (): void => {
    if (petVisible) void save(petSettings.petVisible, false);
  };
  const createPet = (): void => {
    navigateToComposer({
      activeProject: null,
      prefillComposerMode: "local",
      prefillPrompt:
        "Use your create-pet skill to create and select a pet based on what you know about me",
    });
  };
  const upgradePet = (avatar: AvatarOption): void => {
    navigateToComposer({
      prefillPrompt:
        "Upgrade the existing pet " +
        petName(avatar) +
        " to the latest pet version",
    });
  };
  const toggleOverlay = (): void => {
    rendererBridge.dispatchMessage("avatar-overlay-open", {});
  };
  const customPets = avatarOptions.filter(
    (avatar) => avatar.type === "custom" || avatar.id.startsWith("custom:"),
  );
  const standardPets = avatarOptions.filter(
    (avatar) => avatar.type !== "custom" && !avatar.id.startsWith("custom:"),
  );
  const tiles = [
    miniMode
      ? jsx.jsx(
          MiniTile,
          { isSelected: !petVisible, onSelect: hidePet },
          "mini",
        )
      : null,
    ...standardPets.map((avatar) =>
      jsx.jsx(
        PetTile,
        {
          avatar,
          isSelected: petVisible && avatar.id === selectedAvatar.id,
          onSelect: () => selectAvatar(avatar),
        },
        avatar.id,
      ),
    ),
    ...customPets.map((avatar) =>
      jsx.jsx(
        PetTile,
        {
          avatar,
          isSelected: petVisible && avatar.id === selectedAvatar.id,
          onSelect: () => selectAvatar(avatar),
          onUpgrade: upgradePet,
        },
        avatar.id,
      ),
    ),
  ];

  const availability = isLoading
    ? jsx.jsx(SettingsLoadingRow, { children: "Loading custom pets…" })
    : isError
      ? jsx.jsx("p", { role: "alert", children: "Unable to load custom pets" })
      : avatarOptions.length === 0
        ? jsx.jsx("p", { role: "status", children: "No pets available" })
        : null;
  const preview = petVisible
    ? jsx.jsxs("section", {
        "aria-label": "Pet preview",
        children: [
          jsx.jsx(PetArtwork, { avatar: selectedAvatar, preview: true }),
          jsx.jsx("input", {
            id: "pet-size",
            type: "range",
            min: 80,
            max: 224,
            value: petSize,
            "aria-label": "Pet size",
            onInput: (event: { currentTarget: { value: string } }) => {
              void save(petSettings.petSize, Number(event.currentTarget.value));
            },
          }),
          jsx.jsx("button", {
            type: "button",
            disabled: petSize === petSettings.petSize.default,
            onClick: () => {
              void save(petSettings.petSize, petSettings.petSize.default);
            },
            children: "Reset size",
          }),
        ],
      })
    : null;

  return jsx.jsxs("div", {
    className: "flex flex-col gap-6",
    children: [
      jsx.jsxs("header", {
        children: [
          jsx.jsx("h1", { children: "Pets" }),
          jsx.jsx("p", {
            children: miniMode
              ? "Pets give you quick access to ChatGPT"
              : "Pets manage threads and surface what needs attention",
          }),
          jsx.jsx("button", {
            type: "button",
            onClick: toggleOverlay,
            children: overlayOpen ? "Hide pet" : "Show pet",
          }),
          jsx.jsx("button", {
            type: "button",
            onClick: createPet,
            children: miniMode ? "Create pet" : "Create",
          }),
        ],
      }),
      preview,
      jsx.jsxs("section", {
        "aria-label": miniMode ? "My pets" : "Pick a pet",
        children: [
          availability,
          jsx.jsx("div", { className: "pet-grid", children: tiles }),
        ],
      }),
      avatarDirectory == null
        ? null
        : jsx.jsx("p", {
            className: "font-mono",
            "data-avatar-directory": true,
            children: avatarDirectory,
          }),
      saveError == null
        ? null
        : jsx.jsx("p", { role: "alert", children: saveError }),
    ],
  });
}

function PetsSettingsRoute(): unknown {
  return jsx.jsx(PetsCollection, { miniMode: isGateEnabled(MINI_PETS_GATE) });
}

function initializePetsSettingsRoute(): void {
  initializeRuntimeLazy?.();
  initializeSignalRuntime?.();
  initializeSettingsRuntime?.();
  initializeControls?.();
  initializeMascot?.();
  initializeMascotState?.();
  initializePetAssets?.();
  initializeSettingsLoadingRow?.();
  initializeRecommendedSkillOverrides?.();
  initializeAvatarOptions?.();
  React =
    typeof getReactRuntime === "function" ? getReactRuntime() : getReactRuntime;
  jsx = typeof getJsxRuntime === "function" ? getJsxRuntime() : getJsxRuntime;
}

initializePetsSettingsRoute();

export { PetsSettingsRoute };
