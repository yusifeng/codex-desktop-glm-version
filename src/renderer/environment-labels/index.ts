import "@rchunk/rolldown-runtime";
import {
  RI as initializePathUtilities,
  VI as normalizePath,
} from "@rchunk/app-shared";

export interface EnvironmentResult {
  configPath: string;
  environment?: { name?: string | null };
  type: string;
}

function getPathBasename(path: string): string {
  const normalized = normalizePath(path);
  const parts = normalized.split("/").filter(Boolean);
  return parts.at(-1) ?? normalized;
}

function getEnvironmentLabel(environment: EnvironmentResult): string {
  const explicitName = environment.type === "success" ? environment.environment?.name : null;
  return explicitName?.trim() || getPathBasename(environment.configPath);
}

function initializeEnvironmentLabels(): void {
  initializePathUtilities();
}

export { initializeEnvironmentLabels as n, getEnvironmentLabel as t };
