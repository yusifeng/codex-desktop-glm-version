import {
  E4 as arraySchema,
  FX as initializeSignalRuntime,
  H4 as objectSchema,
  QI as initializeScopeRuntime,
  Z4 as stringSchema,
  ZI as appScope,
  g4 as initializeDialogRuntime,
  l3 as isEqual,
  rZ as createDerivedFamily,
} from "@rchunk/app-shared";
import {
  RVt as conversationNodes,
  uHt as initializeConversationNodes,
} from "@rchunk/app-initial";

export interface RequestContextPosition {
  conversationId: string;
  messageId: string;
}

export interface RequestContextProduct {
  cite?: boolean;
}

export interface RequestContextResult {
  isSourceCatalog: boolean;
  rewrittenQueries?: string[];
}

interface ConversationNode {
  message?: {
    author?: { role?: string };
    metadata?: {
      business_agent_context?: unknown;
      shopping?: unknown;
    };
  };
  parent?: string | null;
}

const shoppingMetadataSchema = objectSchema<{ rewritten_queries: string[] }>({
  rewritten_queries: arraySchema(stringSchema()).transform((values: unknown[]) =>
    values.filter(
      (value): value is string => typeof value === "string" && value !== "",
    ),
  ),
});

function deriveRequestContext(
  nodes: Record<string, ConversationNode> | null | undefined,
  position: RequestContextPosition,
  product: RequestContextProduct,
): RequestContextResult {
  let messageId: string | null | undefined = position.messageId;
  const visited = new Set<string>();
  let rewrittenQueries: string[] | undefined;
  let foundShopping = false;
  let isSourceCatalog = false;

  while (messageId != null && !visited.has(messageId)) {
    visited.add(messageId);
    const node = nodes?.[messageId];
    if (node == null) break;
    const message = node.message;
    if (product.cite && message?.metadata?.business_agent_context != null) {
      isSourceCatalog = true;
    }
    if (!foundShopping && message?.author?.role === "assistant") {
      const parsed = shoppingMetadataSchema.safeParse(message.metadata?.shopping);
      if (parsed.success) {
        foundShopping = true;
        rewrittenQueries =
          parsed.data.rewritten_queries.length > 0
            ? parsed.data.rewritten_queries
            : undefined;
      }
    }
    if (foundShopping && (!product.cite || isSourceCatalog)) break;
    messageId = node.parent;
  }
  return { rewrittenQueries, isSourceCatalog };
}

function readRequestContext(
  scope: { get(signal: unknown, parameter: string): unknown },
  position: RequestContextPosition,
  product: RequestContextProduct,
): RequestContextResult {
  return deriveRequestContext(
    scope.get(conversationNodes, position.conversationId) as
      | Record<string, ConversationNode>
      | null
      | undefined,
    position,
    product,
  );
}

let requestContextFamily: ReturnType<typeof createDerivedFamily>;

function initializeRequestContext(): void {
  initializeSignalRuntime();
  initializeDialogRuntime();
  initializeConversationNodes();
  initializeScopeRuntime();
  requestContextFamily = createDerivedFamily(
    appScope,
    (
      { context, product }: {
        context: RequestContextPosition;
        product: RequestContextProduct;
      },
      { get },
    ) =>
      deriveRequestContext(
        get(conversationNodes, context.conversationId) as
          | Record<string, ConversationNode>
          | null
          | undefined,
        context,
        product,
      ),
    { isEqual },
  );
}

export {
  initializeRequestContext as n,
  requestContextFamily as r,
  readRequestContext as t,
};
