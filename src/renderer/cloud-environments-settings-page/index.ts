import {
  $I as useInfiniteQuery,
  BX as useScopedFamilyValue,
  HX as useScopedValue,
  I3 as getJsxRuntime,
  e6 as getReactRuntime,
  type JsxRuntime,
  type ReactRuntime,
} from "@rchunk/app-shared";
import {
  i_n as useRouterLocation,
  o_n as useNavigate,
} from "@rchunk/app-initial";
import {
  i as environmentSearchOptions,
  t as environmentDetailsQuery,
  l as createEnvironmentMutation,
  p as updateEnvironmentMutation,
  u as deleteEnvironmentMutation,
  f as resetEnvironmentCacheMutation,
  x as environmentToForm,
  w as validateEnvironmentForm,
  v as canSaveEnvironment,
  y as createEnvironmentRequest,
  type CloudEnvironment,
  type EnvironmentForm,
} from "@rchunk/cloud-environment-queries";
import { a as useCloudUserPreferences } from "@rchunk/cloud-preferences";
import { t as ToolbarBreadcrumb } from "@rchunk/toolbar-breadcrumb";
import "@rchunk/form-runtime";
import "@rchunk/rolldown-runtime";

const routeRoot = "/settings/cloud-environments";

interface InfiniteEnvironmentPage {
  items?: CloudEnvironment[];
  environments?: CloudEnvironment[];
}

interface InfiniteEnvironmentResult {
  data?: { pages?: InfiniteEnvironmentPage[] };
  fetchNextPage?(): void;
  hasNextPage?: boolean;
  isError?: boolean;
  isFetchingNextPage?: boolean;
  isPending?: boolean;
  refetch?(): void;
}

interface QueryResult<T> {
  data?: T;
  isError?: boolean;
  isPending?: boolean;
  refetch?(): void;
}

interface MutationResult<TInput> {
  error?: unknown;
  isPending?: boolean;
  mutate(input: TInput, options?: { onSuccess?(result: unknown): void }): void;
}

let React: ReactRuntime;
let jsx: JsxRuntime;

function environmentId(environment: CloudEnvironment): string {
  return environment.id ?? environment.slug ?? environment.label;
}

function environmentsFromPages(result: InfiniteEnvironmentResult): CloudEnvironment[] {
  return (result.data?.pages ?? []).flatMap(
    (page) => page.items ?? page.environments ?? [],
  );
}

function Breadcrumb(props: {
  current?: unknown;
  environment?: { id: string; label: string; onClick(): void };
  onRootClick(): void;
}): unknown {
  return ToolbarBreadcrumb({
    ancestors: [
      {
        id: "cloud-environments",
        label: "Cloud environments",
        onClick: props.onRootClick,
      },
      ...(props.environment == null
        ? []
        : [
            {
              id: props.environment.id,
              label: props.environment.label,
              onClick: props.environment.onClick,
            },
          ]),
    ],
    current: props.current,
  });
}

