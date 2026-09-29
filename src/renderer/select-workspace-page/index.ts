import "@rchunk/rolldown-runtime";
import {
  $3 as initializeJsxRuntime,
  G3 as hostMessageBridge,
  I3 as getJsxRuntime,
  II as getPathBasename,
  K3 as useElectronMessageHandler,
  Qh as LoadingSpinner,
  Yh as Button,
  e6 as getReactRuntime,
  type JsxRuntime,
  type ReactRuntime,
  type RendererHostMessage,
} from "@rchunk/app-shared";
import {
  _N as useIsRemoteHost,
  o_n as useNavigate,
  pnt as desktopApi,
} from "@rchunk/app-initial";

interface WorkspaceCandidate {
  exists?: boolean;
  label?: string | null;
  root: string;
  selected?: boolean;
}

interface WorkspaceSelectionSnapshot {
  candidates?: readonly WorkspaceCandidate[];
  initializeGitRepository?: boolean;
  isLoading?: boolean;
}

interface WorkspaceSelectionService {
  createOrSelectLocalProjects(
    roots: readonly string[],
  ): Promise<readonly unknown[]>;
  getSnapshot?(): WorkspaceSelectionSnapshot;
  listCandidates?(): Promise<WorkspaceSelectionSnapshot>;
}

interface DesktopApiWithWorkspaceSelection {
  workspaceSelection?: WorkspaceSelectionService;
}

interface WorkspaceRootPickedMessage extends RendererHostMessage {
  root?: string;
  type: "workspace-root-option-picked";
}

interface SkipWorkspaceResultMessage extends RendererHostMessage {
  error?: string | null;
  success?: boolean;
  type: "electron-onboarding-skip-workspace-result";
}

interface SelectWorkspacePageProps {
  initializeGitRepository?: boolean;
  isLoading?: boolean;
  isRemoteHost?: boolean;
  roots?: readonly WorkspaceCandidate[];
  service?: WorkspaceSelectionService;
}

type PendingAction = "continue" | "skip" | null;

let React: ReactRuntime;
let jsx: JsxRuntime;

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/\/+$/, "").toLocaleLowerCase();
}

function pathDescription(path: string): string {
  const normalized = path.replace(/\\/g, "/").replace(/\/+$/, "");
  const slash = normalized.lastIndexOf("/");
  return slash <= 0 ? normalized : normalized.slice(0, slash);
}

function prepareCandidates(
  candidates: readonly WorkspaceCandidate[],
): WorkspaceCandidate[] {
  const byRoot = new Map<string, WorkspaceCandidate>();
  for (const candidate of candidates) {
    const root = candidate.root.trim().replace(/\/+$/, "");
    if (!root || candidate.exists === false) continue;
    const key = normalizePath(root);
    const current = byRoot.get(key);
    byRoot.set(key, {
      ...current,
      ...candidate,
      label: candidate.label?.trim() || current?.label || getPathBasename(root),
      root,
      selected: candidate.selected ?? current?.selected ?? false,
    });
  }
  return [...byRoot.values()].sort((left, right) =>
    left.root.localeCompare(right.root),
  );
}

