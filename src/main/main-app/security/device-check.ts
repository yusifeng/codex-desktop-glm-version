import { createRequire } from "node:module";
import { join } from "node:path";

const DEVICE_CHECK_ADDON = "devicecheck.node";
const TOKEN_VERSION = "v1";
const requireFromMain = createRequire(typeof __filename === "string" ? __filename : `${process.cwd()}/package.json`);

export interface DeviceCheckLogger {
  info(message: string, details: { safe: Record<string, unknown>; sensitive: Record<string, unknown> }): void;
  warning(message: string, details: { safe: Record<string, unknown>; sensitive: Record<string, unknown> }): void;
}

export interface DeviceCheckSignals {
  schemaVersion: number;
  preferredLanguages: string[];
  locale: string;
  timezone: string;
  screenSizeSum: number;
  screenScale: number;
  appSessionId: string;
}

export interface DeviceCheckAddon {
  isSupported?(): boolean;
  generateToken(): Promise<{ supported: boolean; tokenBase64?: string | null; latencyMs?: number }>;
}

export function isDeviceCheckPlatform(platform: NodeJS.Platform | { platform?: NodeJS.Platform } = process.platform): boolean {
  const value = typeof platform === "string" ? platform : platform.platform ?? process.platform;
  return value === "darwin" || value === "win32";
}

export function isAppleSilicon(arch: string | { arch?: string; platform?: NodeJS.Platform } = process.arch, platform: NodeJS.Platform = process.platform): boolean {
  if (typeof arch === "object") return arch.platform === "darwin" && arch.arch === "arm64";
  return platform === "darwin" && arch === "arm64";
}

export function isDeviceCheckSupported(options: {
  addon?: DeviceCheckAddon;
  arch?: string;
  platform?: NodeJS.Platform;
  resourcesPath?: string;
} = {}): boolean {
  if (!isAppleSilicon(options.arch, options.platform)) return false;
  try {
    return (options.addon ?? loadDeviceCheckAddon(options.resourcesPath)).isSupported?.() ?? false;
  } catch {
    return false;
  }
}

export function createDeviceAttestationHandler(options: {
  addon?: DeviceCheckAddon;
  arch?: string;
  bundleIdentifier?: string;
  getSignals: () => DeviceCheckSignals;
  logger?: DeviceCheckLogger;
  platform?: NodeJS.Platform;
  resourcesPath?: string;
}): (request: { method: string }) => Promise<{ token: string }> | null {
  return (request) =>
    request.method === "attestation/generate"
      ? isDeviceCheckPlatform(options.platform)
        ? generateDeviceAttestation(options)
        : Promise.resolve(buildUnavailableAttestation(1, Date.now(), options.bundleIdentifier, undefined, options.logger))
      : null;
}

export async function generateDeviceCheckToken(options: {
  addon?: DeviceCheckAddon;
  arch?: string;
  platform?: NodeJS.Platform;
  resourcesPath?: string;
} = {}): Promise<string | null> {
  if (!isAppleSilicon(options.arch, options.platform)) return null;
  const result = await (options.addon ?? loadDeviceCheckAddon(options.resourcesPath)).generateToken();
  return result.supported ? result.tokenBase64 ?? null : null;
}

async function generateDeviceAttestation(options: {
  addon?: DeviceCheckAddon;
  arch?: string;
  bundleIdentifier?: string;
  getSignals: () => DeviceCheckSignals;
  logger?: DeviceCheckLogger;
  platform?: NodeJS.Platform;
  resourcesPath?: string;
}): Promise<{ token: string }> {
  const startedAt = Date.now();
  const signals = options.getSignals();
  if (options.platform !== "darwin") return buildUnavailableAttestation(1, startedAt, options.bundleIdentifier, signals, options.logger);
  if (!isAppleSilicon(options.arch, options.platform)) return buildUnavailableAttestation(2, startedAt, options.bundleIdentifier, signals, options.logger);
  let result: Awaited<ReturnType<DeviceCheckAddon["generateToken"]>>;
  try {
    result = await (options.addon ?? loadDeviceCheckAddon(options.resourcesPath)).generateToken();
  } catch (error) {
    return buildUnavailableAttestation(4, startedAt, options.bundleIdentifier, signals, options.logger, { error });
  }
  if (!result.supported) return buildUnavailableAttestation(3, startedAt, options.bundleIdentifier, signals, options.logger, { deviceCheckLatencyMs: result.latencyMs });
  if (result.tokenBase64 == null) return buildUnavailableAttestation(4, startedAt, options.bundleIdentifier, signals, options.logger, { deviceCheckLatencyMs: result.latencyMs });
  options.logger?.info("DeviceCheck attestation generated", { safe: { durationMs: Date.now() - startedAt, deviceCheckLatencyMs: result.latencyMs ?? null }, sensitive: {} });
  return { token: encodeAttestation({ bundleIdentifier: options.bundleIdentifier, signals, token: result.tokenBase64, latencyMs: result.latencyMs }) };
}