function EnvironmentList(props: {
  onCreate(): void;
  onEdit(id: string): void;
  onSelect(id: string): void;
}): unknown {
  const [query, setQuery] = React.useState("");
  const result = useInfiniteQuery(
    environmentSearchOptions(query),
  ) as unknown as InfiniteEnvironmentResult;
  const preferences = useCloudUserPreferences() as QueryResult<unknown>;
  const environments = environmentsFromPages(result);

  return jsx.jsxs("main", {
    className: "cloud-environments-settings-page",
    children: [
      jsx.jsxs("header", {
        children: [
          jsx.jsx("h1", { children: "Cloud environments" }),
          jsx.jsx("button", {
            type: "button",
            onClick: props.onCreate,
            children: "Create environment",
          }),
        ],
      }),
      jsx.jsx("input", {
        "aria-label": "Search cloud environments",
        value: query,
        onChange: (event: { currentTarget: { value: string } }) =>
          setQuery(event.currentTarget.value),
      }),
      preferences.isError
        ? jsx.jsx("p", {
            role: "status",
            children: "Cloud preferences are unavailable",
          })
        : null,
      result.isPending
        ? jsx.jsx("p", { role: "status", children: "Loading environments…" })
        : result.isError
          ? jsx.jsxs("div", {
              role: "alert",
              children: [
                "Unable to load cloud environments",
                jsx.jsx("button", {
                  type: "button",
                  onClick: () => result.refetch?.(),
                  children: "Retry",
                }),
              ],
            })
          : jsx.jsx("ul", {
              children: environments.map((environment) => {
                const id = environmentId(environment);
                return jsx.jsxs(
                  "li",
                  {
                    children: [
                      jsx.jsx("button", {
                        type: "button",
                        onClick: () => props.onSelect(id),
                        children: environment.label,
                      }),
                      environment.permissions?.can_write === true
                        ? jsx.jsx("button", {
                            type: "button",
                            onClick: () => props.onEdit(id),
                            children: "Edit",
                          })
                        : null,
                    ],
                  },
                  id,
                );
              }),
            }),
      result.hasNextPage
        ? jsx.jsx("button", {
            type: "button",
            disabled: result.isFetchingNextPage,
            onClick: () => result.fetchNextPage?.(),
            children: result.isFetchingNextPage ? "Loading…" : "Load more",
          })
        : null,
    ],
  });
}

function EnvironmentEditor(props: {
  environment?: CloudEnvironment | null;
  onCancel(): void;
  onSaved(id: string): void;
}): unknown {
  const initial = environmentToForm(props.environment ?? null);
  const [form, setForm] = React.useState(initial);
  const createMutation = useScopedValue(
    createEnvironmentMutation,
  ) as unknown as MutationResult<ReturnType<typeof createEnvironmentRequest>>;
  const updateMutation = useScopedValue(
    updateEnvironmentMutation,
  ) as unknown as MutationResult<{
    environmentId: string;
    request: ReturnType<typeof createEnvironmentRequest>;
  }>;
  const errors = validateEnvironmentForm(form);
  const currentId = props.environment == null ? null : environmentId(props.environment);
  const mutation = currentId == null ? createMutation : updateMutation;
  const save = (): void => {
    if (!canSaveEnvironment(form, true, form.machineId) || mutation.isPending)
      return;
    const request = createEnvironmentRequest(form);
    if (currentId == null) {
      createMutation.mutate(request, {
        onSuccess: (result) =>
          props.onSaved(
            (result as { id?: string } | null)?.id ?? environmentIdFromLabel(form.label),
          ),
      });
    } else {
      updateMutation.mutate(
        { environmentId: currentId, request },
        { onSuccess: () => props.onSaved(currentId) },
      );
    }
  };

  return jsx.jsxs("form", {
    onSubmit: (event: { preventDefault(): void }) => {
      event.preventDefault();
      save();
    },
    children: [
      jsx.jsx("label", {
        children: jsx.jsx("input", {
          "aria-label": "Environment name",
          value: form.label,
          onChange: (event: { currentTarget: { value: string } }) =>
            setForm({ ...form, label: event.currentTarget.value }),
        }),
      }),
      errors.label
        ? jsx.jsx("p", { role: "alert", children: "A name is required" })
        : null,
      jsx.jsx("label", {
        children: jsx.jsx("textarea", {
          "aria-label": "Setup commands",
          value: form.setupCommands,
          onChange: (event: { currentTarget: { value: string } }) =>
            setForm({ ...form, setupCommands: event.currentTarget.value }),
        }),
      }),
      mutation.error
        ? jsx.jsx("p", { role: "alert", children: "Unable to save environment" })
        : null,
      jsx.jsxs("footer", {
        children: [
          jsx.jsx("button", {
            type: "button",
            onClick: props.onCancel,
            children: "Cancel",
          }),
          jsx.jsx("button", {
            type: "submit",
            disabled: mutation.isPending || Object.keys(errors).length > 0,
            children: mutation.isPending ? "Saving…" : "Save",
          }),
        ],
      }),
    ],
  });
}

