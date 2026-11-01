import "@rchunk/rolldown-runtime";
import {
  E4 as arraySchema,
  H4 as objectSchema,
  M4 as discriminatedUnionSchema,
  R4 as literalSchema,
  g4 as initializeValidationRuntime,
  k4 as booleanSchema,
  q4 as stringSchema,
  type SafeParseSchema,
} from "@rchunk/app-shared";

interface WebMcpCall {
  description?: string;
  inputJson?: string;
  inputTruncated?: true;
  kind: "invokeTool" | "listTools";
  name: string;
  outputJson?: string;
  outputTruncated?: true;
  readOnlyHint?: boolean;
  sourceHostname?: string;
  title?: string;
}

let webMcpCallSchema: SafeParseSchema<WebMcpCall>;
let webMcpMetadataSchema: SafeParseSchema<{
  "codex/toolSurface": {
    kind: "browserUse";
    webMcpCalls: WebMcpCall[];
  };
}>;

function webMcpCallsFromMetadata(metadata: unknown): WebMcpCall[] {
  const parsed = webMcpMetadataSchema.safeParse(metadata);
  return parsed.success
    ? parsed.data["codex/toolSurface"].webMcpCalls
    : [];
}

function initializeWebMcpToolCalls(): void {
  initializeValidationRuntime();
  webMcpCallSchema = discriminatedUnionSchema("kind", [
    objectSchema({
      kind: literalSchema("listTools"),
      name: literalSchema("webmcp_list_tools"),
      title: stringSchema().min(1).optional(),
      description: stringSchema().optional(),
      readOnlyHint: booleanSchema().optional(),
      sourceHostname: stringSchema().min(1).optional(),
      outputJson: stringSchema().optional(),
      outputTruncated: literalSchema(true).optional(),
    }),
    objectSchema({
      kind: literalSchema("invokeTool"),
      name: stringSchema().refine((name) => name.trim().length > 0),
      title: stringSchema().min(1).optional(),
      description: stringSchema().optional(),
      readOnlyHint: booleanSchema().optional(),
      sourceHostname: stringSchema().min(1).optional(),
      inputJson: stringSchema().optional(),
      inputTruncated: literalSchema(true).optional(),
      outputJson: stringSchema().optional(),
      outputTruncated: literalSchema(true).optional(),
    }),
  ]) as SafeParseSchema<WebMcpCall>;
  webMcpMetadataSchema = objectSchema({
    "codex/toolSurface": objectSchema({
      kind: literalSchema("browserUse"),
      webMcpCalls: arraySchema(webMcpCallSchema),
    }),
  }) as SafeParseSchema<{
    "codex/toolSurface": {
      kind: "browserUse";
      webMcpCalls: WebMcpCall[];
    };
  }>;
}
export { initializeWebMcpToolCalls as n, webMcpCallsFromMetadata as t };
