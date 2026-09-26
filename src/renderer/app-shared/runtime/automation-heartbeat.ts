export interface HeartbeatPrompt {
  automationId: string | null;
  currentTimeIso: string;
  instructions: string;
}

export interface AutomationInputItem extends Record<string, unknown> {
  type: string;
  text?: string;
}

export interface AutomationToolOutput extends Record<string, unknown> {
  namespace?: string;
  name?: string;
  output?: unknown;
}

function extractXmlElement(source: string, element: string): string | null {
  return (
    new RegExp(`<${element}>\\s*([\\s\\S]*?)\\s*</${element}>`, "i")
      .exec(source)?.[1]
      .trim() ?? null
  );
}

/** 原 `rR` / 压缩导出 `kY`。 */
export function parseHeartbeatPrompt(source: string): HeartbeatPrompt | null {
  const trimmed = source.trim();
  if (!trimmed.startsWith("<heartbeat>") || !trimmed.endsWith("</heartbeat>")) {
    return null;
  }
  const currentTimeIso = extractXmlElement(trimmed, "current_time_iso");
  const instructions = extractXmlElement(trimmed, "instructions");
  return currentTimeIso == null || instructions == null
    ? null
    : {
        automationId: extractXmlElement(trimmed, "automation_id"),
        currentTimeIso,
        instructions,
      };
}

/** 原 `RNe` / 压缩导出 `AY`。 */
export function parseHeartbeatInput(
  input: readonly AutomationInputItem[] | null | undefined,
): HeartbeatPrompt | null {
  return input == null
    ? null
    : parseHeartbeatPrompt(
        input
          .flatMap((item) =>
            item.type === "text" && typeof item.text === "string"
              ? [item.text]
              : [],
          )
          .join("\n"),
      );
}

/** 原 `BNe` / 压缩导出 `EY`。 */
export function extractAutomationUpdateOutput(
  toolOutput: AutomationToolOutput | null | undefined,
): string | null {
  if (
    toolOutput?.namespace !== "codex_app" ||
    toolOutput.name !== "automation_update" ||
    typeof toolOutput.output !== "string"
  ) {
    return null;
  }
  const output = toolOutput.output;
  return (output.startsWith("Automation: ") &&
    output.includes("\nAutomation ID: ")) ||
    parseHeartbeatPrompt(output) != null
    ? output
    : null;
}

/** 原 `zNe` / 压缩导出 `OY`。 */
export function initializeHeartbeatInputParser(): void {}

/** 原 `aR` / 压缩导出 `DY`。 */
export function initializeAutomationUpdateOutputParser(): void {}