function environmentIdFromLabel(label: string): string {
  return label.trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function EnvironmentRoute(props: {
  edit: boolean;
  environmentId: string;
  navigate(path: string): void;
}): unknown {
  const result = useScopedFamilyValue(
    environmentDetailsQuery,
    props.environmentId,
  ) as unknown as QueryResult<CloudEnvironment>;
  const deleteMutation = useScopedValue(
    deleteEnvironmentMutation,
  ) as unknown as MutationResult<string>;
  const resetMutation = useScopedValue(
    resetEnvironmentCacheMutation,
  ) as unknown as MutationResult<string>;
  if (result.isPending)
    return jsx.jsx("p", { role: "status", children: "Loading environment…" });
  if (result.isError || result.data == null)
    return jsx.jsxs("div", {
      role: "alert",
      children: [
        "Unable to load this cloud environment",
        jsx.jsx("button", {
          type: "button",
          onClick: () => result.refetch?.(),
          children: "Retry",
        }),
      ],
    });
  const environment = result.data;
  if (props.edit) {
    return jsx.jsxs("main", {
      children: [
        Breadcrumb({
          current: "Edit environment",
          environment: {
            id: props.environmentId,
            label: environment.label,
            onClick: () => props.navigate(`${routeRoot}/${props.environmentId}`),
          },
          onRootClick: () => props.navigate(routeRoot),
        }),
        EnvironmentEditor({
          environment,
          onCancel: () => props.navigate(`${routeRoot}/${props.environmentId}`),
          onSaved: () => props.navigate(`${routeRoot}/${props.environmentId}`),
        }),
      ],
    });
  }
  return jsx.jsxs("main", {
    children: [
      Breadcrumb({
        current: environment.label,
        onRootClick: () => props.navigate(routeRoot),
      }),
      jsx.jsx("h1", { children: environment.label }),
      environment.description
        ? jsx.jsx("p", { children: environment.description })
        : null,
      jsx.jsx("button", {
        type: "button",
        disabled: environment.permissions?.can_write !== true,
        onClick: () => props.navigate(`${routeRoot}/${props.environmentId}/edit`),
        children: "Edit",
      }),
      jsx.jsx("button", {
        type: "button",
        disabled: resetMutation.isPending,
        onClick: () => resetMutation.mutate(props.environmentId),
        children: "Reset cache",
      }),
      jsx.jsx("button", {
        type: "button",
        disabled:
          environment.permissions?.can_delete !== true || deleteMutation.isPending,
        onClick: () =>
          deleteMutation.mutate(props.environmentId, {
            onSuccess: () => props.navigate(routeRoot),
          }),
        children: "Delete",
      }),
    ],
  });
}

function CloudEnvironmentsSettingsPage(): unknown {
  const location = useRouterLocation();
  const navigate = useNavigate();
  const segments = location.pathname.slice(routeRoot.length).split("/").filter(Boolean);
  if (segments.length === 0) {
    return jsx.jsx(EnvironmentList, {
      onCreate: () => navigate(`${routeRoot}/new`),
      onEdit: (id) => navigate(`${routeRoot}/${id}/edit`),
      onSelect: (id) => navigate(`${routeRoot}/${id}`),
    });
  }
  if (segments.length === 1 && segments[0] === "new") {
    return jsx.jsxs("main", {
      children: [
        Breadcrumb({
          current: "Create cloud environment",
          onRootClick: () => navigate(routeRoot),
        }),
        jsx.jsx(EnvironmentEditor, {
          onCancel: () => navigate(routeRoot),
          onSaved: (id) => navigate(`${routeRoot}/${id}`),
        }),
      ],
    });
  }
  if (segments.length === 1 || (segments.length === 2 && segments[1] === "edit")) {
    return jsx.jsx(EnvironmentRoute, {
      edit: segments.length === 2,
      environmentId: segments[0],
      navigate,
    });
  }
  navigate(routeRoot, { replace: true });
  return null;
}

function initializeCloudEnvironmentsSettingsPage(): void {
  React = getReactRuntime();
  jsx = getJsxRuntime();
}

initializeCloudEnvironmentsSettingsPage();

export { CloudEnvironmentsSettingsPage };
