// @ts-nocheck

export function createAutomationsServiceClass({
  DisposableBase,
  assertWorktreeTargetRequirements,
  createLocalAutomation,
  executeUpdateTool,
  getLocalAutomation,
  missingAutomationMessage,
  removeAutomationRegistryEntry,
  removeLocalAutomation,
  resolveCompatibilityCwds,
  updateLocalAutomation,
}) {
  return class AutomationsService extends DisposableBase {
    constructor(globalState, appServerConnectionRegistry, habitatAutomationsService) {
      super();
      this.globalState = globalState;
      this.appServerConnectionRegistry = appServerConnectionRegistry;
      this.habitatAutomationsService = habitatAutomationsService;
    }

    async create(input) {
      return this.createWithContext(input, null);
    }

    async createWithContext(input, context) {
      const compatibilityCwds = input.kind === "cron"
        ? resolveCompatibilityCwds(this.globalState, input.projectId)
        : [];
      if (input.kind === "cron") {
        assertWorktreeTargetRequirements({
          compatibilityCwds,
          executionEnvironment: input.executionEnvironment,
          projectId: input.projectId,
        });
      }
      context?.assertCurrent();
      const item = this.habitatAutomationsService
        ? await this.habitatAutomationsService.create(input, compatibilityCwds)
        : createLocalAutomation(input, compatibilityCwds);
      if (!item) throw new Error("Automation create failed.");
      return { item };
    }

    async update(input) {
      return this.updateWithContext(input, null);
    }

    async updateWithContext(input, context) {
      const compatibilityCwds = input.kind === "cron"
        ? resolveCompatibilityCwds(this.globalState, input.projectId)
        : [];
      if (input.kind === "cron") {
        assertWorktreeTargetRequirements({
          compatibilityCwds,
          executionEnvironment: input.executionEnvironment,
          projectId: input.projectId,
        });
      }
      context?.assertCurrent();
      const item = this.habitatAutomationsService
        ? await this.habitatAutomationsService.update(input, compatibilityCwds)
        : updateLocalAutomation(input, compatibilityCwds);
      if (!item) throw new Error(missingAutomationMessage);
      return { item };
    }

    async delete({ id }) {
      return this.deleteWithContext(id, null);
    }

    async deleteWithContext(id, context) {
      context?.assertCurrent();
      const { item, status } = this.habitatAutomationsService
        ? await this.habitatAutomationsService.delete(id)
        : { item: getLocalAutomation(id), status: removeLocalAutomation(id) };
      const success = status === "deleted" || status === "not_found";
      if (success) {
        try {
          removeAutomationRegistryEntry(id);
          (context?.connection ?? this.appServerConnectionRegistry.getConnection("local"))
            .notifyAutomationRunsUpdated();
        } catch {}
      }
      return { item, success, status };
    }

    executeUpdateTool(request) {
      return this.runTool(request, this);
    }

    executeNativeUpdateTool = (request, context) => {
      context.assertCurrent();
      return this.runTool(request, {
        create: (input) => this.createWithContext(input, context),
        update: (input) => this.updateWithContext(input, context),
        delete: ({ id }) => this.deleteWithContext(id, context),
      });
    };

    runTool(request, operations) {
      if (request.hostId !== "local") {
        return Promise.resolve({
          response: {
            success: false,
            contentItems: [{ type: "inputText", text: "Automations are only supported for local threads." }],
          },
        });
      }
      if (this.habitatAutomationsService?.isLocalMigrationActive()) {
        return Promise.resolve({
          response: {
            success: false,
            contentItems: [{
              type: "inputText",
              text: "Local automation changes must use the Automations app after migration consent.",
            }],
          },
        });
      }
      return executeUpdateTool(operations, request, () => null);
    }
  };
}

if (typeof module !== "undefined") module.exports = { createAutomationsServiceClass };
