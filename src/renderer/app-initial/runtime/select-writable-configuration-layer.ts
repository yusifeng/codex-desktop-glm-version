/** Select the user-writable configuration layer (former app-initial `Kdn`). */
export function selectWritableConfigurationLayer(
  layers: unknown,
): unknown {
  let writable: unknown = null;
  for (const entry of Array.isArray(layers) ? layers : []) {
    const layer = entry as { name?: { type?: string } };
    if (layer?.name?.type === "user") writable = layer;
  }
  return writable;
}
