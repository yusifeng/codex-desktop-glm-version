// shared chunk：宠物 spritesheet 解析与安装（pet-spritesheet 分区）。
//
// 对应 src-DldfpmrL.ts 的 L58,774-58,861 + L58,901-58,958 区段：
//   - Bre=1536 宽；Vre=1872（v1 高）/Hre=2288（v2 高）：
//     16×24 网格（1536/64=24 列；1872/78=24、2288… 版本对应行高）
//   - Yre：图像字节 → {width, height, mimeType}（Xre PNG IHDR 头解析 +
//     Zre WEBP RIFF 块遍历；Qre VP8X/VP8L/VP8 三 chunk 形态）
//   - w8（vt）：spritesheet 校验——宽 1536 且高匹配版本 →
//     {extension, spriteVersionNumber, spritesheetDataUrl}
//   - Jre：目录名去重（slug 截断 80 + 尾 - 清理 + -2/-3 后缀）
//   - qre（ht）：安装自定义宠物——<codexHome>/pets/<slug>/ 下
//     spritesheet.<png|webp> + pet.json（displayName/description/
//     spriteVersionNumber/spritesheetPath），返回 `custom:<slug>`
//   - Z：app-server 文件系统门面（readFile/writeFile/mkdir/readdir/
//     cp 等——L24,697；此处以内联接口形态承接 qre 所需子面）
//
// 兼容导出：vt=w8、ht=qre。

// ---------------------------------------------------------------------------
// 图像头解析（原 `Yre`/`Xre`/`Zre`/`Qre`）
// ---------------------------------------------------------------------------

/** 解析出的图像尺寸。 */
interface ImageDimensions {
  width: number;
  height: number;
  mimeType: "image/png" | "image/webp";
}

/** PNG IHDR 解析（原 `Xre`）。 */
function pngDimensions(bytes: Buffer): ImageDimensions | null {
  if (
    bytes.length < 24 ||
    bytes[0] !== 137 ||
    bytes.subarray(1, 4).toString("ascii") !== "PNG" ||
    bytes[4] !== 13 ||
    bytes[5] !== 10 ||
    bytes[6] !== 26 ||
    bytes[7] !== 10 ||
    bytes.subarray(12, 16).toString("ascii") !== "IHDR"
  )
    return null;
  return { height: bytes.readUInt32BE(20), mimeType: "image/png", width: bytes.readUInt32BE(16) };
}

/** WEBP chunk 尺寸解析（原 `Qre`）。 */
function webpChunkDimensions(bytes: Buffer, chunkTag: string, offset: number, length: number): Omit<ImageDimensions, "mimeType"> | null {
  if (chunkTag === "VP8X")
    return length < 10
      ? null
      : { height: bytes.readUIntLE(offset + 7, 3) + 1, width: bytes.readUIntLE(offset + 4, 3) + 1 };
  if (chunkTag === "VP8L") {
    if (length < 5 || bytes[offset] !== 47) return null;
    const bits = bytes.readUInt32LE(offset + 1);
    const limit = 2 ** 14;
    return { height: (Math.floor(bits / limit) % limit) + 1, width: (bits % limit) + 1 };
  }
  if (chunkTag === "VP8")
    return length < 10 || bytes[offset + 3] !== 157 || bytes[offset + 4] !== 1 || bytes[offset + 5] !== 42
      ? null
      : { height: bytes.readUInt16LE(offset + 8) % 2 ** 14, width: bytes.readUInt16LE(offset + 6) % 2 ** 14 };
  return null;
}

/** WEBP RIFF 遍历（原 `Zre`）。 */
function webpDimensions(bytes: Buffer): ImageDimensions | null {
  if (
    bytes.length < 20 ||
    bytes.subarray(0, 4).toString("ascii") !== "RIFF" ||
    bytes.subarray(8, 12).toString("ascii") !== "WEBP"
  )
    return null;
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const chunkTag = bytes.subarray(offset, offset + 4).toString("ascii");
    const chunkLength = bytes.readUInt32LE(offset + 4);
    const dataOffset = offset + 8;
    if (dataOffset + chunkLength > bytes.length) return null;
    const dimensions = webpChunkDimensions(bytes, chunkTag, dataOffset, chunkLength);
    if (dimensions != null) return { ...dimensions, mimeType: "image/webp" };
    offset = dataOffset + chunkLength + (chunkLength % 2);
  }
  return null;
}

/** 图像字节 → 尺寸（原 `Yre`：PNG 优先，WEBP 兜底）。 */
export function imageDimensionsOf(bytes: Buffer): ImageDimensions | null {
  return pngDimensions(bytes) ?? webpDimensions(bytes);
}

