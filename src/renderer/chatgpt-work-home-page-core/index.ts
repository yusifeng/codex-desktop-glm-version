import "@rchunk/rolldown-runtime";
import "@rchunk/app-primary";
import "@rchunk/home-task-suggestions-core";
import { I3 as getJsxRuntime, e6 as getReactRuntime } from "@rchunk/app-shared";
import { cJt as initializeApiClient } from "@rchunk/app-initial";

interface WorkHomePageProps {
  additionalDeveloperInstructions?: string;
  initialPrompt?: string;
  onSubmit?(input: { developerInstructions?: string; prompt: string }): Promise<unknown> | unknown;
  onTaskSuggestionSelected?(suggestion: string): void;
  renderHomeContent?: (context: { setPrompt(value: string): void }) => unknown;
  suggestions?: string[];
}
const jsx = getJsxRuntime();
const React = getReactRuntime();
function ChatGptWorkHomePage({ additionalDeveloperInstructions, initialPrompt = "", onSubmit, onTaskSuggestionSelected, renderHomeContent, suggestions = [] }: WorkHomePageProps): unknown {
  const [prompt, setPrompt] = React.useState(initialPrompt);
  const [pending, setPending] = React.useState(false);
  const submit = async (event: { preventDefault(): void }) => {
    event.preventDefault();
    if (pending || prompt.trim() === "") return;
    setPending(true);
    try { await onSubmit?.({ prompt: prompt.trim(), developerInstructions: additionalDeveloperInstructions }); setPrompt(""); } finally { setPending(false); }
  };
  return jsx.jsxs("div", { className: "flex h-full flex-col", "data-testid": "chatgpt-work-home-page", "data-vscode-context": '{"chatgpt.supportsNewChatMenu": true}', children: [renderHomeContent?.({ setPrompt }), jsx.jsx("main", { className: "flex flex-1 items-center justify-center", children: jsx.jsxs("form", { onSubmit: submit, children: [jsx.jsx("h1", { children: "What are you working on?" }), jsx.jsx("textarea", { "aria-label": "Message ChatGPT", value: prompt, onChange: (event: { currentTarget: { value: string } }) => setPrompt(event.currentTarget.value) }), jsx.jsx("button", { type: "submit", disabled: pending || prompt.trim() === "", children: "Send" }), suggestions.length ? jsx.jsx("ul", { children: suggestions.map(suggestion => jsx.jsx("li", { children: jsx.jsx("button", { type: "button", onClick: () => { setPrompt(suggestion); onTaskSuggestionSelected?.(suggestion); }, children: suggestion }) }, suggestion)) }) : null] }) })] });
}
function initializeWorkHomePage(): void { initializeApiClient(); }
export { initializeWorkHomePage as n, ChatGptWorkHomePage as t };