function loadDeviceCheckAddon(resourcesPath?: string): DeviceCheckAddon {
  const resolvedResourcesPath = resourcesPath ?? process.resourcesPath;
  if (resolvedResourcesPath == null) throw Error("DeviceCheck requires resourcesPath");
  return requireFromMain(join(resolvedResourcesPath, "native", DEVICE_CHECK_ADDON));
}

function buildUnavailableAttestation(errorCode: number, startedAt: number, bundleIdentifier?: string, signals?: DeviceCheckSignals, logger?: DeviceCheckLogger, details: { deviceCheckLatencyMs?: number; error?: unknown } = {}): { token: string } {
  const safe = { durationMs: Date.now() - startedAt, errorCode, deviceCheckLatencyMs: details.deviceCheckLatencyMs ?? null };
  if (details.error == null) logger?.info("DeviceCheck attestation unavailable", { safe, sensitive: {} });
  else logger?.warning("DeviceCheck attestation failed", { safe, sensitive: { error: details.error } });
  return { token: encodeAttestation({ bundleIdentifier, signals, errorCode, latencyMs: details.deviceCheckLatencyMs }) };
}

export function encodeAttestation(input: { bundleIdentifier?: string; signals?: DeviceCheckSignals; token?: string; errorCode?: number; latencyMs?: number }): string {
  const fields: Buffer[] = input.token != null ? [textField("token", input.token)] : [unsignedField("error_code", input.errorCode!)];
  fields.push(textField("bundle_id", input.bundleIdentifier));
  if (input.signals != null) fields.push(encodeSignals(input.signals));
  if (input.latencyMs != null) fields.push(floatField("t", input.latencyMs));
  return `${TOKEN_VERSION}.${base64Url(Buffer.concat([Buffer.from([0xa0 + fields.length]), ...fields]))}`;
}

function encodeSignals(signals: DeviceCheckSignals): Buffer {
  const map = encodeMap([[0, unsigned(signals.schemaVersion)], [1, encodeArray(signals.preferredLanguages.map((value) => text(value)))], [2, text(signals.locale)], [3, text(signals.timezone)], [4, unsigned(signals.screenSizeSum)], [5, Number.isSafeInteger(signals.screenScale) && signals.screenScale >= 0 ? unsigned(signals.screenScale) : float(signals.screenScale)], [6, text(signals.appSessionId)]]);
  return Buffer.concat([text("f"), length(0x40, map.length), map]);
}
function textField(key: string, value?: string): Buffer { return Buffer.concat([text(key), text(value ?? "undefined")]); }
function unsignedField(key: string, value: number): Buffer { return Buffer.concat([text(key), unsigned(value)]); }
function floatField(key: string, value: number): Buffer { return Buffer.concat([text(key), float(value)]); }
function text(value: string): Buffer { const bytes = Buffer.from(value, "utf8"); return Buffer.concat([length(0x60, bytes.length), bytes]); }
function unsigned(value: number): Buffer { if (!Number.isSafeInteger(value) || value < 0) throw Error(`Invalid CBOR unsigned integer: ${value}`); return length(0, value); }
function float(value: number): Buffer { const bytes = Buffer.allocUnsafe(9); bytes[0] = 0xfb; bytes.writeDoubleBE(value, 1); return bytes; }
function encodeArray(values: Buffer[]): Buffer { return Buffer.concat([length(0x80, values.length), ...values]); }
function encodeMap(values: Array<[number, Buffer]>): Buffer { return Buffer.concat([length(0xa0, values.length), ...values.flatMap(([key, value]) => [unsigned(key), value])]); }
function length(type: number, value: number): Buffer {
  if (value < 24) return Buffer.from([type + value]);
  if (value <= 255) return Buffer.from([type + 24, value]);
  if (value <= 65535) { const out = Buffer.allocUnsafe(3); out[0] = type + 25; out.writeUInt16BE(value, 1); return out; }
  if (value <= 0xffffffff) { const out = Buffer.allocUnsafe(5); out[0] = type + 26; out.writeUInt32BE(value, 1); return out; }
  throw Error(`CBOR length too large: ${value}`);
}
function base64Url(value: Buffer): string { return value.toString("base64").replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, ""); }
