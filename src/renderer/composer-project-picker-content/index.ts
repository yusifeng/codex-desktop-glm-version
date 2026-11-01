import "@rchunk/rolldown-runtime";
import * as sharedChunk from "@rchunk/app-shared";
import * as initialChunk from "@rchunk/app-initial";
import * as primaryChunk from "@rchunk/app-primary";

export interface CloudProject {
  gizmo: { display: { name: string }; id: string };
}

export interface LocalProject {
  gitRepos: Array<{ rootFolder?: string }>;
  hostDisplayName?: string;
  id?: string;
  label: string;
  path?: string;
}

export interface LocalProjectOptions {
  onSelectProject(project: LocalProject): void;
  projects: LocalProject[];
}

export interface ComposerProjectPickerContentProps {
  cloudProjectsEnabled: boolean;
  isPending?: boolean;
  localProjectOptions?: LocalProjectOptions | null;
  onClose(): void;
  onCreateProject?(): void;
  onProjectChange(id: string | null, name: string | null): void;
  onSearchQueryChange(query: string): void;
  onSelectLocalProject(): void;
  onSelectProject(id: string, name: string): void;
  projectId?: string | null;
  searchQuery: string;
}

interface CloudProjectState {
  isError: boolean;
  isLoading: boolean;
  projects: CloudProject[];
}

interface MenuRegistry {
  Action: (props: Record<string, unknown>) => unknown;
  Item: (props: Record<string, unknown>) => unknown;
}

const shared = sharedChunk as unknown as Record<string, unknown>;
const initial = initialChunk as unknown as Record<string, unknown>;
const primary = primaryChunk as unknown as Record<string, unknown>;

function callInitializer(value: unknown): void {
  if (typeof value === "function") value();
}

for (const value of [
  shared.kE,
  shared.FX,
  shared.K2,
  primary.ac,
  shared.If,
  shared.C_,
  shared.$h,
  shared.tm,
  initial.Xg,
  initial.Mrt,
  shared.ag,
  initial.vm,
  primary.B,
  primary.Q,
  primary.R,
  initial.Yp,
]) callInitializer(value);

const jsx = (shared.I3 as () => {
  Fragment: unknown;
  jsx(component: unknown, props: unknown, key?: string): unknown;
  jsxs(component: unknown, props: unknown, key?: string): unknown;
})();
const useSignalValue = shared.HX as (
  signal: unknown,
  options: { enabled: boolean },
) => CloudProjectState;
const useIntl = shared.n4 as () => {
  formatMessage(message: Record<string, string>): string;
};
const FormattedMessage = shared.Y2;
const MenuMessage = (shared.jf as { Message: unknown }).Message;
const Spinner = shared.Qh;
const ProjectIcon = initial._m;
const CloudProjects = initial.Jp;
const PlusIcon = initial.jrt;
const LocalProjectIcon = initial.Yg;
const ClearIcon = shared.ig;
const CheckIcon = shared.em;
const IconAsset = shared.S_;
const projectFallbackAsset = shared.OE;
const Menu = primary.ic as MenuRegistry;
const ProjectPickerFrame = primary.z;
const LocalProjectGroups = primary.L;
const searchProjects = primary.$ as <T>(
  items: readonly T[],
  query: string,
  getSearchValues: (item: T) => Array<string | undefined>,
) => T[];

function cloudSearchValues(project: CloudProject): string[] {
  return [project.gizmo.display.name.trim() || project.gizmo.id, project.gizmo.id];
}

function localSearchValues(project: LocalProject): Array<string | undefined> {
  return [project.label, project.gitRepos[0]?.rootFolder, project.path, project.hostDisplayName];
}

function LocalProjectDetails(): unknown {
  return jsx.jsx(LocalProjectIcon, {
    "aria-hidden": true,
    className: "icon-xs shrink-0 text-tertiary opacity-0 group-hover:opacity-100",
  });
}

