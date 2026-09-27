import "@rchunk/rolldown-runtime";
import {
  FX as initializeSignalRuntime,
  QI as initializeQueryRuntime,
  QX as createQueryFamily,
  ZI as appScope,
} from "@rchunk/app-shared";
import {
  _dn as desktopFetch,
  cJt as initializeAuthentication,
  oJt as getRequestHeaders,
  rJt as apiClient,
  ydn as initializeApiRuntime,
} from "@rchunk/app-initial";
import {
  d as browserSkillsIdentitySignal,
  n as initializeBrowserSkillsState,
  s as browserSkillsEnabledSignal,
} from "@rchunk/browser-skills-state";

interface BrowserSkillFileRange {
  length: number;
  start: number;
}

interface BrowserSkillWithFiles extends Record<string, unknown> {
  check_sum_hash?: string | null;
  files: Record<string, BrowserSkillFileRange | undefined>;
  id: string;
  permissions?: { can_read?: boolean };
  sediment_id?: string | null;
}

interface BrowserSkillFileParameters {
  path: string;
  skill: BrowserSkillWithFiles;
}

async function fetchBrowserSkillFile(
  accountId: string,
  skill: BrowserSkillWithFiles,
  path: string,
  signal?: AbortSignal,
): Promise<ArrayBuffer> {
  if (!skill.sediment_id) {
    const response = await desktopFetch
      .getInstance()
      .fetch(`/hazelnuts/${encodeURIComponent(skill.id)}/files/download`, {
        method: "POST",
        headers: {
          ...getRequestHeaders(),
          "ChatGPT-Account-ID": accountId,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ path }),
      });
    return response.arrayBuffer();
  }
  const file = skill.files[path];
  if (file == null) throw new Error("Skill file is missing");
  if (file.length === 0) return new ArrayBuffer(0);
  const { download_url: downloadUrl } = await apiClient.safePost<{
    download_url?: string | null;
  }>("/hazelnuts/{hazelnut_id}/files/get_download_link", {
    additionalHeaders: { "ChatGPT-Account-ID": accountId },
    parameters: { path: { hazelnut_id: skill.id } },
    requestBody: { file_id: skill.sediment_id },
  });
  if (!downloadUrl) throw new Error("Skill download URL is missing");
  const response = await fetch(downloadUrl, {
    credentials: "omit",
    headers: { Range: `bytes=${file.start}-${file.start + file.length - 1}` },
    signal,
  });
  if (!response.ok) throw new Error("Skill file download failed");
  let bytes = await response.arrayBuffer();
  if (response.status === 206) {
    const contentRange = response.headers.get("Content-Range");
    if (contentRange != null) {
      const match = /^bytes (\d+)-(\d+)\/(?:\d+|\*)$/iu.exec(contentRange);
      if (
        match == null ||
        Number(match[1]) !== file.start ||
        Number(match[2]) !== file.start + file.length - 1
      ) {
        throw new Error("Mismatched skill file range");
      }
    }
  } else if (response.status === 200) {
    bytes = bytes.slice(file.start, file.start + file.length);
  } else {
    throw new Error("Unexpected skill file response");
  }
  if (bytes.byteLength !== file.length) {
    throw new Error("Incomplete skill file");
  }
  return bytes;
}

let browserSkillFileQuery: ReturnType<typeof createQueryFamily>;
let initialized = false;
function initializeBrowserSkillFiles(): void {
  if (initialized) return;
  initialized = true;
  initializeSignalRuntime();
  initializeAuthentication();
  initializeQueryRuntime();
  initializeApiRuntime();
  initializeBrowserSkillsState();
  browserSkillFileQuery = createQueryFamily(
    appScope,
    ({ skill, path }: BrowserSkillFileParameters, { get }) => {
      const identity = get(browserSkillsIdentitySignal);
      return {
        queryKey: [
          "browser-skills",
          identity?.accountId,
          identity?.userId,
          "file",
          skill.id,
          skill.sediment_id,
          skill.check_sum_hash,
          path,
        ],
        enabled:
          identity != null &&
          get(browserSkillsEnabledSignal) === true &&
          skill.permissions?.can_read !== false,
        staleTime: 300_000,
        queryFn: async ({ signal }) => {
          if (identity == null) throw new Error("Skills account unavailable");
          const bytes = await fetchBrowserSkillFile(
            identity.accountId,
            skill,
            path,
            signal,
          );
          return new TextDecoder().decode(bytes);
        },
      };
    },
  );
}

export {
  initializeBrowserSkillFiles as n,
  browserSkillFileQuery as r,
  fetchBrowserSkillFile as t,
};
