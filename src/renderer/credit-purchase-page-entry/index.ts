// credit-purchase-page-entry —— Credits 购买页公开入口。
import * as appSharedChunk from "@rchunk/app-shared";
import * as pageChunk from "@rchunk/credit-purchase-page-core";
void appSharedChunk;
const { n: initializeCreditPurchasePage, t: CreditPurchasePage } = pageChunk;
initializeCreditPurchasePage();
export { CreditPurchasePage };
