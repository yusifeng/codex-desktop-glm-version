import { z } from "zod";

/** Agent permission profiles accepted by the app-server protocol. */
export const permissionProfileSchema = z.enum([
  "read-only",
  "auto",
  "granular",
  "guardian-approvals",
  "full-access",
  "custom",
]);

/** Built-in browser plugin identifier. */
export const BROWSER_PLUGIN_NAME = "browser";

/** Maximum non-image payload sent through the direct transfer path. */
export const MAX_DIRECT_TRANSFER_BYTES = 47_185_920;

/** Parse a URL while excluding credentials and implementation-specific fields. */
export function parseUrl(value: string): {
  protocol: string;
  username: string;
  password: string;
  hostname: string;
  href: string;
} | null {
  try {
    const url = new URL(value);
    return {
      protocol: url.protocol,
      username: url.username,
      password: url.password,
      hostname: url.hostname,
      href: url.href,
    };
  } catch {
    return null;
  }
}

export { permissionProfileSchema as Ed, BROWSER_PLUGIN_NAME as kl, MAX_DIRECT_TRANSFER_BYTES as pu, parseUrl as sr };
