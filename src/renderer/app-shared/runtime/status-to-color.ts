export type StatusColor =
  | "awaiting-approval"
  | "awaiting-response"
  | "error"
  | "idle"
  | "off"
  | "unread"
  | "working";
/** Map activity status to its stable color token. */
export function statusToColor(status: StatusColor): number;
export function statusToColor(status: string): number | undefined;
export function statusToColor(status: string): number | undefined {
  switch (status) {
    case "working": return 3166206;
    case "unread": return 65356;
    case "idle": return 16777215;
    case "awaiting-approval":
    case "awaiting-response": return 16739584;
    case "error": return 16711731;
    case "off": return 0;
    default: return undefined;
  }
}
