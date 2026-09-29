// Asymmetric-key roles teaching model. Release chunk: model-d30b7c46ced0.js.
import "@rchunk/rolldown-runtime";

type SecurityGoal = "confidentiality" | "authenticity";
interface AsymmetricKeyInput { initial_goal?: SecurityGoal | string; stepIndex?: number }

const asymmetricKeyStepControl = { min: 0, max: 4, step: 1, defaultValue: 0 };
const normalizeAsymmetricKeyInput = (input: AsymmetricKeyInput) => {
  const stepIndex = Number.isFinite(input.stepIndex)
    ? Math.round(input.stepIndex ?? asymmetricKeyStepControl.defaultValue)
    : asymmetricKeyStepControl.defaultValue;
  return {
    initial_goal: input.initial_goal === "authenticity" ? "authenticity" as const : "confidentiality" as const,
    stepIndex: Math.min(asymmetricKeyStepControl.max, Math.max(asymmetricKeyStepControl.min, stepIndex)),
  };
};
const describeAsymmetricKeyFlow = (goal: SecurityGoal) => goal === "confidentiality" ? {
  senderOperation: "encrypt",
  senderKeyOwner: "recipient",
  senderKeyType: "public",
  artifact: "ciphertext",
  recipientOperation: "decrypt",
  recipientKeyOwner: "recipient",
  recipientKeyType: "private",
  outcome: "confidentiality",
} : {
  senderOperation: "sign",
  senderKeyOwner: "sender",
  senderKeyType: "private",
  artifact: "message-and-signature",
  recipientOperation: "verify",
  recipientKeyOwner: "sender",
  recipientKeyType: "public",
  outcome: "authenticity-and-integrity",
};
function initializeAsymmetricKeyRolesModel(): void {}

export { normalizeAsymmetricKeyInput as i, describeAsymmetricKeyFlow as n, initializeAsymmetricKeyRolesModel as r, asymmetricKeyStepControl as t };
