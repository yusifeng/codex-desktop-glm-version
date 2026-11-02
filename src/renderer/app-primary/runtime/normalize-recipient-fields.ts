/** Normalize comma-separated recipient fields for the composer preview. */
export interface RecipientContact {
  email: string;
  id?: string;
  name?: string;
  avatar_url?: string;
}

export interface RawRecipientContact {
  email?: string | null;
  id?: string | null;
  name?: string | null;
  photo_url?: string | null;
}

export interface NormalizedRecipient {
  value: string;
  isInvalid: boolean;
  prefix?: string;
}

export interface ParsedRecipientField {
  recipients: RecipientContact[];
  unfinishedValue: string;
}

type RecipientFieldMap = Record<"recipient" | "cc" | "bcc", RecipientContact[]>;

function isRecipientContact(value: unknown): value is RecipientContact {
  if (typeof value !== "object" || value == null) return false;
  const contact = value as Record<string, unknown>;
  return typeof contact.email === "string" &&
    (contact.id == null || typeof contact.id === "string") &&
    (contact.name == null || typeof contact.name === "string") &&
    (contact.avatar_url == null || typeof contact.avatar_url === "string");
}

function isValidEmail(value: string): boolean {
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(value);
}

function normalizeField(value: unknown, contacts: RecipientContact[]): NormalizedRecipient[] {
  if (typeof value !== "string") return [];
  const byEmail = new Map(contacts.map((contact) => [contact.email.trim().toLowerCase(), contact]));
  return value.split(",").map((item) => item.trim()).filter(Boolean).map((item) => {
    const valid = isValidEmail(item);
    const name = byEmail.get(item.toLowerCase())?.name?.trim();
    return { value: valid && name ? name : item, isInvalid: !valid };
  });
}

/** Parse a comma-separated recipient input (former app-primary `Hd`/`KMe`). */
export function parseRecipientField(
  value: string,
  contacts: readonly RecipientContact[] = [],
): ParsedRecipientField {
  const contactsByEmail = new Map(
    contacts.map((contact) => [contact.email.trim().toLowerCase(), contact]),
  );
  const recipients: RecipientContact[] = [];
  const unfinished: string[] = [];
  for (const item of value.split(",").map((entry) => entry.trim()).filter(Boolean)) {
    if (!isValidEmail(item)) {
      unfinished.push(item);
      continue;
    }
    const contact = contactsByEmail.get(item.toLowerCase());
    recipients.push(contact == null ? { email: item } : { ...contact, email: item });
  }
  return { recipients, unfinishedValue: unfinished.join(", ") };
}

/** Drop empty recipient buckets while cloning populated arrays (former app-primary `Id`/`GMe`). */
export function projectRecipientContacts(
  fields: RecipientFieldMap,
): Partial<RecipientFieldMap> {
  return Object.fromEntries(
    (["recipient", "cc", "bcc"] as const).flatMap((field) =>
      fields[field].length > 0 ? [[field, [...fields[field]]]] : [],
    ),
  );
}

/** Parse semicolon/comma/newline-delimited recipients (former app-primary `Fd`/`JMe`). */
export function parseDelimitedRecipients(
  value: string,
  contacts: readonly RecipientContact[],
): RecipientContact[] {
  const contactsByEmail = new Map(contacts.map((contact) => [contact.email.toLowerCase(), contact]));
  return value
    .split(/[;,\n]+/u)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map((email) => {
      const contact = contactsByEmail.get(email.toLowerCase());
      return contact == null ? { email } : { ...contact, email };
    });
}

/** Normalize raw contact records and drop entries with empty email addresses. */
export function normalizeRecipientContacts(contacts: readonly RawRecipientContact[]): RecipientContact[] {
  return contacts.flatMap((contact) => {
    const email = contact.email?.trim();
    return email == null || email.length === 0
      ? []
      : [{
          email,
          id: contact.id?.trim() || undefined,
          name: contact.name?.trim() || undefined,
          avatar_url: contact.photo_url?.trim() || undefined,
        }];
  });
}

/** Find the contact whose owner email matches case-insensitively. */
export function findContactIdByOwnerEmail<T extends { id?: string; ownerEmail?: string | null }>(
  contacts: readonly T[],
  selected: { ownerEmail?: string | null } | null | undefined,
): string | undefined {
  const ownerEmail = selected?.ownerEmail?.trim().toLowerCase();
  if (ownerEmail != null && ownerEmail.length !== 0) {
    return contacts.find((contact) => contact.ownerEmail?.trim().toLowerCase() === ownerEmail)?.id;
  }
}

/** Read a recipient field from normalized contacts or its legacy string representation. */
export function formatRecipientField(
  value: { contacts?: unknown; recipient?: unknown; cc?: unknown; bcc?: unknown } | null | undefined,
  field: keyof RecipientFieldMap,
): string {
  const contacts = value?.contacts;
  return contacts != null && typeof contacts === "object" && !Array.isArray(contacts)
    ? (Array.isArray((contacts as Partial<RecipientFieldMap>)[field])
        ? (contacts as Partial<RecipientFieldMap>)[field]!.filter(isRecipientContact)
        : [])
      .map((contact) => contact.email)
      .join(", ")
    : typeof value?.[field] === "string"
      ? value[field]
      : "";
}

/** Join committed recipients and the unfinished input token. */
export function mergeRecipientInput(recipients: readonly RecipientContact[], unfinishedValue: string): string {
  const committed = recipients.map((recipient) => recipient.email).join(", ");
  const unfinished = unfinishedValue.trim();
  return committed.length === 0 ? unfinished : unfinished.length === 0 ? committed : `${committed}, ${unfinished}`;
}

export function normalizeRecipientFields(input: {
  recipient?: unknown;
  cc?: unknown;
  bcc?: unknown;
  contacts?: { recipient?: RecipientContact[]; cc?: RecipientContact[]; bcc?: RecipientContact[] };
}): NormalizedRecipient[] {
  const contacts = input.contacts ?? {};
  const result = [
    ...normalizeField(input.recipient, contacts.recipient ?? []),
    ...normalizeField(input.cc, contacts.cc ?? []),
  ];
  const bcc = normalizeField(input.bcc, contacts.bcc ?? []);
  if (bcc.length > 0) bcc[0] = { ...bcc[0], prefix: "Bcc: " };
  return [...result, ...bcc];
}
