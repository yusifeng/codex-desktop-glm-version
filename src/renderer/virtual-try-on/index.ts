import "@rchunk/rolldown-runtime";

function stringEnum(values: readonly string[]): Record<string, string> {
  return Object.fromEntries(values.map((value) => [value, value]));
}

let entrySurface: Record<string, string>;
let likenessType: Record<string, string>;
let likenessSourceMethod: Record<string, string>;
let uploadOutcome: Record<string, string>;
let failureCategory: Record<string, string>;
let onboardingCloseReason: Record<string, string>;
let onboardingLastStep: Record<string, string>;
let likenessSettingsAction: Record<string, string>;
let removalOutcome: Record<string, string>;
let generationOutcome: Record<string, string>;
let entryPointShown: { $type: string };
let entryPointTapped: { $type: string };
let onboardingStarted: { $type: string };
let likenessSourceSelected: { $type: string };
let likenessUploadCompleted: { $type: string };
let setupGenerateTapped: { $type: string };
let onboardingClosed: { $type: string };
let likenessSettingsViewed: { $type: string };
let likenessSettingsActionTapped: { $type: string };
let likenessRemoved: { $type: string };
let generationStarted: { $type: string };
let generationCompleted: { $type: string };

const event = (name: string) => ({
  $type: `protobuf_analytics_events.v1.${name}`,
});

