// 宠物（pet）安装与头像管理。
//
// 对应 main-C-Mhak1n.ts 80,760-80,873：
//   - zN petInstallRequestSchema：name/description/imageUrl（https 且非
//     localhost）/spriteVersionNumber（1|2）
//   - wje PetInstallManager：preview/install——spritesheet 下载与校验
//     （重定向拒绝、png/webp 白名单、20MiB 上限、shared 校验器）
//   - BN fetchAndValidateSpritesheet / Tje readBody
//   - Eje AvatarManager：executionHostRegistry 门面（load/loadAvatar/
//     previewPetInstall/installPet，WSL 探测）
import { net } from "electron";
import {
  Uf as EventEmitterBase,
  vt as validateSpritesheet,
  ht as installPreparedPetAsset,
  _t as loadAvatarState,
  gt as loadAvatarById,
} from "@chunk/shared";
import {
  wf as objectSchema,
  Of as stringSchema,
  Nf as urlSchema,
  jf as unionSchema,
  bf as literalSchema,
} from "../../shared/zod-facade";

// ---------------------------------------------------------------------------
// schema（原 `zN`）
// ---------------------------------------------------------------------------

const petInstallRequestSchema = objectSchema({
  name: stringSchema().trim().min(1),
  description: stringSchema()
    .nullish()
    .transform((value) => (value as string | undefined)?.trim() || null),
  imageUrl: urlSchema().transform(
    (value: string, ctx: unknown) => {
      const url = new URL(value);
      return url.protocol !== "https:" || url.hostname === "localhost"
        ? ((ctx as { addIssue(issue: unknown): void }).addIssue({ code: "custom", message: "Pet spritesheet URL is invalid" }),
          undefined)
        : url.toString();
    },
  ),
  spriteVersionNumber: unionSchema([literalSchema(1), literalSchema(2)]).optional(),
});

interface PetInstallRequest {
  name: string;
  description: string | null;
  imageUrl: string;
  spriteVersionNumber?: number;
}

interface ValidatedSpritesheet {
  spriteVersionNumber: number;
  spritesheetDataUrl: string;
  bytes: Buffer;
}

// ---------------------------------------------------------------------------
// spritesheet 下载与校验（原 `BN`/`Tje`）
// ---------------------------------------------------------------------------

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/webp"]);
const MAX_SPRITESHEET_BYTES = 20_971_520;

/** 读响应体（原 `Tje`）：content-type 白名单 + 流式 20MiB 上限。 */
async function readSpritesheetBody(response: Response): Promise<Buffer> {
  const contentType = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  if (contentType == null || !ALLOWED_IMAGE_TYPES.has(contentType))
    throw new Error("Pet spritesheet response must be an image");
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_SPRITESHEET_BYTES)
    throw new Error("Pet spritesheet is too large");
  if (response.body == null) throw new Error("Pet spritesheet response had no body");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value!.byteLength;
    if (received > MAX_SPRITESHEET_BYTES)
      throw (reader.cancel(), new Error("Pet spritesheet is too large"));
    chunks.push(value!);
  }
  return Buffer.concat(chunks, received);
}

/** 下载 + 校验（原 `BN`）：重定向拒绝，版本缺省时按 1→2 顺序探测。 */
async function fetchAndValidateSpritesheet(
  imageUrl: string,
  spriteVersionNumber: number | undefined,
  fetchAsset: (url: string, init?: unknown) => Promise<Response>,
): Promise<ValidatedSpritesheet> {
  const response = await fetchAsset(imageUrl, { redirect: "manual" });
  if (REDIRECT_STATUSES.has(response.status)) throw new Error("Pet spritesheet redirects are not allowed");
  if (!response.ok) throw new Error(`Pet spritesheet download failed (${response.status})`);
  const bytes = await readSpritesheetBody(response);
  const validated =
    spriteVersionNumber == null
      ? ((validateSpritesheet as (bytes: Buffer, version: number) => ValidatedSpritesheet | null)(bytes, 1) ??
        (validateSpritesheet as (bytes: Buffer, version: number) => ValidatedSpritesheet | null)(bytes, 2))
      : (validateSpritesheet as (bytes: Buffer, version: number) => ValidatedSpritesheet | null)(bytes, spriteVersionNumber);
  if (validated == null) throw new Error("Pet spritesheet is invalid");
  return { ...validated, bytes };
}

