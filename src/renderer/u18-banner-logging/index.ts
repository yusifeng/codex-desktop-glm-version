// Under-18 model-policy banner analytics. Release chunk: u18-banner-logging-126c6aef16d2.js.
import "@rchunk/rolldown-runtime";
import {
  Cpn as analyticsServiceSignal,
  ypn as initializeAppInitial,
} from "@rchunk/app-initial";
import {
  f as initializeParentalPresentation,
  p as isBannerEligible,
} from "@rchunk/settings-parental-presentation";

interface U18AnalyticsLogger {
  logU18ModelPolicyBannerEvent?(
    event: "U18 Model Policy Banner Shown" | "U18 Model Policy Banner Clicked",
    payload: {
      origin: "chat";
      user_id: string;
      timestamp_ms: number;
      timestamp_iso: string;
      cta?: string;
    },
  ): void;
}
interface U18Scope {
  get(signal: typeof analyticsServiceSignal): U18AnalyticsLogger;
}
interface U18User {
  userId: string;
}

function n(scope: U18Scope, user: U18User, cta?: string | null): void {
  if (!isBannerEligible(scope, user)) return;
  const timestamp = Date.now();
  scope
    .get(analyticsServiceSignal)
    .logU18ModelPolicyBannerEvent?.(
      cta == null
        ? "U18 Model Policy Banner Shown"
        : "U18 Model Policy Banner Clicked",
      {
        origin: "chat",
        user_id: user.userId,
        timestamp_ms: timestamp,
        timestamp_iso: new Date(timestamp).toISOString(),
        ...(cta == null ? {} : { cta }),
      },
    );
}

function t(): void {
  initializeAppInitial();
  initializeParentalPresentation();
}

export { n, t };