function initializeVirtualTryOnEvents(): void {
  entrySurface = stringEnum([
    "VIRTUAL_TRY_ON_ENTRY_SURFACE_UNSPECIFIED",
    "VIRTUAL_TRY_ON_ENTRY_SURFACE_PRODUCT_DETAIL",
    "VIRTUAL_TRY_ON_ENTRY_SURFACE_SETTINGS_PERSONALIZATION",
    "UNRECOGNIZED",
  ]);
  likenessType = stringEnum([
    "VIRTUAL_TRY_ON_LIKENESS_TYPE_UNSPECIFIED",
    "VIRTUAL_TRY_ON_LIKENESS_TYPE_FACE",
    "VIRTUAL_TRY_ON_LIKENESS_TYPE_BODY",
    "UNRECOGNIZED",
  ]);
  likenessSourceMethod = stringEnum([
    "VIRTUAL_TRY_ON_LIKENESS_SOURCE_METHOD_UNSPECIFIED",
    "VIRTUAL_TRY_ON_LIKENESS_SOURCE_METHOD_CAMERA",
    "VIRTUAL_TRY_ON_LIKENESS_SOURCE_METHOD_PHOTO_LIBRARY",
    "UNRECOGNIZED",
  ]);
  uploadOutcome = stringEnum([
    "VIRTUAL_TRY_ON_UPLOAD_OUTCOME_UNSPECIFIED",
    "VIRTUAL_TRY_ON_UPLOAD_OUTCOME_SUCCESS",
    "VIRTUAL_TRY_ON_UPLOAD_OUTCOME_FAILURE",
    "VIRTUAL_TRY_ON_UPLOAD_OUTCOME_CANCELLED",
    "UNRECOGNIZED",
  ]);
  failureCategory = stringEnum([
    "VIRTUAL_TRY_ON_FAILURE_CATEGORY_UNSPECIFIED",
    "VIRTUAL_TRY_ON_FAILURE_CATEGORY_NETWORK",
    "VIRTUAL_TRY_ON_FAILURE_CATEGORY_SERVER",
    "VIRTUAL_TRY_ON_FAILURE_CATEGORY_CLIENT",
    "VIRTUAL_TRY_ON_FAILURE_CATEGORY_PERMISSION_DENIED",
    "VIRTUAL_TRY_ON_FAILURE_CATEGORY_ASSET_LOADING",
    "VIRTUAL_TRY_ON_FAILURE_CATEGORY_UNKNOWN",
    "UNRECOGNIZED",
  ]);
  onboardingCloseReason = stringEnum([
    "VIRTUAL_TRY_ON_ONBOARDING_CLOSE_REASON_UNSPECIFIED",
    "VIRTUAL_TRY_ON_ONBOARDING_CLOSE_REASON_GENERATION_STARTED",
    "VIRTUAL_TRY_ON_ONBOARDING_CLOSE_REASON_DISMISSED",
    "VIRTUAL_TRY_ON_ONBOARDING_CLOSE_REASON_AVAILABILITY_LOST",
    "VIRTUAL_TRY_ON_ONBOARDING_CLOSE_REASON_SETUP_COMPLETED",
    "VIRTUAL_TRY_ON_ONBOARDING_CLOSE_REASON_ERROR",
    "UNRECOGNIZED",
  ]);
  onboardingLastStep = stringEnum([
    "VIRTUAL_TRY_ON_ONBOARDING_LAST_STEP_UNSPECIFIED",
    "VIRTUAL_TRY_ON_ONBOARDING_LAST_STEP_WELCOME",
    "VIRTUAL_TRY_ON_ONBOARDING_LAST_STEP_FACE_SELECTION",
    "VIRTUAL_TRY_ON_ONBOARDING_LAST_STEP_BODY_SELECTION",
    "VIRTUAL_TRY_ON_ONBOARDING_LAST_STEP_UPLOAD",
    "VIRTUAL_TRY_ON_ONBOARDING_LAST_STEP_READY",
    "UNRECOGNIZED",
  ]);
  likenessSettingsAction = stringEnum([
    "VIRTUAL_TRY_ON_LIKENESS_SETTINGS_ACTION_UNSPECIFIED",
    "VIRTUAL_TRY_ON_LIKENESS_SETTINGS_ACTION_ADD",
    "VIRTUAL_TRY_ON_LIKENESS_SETTINGS_ACTION_UPDATE",
    "VIRTUAL_TRY_ON_LIKENESS_SETTINGS_ACTION_REMOVE",
    "UNRECOGNIZED",
  ]);
  removalOutcome = stringEnum([
    "VIRTUAL_TRY_ON_REMOVAL_OUTCOME_UNSPECIFIED",
    "VIRTUAL_TRY_ON_REMOVAL_OUTCOME_SUCCESS",
    "VIRTUAL_TRY_ON_REMOVAL_OUTCOME_FAILURE",
    "VIRTUAL_TRY_ON_REMOVAL_OUTCOME_CANCELLED",
    "UNRECOGNIZED",
  ]);
  generationOutcome = stringEnum([
    "VIRTUAL_TRY_ON_GENERATION_OUTCOME_UNSPECIFIED",
    "VIRTUAL_TRY_ON_GENERATION_OUTCOME_SUCCESS",
    "VIRTUAL_TRY_ON_GENERATION_OUTCOME_FAILURE",
    "VIRTUAL_TRY_ON_GENERATION_OUTCOME_CANCELLED",
    "UNRECOGNIZED",
  ]);
  entryPointShown = event("VirtualTryOnEntryPointShown");
  entryPointTapped = event("VirtualTryOnEntryPointTapped");
  onboardingStarted = event("VirtualTryOnOnboardingStarted");
  likenessSourceSelected = event("VirtualTryOnLikenessSourceSelected");
  likenessUploadCompleted = event("VirtualTryOnLikenessUploadCompleted");
  setupGenerateTapped = event("VirtualTryOnSetupGenerateTapped");
  onboardingClosed = event("VirtualTryOnOnboardingClosed");
  likenessSettingsViewed = event("VirtualTryOnLikenessSettingsViewed");
  likenessSettingsActionTapped = event("VirtualTryOnLikenessSettingsActionTapped");
  likenessRemoved = event("VirtualTryOnLikenessRemoved");
  generationStarted = event("VirtualTryOnGenerationStarted");
  generationCompleted = event("VirtualTryOnGenerationCompleted");
}

export {
  initializeVirtualTryOnEvents as C,
  uploadOutcome as S,
  onboardingClosed as _,
  generationCompleted as a,
  removalOutcome as b,
  likenessRemoved as c,
  likenessSettingsViewed as d,
  likenessSourceMethod as f,
  onboardingCloseReason as g,
  likenessUploadCompleted as h,
  failureCategory as i,
  likenessSettingsAction as l,
  likenessType as m,
  entryPointTapped as n,
  generationOutcome as o,
  likenessSourceSelected as p,
  entrySurface as r,
  generationStarted as s,
  entryPointShown as t,
  likenessSettingsActionTapped as u,
  onboardingLastStep as v,
  setupGenerateTapped as x,
  onboardingStarted as y,
};
