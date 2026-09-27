import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/rolldown-runtime";

export interface ConversationSummary {
  conversation_origin?: string;
  id: string;
  memory_scope?: string | null;
}

export interface ProjectSummary {
  id: string;
  name: string;
  ownerId?: string;
  projectOnly?: boolean;
}

export interface ConversationMoveMenuItemsProps {
  conversation: ConversationSummary;
  project?: ProjectSummary | null;
  projectOwnerId?: string | null;
  projects?: readonly ProjectSummary[];
  showMoveToProject?: boolean;
  canCreateProject?: boolean;
  isLoading?: boolean;
  loadError?: unknown;
  onCreateProjectDialogCloseAutoFocus?(): void;
  onCreateProject?(): void;
  onMove(projectId: string | null): Promise<void> | void;
  onRetry?(): void;
}

let jsx: JsxRuntime;

function ConversationMoveMenuItems(props: ConversationMoveMenuItemsProps): unknown {
  const projectOnlyConversation =
    (props.conversation.conversation_origin === "tpp" || props.conversation.conversation_origin === "flora") &&
    (props.conversation.memory_scope === "project_v2" ||
      (props.conversation.memory_scope == null && props.project?.projectOnly === true));
  const destinations = (props.projects ?? []).filter(
    (project) =>
      project.id !== props.project?.id &&
      (props.projectOwnerId == null || project.ownerId === props.projectOwnerId),
  );
  return jsx.jsxs(jsx.Fragment, {
    children: [
      props.showMoveToProject === false
        ? null
        : jsx.jsx("li", {
            children: jsx.jsxs("details", {
              children: [
                jsx.jsx("summary", {
                  "aria-disabled": projectOnlyConversation,
                  children: "Move to project",
                }),
                projectOnlyConversation
                  ? jsx.jsx("p", { role: "status", children: "Project-only conversations can’t be moved" })
                  : props.loadError
                    ? jsx.jsx("button", { type: "button", onClick: props.onRetry, children: "Couldn’t load projects. Try again" })
                    : props.isLoading
                      ? jsx.jsx("span", { role: "status", children: "Loading projects…" })
                      : jsx.jsxs("menu", {
                          children: [
                            props.canCreateProject
                              ? jsx.jsx("li", { children: jsx.jsx("button", { type: "button", onClick: props.onCreateProject, children: "New project" }) })
                              : null,
                            destinations.map((project) =>
                              jsx.jsx("li", {
                                children: jsx.jsx("button", { type: "button", onClick: () => props.onMove(project.id), children: project.name }),
                              }, project.id),
                            ),
                            destinations.length === 0 && !props.canCreateProject
                              ? jsx.jsx("li", { children: "No other projects" })
                              : null,
                          ],
                        }),
              ],
            }),
          })
      ,
      props.project == null
        ? null
        : jsx.jsx("li", {
            children: jsx.jsx("button", {
              type: "button",
              disabled: projectOnlyConversation,
              onClick: () => props.onMove(null),
              children: "Remove from project",
            }),
          }),
    ],
  });
}

function initializeConversationMoveMenuItems(): void {
  jsx = getJsxRuntime();
}

initializeConversationMoveMenuItems();

export { initializeConversationMoveMenuItems as n, ConversationMoveMenuItems as t };