function ComposerProjectPickerContent({
  cloudProjectsEnabled,
  isPending,
  localProjectOptions,
  projectId,
  searchQuery,
  onSearchQueryChange,
  onCreateProject,
  onProjectChange,
  onSelectProject,
  onSelectLocalProject,
  onClose,
}: ComposerProjectPickerContentProps): unknown {
  const intl = useIntl();
  const cloudState = useSignalValue(CloudProjects, { enabled: cloudProjectsEnabled });
  const cloudProjects = searchProjects(
    cloudProjectsEnabled ? cloudState.projects : [],
    searchQuery,
    cloudSearchValues,
  );
  const localGroups = localProjectOptions == null
    ? undefined
    : searchProjects(localProjectOptions.projects, searchQuery, localSearchValues);

  let status: unknown = null;
  if (cloudProjectsEnabled && cloudState.isLoading) {
    status = jsx.jsx(MenuMessage, {
      children: jsx.jsx(FormattedMessage, {
        id: "chatgptConversations.composer.projectSelector.loading",
        defaultMessage: "Loading projects…",
        description: "Loading message for the cloud project section of the composer project picker",
      }),
    });
  } else if (cloudProjectsEnabled && cloudState.isError) {
    status = jsx.jsx(MenuMessage, {
      tone: "error",
      children: jsx.jsx(FormattedMessage, {
        id: "chatgptConversations.composer.projectSelector.error",
        defaultMessage: "Projects couldn't be loaded",
        description: "Error message for the cloud project section of the composer project picker",
      }),
    });
  }

  const cloudItems = cloudProjects.map((project) => {
    const name = project.gizmo.display.name.trim() || project.gizmo.id;
    const selected = project.gizmo.id === projectId;
    return jsx.jsx(Menu.Item, {
      icon: selected && isPending
        ? jsx.jsx(Spinner, { className: "icon-xs" })
        : jsx.jsx(ProjectIcon, {
            className: "icon-xs",
            fallbackIcon: jsx.jsx(IconAsset, {
              asset: projectFallbackAsset,
              "aria-hidden": false,
              className: "shrink-0",
            }),
            isRemoteProject: false,
            projectId: project.gizmo.id,
            size: 16,
          }),
      RightIcon: selected ? CheckIcon : undefined,
      value: project.gizmo.id,
      onSelect: () => onSelectProject(project.gizmo.id, name),
      children: name,
    }, project.gizmo.id);
  });

  const localItems = localProjectOptions == null
    ? null
    : jsx.jsx(LocalProjectGroups, {
        getProjectDetails: LocalProjectDetails,
        groups: localGroups ?? [],
        selectedProjectIds: projectId == null ? [] : [projectId],
        onSelectProject: (project: LocalProject) => {
          localProjectOptions.onSelectProject(project);
          onSelectLocalProject();
        },
      });

  const clearLabel = intl.formatMessage({
    id: "chatgptConversations.composer.projectSelector.clearProject",
    defaultMessage: "Don't work in a project",
    description: "Menu item in the composer project picker that clears the selected local or cloud project",
  });
  const footerItems = onCreateProject == null && projectId == null
    ? null
    : jsx.jsxs(jsx.Fragment, {
        children: [
          onCreateProject == null ? null : jsx.jsx(Menu.Action, {
            LeftIcon: PlusIcon,
            onClick: () => { onCreateProject(); onClose(); },
            children: jsx.jsx(FormattedMessage, {
              id: "chatgptConversations.composer.projectSelector.createProject",
              defaultMessage: "New project",
              description: "Menu item in the composer project picker that opens the project creation flow",
            }),
          }),
          projectId == null ? null : jsx.jsx(Menu.Action, {
            LeftIcon: ClearIcon,
            onClick: () => { onProjectChange(null, null); onClose(); },
            children: clearLabel,
          }),
        ],
      });

  const hasProjectItems = cloudProjects.length + (localGroups?.length ?? 0) > 0;
  const emptyMessage = localProjectOptions == null && searchQuery.trim().length === 0
    ? jsx.jsx(FormattedMessage, {
        id: "chatgptConversations.composer.projectSelector.empty",
        defaultMessage: "No projects",
        description: "Empty message for the cloud project section of the composer project picker",
      })
    : undefined;

  return jsx.jsx(ProjectPickerFrame, {
    emptyMessage,
    footerItems,
    hasProjectItems,
    projectItems: jsx.jsxs(jsx.Fragment, { children: [cloudItems, localItems] }),
    searchQuery,
    status,
    onSearchQueryChange,
  });
}

export { ComposerProjectPickerContent };
