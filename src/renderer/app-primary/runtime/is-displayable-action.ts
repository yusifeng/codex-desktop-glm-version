export type ActionType = "primary" | "secondary" | string;

export type ActionDescriptor = {
  type?: ActionType;
  action_v2?: {
    action_enum?: string;
  };
};

/** Returns whether an action is rendered in the primary/secondary action surface. */
export function isDisplayableAction(action: ActionDescriptor): boolean {
  return (
    (action.type === "primary" || action.type === "secondary") &&
    action.action_v2?.action_enum !==
      "submit_personalized_information_questionnaire_feedback"
  );
}
