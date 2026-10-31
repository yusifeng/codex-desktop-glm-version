// @ts-nocheck

/** Creates the dispatcher that projects parsed deep links into renderer and workspace actions. */
export function createDeepLinkRouteExecutor(dependencies: Record<string, any>) {
  const {
    logger,
    findPluginMarketplacePath,
    openBrowserForDeepLink,
    buildPluginDetailRoute,
    buildMcpAppRoute,
    buildSharedConversationRoute,
    buildConversationRoute,
    resolveProjectRoot,
    getLegacyProjects,
    resolveWorkspace,
    selectWorkspaceProject,
    now = Date.now,
  } = dependencies;

  async function executeDeepLinkRoute(options: Record<string, any>) {
    const {
      window,
      route,
      globalState,
      requestGitWorker,
      appServerClient,
      listPlugins,
      readThread,
      projectsManager,
      windowManager,
      navigateToRoute,
    } = options;

    switch (route.kind) {
      case `applyCodexAppConfig`:
      case `orbitOnboarding`:
      case `team`:
      case `sharedCodexSnapshot`:
      case `spacePage`:
        return;

      case `experienceActivation`:
        windowManager.sendMessageToWindow(window, {
          type: `show-chatgpt-rosalind-announcement`,
        });
        return;

      case `pluginInstall`: {
        let marketplacePath;
        try {
          marketplacePath = await findPluginMarketplacePath({ listPlugins, route });
        } catch (error) {
          logger.warning(`plugin_install_marketplace_lookup_failed`, {
            safe: {
              marketplaceName: route.marketplaceName,
              pluginName: route.pluginName,
            },
            sensitive: { error },
          });
          navigateToRoute(window, `/skills`, { initialTab: `plugins` });
          return;
        }
        if (marketplacePath == null) {
          navigateToRoute(window, `/skills`, { initialTab: `plugins` });
          return;
        }
        navigateToRoute(
          window,
          buildPluginDetailRoute({
            marketplacePath,
            pluginId: route.pluginName,
            pluginName: route.pluginName,
          }),
        );
        return;
      }

      case `petInstall`:
        windowManager.showPrimaryWindow({ stealFocus: true });
        windowManager.sendMessageToWindow(window, {
          type: `open-pet-install-modal`,
          name: route.name,
          description: route.description,
          imageUrl: route.imageUrl,
          spriteVersionNumber: route.spriteVersionNumber,
        });
        return;

      case `pluginDetail`:
        navigateToRoute(window, buildPluginDetailRoute(route));
        return;

      case `pluginMcpApp`:
        navigateToRoute(window, buildMcpAppRoute(route.pluginId, route.toolName), {
          entrypoint: route.entrypoint,
          mcpAppDeepLink: route.target ?? undefined,
        });
        return;

      case `localPluginDetail`:
        navigateToRoute(
          window,
          buildPluginDetailRoute({
            hostId: route.hostId ?? `local`,
            marketplacePath: route.marketplacePath,
            pluginId: route.pluginName,
            pluginName: route.pluginName,
          }),
          { pluginDetailDeepLinkMode: route.openShareDialog ? `share` : `view` },
        );
        return;

      case `automations`:
        navigateToRoute(window, `/automations`, { automationMode: `create` });
        return;

      case `automation`: {
        const search = new URLSearchParams({
          automationId: route.automationId,
          automationSource: route.automationSource,
        });
        if (route.edit) search.set(`edit`, `true`);
        navigateToRoute(window, `/automations?${search.toString()}`);
        return;
      }

      case `connectorOAuthCallback`:
        windowManager.showPrimaryWindow({ stealFocus: true });
        windowManager.sendMessageToWindow(window, {
          type: `connector-oauth-callback`,
          fullRedirectUrl: route.fullRedirectUrl,
          returnTo: route.returnTo ?? undefined,
        });
        return;

      case `launch`:
        windowManager.showPrimaryWindow({ stealFocus: true });
        return;

      case `browser`:
        openBrowserForDeepLink({
          browserUrl: route.browserUrl,
          initiator: `external_link`,
          window,
          windowManager,
        });
        return;

      case `sharedChatGptConversation`:
        navigateToRoute(window, buildSharedConversationRoute(route.sharedConversationId));
        return;

      case `libraryFile`:
        navigateToRoute(window, `/library/file/${route.libraryFileId}`);
        return;

      case `localConversation`: {
        if (
          readThread == null ||
          (await readThread(route.conversationId, { includeTurns: false }).catch((error: unknown) => {
            logger.warning(`local_conversation_deep_link_lookup_failed`, {
              safe: { conversationId: route.conversationId },
              sensitive: { error },
            });
            return null;
          })) == null
        ) {
          return;
        }

        if (route.browserActive === false && route.browserTabId != null && route.browserUrl != null) {
          openBrowserForDeepLink({
            browserActive: false,
            browserTabId: route.browserTabId,
            browserUrl: route.browserUrl,
            conversationId: route.conversationId,
            window,
            windowManager,
          });
          return;
        }

        let navigationState;
        if (route.openReview && route.reviewDiffFilter != null) {
          navigationState = {
            openReview: true,
            reviewDiffFilter: route.reviewDiffFilter,
            reviewPath: route.reviewPath,
          };
        } else if (route.openReview) {
          navigationState = { openReview: true };
        }
        if (route.prompt != null) {
          navigationState = {
            ...navigationState,
            focusComposerNonce: now(),
            prefillPrompt: route.prompt,
          };
        }

        const conversationPath = buildConversationRoute(route.conversationId);
        navigateToRoute(
          window,
          route.hostId == null || route.hostId === `local`
            ? conversationPath
            : `${conversationPath}?${new URLSearchParams({ hostId: route.hostId })}`,
          navigationState,
        );
        openBrowserForDeepLink({
          browserTabId: route.browserTabId,
          browserUrl: route.browserUrl,
          conversationId: route.conversationId,
          window,
          windowManager,
        });
        return;
      }

      case `newThread`: {
        const project =
          route.projectId == null
            ? null
            : (projectsManager?.getLocalProjects()[route.projectId] ??
              getLegacyProjects(globalState)[route.projectId]);
        const workspaceRoot =
          project == null
            ? await resolveWorkspace({
                route,
                globalState,
                requestGitWorker,
                appServerClient,
                projectsManager,
              })
            : resolveProjectRoot(project.rootPaths);
        const selectedProject =
          workspaceRoot == null
            ? undefined
            : await selectWorkspaceProject({
                globalState,
                projectsManager,
                projectId: project?.id,
                workspaceRoot,
                windowManager,
              });
        if (workspaceRoot != null && selectedProject == null) return;

        navigateToRoute(window, `/`, {
          codexAppMode: route.codexAppMode,
          focusComposerNonce: now(),
          prefillPrompt: route.prompt,
          project: selectedProject,
        });
        openBrowserForDeepLink({ browserUrl: route.browserUrl, window, windowManager });
        return;
      }

      case `settings`:
        navigateToRoute(
          window,
          `${route.section == null ? `/settings` : `/settings/${route.section}`}${route.search ?? ``}${route.hash ?? ``}`,
        );
        return;

      case `skills`:
        navigateToRoute(window, `/skills${route.search ?? ``}`);
        return;
    }
  }

  return { executeDeepLinkRoute };
}

if (typeof module !== "undefined") {
  module.exports = { createDeepLinkRouteExecutor };
}
