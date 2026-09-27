// checkout-page-entry —— Checkout 页面公开入口。
import * as appSharedChunk from "@rchunk/app-shared";
import * as pageChunk from "@rchunk/checkout-page-core";
void appSharedChunk;
const { r: initializeCheckoutPage, t: CheckoutPage } = pageChunk;
initializeCheckoutPage();
export { CheckoutPage };
