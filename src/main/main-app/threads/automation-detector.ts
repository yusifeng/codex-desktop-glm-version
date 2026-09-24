// automation（心跳通知）消息解析与判定器。
//
// 原版 main-C-Mhak1n.ts 33,143-33,187（q_/heartbeat 解析/Y_）。automations
// 产生的 assistant 消息带 <heartbeat> 块（含 NOTIFY/DONT_NOTIFY 决策与
// 通知文案），用户不可见；判定器用于在 turn 合并/压缩时识别并无痕处理
// 这类消息，以及 canonical voice 历史的版本门（q_）。

import {
  Wu as hasCapability,
  fd as parseAutomationUserInput,
} from "@chunk/shared";

/**
 * 线程是否使用 canonical voice 历史（原版 q_）：非 fork、paginated 模式、
 * cliVersion 非 0.0.0 且 ≥ 'threadTimeline' 能力。
 */
export function hasCanonicalVoiceHistory(thread: {
  forkedFromId?: string | null;
  historyMode?: string;
  cliVersion?: string;
}): boolean {
  return (
    thread.forkedFromId == null &&
    thread.historyMode === `paginated` &&
    thread.cliVersion !== `0.0.0` &&
    hasCapability(thread.cliVersion, `threadTimeline`)
  );
}

/** 剥离全部 <heartbeat> 块（含 ```xml 围栏形态，原版 r_e）；无块返回 null。 */
function stripHeartbeatBlocks(message: string): string | null {
  let trimmed = message.trim();
  let withoutHeartbeat = trimmed
    .replace(/```(?:xml)?\s*<heartbeat>[\s\S]*?<\/heartbeat>\s*```/gi, ``)
    .replace(/<heartbeat>[\s\S]*?<\/heartbeat>/gi, ``)
    .trim();
  return withoutHeartbeat === trimmed ? null : withoutHeartbeat;
}

/** 取最后一个 <heartbeat> 块（原版 i_e）。 */
function lastHeartbeatBlock(message: string): string | null {
  return Array.from(message.trim().matchAll(/<heartbeat>[\s\S]*?<\/heartbeat>/gi)).at(-1)?.[0] ?? null;
}

/** 取 heartbeat 块内的 <message> 文案（CDATA 解包，原版 a_e）。 */
function heartbeatMessage(block: string): string {
  let message = block.match(/<message>\s*([\s\S]*?)\s*<\/message>/i)?.[1]?.trim() ?? ``;
  return message.match(/^<!\[CDATA\[([\s\S]*)\]\]>$/)?.[1]?.trim() ?? message;
}

/** 解析 assistant 消息的心跳决策（原版 J_）：无 heartbeat 块或无决策返回 null。 */
function parseHeartbeatDecision(message: string): {
  decision: `NOTIFY` | `DONT_NOTIFY`;
  visibleText: string;
  notificationMessage: string | null;
} | null {
  let visibleText = stripHeartbeatBlocks(message);
  let block = lastHeartbeatBlock(message);
  if (visibleText == null || block == null) return null;
  let decisionMatch = block.match(/<decision>\s*(NOTIFY|DONT_NOTIFY)\s*<\/decision>/i);
  if (decisionMatch == null) return null;
  let notificationMessage = heartbeatMessage(block);
  return {
    decision: decisionMatch[1].toUpperCase() === `NOTIFY` ? `NOTIFY` : `DONT_NOTIFY`,
    visibleText,
    notificationMessage: notificationMessage.length > 0 ? notificationMessage : null,
  };
}

/** 解析 automation 的 userInput 消息（原版 n_e）：CDATA 直包 DONT_NOTIFY
 *  的短路形态 + 完整 heartbeat 解析。 */
function parseAutomationUserMessage(message: string): {
  decision: `NOTIFY` | `DONT_NOTIFY`;
  visibleText: string;
  notificationMessage: string | null;
} | null {
  return ((message.match(/^<!\[CDATA\[ ([\s\S]*) \]\]>$/)?.[1] ?? message) as string).trim() === `DONT_NOTIFY`
    ? { decision: `DONT_NOTIFY`, visibleText: ``, notificationMessage: null }
    : parseHeartbeatDecision(message);
}

/**
 * automation 判定器（原版 Y_）——兼作 turnMergePolicy（isAutomationUserInput/
 * isAutomationAssistantMessage 两个方法面）。
 */
export const AUTOMATION_DETECTOR = {
  isAutomationAssistantMessage: (text: any) => parseHeartbeatDecision(text) != null,
  isAutomationUserInput: (input: any) => parseAutomationUserInput(input) != null,
};

export { parseHeartbeatDecision, parseAutomationUserMessage };
