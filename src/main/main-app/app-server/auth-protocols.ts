const APP_SERVER_PROTOCOL = "codex-app-server";
const BEARER_PROTOCOL_PREFIX = "openai-bearer.";

export function appServerProtocolsForToken(token: string): [string, string] {
  return [APP_SERVER_PROTOCOL, `${BEARER_PROTOCOL_PREFIX}${token}`];
}
