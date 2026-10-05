/** Normalize comma-separated recipient fields for the composer preview. */
export interface RecipientContact {
  email: string;
  id?: string;
  name?: string;
}

export interface NormalizedRecipient {
  value: string;
  isInvalid: boolean;
  prefix?: string;
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
