import {
  G2 as defineMessages,
  K2 as initializeInternationalization,
} from "@rchunk/app-shared";
import "@rchunk/rolldown-runtime";

const environmentChangeMessages = defineMessages({
  variables: {
    id: "restricted.environmentSetup.changes.variables",
    defaultMessage: "Environment variables",
    description:
      "Changed environment-owned runtime variable names or values in the change summary",
  },
  connections: {
    id: "restricted.environmentSetup.changes.connections",
    defaultMessage: "Outbound identity connections",
    description:
      "Changed outbound identity connection attachments or aliases in the environment change summary",
  },
  name: {
    id: "restricted.environmentSetup.changes.name",
    defaultMessage: "Environment name",
    description: "Changed environment name in the change summary",
  },
  scripts: {
    id: "restricted.environmentSetup.changes.scripts",
    defaultMessage: "Scripts",
    description:
      "Changed install script or start skill in the environment change summary",
  },
  network: {
    id: "restricted.environmentSetup.changes.network",
    defaultMessage: "Internet access",
    description:
      "Changed internet access policy in the environment change summary",
  },
  repositories: {
    id: "restricted.environmentSetup.changes.repositories",
    defaultMessage: "Repositories",
    description: "Changed repositories in the environment change summary",
  },
  secrets: {
    id: "restricted.environmentSetup.changes.secrets",
    defaultMessage: "Secrets",
    description:
      "Changed secret requirements or values in the environment change summary",
  },
  privacy: {
    id: "restricted.environmentSetup.changes.privacy",
    defaultMessage: "Privacy",
    description: "Changed sharing settings in the change summary",
  },
});

function initializeEnvironmentChangeMessages(): void {
  initializeInternationalization();
}

export {
  initializeEnvironmentChangeMessages as n,
  environmentChangeMessages as t,
};
