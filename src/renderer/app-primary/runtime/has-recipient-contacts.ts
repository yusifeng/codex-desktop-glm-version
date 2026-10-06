export interface RecipientContactGroups {
  to: readonly unknown[];
  cc: readonly unknown[];
  bcc: readonly unknown[];
}

/** True when at least one recipient, carbon-copy, or blind-copy contact exists. */
export function hasRecipientContacts({ to, cc, bcc }: RecipientContactGroups): boolean {
  return to.length > 0 || cc.length > 0 || bcc.length > 0;
}
