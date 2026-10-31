// @ts-nocheck

/** Owns ephemeral title, description, and turn-summary generation requests for threads. */
export function createThreadMetadataGenerationServiceClass(dependencies: Record<string, any>) {
  const {
    RpcHandlerBase,
    createLogger,
    getFeatureConfig,
    generateTitle,
    generateDescription,
    generateSummary,
  } = dependencies;

  return class ThreadMetadataGenerationService extends RpcHandlerBase {
    appServerConnectionRegistry;
    statsig;
    logger = createLogger(`ThreadMetadataGenerationService`);
    summaryRequests = new Map();
    disposed = false;

    constructor(appServerConnectionRegistry: any, statsig: any) {
      super();
      this.appServerConnectionRegistry = appServerConnectionRegistry;
      this.statsig = statsig;
    }

    static dispose(service: any) {
      service.disposed = true;
      for (const request of service.summaryRequests.values()) request.abort();
      service.summaryRequests.clear();
    }

    async generateTitle({
      hostId,
      prompt,
      cwd,
      readOnlyAppToolAllowlist,
      serviceName,
    }: Record<string, any>) {
      try {
        return await generateTitle({
          model: (await getFeatureConfig(this.statsig)).ephemeralGenerationModel,
          prompt,
          cwd,
          serviceTier: null,
          readOnlyAppToolAllowlist,
          serviceName,
          appServerClient: this.appServerConnectionRegistry.getConnection(hostId),
        });
      } catch (error) {
        this.logger.warning(`Failed to generate thread title`, {
          safe: {},
          sensitive: { error },
        });
        return null;
      }
    }

    async generateDescription({ hostId, threadId, title, cwd, serviceName }: Record<string, any>) {
      return generateDescription({
        model: (await getFeatureConfig(this.statsig)).ephemeralGenerationModel,
        title,
        cwd,
        serviceTier: null,
        sourceThreadId: threadId,
        serviceName,
        appServerClient: this.appServerConnectionRegistry.getConnection(hostId),
      });
    }

    async generateSummary({
      hostId,
      threadId,
      title,
      previousUserMessage,
      previousAssistantMessage,
      latestMessage,
      phase,
      cwd,
      includeCompactSummary,
      serviceName,
    }: Record<string, any>) {
      if (this.disposed) return null;
      const requestKey = `${hostId}\0${threadId}`;
      this.summaryRequests.get(requestKey)?.abort();
      const abortController = new AbortController();
      this.summaryRequests.set(requestKey, abortController);
      try {
        const summary = await generateSummary({
          model: (await getFeatureConfig(this.statsig)).ephemeralGenerationModel,
          title,
          previousUserMessage,
          previousAssistantMessage,
          latestMessage,
          phase,
          cwd,
          includeCompactSummary,
          serviceName,
          signal: abortController.signal,
          appServerClient: this.appServerConnectionRegistry.getConnection(hostId),
        });
        return abortController.signal.aborted ? null : summary;
      } catch (error) {
        if (!abortController.signal.aborted) {
          this.logger.warning(`Failed to generate thread turn summary`, {
            safe: {},
            sensitive: { error },
          });
        }
        return null;
      } finally {
        if (this.summaryRequests.get(requestKey) === abortController) {
          this.summaryRequests.delete(requestKey);
        }
      }
    }
  };
}

if (typeof module !== "undefined") {
  module.exports = { createThreadMetadataGenerationServiceClass };
}
