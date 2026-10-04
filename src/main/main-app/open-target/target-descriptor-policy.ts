type TargetPlatform = {
  label?: string;
  icon?: string;
  kind?: string;
  hidden?: boolean;
  detect?: unknown;
  iconPath?: unknown;
  args?: unknown;
  env?: unknown;
  open?: unknown;
};

/** Merge platform-specific overrides while preserving the target's shared metadata. */
export function mergeTargetPlatformDescriptor(options: {
  label: string;
  icon: string;
  kind: string;
  platform: TargetPlatform;
}): TargetPlatform {
  const { label, icon, kind, platform } = options;
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

/** Build a cross-platform open-in target descriptor from platform overrides. */
export function createTargetDescriptor(options: {
  id: string;
  label: string;
  icon: string;
  kind: string;
  hidden?: boolean;
  darwin?: TargetPlatform;
  win32?: TargetPlatform;
  linux?: TargetPlatform;
}): {
  id: string;
  platforms: {
    darwin?: TargetPlatform;
    win32?: TargetPlatform;
    linux?: TargetPlatform;
  };
} {
  const { id, label, icon, kind, hidden, darwin, win32, linux } = options;
  return {
    id,
    platforms: {
      darwin: darwin
        ? mergeTargetPlatformDescriptor({ label, icon, kind, platform: { hidden, ...darwin } })
        : undefined,
      win32: win32
        ? mergeTargetPlatformDescriptor({ label, icon, kind, platform: { hidden, ...win32 } })
        : undefined,
      linux: linux
        ? mergeTargetPlatformDescriptor({ label, icon, kind, platform: { hidden, ...linux } })
        : undefined,
    },
  };
}

if (typeof module !== "undefined") {
  module.exports = { mergeTargetPlatformDescriptor, createTargetDescriptor };
}
