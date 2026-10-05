export interface DesktopEntryPolicyFields {
  exec?: string;
  hidden?: string;
  type?: string;
  dbusActivatable?: string;
  onlyShowIn?: string;
  notShowIn?: string;
  tryExec?: string;
  name?: string;
  icon?: string;
}

export interface DesktopEntryMetadata {
  desktopId: string;
  desktopPath: string;
  displayName: string;
  executableIdentity: string | null;
  icon: string | null;
}

/** Apply freedesktop visibility and executable eligibility rules to one entry. */
export function resolveDesktopEntryMetadata({
  desktopId,
  desktopPath,
  fields,
  currentDesktops,
  isExecutable,
}: {
  desktopId: string;
  desktopPath: string;
  fields: DesktopEntryPolicyFields;
  currentDesktops: readonly string[];
  isExecutable: (path: string) => boolean;
}): DesktopEntryMetadata | null {
  if (
    fields.hidden === `true` ||
    fields.type !== `Application` ||
    (!fields.exec && fields.dbusActivatable !== `true`)
  ) {
    return null;
  }

  const onlyShowIn = fields.onlyShowIn?.split(`;`).filter(Boolean);
  const notShowIn = fields.notShowIn?.split(`;`).filter(Boolean);
  let visible = onlyShowIn == null;
  for (const desktop of currentDesktops) {
    if (onlyShowIn?.includes(desktop)) {
      visible = true;
      break;
    }
    if (notShowIn?.includes(desktop)) {
      visible = false;
      break;
    }
  }
  if (!visible || (fields.tryExec && !isExecutable(fields.tryExec))) return null;

  return {
    desktopId,
    desktopPath,
    displayName: fields.name ?? desktopId.slice(0, -8),
    executableIdentity: fields.exec ?? null,
    icon: fields.icon ?? null,
  };
}

if (typeof module !== `undefined`) module.exports = { resolveDesktopEntryMetadata };
