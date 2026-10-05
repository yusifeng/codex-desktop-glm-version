export type ComposerPlaceholderFormatter = {
  formatMessage: (message: unknown, values?: Record<string, unknown>) => string;
};

export type ComposerPlaceholderMode = "chat" | "codex" | "work" | string;

/** Formats the mode-specific composer placeholder without renderer lifecycle state. */
export function formatComposerPlaceholder(
  formatter: ComposerPlaceholderFormatter,
  mode: ComposerPlaceholderMode,
  agentName?: string | null,
): string | undefined {
  switch (mode) {
    case "chat":
      return agentName == null
        ? formatter.formatMessage({
            id: "chatgptConversations.composer.placeholder",
            defaultMessage: "Ask ChatGPT",
            description: "Placeholder and accessible label for the empty Chat composer on the home screen and in conversations in the browser and desktop app. Invites the user to ask ChatGPT a question or give it a task.",
          })
        : formatter.formatMessage(
            {
              id: "workspaceAgents.detail.composerPlaceholder",
              defaultMessage: "Ask {agentName}",
              description: "Placeholder in the composer on a Workspace Agent page",
            },
            { agentName },
          );
    case "codex":
      return formatter.formatMessage({
        id: "homePage.composer.placeholder.askAnything.v2",
        defaultMessage: "Do anything",
        description: "Short, open-ended composer placeholder inviting the user to give Codex any kind of task. Translate idiomatically as an invitation, not as a literal command to do everything.",
      });
    case "work":
      return formatter.formatMessage({
        id: "composer.placeholder.workWithChatGPT",
        defaultMessage: "Work with ChatGPT",
        description: "Placeholder for the composer in Work mode",
      });
    default:
      return undefined;
  }
}
