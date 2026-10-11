/** Classifies worker IPC messages for transport performance counters. */
function classifyWorkerMessageCategory(message: {
  type?: string;
  method?: string;
  params?: { change?: { type?: string } };
}): string {
  if (message?.type === `request`) return `other_request`;
  if (message?.type === `response`) return `other_response`;
  if (message?.type !== `broadcast`) return `unknown`;
  if (message.method === `thread-stream-state-changed`) {
    const changeType = message.params?.change?.type;
    return changeType === `snapshot` || changeType === `patches` ? changeType : `unknown`;
  }
  return message.method === `thread-stream-following-changed` ||
    message.method === `thread-stream-following-status-requested`
    ? `follower_coordination`
    : `other_broadcast`;
}

export { classifyWorkerMessageCategory };
if (typeof module !== `undefined`) module.exports = { classifyWorkerMessageCategory };
