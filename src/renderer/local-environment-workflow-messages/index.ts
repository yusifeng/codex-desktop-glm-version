import "@rchunk/rolldown-runtime";
import {
  G2 as defineMessages,
  K2 as initializeInternationalization,
} from "@rchunk/app-shared";

const localEnvironmentWorkflowMessages = defineMessages({
  needsAttention: {
    id: "localEnvironment.needsAttention",
    defaultMessage: "Environment needs attention",
    description: "Message shown when local environment files need to be repaired in Settings",
  },
  parseError: {
    id: "settings.localEnvironments.file.invalidEnvironmentWarning",
    defaultMessage: "This environment file is invalid. Saving will replace its contents",
    description: "Warning that saving an invalid local environment file will replace it",
  },
  readError: {
    id: "settings.localEnvironments.file.readFailure",
    defaultMessage: "Unable to load this environment file. Try again",
    description: "Read error for a local environment file with guidance to retry",
  },
  retry: {
    id: "settings.localEnvironments.retry",
    defaultMessage: "Retry",
    description: "Button label to retry loading local environment data",
  },
  setup: {
    id: "threadPage.runAction.environment.setup",
    defaultMessage: "Set up local environment",
    description: "Accessible label for setting up a local environment from a thread",
  },
});

function initializeLocalEnvironmentWorkflowMessages(): void {
  initializeInternationalization();
}

export {
  localEnvironmentWorkflowMessages as n,
  initializeLocalEnvironmentWorkflowMessages as t,
};
