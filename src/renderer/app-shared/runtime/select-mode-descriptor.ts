/** Select the enabled/disabled mode descriptor for a view-state flag. */
export function selectModeDescriptor<T>(enabled: boolean, enabledDescriptor: T, disabledDescriptor: T): T {
  return enabled ? enabledDescriptor : disabledDescriptor;
}
