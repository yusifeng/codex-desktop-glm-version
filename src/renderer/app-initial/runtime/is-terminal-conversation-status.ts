/** Returns whether a conversation status is still actively streaming work. */
export function isTerminalConversationStatus(status: unknown): boolean {
  switch (status) {
    case "active-async-turn":
    case "active-tpp-turn":
    case "streaming":
      return true;
    case "error":
    case "idle":
      return false;
    default:
      return false;
  }
}
