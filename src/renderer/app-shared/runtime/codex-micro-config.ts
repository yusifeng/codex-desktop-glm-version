import { z } from "@rchunk/renderer-zod-runtime";

export const codexMicroIdleTimeoutSchema = z.enum([
  "off",
  "30-seconds",
  "1-minute",
  "3-minutes",
  "10-minutes",
  "30-minutes",
  "1-hour",
]);

export type CodexMicroIdleTimeout = z.infer<
  typeof codexMicroIdleTimeoutSchema
>;

const CODEX_MICRO_IDLE_TIMEOUT_MS: Record<
  CodexMicroIdleTimeout,
  number | null
> = {
  off: null,
  "30-seconds": 30_000,
  "1-minute": 60_000,
  "3-minutes": 180_000,
  "10-minutes": 600_000,
  "30-minutes": 1_800_000,
  "1-hour": 3_600_000,
};

export const codexMicroAgentKeyIds = [
  "AG00",
  "AG01",
  "AG02",
  "AG03",
  "AG04",
  "AG05",
] as const;

export const codexMicroEncoderModeSchema = z.enum([
  "composer-navigation",
  "reasoning",
  "conversation-scroll",
  "custom",
]);

export const codexMicroVoiceButtonModeSchema = z.enum([
  "push-to-talk",
  "realtime",
]);

export const codexMicroTaskSortSchema = z.enum([
  "pinned",
  "recent",
  "priority",
  "custom",
]);

export const composerSubmitModeValues = [
  "enter",
  "cmdIfMultiline",
  "cmdAlways",
] as const;

const codexMicroKeycapIdSchema = z.enum(
  "FAST.APPR.REJ.SPLIT.MIC.MIC1.CODEX.BUG.OAI.TERM.DWN.DEL.NEW.NAV.MAGIC.DIFF.PLAY.GIT.BRCH.BRANCH.MRG.PR.PAINT.LAB.PARTY.TIME.MIND+.MIND-.EMPT1.EMPT2.EMPT3.EMPT4.SETUP.FOLD.UPL.APPS.YOLO.YEET.EMPT5".split(
    ".",
  ) as [string, ...string[]],
);

const commandActionSchema = z.object({
  type: z.literal("command"),
  commandId: z.string().min(1),
});
const skillActionSchema = z.object({
  type: z.literal("skill"),
  skillName: z.string().min(1),
  skillPath: z.string().min(1),
});
const configurableActionSchema = z.discriminatedUnion("type", [
  commandActionSchema,
  skillActionSchema,
  z.object({ type: z.literal("composer-text"), text: z.string().min(1) }),
]);
const directionalActionSchema = z.discriminatedUnion("type", [
  commandActionSchema,
  skillActionSchema,
]);
const slotSchema = z.object({
  keycapId: codexMicroKeycapIdSchema,
  commandId: z.string().optional(),
  action: configurableActionSchema.optional(),
});

const defaultAnalogStick = {
  up: { type: "command", commandId: "composer.togglePlanMode" },
  right: { type: "command", commandId: "navigateForward" },
  down: { type: "command", commandId: "toggleSidebar" },
  left: { type: "command", commandId: "navigateBack" },
} as const;
const defaultEncoder = {
  left: null,
  right: null,
  click: null,
  longPress: null,
};

export const codexMicroConfigSchema = z.object({
  version: z.literal(1),
  slots: z.object({
    ACT06: slotSchema,
    ACT07: slotSchema,
    ACT08: slotSchema,
    ACT09: slotSchema,
    ACT10: slotSchema.default({ keycapId: "MIC1" }),
    ACT11: slotSchema.default({ keycapId: "EMPT1" }),
    ACT10_ACT11: slotSchema,
    ACT12: slotSchema,
  }),
  analogStick: z.object({
    up: directionalActionSchema.nullable(),
    right: directionalActionSchema.nullable(),
    down: directionalActionSchema.nullable(),
    left: directionalActionSchema.nullable(),
  }).default(defaultAnalogStick),
  encoder: z.object({
    left: directionalActionSchema.nullable(),
    right: directionalActionSchema.nullable(),
    click: directionalActionSchema.nullable(),
    longPress: directionalActionSchema.nullable(),
  }).default(defaultEncoder),
  encoderMode: codexMicroEncoderModeSchema.default("composer-navigation"),
  voiceButtonMode: codexMicroVoiceButtonModeSchema.default("push-to-talk"),
  separateMicrophoneKeys: z.boolean().default(false),
});

export type CodexMicroConfig = z.infer<typeof codexMicroConfigSchema>;

export const DEFAULT_CODEX_MICRO_CONFIG: CodexMicroConfig = {
  version: 1,
  slots: {
    ACT06: { keycapId: "FAST" },
    ACT07: { keycapId: "APPR" },
    ACT08: { keycapId: "REJ" },
    ACT09: { keycapId: "SPLIT" },
    ACT10: { keycapId: "MIC1" },
    ACT11: { keycapId: "EMPT1" },
    ACT10_ACT11: { keycapId: "MIC" },
    ACT12: { keycapId: "CODEX" },
  },
  analogStick: defaultAnalogStick,
  encoder: defaultEncoder,
  encoderMode: "composer-navigation",
  voiceButtonMode: "push-to-talk",
  separateMicrophoneKeys: false,
};

export type CodexMicroStatus =
  | "awaiting-approval"
  | "awaiting-response"
  | "error"
  | "idle"
  | "off"
  | "unread"
  | "working";

/** 原 `TMe` / 压缩导出 `TX`。 */
export function getCodexMicroIdleTimeoutMs(
  timeout: CodexMicroIdleTimeout,
): number | null {
  return CODEX_MICRO_IDLE_TIMEOUT_MS[timeout];
}

/** 原 `EMe` / 压缩导出 `EX`。 */
export function getCodexMicroStatusColor(status: CodexMicroStatus): number {
  switch (status) {
    case "working":
      return 3_166_206;
    case "unread":
      return 65_356;
    case "idle":
      return 16_777_215;
    case "awaiting-approval":
    case "awaiting-response":
      return 16_739_584;
    case "error":
      return 16_711_731;
    case "off":
      return 0;
  }
}

/** 原 `IL` / 压缩导出 `lX`。 */
export function isAutomatedReviewSource(source: unknown): boolean {
  return source === "auto_review" || source === "guardian_subagent";
}

function normalizeModelSlug(model: string): string | null {
  const separator = model.indexOf("/");
  if (separator === -1) return model;
  const provider = model.slice(0, separator);
  const slug = model.slice(separator + 1);
  return provider.length === 0 ||
    slug.includes("/") ||
    !/^[A-Za-z0-9_-]+$/.test(provider)
    ? null
    : slug;
}

export interface AutoReviewConfig {
  autoReview?: { requiredOnModels?: readonly string[] };
}

/** 原 `FMe` / 压缩导出 `uX`。 */
export function isAutoReviewRequiredForModel(
  config: AutoReviewConfig | null | undefined,
  model: string | null | undefined,
): boolean {
  if (model == null) return false;
  const requiredModels = config?.autoReview?.requiredOnModels;
  if (requiredModels == null) return false;
  const slug = normalizeModelSlug(model);
  return slug != null && requiredModels.includes(slug);
}

/** 原 `ML` / 压缩导出 `DX`。 */
export function initializeCodexMicroConfig(): void {}
