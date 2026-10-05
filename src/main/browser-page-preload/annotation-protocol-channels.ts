function createAnnotationProtocolChannels(metadataLimits: unknown) {
  return {
    requestEvent: `codex:annotation-surface-request`, responseEvent: `codex:annotation-surface-response`,
    removeEvent: `codex:annotation-surfaces-remove`, availableEvent: `codex:annotation-surface-available`,
    busySlot: `codex:annotation-surface-pending`, deadlineMs: 250, maxPayloadLength: 8192,
    maxIdLength: 128, maxRoleLength: 64, rolePattern: `^[a-z][a-z0-9-]*(?![\\s\\S])`, metadataLimits,
  };
}
export { createAnnotationProtocolChannels };
if (typeof module !== `undefined`) module.exports = { createAnnotationProtocolChannels };
