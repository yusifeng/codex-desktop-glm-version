// checkout-page-entry —— Checkout 页面公开入口。
import * as appSharedChunk from "@rchunk/app-shared";
import { r as initializeCheckoutPage, t as CheckoutPage } from "@rchunk/checkout-page-core";
void appSharedChunk;
initializeCheckoutPage();
export { CheckoutPage };