// ---------------------------------------------------------------------------
// spritesheet 校验（原 `w8`）
// ---------------------------------------------------------------------------

/** spritesheet 固定宽度（原 `Bre`）。 */
const SPRITESHEET_WIDTH = 1536;

/** v1 网格高度（原 `Vre`）。 */
const SPRITESHEET_V1_HEIGHT = 1872;

/** v2 网格高度（原 `Hre`）。 */
const SPRITESHEET_V2_HEIGHT = 2288;

/** 校验后的 spritesheet。 */
export interface ValidatedSpritesheet {
  extension: "png" | "webp";
  spriteVersionNumber: number;
  spritesheetDataUrl: string;
}

/**
 * spritesheet 校验（原 `w8`，导出 `vt`）。
 * 宽 1536 + 高与版本网格匹配（1872/2288）才有效。
 */
export function validatePetSpritesheet(bytes: Buffer, spriteVersion: number = 1): ValidatedSpritesheet | null {
  const dimensions = imageDimensionsOf(bytes);
  const expectedHeight = spriteVersion === 1 ? SPRITESHEET_V1_HEIGHT : SPRITESHEET_V2_HEIGHT;
  if (dimensions == null || dimensions.width !== SPRITESHEET_WIDTH || dimensions.height !== expectedHeight)
    return null;
  return {
    extension: dimensions.mimeType === "image/png" ? "png" : "webp",
    spriteVersionNumber: spriteVersion,
    spritesheetDataUrl: `data:${dimensions.mimeType};base64,${bytes.toString("base64")}`,
  };
}

// ---------------------------------------------------------------------------
// 安装（原 `Jre`/`qre`）
// ---------------------------------------------------------------------------

/** slug 截断上限（原 `Ure`）。 */
const SLUG_MAX_LENGTH = 80;

/** app-server 文件系统面（qre 依赖的最小接口）。 */
export interface PetInstallFilesystem {
  createDirectory(path: string, options?: Record<string, unknown>): Promise<void>;
  readDirectory(path: string): Promise<{ name: string }[]>;
  writeFile(path: string, contents: string | Uint8Array): Promise<void>;
  join(...segments: string[]): string;
}

/** 目录名去重（原 `Jre`：截断 80 + 尾 - 清理 + -N 后缀）。 */
function uniqueDirectoryName(name: string, existing: Set<string>): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/, "") || "pet";
  let counter = 1;
  let candidate = base;
  while (existing.has(candidate)) {
    counter += 1;
    candidate = `${base}-${counter}`;
  }
  return candidate;
}

/**
 * 安装自定义宠物（原 `qre`，导出 `ht`）。
 * 写 <codexHome>/pets/<slug>/{spritesheet.<ext>, pet.json}，返回
 * `custom:<slug>`。
 */
export async function installCustomPet({
  appServerClient,
  name,
  description,
  preferWsl = false,
  spritesheet,
}: {
  appServerClient: PetInstallFilesystem;
  name: string;
  description?: string | null;
  preferWsl?: boolean;
  spritesheet: { bytes: Buffer; extension: "png" | "webp"; spriteVersionNumber: number };
}): Promise<string> {
  const codexHome = process.env.CODEX_HOME ?? require("node:os").homedir() + "/.codex";
  const petsRoot = appServerClient.join(codexHome, "pets");
  await appServerClient.createDirectory(petsRoot, { recursive: true });
  const slug = uniqueDirectoryName(name, new Set((await appServerClient.readDirectory(petsRoot)).map((entry) => entry.name)));
  const petDirectory = appServerClient.join(petsRoot, slug);
  const manifestPath = appServerClient.join(petDirectory, "pet.json");
  const spritesheetFilename = `spritesheet.${spritesheet.extension}`;
  const spritesheetPath = appServerClient.join(petDirectory, spritesheetFilename);
  await appServerClient.createDirectory(petDirectory, { recursive: true });
  await appServerClient.writeFile(spritesheetPath, spritesheet.bytes);
  await appServerClient.writeFile(
    manifestPath,
    JSON.stringify({
      displayName: name,
      description: description ?? undefined,
      spriteVersionNumber: spritesheet.spriteVersionNumber,
      spritesheetPath: spritesheetFilename,
    }),
  );
  return `custom:${slug}`;
}

// ---------------------------------------------------------------------------
// 兼容导出（pet-spritesheet 分区 2 个压缩名）
// ---------------------------------------------------------------------------

export {
  validatePetSpritesheet as vt,
  installCustomPet as ht,
};