// ---------------------------------------------------------------------------
// PetInstallManager（原 `wje`）
// ---------------------------------------------------------------------------

/** 宠物安装管理器（原 `wje`）。 */
class PetInstallManager {
  appServerClient: unknown;
  fetchAsset: (url: string, init?: unknown) => Promise<Response>;
  installPreparedPet: (request: Record<string, unknown>) => Promise<string>;
  preferWsl: boolean;

  constructor({
    appServerClient,
    fetchAsset = (url, init) => net.fetch(url, init),
    installPreparedPet = installPreparedPetAsset as never,
    preferWsl = false,
  }: {
    appServerClient: unknown;
    fetchAsset?: PetInstallManager["fetchAsset"];
    installPreparedPet?: PetInstallManager["installPreparedPet"];
    preferWsl?: boolean;
  }) {
    this.appServerClient = appServerClient;
    this.fetchAsset = fetchAsset;
    this.installPreparedPet = installPreparedPet;
    this.preferWsl = preferWsl;
  }

  /** 预览（原 `preview`）：只下载校验，不落盘。 */
  async preview({ name, description, imageUrl, spriteVersionNumber }: PetInstallRequest) {
    const request = (petInstallRequestSchema as unknown as { parse(input: unknown): PetInstallRequest }).parse({
      name,
      description,
      imageUrl,
      spriteVersionNumber,
    });
    const spritesheet = await fetchAndValidateSpritesheet(request.imageUrl, request.spriteVersionNumber, this.fetchAsset);
    return {
      displayName: request.name,
      description: request.description,
      spriteVersionNumber: spritesheet.spriteVersionNumber,
      spritesheetDataUrl: spritesheet.spritesheetDataUrl,
    };
  }

  /** 安装（原 `install`）。 */
  async install({ name, description, imageUrl, spriteVersionNumber }: PetInstallRequest): Promise<{ id: string }> {
    const request = (petInstallRequestSchema as unknown as { parse(input: unknown): PetInstallRequest }).parse({
      name,
      description,
      imageUrl,
      spriteVersionNumber,
    });
    const spritesheet = await fetchAndValidateSpritesheet(request.imageUrl, request.spriteVersionNumber, this.fetchAsset);
    return {
      id: await this.installPreparedPet({
        appServerClient: this.appServerClient,
        preferWsl: this.preferWsl,
        name: request.name,
        description: request.description,
        spritesheet,
      }),
    };
  }
}

// ---------------------------------------------------------------------------
// AvatarManager 门面（原 `Eje`）
// ---------------------------------------------------------------------------

/** 头像管理门面（原 `Eje`）：executionHostRegistry 包装。 */
class AvatarManager extends (EventEmitterBase as new () => {}) {
  executionHostRegistry: { get(): unknown };
  petInstallManager: PetInstallManager;

  constructor(executionHostRegistry: AvatarManager["executionHostRegistry"]) {
    super();
    this.executionHostRegistry = executionHostRegistry;
    this.petInstallManager = new PetInstallManager({
      appServerClient: executionHostRegistry.get(),
      preferWsl: !!process.env.WSL_DISTRO_NAME,
    });
  }

  load() {
    return (loadAvatarState as unknown as (request: Record<string, unknown>) => Promise<unknown>)({
      appServerClient: this.executionHostRegistry.get(),
      preferWsl: !!process.env.WSL_DISTRO_NAME,
    });
  }

  loadAvatar(avatarId: string) {
    return (loadAvatarById as unknown as (request: Record<string, unknown>) => Promise<unknown>)({
      appServerClient: this.executionHostRegistry.get(),
      avatarId,
      preferWsl: !!process.env.WSL_DISTRO_NAME,
    });
  }

  previewPetInstall(request: PetInstallRequest) {
    return this.petInstallManager.preview(request);
  }

  installPet(request: PetInstallRequest) {
    return this.petInstallManager.install(request);
  }
}

export {
  PetInstallManager,
  AvatarManager,
  fetchAndValidateSpritesheet,
  petInstallRequestSchema,
  type PetInstallRequest,
  type ValidatedSpritesheet,
};
