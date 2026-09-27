import "@rchunk/rolldown-runtime";
import {
  G2 as defineMessages,
  K2 as initializeInternationalization,
} from "@rchunk/app-shared";

const ChatGptFamilyTeenOnboardingStep = {
  CHATGPT_FAMILY_TEEN_ONBOARDING_STEP_UNSPECIFIED:
    "CHATGPT_FAMILY_TEEN_ONBOARDING_STEP_UNSPECIFIED",
  CHATGPT_FAMILY_TEEN_ONBOARDING_STEP_SIGNUP_INTRO:
    "CHATGPT_FAMILY_TEEN_ONBOARDING_STEP_SIGNUP_INTRO",
  CHATGPT_FAMILY_TEEN_ONBOARDING_STEP_GUIDED_LEARNING:
    "CHATGPT_FAMILY_TEEN_ONBOARDING_STEP_GUIDED_LEARNING",
  CHATGPT_FAMILY_TEEN_ONBOARDING_STEP_IMAGE_CREATION:
    "CHATGPT_FAMILY_TEEN_ONBOARDING_STEP_IMAGE_CREATION",
  CHATGPT_FAMILY_TEEN_ONBOARDING_STEP_PERSONALIZATION:
    "CHATGPT_FAMILY_TEEN_ONBOARDING_STEP_PERSONALIZATION",
  CHATGPT_FAMILY_TEEN_ONBOARDING_STEP_WELLBEING:
    "CHATGPT_FAMILY_TEEN_ONBOARDING_STEP_WELLBEING",
  UNRECOGNIZED: "UNRECOGNIZED",
} as const;

const ChatGptFamilyTeenOnboardingAction = {
  CHATGPT_FAMILY_TEEN_ONBOARDING_ACTION_UNSPECIFIED:
    "CHATGPT_FAMILY_TEEN_ONBOARDING_ACTION_UNSPECIFIED",
  CHATGPT_FAMILY_TEEN_ONBOARDING_ACTION_CLOSE_CLICKED:
    "CHATGPT_FAMILY_TEEN_ONBOARDING_ACTION_CLOSE_CLICKED",
  CHATGPT_FAMILY_TEEN_ONBOARDING_ACTION_EXPLORE_CLICKED:
    "CHATGPT_FAMILY_TEEN_ONBOARDING_ACTION_EXPLORE_CLICKED",
  CHATGPT_FAMILY_TEEN_ONBOARDING_ACTION_NEXT_CLICKED:
    "CHATGPT_FAMILY_TEEN_ONBOARDING_ACTION_NEXT_CLICKED",
  CHATGPT_FAMILY_TEEN_ONBOARDING_ACTION_GET_HOMEWORK_HELP_CLICKED:
    "CHATGPT_FAMILY_TEEN_ONBOARDING_ACTION_GET_HOMEWORK_HELP_CLICKED",
  CHATGPT_FAMILY_TEEN_ONBOARDING_ACTION_CREATE_IMAGE_CLICKED:
    "CHATGPT_FAMILY_TEEN_ONBOARDING_ACTION_CREATE_IMAGE_CLICKED",
  CHATGPT_FAMILY_TEEN_ONBOARDING_ACTION_ADD_PERSONALIZATION_CLICKED:
    "CHATGPT_FAMILY_TEEN_ONBOARDING_ACTION_ADD_PERSONALIZATION_CLICKED",
  CHATGPT_FAMILY_TEEN_ONBOARDING_ACTION_RETURN_TO_CHAT_CLICKED:
    "CHATGPT_FAMILY_TEEN_ONBOARDING_ACTION_RETURN_TO_CHAT_CLICKED",
  CHATGPT_FAMILY_TEEN_ONBOARDING_ACTION_LEARN_MORE_CLICKED:
    "CHATGPT_FAMILY_TEEN_ONBOARDING_ACTION_LEARN_MORE_CLICKED",
  CHATGPT_FAMILY_TEEN_ONBOARDING_ACTION_VERIFY_AGE_CLICKED:
    "CHATGPT_FAMILY_TEEN_ONBOARDING_ACTION_VERIFY_AGE_CLICKED",
  UNRECOGNIZED: "UNRECOGNIZED",
} as const;

const teenOnboardingStepShownEvent = {
  $type: "protobuf_analytics_events.v1.ChatgptFamilyTeenOnboardingStepShown",
};
const teenOnboardingActionTakenEvent = {
  $type: "protobuf_analytics_events.v1.ChatgptFamilyTeenOnboardingActionTaken",
};
const teenOnboardingThemeChangedEvent = {
  $type: "protobuf_analytics_events.v1.ChatgptFamilyTeenOnboardingThemeChanged",
};

const chatGptAccentMessages = defineMessages({
  lightCustom: {
    id: "settings.appearance.chatGptAccent.lightCustom",
    defaultMessage: "Light custom accent color",
    description: "Accessible label for the custom hexadecimal accent input for light appearance",
  },
  darkCustom: {
    id: "settings.appearance.chatGptAccent.darkCustom",
    defaultMessage: "Dark custom accent color",
    description: "Accessible label for the custom hexadecimal accent input for dark appearance",
  },
  default: {
    id: "settings.appearance.chatGptAccent.default",
    defaultMessage: "Default",
    description: "Option in the appearance Accent menu that follows ChatGPT's default accent palette",
  },
  blue: { id: "settings.appearance.chatGptAccent.blue", defaultMessage: "Blue" },
  green: { id: "settings.appearance.chatGptAccent.green", defaultMessage: "Green" },
  yellow: { id: "settings.appearance.chatGptAccent.yellow", defaultMessage: "Yellow" },
  pink: { id: "settings.appearance.chatGptAccent.pink", defaultMessage: "Pink" },
  orange: { id: "settings.appearance.chatGptAccent.orange", defaultMessage: "Orange" },
  purple: { id: "settings.appearance.chatGptAccent.purple", defaultMessage: "Purple" },
  black: { id: "settings.appearance.chatGptAccent.black", defaultMessage: "Black" },
  white: { id: "settings.appearance.chatGptAccent.white", defaultMessage: "White" },
  custom: { id: "settings.appearance.chatGptAccent.custom", defaultMessage: "Custom" },
  updateError: {
    id: "settings.appearance.chatGptAccent.updateError",
    defaultMessage: "Could not update accent color",
  },
});

function initializeTeenOnboardingAnalytics(): void {}

function initializeChatGptAccentMessages(): void {
  initializeInternationalization();
}

export {
  ChatGptFamilyTeenOnboardingStep as a,
  initializeTeenOnboardingAnalytics as c,
  teenOnboardingActionTakenEvent as i,
  chatGptAccentMessages as n,
  teenOnboardingStepShownEvent as o,
  ChatGptFamilyTeenOnboardingAction as r,
  teenOnboardingThemeChangedEvent as s,
  initializeChatGptAccentMessages as t,
};
