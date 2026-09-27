import {
  $O as queryConstants,
  CL as useQueryClient,
  SL as initializeQueries,
  _L as useQuery,
  ek as initializeMutations,
  gL as initializeQueryClient,
  iL as useMutation,
  rL as initializeQueryRuntime,
} from "@rchunk/app-shared";
import {
  pdn as initializeCloudPreferencesApi,
  udn as cloudPreferencesApi,
} from "@rchunk/app-initial";
import "@rchunk/rolldown-runtime";

export interface PathTemplateVariable {
  value: string;
  example: string;
  char_count: number;
}

export type PathTemplateError =
  | "bracket-mismatch"
  | "invalid-characters"
  | "invalid-pattern"
  | "leading-slash"
  | "missing-pattern"
  | "too-long";

interface PreferencesApi {
  safeGet(path: string): Promise<unknown>;
  safePatch(path: string, options: { requestBody: unknown }): Promise<unknown>;
}

const cloudUserPreferencesQueryKey = ["cloud-user-preferences"];
const cloudPreferencesConfigQueryKey = ["cloud-preferences-config"];

function useCloudUserPreferences(): unknown {
  return useQuery({
    queryKey: cloudUserPreferencesQueryKey,
    queryFn: fetchCloudUserPreferences,
    retry: false,
    staleTime: queryConstants.FIVE_MINUTES,
  });
}

function fetchCloudUserPreferences(): Promise<unknown> {
  return (cloudPreferencesApi as PreferencesApi).safeGet("/wham/settings/user");
}

function useCloudPreferencesConfig(): unknown {
  return useQuery({
    queryKey: cloudPreferencesConfigQueryKey,
    queryFn: fetchCloudPreferencesConfig,
    retry: false,
    staleTime: queryConstants.FIVE_MINUTES,
  });
}

function fetchCloudPreferencesConfig(): Promise<unknown> {
  return (cloudPreferencesApi as PreferencesApi).safeGet(
    "/wham/settings/configs/user-preferences",
  );
}

function useUpdateCloudUserPreferences(): unknown {
  const queryClient = useQueryClient() as unknown as {
    setQueryData(queryKey: readonly unknown[], value: unknown): void;
  };
  return useMutation({
    mutationFn: updateCloudUserPreferences,
    onSuccess: (value: unknown) => {
      queryClient.setQueryData(cloudUserPreferencesQueryKey, value);
    },
  });
}

function updateCloudUserPreferences(value: unknown): Promise<unknown> {
  return (cloudPreferencesApi as PreferencesApi).safePatch(
    "/wham/settings/user",
    {
      requestBody: value,
    },
  );
}

function substitutePathTemplate(
  template: string,
  variables: readonly PathTemplateVariable[],
  value: (variable: PathTemplateVariable) => string,
): string {
  let result = template;
  for (const variable of variables)
    result = result.replaceAll(variable.value, value(variable));
  return result;
}

function validatePathTemplate(
  template: string,
  maxLength: number,
  variables: readonly PathTemplateVariable[],
): PathTemplateError | null {
  const opening = (template.match(/{/g) ?? []).length;
  if (opening !== (template.match(/}/g) ?? []).length)
    return "bracket-mismatch";
  if (opening === 0) return "missing-pattern";
  const allowed = variables.map((variable) => variable.value);
  if (
    (template.match(/{([^}]+)}/g) ?? []).some(
      (pattern) => !allowed.includes(pattern),
    )
  ) {
    return "invalid-pattern";
  }
  const expanded = substitutePathTemplate(template, variables, (variable) =>
    "x".repeat(variable.char_count),
  );
  if (expanded.length > maxLength) return "too-long";
  if (expanded.startsWith("/")) return "leading-slash";
  return /^[a-zA-Z0-9./\-_]+$/.test(expanded) ? null : "invalid-characters";
}

function previewPathTemplate(
  template: string,
  variables: readonly PathTemplateVariable[],
): string {
  return substitutePathTemplate(
    template,
    variables,
    (variable) => variable.example,
  );
}

function initializeCloudPreferences(): void {
  initializeQueryRuntime();
  initializeQueryClient();
  initializeQueries();
  initializeMutations();
  initializeCloudPreferencesApi();
}

export {
  useCloudUserPreferences as a,
  useCloudPreferencesConfig as i,
  validatePathTemplate as n,
  useUpdateCloudUserPreferences as o,
  initializeCloudPreferences as r,
  previewPathTemplate as t,
};
