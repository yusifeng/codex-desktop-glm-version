/** Normalize the structured recipient/cc/bcc contact payload used by the mail composer. */
export interface RecipientContactRecord {
  email: string;
  id?: string;
  name?: string;
  avatar_url?: string;
}

export type RecipientContactGroups = Record<"recipient" | "cc" | "bcc", RecipientContactRecord[]>;

const GROUPS = ["recipient", "cc", "bcc"] as const;

function isContact(value: unknown): value is RecipientContactRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return typeof record.email === "string" &&
    (record.id == null || typeof record.id === "string") &&
    (record.name == null || typeof record.name === "string") &&
    (record.avatar_url == null || typeof record.avatar_url === "string");
}

function parseEmails(value: unknown): RecipientContactRecord[] {
  if (typeof value !== "string") return [];
  return value.split(/[;,\n]+/).map((email) => email.trim()).filter(Boolean).map((email) => ({ email }));
}

/** Keep valid structured contacts, or project legacy delimited fields into contacts. */
export function normalizeRecipientContacts(input: unknown): RecipientContactGroups {
  const record = input && typeof input === "object" && !Array.isArray(input) ? input as Record<string, unknown> : null;
  const contacts = record?.contacts;
  if (contacts && typeof contacts === "object" && !Array.isArray(contacts)) {
    const source = contacts as Record<string, unknown>;
    return Object.fromEntries(GROUPS.map((group) => [group, Array.isArray(source[group]) ? source[group].filter(isContact) : []])) as RecipientContactGroups;
  }
  return Object.fromEntries(GROUPS.map((group) => [group, parseEmails(record?.[group])])) as RecipientContactGroups;
}
