import { z } from "zod";

export const browserProfileSignalsSchema = z.object({
  hasCookiesOlderThanProfile: z.boolean(),
  hasPasswordsOlderThanProfile: z.boolean(),
});

const sourceSchema = z.enum(["atlas", "chrome"]);
const importCountSchema = z.object({
  status: z.string().optional(),
  discovered: z.number().int().nonnegative().optional(),
  canonicalized: z.number().int().nonnegative().optional(),
  imported: z.number().int().nonnegative().optional(),
  skippedExisting: z.number().int().nonnegative().optional(),
  skippedInvalid: z.number().int().nonnegative().optional(),
  failed: z.number().int().nonnegative().optional(),
  error: z.string().optional(),
}).passthrough();

export const browserProfileSchema = z.object({
  source: sourceSchema,
  appName: z.string(),
  profileName: z.string(),
  profileDirectoryName: z.string(),
  profilePath: z.string(),
  rootPath: z.string(),
  hasCookies: z.boolean(),
  hasPasswords: z.boolean(),
  hasHistory: z.boolean().optional().default(false),
  hasExtensions: z.boolean().optional(),
  gaiaName: z.string().optional(),
  userName: z.string().optional(),
}).passthrough();

export const browserProfileImportResultSchema = z.object({
  source: sourceSchema,
  profilePath: z.string(),
  cookies: importCountSchema.optional(),
  passwords: importCountSchema.extend({ profile: importCountSchema.optional(), account: importCountSchema.optional() }).passthrough().optional(),
  history: z.object({ status: z.string(), discovered: z.number().int().nonnegative(), imported: z.number().int().nonnegative(), skippedExisting: z.number().int().nonnegative(), skippedInvalid: z.number().int().nonnegative(), failed: z.number().int().nonnegative() }).optional(),
  extensions: importCountSchema.extend({ failures: z.array(z.object({ id: z.string().optional(), name: z.string().optional(), reason: z.string() })).optional() }).optional(),
}).passthrough();

export const browserProfileImportRequestSchema = z.object({
  source: sourceSchema,
  profilePath: z.string().trim().min(1),
  importCookies: z.boolean().optional().default(true),
  importPasswords: z.boolean().optional().default(true),
  importHistory: z.boolean().optional().default(false),
  importExtensions: z.boolean().optional().default(false),
  allowUnverifiedExtensions: z.boolean().optional(),
  allowElevatedChromeDecryption: z.boolean().optional(),
  cookieDomainAllowlist: z.array(z.string().trim().min(1)).optional(),
});
