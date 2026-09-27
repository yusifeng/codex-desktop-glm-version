import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";

export interface MessageDescriptor { id: string; defaultMessage: string; description: string }
const sourcesTitle: MessageDescriptor = { id: "chatgptConversations.summaryPanel.sources.title", defaultMessage: "Sources", description: "Title for the sources section in the ChatGPT summary panel" };
const sourceCategoryMessages = {
  links: { id: "chatgptConversations.sources.category.links", defaultMessage: "Links", description: "Suggested navigation links" },
  more: { id: "chatgptConversations.sources.category.more", defaultMessage: "More", description: "Additional uncited search results" },
  apps: { id: "chatgptConversations.sources.category.apps", defaultMessage: "Apps", description: "Connected app sources" },
  files: { id: "chatgptConversations.sources.category.files", defaultMessage: "Files", description: "File sources" },
  memory: { id: "chatgptConversations.sources.category.memory", defaultMessage: "Memory", description: "Remembered information" },
  skills: { id: "chatgptConversations.sources.category.skills", defaultMessage: "Skills", description: "Skill sources" },
  web: { id: "chatgptConversations.sources.category.web", defaultMessage: "Web", description: "Cited websites" },
} as const;
const skillAttributionMessages = {
  plugin: { id: "chatgptConversations.sources.skill.attribution.plugin", defaultMessage: "Plugin", description: "Plugin skill attribution" },
  skill: { id: "chatgptConversations.sources.skill.attribution.skill", defaultMessage: "Skill", description: "Skill attribution" },
} as const;
const memoryAttributionMessages = {
  userInstructions: { id: "chatgptConversations.sources.memory.attribution.userInstructions", defaultMessage: "Custom instructions", description: "Account custom instructions" },
  userMemory: { id: "chatgptConversations.sources.memory.attribution.userMemory", defaultMessage: "Saved memory", description: "Saved account memory" },
  generalMemory: { id: "chatgptConversations.sources.memory.attribution.generalMemory", defaultMessage: "Memory", description: "General account memory" },
} as const;
function initializeChatGptSourcesMessages(): void {}
export { initializeChatGptSourcesMessages as a, sourcesTitle as i, skillAttributionMessages as n, sourceCategoryMessages as r, memoryAttributionMessages as t };
