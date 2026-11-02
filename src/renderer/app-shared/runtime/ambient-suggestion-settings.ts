import { z } from "@rchunk/renderer-zod-runtime";

export interface AmbientSuggestionSetting<T> {
  agentAccess: "read-write";
  default: T;
  description: string;
  hostStorage: { kind: "global-state"; key: string };
  key: string;
  schema: z.ZodType<T>;
}

function globalStateSetting<T>(
  definition: Omit<AmbientSuggestionSetting<T>, "hostStorage">,
): AmbientSuggestionSetting<T> {
  return {
    ...definition,
    hostStorage: { kind: "global-state", key: definition.key },
  };
}

/** 原 `_U` / 压缩导出 `Tz`。 */
export const ambientSuggestionSettings = {
  enabled: globalStateSetting({
    agentAccess: "read-write",
    default: true,
    description: "Whether home-page ambient suggestions are enabled",
    key: "ambient-suggestions-enabled",
    schema: z.boolean(),
  }),
} as const;

/** 原 `vU` / 压缩导出 `Ez`。 */
export function initializeAmbientSuggestionSettings(): void {}
