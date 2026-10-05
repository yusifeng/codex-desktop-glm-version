/** Build the stable composite key used to deduplicate beacon actions. */
export function formatBeaconActionKey(input: { beaconId: string; actionId: string }): string {
  return `${input.beaconId}:${input.actionId}`;
}
