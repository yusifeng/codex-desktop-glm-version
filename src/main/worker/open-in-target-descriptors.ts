/** Pure descriptor construction for the worker's cross-platform "open in" targets. */

export interface PlatformTargetDescriptor {
  label?: string;
  icon?: string;
  kind?: string;
  hidden?: boolean;
  detect?: unknown;
  iconPath?: unknown;
  args?: unknown;
  env?: unknown;
  open?: unknown;
  supportsSsh?: boolean;
}

export function mergePlatformTarget({
  label,
  icon,
  kind,
  platform,
}: {
  label: string;
  icon: string;
  kind: string;
  platform: PlatformTargetDescriptor;
}): PlatformTargetDescriptor {
  return {
    label: platform.label ?? label,
    icon: platform.icon ?? icon,
    kind: platform.kind ?? kind,
    hidden: platform.hidden,
    detect: platform.detect,
    iconPath: platform.iconPath,
    args: platform.args,
    env: platform.env,
    open: platform.open,
  };
}

export function createCrossPlatformTarget({
  id,
  label,
  icon,
  kind,
  hidden,
  darwin,
  win32,
  linux,
}: {
  id: string;
  label: string;
  icon: string;
  kind: string;
  hidden?: boolean;
  darwin?: PlatformTargetDescriptor;
  win32?: PlatformTargetDescriptor;
  linux?: PlatformTargetDescriptor;
}) {
  const platform = (value?: PlatformTargetDescriptor) =>
    value ? mergePlatformTarget({ label, icon, kind, platform: { hidden, ...value } }) : undefined;
  return {
    id,
    platforms: {
      darwin: platform(darwin),
      win32: platform(win32),
      linux: platform(linux),
    },
  };
}

export function createEditorTarget({
  id,
  label,
  icon,
  darwinDetect,
  win32Detect,
  linuxDetect,
  darwinEnv,
  darwinArgs,
  hidden,
  defaultArgs,
  openLinux,
}: {
  id: string;
  label: string;
  icon: string;
  darwinDetect?: unknown;
  win32Detect?: unknown;
  linuxDetect?: unknown;
  darwinEnv?: unknown;
  darwinArgs?: unknown;
  hidden?: boolean;
  defaultArgs: unknown;
  openLinux: (request: unknown, args: unknown) => unknown;
}) {
  return {
    id,
    platforms: {
      darwin: darwinDetect
        ? {
            label,
            icon,
            kind: `editor`,
            hidden,
            detect: darwinDetect,
            env: darwinEnv,
            args: darwinArgs ?? defaultArgs,
            supportsSsh: true,
          }
        : undefined,
      win32: win32Detect
        ? {
            label,
            icon,
            kind: `editor`,
            hidden,
            detect: win32Detect,
            args: defaultArgs,
            supportsSsh: true,
          }
        : undefined,
      linux: linuxDetect
        ? {
            label,
            icon,
            kind: `editor`,
            hidden,
            detect: linuxDetect,
            args: defaultArgs,
            supportsSsh: true,
            open: (request: unknown) => openLinux(request, defaultArgs),
          }
        : undefined,
    },
  };
}

if (typeof module !== `undefined`) module.exports = {
  mergePlatformTarget,
  createCrossPlatformTarget,
  createEditorTarget,
};
