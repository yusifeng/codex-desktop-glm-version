const RECIPIENT_EMAIL = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/u;

/** Returns whether a recipient token satisfies the composer email policy. */
export function isValidRecipientEmail(value: string): boolean {
  return RECIPIENT_EMAIL.test(value);
}