function SelectWorkspacePage(props: SelectWorkspacePageProps = {}): unknown {
  const navigate = useNavigate();
  const runtimeRemoteHost = useIsRemoteHost();
  const runtimeService = (
    desktopApi as unknown as DesktopApiWithWorkspaceSelection
  ).workspaceSelection;
  const service = props.service ?? runtimeService;
  const snapshot = service?.getSnapshot?.();
  const remoteHost = props.isRemoteHost ?? runtimeRemoteHost;
  const initialCandidates = prepareCandidates(
    props.roots ?? snapshot?.candidates ?? [],
  );
  const [candidates, setCandidates] = React.useState(initialCandidates);
  const [isLoading, setIsLoading] = React.useState(
    props.isLoading ?? snapshot?.isLoading ?? service?.listCandidates != null,
  );
  const [selected, setSelected] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      initialCandidates.map((candidate) => [
        candidate.root,
        candidate.selected === true,
      ]),
    ),
  );
  const [pendingAction, setPendingAction] = React.useState<PendingAction>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [skipError, setSkipError] = React.useState<string | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const navigationNonce = React.useRef(0);

  React.useEffect(() => {
    if (service?.listCandidates == null || props.roots != null) return;
    let active = true;
    setIsLoading(true);
    service
      .listCandidates()
      .then((nextSnapshot) => {
        if (!active) return;
        const nextCandidates = prepareCandidates(nextSnapshot.candidates ?? []);
        setCandidates(nextCandidates);
        setSelected(
          Object.fromEntries(
            nextCandidates.map((candidate) => [
              candidate.root,
              candidate.selected === true,
            ]),
          ),
        );
        setError(null);
      })
      .catch(() => {
        if (active) setError("Could not load projects");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [props.roots, service]);

  useElectronMessageHandler<WorkspaceRootPickedMessage>(
    "workspace-root-option-picked",
    (message) => {
      const root = message.root?.trim();
      if (!root) return;
      setCandidates((current) =>
        prepareCandidates([...current, { root, selected: true }]),
      );
      setSelected((current) => ({ ...current, [root]: true }));
      setError(null);
      setSkipError(null);
    },
  );

  useElectronMessageHandler<SkipWorkspaceResultMessage>(
    "electron-onboarding-skip-workspace-result",
    (message) => {
      setPendingAction(null);
      setSkipError(message.success ? null : (message.error ?? null));
    },
  );

  const selectedRoots = candidates
    .map((candidate) => candidate.root)
    .filter((root) => selected[root] === true);
  const hasCandidates = candidates.length > 0;
  const allSelected =
    hasCandidates && selectedRoots.length === candidates.length;
  const disabled = isLoading || pendingAction != null;

  const toggleRoot = (root: string, checked: boolean): void => {
    setError(null);
    setSkipError(null);
    setSelected((current) => ({ ...current, [root]: checked }));
  };
  const toggleAll = (checked: boolean): void => {
    setError(null);
    setSkipError(null);
    setSelected(
      Object.fromEntries(
        candidates.map((candidate) => [candidate.root, checked]),
      ),
    );
  };
  const openFolder = (): void => {
    setError(null);
    setSkipError(null);
    setMenuOpen(false);
    hostMessageBridge.dispatchMessage("electron-pick-workspace-root-option", {
      allowMultiple: false,
    });
  };
  const startFromScratch = (): void => {
    if (pendingAction != null) return;
    setError(null);
    setSkipError(null);
    setMenuOpen(false);
    setPendingAction("skip");
    hostMessageBridge.dispatchMessage("electron-onboarding-skip-workspace", {
      initializeGitRepository:
        props.initializeGitRepository ??
        snapshot?.initializeGitRepository ??
        true,
    });
  };
  const continueWithSelection = (): void => {
    if (pendingAction != null || selectedRoots.length === 0 || service == null)
      return;
    setError(null);
    setSkipError(null);
    setPendingAction("continue");
    service
      .createOrSelectLocalProjects(selectedRoots)
      .then((projects) => {
        if (projects.length === 0) return;
        navigationNonce.current += 1;
        navigate("/", {
          replace: true,
          state: { focusComposerNonce: navigationNonce.current },
        });
      })
      .catch(() => setError("Could not add the selected folders"))
      .finally(() => setPendingAction(null));
  };

  const addProjectButton = jsx.jsx(Button, {
    color: hasCandidates ? "outline" : "primary",
    disabled,
    onClick: remoteHost ? openFolder : () => setMenuOpen((open) => !open),
    children: "Add project",
  });
  const addProjectControl = remoteHost
    ? addProjectButton
    : jsx.jsxs("div", {
        children: [
          addProjectButton,
          menuOpen
            ? jsx.jsxs("div", {
                role: "menu",
                "aria-label": "Add project",
                children: [
                  jsx.jsx("button", {
                    type: "button",
                    role: "menuitem",
                    onClick: startFromScratch,
                    children: "Start from scratch",
                  }),
                  jsx.jsx("button", {
                    type: "button",
                    role: "menuitem",
                    onClick: openFolder,
                    children: "Use an existing folder",
                  }),
                ],
              })
            : null,
        ],
      });

  return jsx.jsxs("main", {
    children: [
      jsx.jsx("h1", { children: "Select a project" }),
      jsx.jsx("p", {
        children:
          "ChatGPT will be able to edit files and run commands in selected folders",
      }),
      isLoading
        ? jsx.jsxs("div", {
            role: "status",
            children: [jsx.jsx(LoadingSpinner, {}), "Loading projects…"],
          })
        : null,
      hasCandidates
        ? jsx.jsxs("section", {
            "aria-label": "Available projects",
            children: [
              jsx.jsxs("label", {
                children: [
                  jsx.jsx("input", {
                    type: "checkbox",
                    checked: allSelected,
                    disabled,
                    onChange: (event: {
                      currentTarget: { checked: boolean };
                    }) => toggleAll(event.currentTarget.checked),
                  }),
                  "Select all",
                ],
              }),
              ...candidates.map((candidate, index) =>
                jsx.jsxs(
                  "label",
                  {
                    children: [
                      jsx.jsx("input", {
                        id: `workspace-root-${index}`,
                        type: "checkbox",
                        checked: selected[candidate.root] === true,
                        disabled,
                        onChange: (event: {
                          currentTarget: { checked: boolean };
                        }) =>
                          toggleRoot(
                            candidate.root,
                            event.currentTarget.checked,
                          ),
                      }),
                      jsx.jsx("span", { children: candidate.label }),
                      jsx.jsx("span", {
                        children: pathDescription(candidate.root),
                      }),
                    ],
                  },
                  candidate.root,
                ),
              ),
            ],
          })
        : isLoading
          ? null
          : jsx.jsx("p", { children: "Add a project to continue." }),
      jsx.jsxs("div", {
        children: [
          addProjectControl,
          hasCandidates
            ? jsx.jsx(Button, {
                color: "primary",
                disabled:
                  disabled || selectedRoots.length === 0 || service == null,
                loading: pendingAction === "continue",
                onClick: continueWithSelection,
                children: "Continue",
              })
            : null,
        ],
      }),
      remoteHost
        ? null
        : jsx.jsx(Button, {
            color: "ghost",
            disabled: pendingAction != null,
            onClick: startFromScratch,
            children:
              pendingAction === "skip" ? "Creating a new project…" : "Skip",
          }),
      error == null
        ? null
        : jsx.jsx("p", {
            role: "alert",
            children: error,
          }),
      skipError == null
        ? null
        : jsx.jsx("p", {
            role: "alert",
            children: `Couldn't create a new project: ${skipError}`,
          }),
    ],
  });
}

function initializeSelectWorkspacePage(): void {
  initializeJsxRuntime();
  React = getReactRuntime();
  jsx = getJsxRuntime();
}

initializeSelectWorkspacePage();

export { SelectWorkspacePage };
