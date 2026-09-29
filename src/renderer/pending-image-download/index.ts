import { n as defineInitializer } from "@rchunk/rolldown-runtime";
import { H4 as objectSchema, R4 as optionalSchema, V4 as numberSchema, g4 as initializeSchemaRuntime, q4 as stringSchema } from "@rchunk/app-shared";
import { GGt as initializeImageDownload, HGt as initializeImageCheckout, krt as initializeImageAssets } from "@rchunk/app-initial";

export interface PendingCheckoutImageDownloadOptions {
  hasPaidSubscription: boolean;
  intl: unknown;
  signal: AbortSignal;
}

async function resumePendingCheckoutImageDownload(_options: PendingCheckoutImageDownloadOptions): Promise<void> {}

const initializePendingImageDownload = (defineInitializer as (factory: () => void) => () => void)(() => {
  initializeSchemaRuntime();
  initializeImageDownload();
  initializeImageAssets();
  initializeImageCheckout();
  objectSchema({
    asset: objectSchema({
      asset_pointer: stringSchema().min(1),
      content_type: optionalSchema("image_asset_pointer"),
      width: numberSchema(),
      height: numberSchema(),
      size_bytes: numberSchema(),
    }),
    conversationId: stringSchema().optional(),
    createdAt: numberSchema(),
  });
});

initializePendingImageDownload();

export { resumePendingCheckoutImageDownload };
