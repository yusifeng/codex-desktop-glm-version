const connectorIds = {
  box: "asdk_app_695bfc98071c8191bac7bc479aa27de7",
  dropbox: "asdk_app_69b31dc2110c8191b8b47dc98fe5a052",
  google_drive: "connector_5f3c8c41a1e54ad7a76272c89e2554fa",
  sharepoint: "connector_1e4f6a44acf14e3ca1d96672f8c945bc",
  onedrive: "connector_1e4f6a44acf14e3ca1d96672f8c945bc",
} as const;

export type ConnectorKind = keyof typeof connectorIds;

/** Check whether an account has a connector link, optionally requiring active authorization. */
export function hasConnectorLink(
  links: readonly { connector_id?: string; auth_status?: string }[] | null | undefined,
  kind: ConnectorKind,
  requireActive = false,
): boolean {
  const connectorId = connectorIds[kind];
  return links?.some((link) =>
    link.connector_id === connectorId && (!requireActive || link.auth_status === "ACTIVE")
  ) ?? false;
}

