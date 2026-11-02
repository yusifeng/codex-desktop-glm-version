export interface NativeApplication {
  appPath: string;
  bundleId: string;
  displayName: string;
  isDefault?: boolean;
}

const EXCLUDED_BUNDLE_IDS = new Set([
  "com.apple.finder.Open-Computer",
  "com.openai.sky.CUAService",
  "com.spotify.installer",
]);

export function normalizeNativeApplications(applications: readonly NativeApplication[]): NativeApplication[] {
  const defaults = new Set(applications.filter((application) => application.isDefault).map((application) => application.appPath));
  const seen = new Set<string>();
  const result: NativeApplication[] = [];
  for (const application of applications) {
    if (!application.appPath.endsWith(".app") || EXCLUDED_BUNDLE_IDS.has(application.bundleId) || seen.has(application.appPath)) continue;
    seen.add(application.appPath);
    result.push({
      appPath: application.appPath,
      bundleId: application.bundleId,
      displayName: application.displayName,
      ...(defaults.has(application.appPath) ? { isDefault: true } : {}),
    });
  }
  return result;
}

function prioritize(applications: NativeApplication[], prioritizedBundleIds?: readonly string[]): void {
  if (prioritizedBundleIds == null || prioritizedBundleIds.length === 0) return;
  applications.sort((left, right) => {
    const leftIndex = prioritizedBundleIds.indexOf(left.bundleId);
    const rightIndex = prioritizedBundleIds.indexOf(right.bundleId);
    return leftIndex === rightIndex ? 0 : leftIndex === -1 ? 1 : rightIndex === -1 ? -1 : leftIndex - rightIndex;
  });
}

export async function listApplicationsForFile(
  { filePath, limit, prioritizedBundleIds }: {
    filePath: string;
    limit?: number;
    order?: "usage" | "display-name";
    prioritizedBundleIds?: readonly string[];
  },
  {
    platform = process.platform,
    listApplicationsForFile: listNativeApplications,
  }: {
    platform?: NodeJS.Platform;
    listApplicationsForFile?: (filePath: string) => Promise<NativeApplication[] | null>;
  } = {},
): Promise<NativeApplication[]> {
  if (platform !== "darwin" || listNativeApplications == null) return [];
  const nativeApplications = await listNativeApplications(filePath);
  if (nativeApplications == null) return [];
  const applications = normalizeNativeApplications(nativeApplications);
  prioritize(applications, prioritizedBundleIds);
  return limit == null ? applications : applications.slice(0, limit);
}
