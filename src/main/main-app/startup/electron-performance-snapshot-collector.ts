// @ts-nocheck

const PROCESS_KIND_LIMIT = 5;
const COMMAND_AGGREGATE_LIMIT = 5;
const PROCESS_RANK_LIMIT = 5;
const ROOT_PROCESS_LIMIT = 5;
const RENDERER_PROCESS_LIMIT = 5;

function getCumulativeCpuSeconds(metric: any) {
  return metric?.cpu?.cumulativeCPUUsage ?? undefined;
}

function getCommandName(command: string, basename: (path: string) => string) {
  const match = /^(?:"([^"]+)"|'([^']+)'|(\S+))/.exec(command.trim());
  const executable = match?.[1] ?? match?.[2] ?? match?.[3];
  return executable == null
    ? `unknown`
    : basename(executable.replaceAll(`\\`, `/`)).replace(/^\((.+)\)$/, `$1`);
}

function addCommandAggregateFields(
  fields: Record<string, any>,
  processes: any[],
  basename: (path: string) => string,
) {
  const aggregates = new Map<string, any>();
  for (const processInfo of processes) {
    const commandName = getCommandName(processInfo.command, basename);
    const aggregate = aggregates.get(commandName) ?? { commandName, count: 0, rssKb: 0 };
    aggregate.count += 1;
    aggregate.rssKb += processInfo.rssKb ?? 0;
    aggregates.set(commandName, aggregate);
  }
  Array.from(aggregates.values())
    .sort((left, right) =>
      right.rssKb === left.rssKb
        ? right.count === left.count
          ? left.commandName.localeCompare(right.commandName)
          : right.count - left.count
        : right.rssKb - left.rssKb,
    )
    .slice(0, COMMAND_AGGREGATE_LIMIT)
    .forEach((aggregate, index) => {
      const rank = index + 1;
      fields[`host_descendant_process_command_${rank}`] = aggregate.commandName;
      fields[`host_descendant_process_command_${rank}_count`] = aggregate.count;
      fields[`host_descendant_process_command_${rank}_rss_kb`] = aggregate.rssKb;
    });
}

function addRootProcessFields(
  fields: Record<string, any>,
  processes: any[],
  includeCommandNames: boolean,
  basename: (path: string) => string,
) {
  const directChildren = new Map(
    processes.filter((processInfo) => processInfo.depth === 1).map((processInfo) => [processInfo.pid, processInfo]),
  );
  const aggregates = new Map<number, any>();
  for (const processInfo of processes) {
    const root = directChildren.get(processInfo.rootChildPid);
    if (root == null) continue;
    const aggregate = aggregates.get(processInfo.rootChildPid) ?? {
      commandName: getCommandName(root.command, basename),
      count: 0,
      kind: root.kind,
      rssKb: 0,
    };
    aggregate.count += 1;
    aggregate.rssKb += processInfo.rssKb ?? 0;
    aggregates.set(processInfo.rootChildPid, aggregate);
  }
  Array.from(aggregates.values())
    .sort((left, right) =>
      right.rssKb === left.rssKb
        ? right.count === left.count
          ? left.kind.localeCompare(right.kind)
          : right.count - left.count
        : right.rssKb - left.rssKb,
    )
    .slice(0, ROOT_PROCESS_LIMIT)
    .forEach((aggregate, index) => {
      const rank = index + 1;
      fields[`host_descendant_root_${rank}_kind`] = aggregate.kind;
      fields[`host_descendant_root_${rank}_process_count`] = aggregate.count;
      fields[`host_descendant_root_${rank}_rss_kb`] = aggregate.rssKb;
      if (includeCommandNames)
        fields[`host_descendant_root_${rank}_command_name`] = aggregate.commandName;
    });
}

/** Collects stateful Electron renderer and descendant-process performance snapshots. */
export function createElectronPerformanceSnapshotCollectorClass(dependencies: Record<string, any>) {
  const {
    basename,
    createLogger,
    desktopSnapshot,
    electron,
    freeMemory,
    getSystemMetrics,
    isInternalBuild,
    listDescendantProcesses,
    now,
    processApi,
    summarizeDescendantProcesses,
  } = dependencies;

  return class ElectronPerformanceSnapshotCollector {
    buildFlavor: any;
    gitWorkerInvocationSampler: any;
    isIabWebContents: (webContents: any) => boolean;
    logger = createLogger(`electron-sampler`);
    previousDescendantProcessSnapshot: { count: number; rssKb: number } | null = null;
    previousRendererWorkingSetKbTotal: number | null = null;

    constructor(
      buildFlavor: any,
      gitWorkerInvocationSampler: any,
      isIabWebContents = (_webContents: any) => false,
    ) {
      this.buildFlavor = buildFlavor;
      this.gitWorkerInvocationSampler = gitWorkerInvocationSampler;
      this.isIabWebContents = isIabWebContents;
    }

    async collectSnapshotFields(webContents: any) {
      const memory = processApi.memoryUsage();
      const systemMetrics = getSystemMetrics();
      const fields: Record<string, any> = {
        ...desktopSnapshot(),
        main_process_rss_bytes: memory.rss,
        main_process_heap_total_bytes: memory.heapTotal,
        main_process_heap_used_bytes: memory.heapUsed,
        main_process_external_bytes: memory.external,
        main_process_array_buffers_bytes: memory.arrayBuffers,
        system_free_memory_bytes: systemMetrics?.systemFreeMemoryBytes ?? freeMemory(),
        renderer_webcontents_id: webContents.id,
      };
      if (systemMetrics != null) {
        if (systemMetrics.mainProcessHandleCount != null)
          fields.main_process_handle_count = systemMetrics.mainProcessHandleCount;
        fields.system_total_memory_bytes = systemMetrics.systemTotalMemoryBytes;
        fields.system_commit_total_bytes = systemMetrics.systemCommitTotalBytes;
        fields.system_commit_limit_bytes = systemMetrics.systemCommitLimitBytes;
        fields.system_kernel_paged_pool_bytes = systemMetrics.systemKernelPagedPoolBytes;
        fields.system_kernel_nonpaged_pool_bytes = systemMetrics.systemKernelNonpagedPoolBytes;
        fields.system_handle_count = systemMetrics.systemHandleCount;
        fields.system_process_count = systemMetrics.systemProcessCount;
        fields.system_thread_count = systemMetrics.systemThreadCount;
        fields.system_uptime_ms = systemMetrics.systemUptimeMs;
      }

      const rendererProcessId = webContents.getOSProcessId();
      try {
        const appMetrics = electron.app.getAppMetrics();
        const mainMetric = appMetrics.find((metric: any) => metric.pid === processApi.pid);
        const rendererMetric = appMetrics.find((metric: any) => metric.pid === rendererProcessId);
        if (mainMetric != null) this.addMainProcessFields(fields, mainMetric);
        if (rendererMetric != null) this.addRendererMemoryFields(fields, rendererMetric);
        this.addRendererProcessAggregateFields(fields, webContents, appMetrics);
      } catch (error) {
        this.logger().warning(`Failed to collect renderer process memory snapshot`, {
          safe: {},
          sensitive: { error },
        });
      }

      const invocationSnapshot = this.gitWorkerInvocationSampler.getSnapshot();
      fields.git_worker_invocations_total = invocationSnapshot.totalInvocations;
      fields.git_worker_invocations_last_30s = invocationSnapshot.invocationsLast30s;
      if (processApi.platform !== `win32`) await this.addChildProcessFields(fields);
      return fields;
    }

    collectPerformanceSpanCpuSnapshot(webContents: any, stage = `initial`) {
      const capturedAtMonotonicMs = now();
      try {
        const rendererProcessId = webContents.getOSProcessId();
        const appMetrics = electron.app.getAppMetrics();
        const mainMetric = appMetrics.find((metric: any) => metric.pid === processApi.pid);
        const rendererMetric = appMetrics.find((metric: any) => metric.pid === rendererProcessId);
        let electronProcessWorkingSetKbTotal: number | undefined;
        let rendererProcessWorkingSetKbTotal: number | undefined;
        let rendererProcessCount: number | undefined;
        for (const metric of appMetrics) {
          if (metric.type === `Tab`) rendererProcessCount = (rendererProcessCount ?? 0) + 1;
          const workingSetSize = metric.memory?.workingSetSize;
          if (workingSetSize != null) {
            electronProcessWorkingSetKbTotal =
              (electronProcessWorkingSetKbTotal ?? 0) + workingSetSize;
            if (metric.type === `Tab`)
              rendererProcessWorkingSetKbTotal =
                (rendererProcessWorkingSetKbTotal ?? 0) + workingSetSize;
          }
        }
        return {
          capturedAtMonotonicMs,
          electronProcessWorkingSetKbTotal,
          mainProcessCumulativeCpuSeconds: getCumulativeCpuSeconds(mainMetric),
          mainProcessRssBytes: processApi.memoryUsage.rss(),
          rendererProcessCount,
          rendererProcessCumulativeCpuSeconds: getCumulativeCpuSeconds(rendererMetric),
          rendererProcessCreationTimeMs: rendererMetric?.creationTime,
          rendererProcessId,
          rendererProcessWorkingSetKb: rendererMetric?.memory?.workingSetSize,
          rendererProcessWorkingSetKbTotal,
          ...(stage === `final` ? getSystemMetrics() : null),
        };
      } catch {
        return { capturedAtMonotonicMs };
      }
    }

    addMainProcessFields(fields: Record<string, any>, metric: any) {
      if (metric.cpu && `percentCPUUsage` in metric.cpu)
        fields.main_process_cpu_percent = metric.cpu.percentCPUUsage;
    }

    addRendererMemoryFields(fields: Record<string, any>, metric: any) {
      if (metric.cpu && `percentCPUUsage` in metric.cpu)
        fields.renderer_process_cpu_percent = metric.cpu.percentCPUUsage;
      const memory = metric.memory;
      if (memory == null) return;
      if (`workingSetSize` in memory)
        fields.renderer_process_working_set_kb = memory.workingSetSize;
      if (`peakWorkingSetSize` in memory)
        fields.renderer_process_peak_working_set_kb = memory.peakWorkingSetSize;
      if (`privateBytes` in memory)
        fields.renderer_process_private_bytes_kb = memory.privateBytes;
      if (`sharedBytes` in memory)
        fields.renderer_process_shared_bytes_kb = memory.sharedBytes;
    }

    addRendererProcessAggregateFields(fields: Record<string, any>, current: any, metrics: any[]) {
      const webContents = electron.webContents
        .getAllWebContents()
        .filter((candidate: any) => !candidate.isDestroyed());
      const webContentsByProcessId = new Map<number, any[]>();
      for (const candidate of webContents) {
        const processId = candidate.getOSProcessId();
        if (processId <= 0) continue;
        const group = webContentsByProcessId.get(processId) ?? [];
        group.push(candidate);
        webContentsByProcessId.set(processId, group);
      }
      const metricsByProcessId = new Map(metrics.map((metric: any) => [metric.pid, metric]));
      const rendererProcesses: any[] = [];
      for (const [processId, processWebContents] of webContentsByProcessId) {
        const memory = metricsByProcessId.get(processId)?.memory;
        if (memory != null && `workingSetSize` in memory) {
          rendererProcesses.push({
            hasCurrentWebContents: processWebContents.some((candidate) => candidate.id === current.id),
            kind: this.getRendererProcessKind(processWebContents),
            peakWorkingSetKb:
              `peakWorkingSetSize` in memory ? memory.peakWorkingSetSize : null,
            webContentsCount: processWebContents.length,
            workingSetKb: memory.workingSetSize,
          });
        }
      }
      const workingSetTotal = rendererProcesses.reduce(
        (total, rendererProcess) => total + rendererProcess.workingSetKb,
        0,
      );
      fields.renderer_process_count_total = rendererProcesses.length;
      fields.renderer_webcontents_count_total = webContents.length;
      fields.renderer_process_working_set_kb_total = workingSetTotal;
      if (this.previousRendererWorkingSetKbTotal != null)
        fields.renderer_process_working_set_kb_delta_since_last_snapshot =
          workingSetTotal - this.previousRendererWorkingSetKbTotal;
      this.previousRendererWorkingSetKbTotal = workingSetTotal;
      rendererProcesses
        .sort((left, right) => right.workingSetKb - left.workingSetKb)
        .slice(0, RENDERER_PROCESS_LIMIT)
        .forEach((rendererProcess, index) => {
          const rank = index + 1;
          fields[`renderer_process_rank_${rank}_working_set_kb`] = rendererProcess.workingSetKb;
          fields[`renderer_process_rank_${rank}_webcontents_count`] = rendererProcess.webContentsCount;
          fields[`renderer_process_rank_${rank}_has_current_webcontents`] = rendererProcess.hasCurrentWebContents;
          fields[`renderer_process_rank_${rank}_kind`] = rendererProcess.kind;
          if (rendererProcess.peakWorkingSetKb != null)
            fields[`renderer_process_rank_${rank}_peak_working_set_kb`] = rendererProcess.peakWorkingSetKb;
        });
    }

    getRendererProcessKind(webContents: any[]) {
      const hasIab = webContents.some(this.isIabWebContents);
      const hasMainWindow = webContents.some(
        (candidate) => electron.BrowserWindow.fromWebContents(candidate) != null,
      );
      return hasIab && hasMainWindow
        ? `mixed`
        : hasIab
          ? `iab`
          : hasMainWindow
            ? `main_window`
            : `other`;
    }

    async addChildProcessFields(fields: Record<string, any>) {
      try {
        const processes = await listDescendantProcesses(processApi.pid);
        const summary = summarizeDescendantProcesses(processes);
        const appServer = summary.byKind.find((entry: any) => entry.kind === `app_server`) ?? null;
        const git = summary.byKind.find((entry: any) => entry.kind === `git`) ?? null;
        fields.host_child_process_count_total = summary.totalCount;
        fields.host_child_process_rss_kb_total = summary.totalRssKb;
        fields.host_child_process_count_direct = summary.directCount;
        fields.host_child_process_rss_kb_direct = summary.directRssKb;
        fields.host_descendant_process_count_total = summary.totalCount;
        fields.host_descendant_process_rss_kb_total = summary.totalRssKb;
        fields.host_descendant_process_count_direct = summary.directCount;
        fields.host_descendant_process_rss_kb_direct = summary.directRssKb;
        fields.host_descendant_process_max_depth = processes.reduce(
          (maximum, processInfo) => Math.max(maximum, processInfo.depth),
          0,
        );
        fields.host_child_git_process_count = git?.count ?? 0;
        fields.host_child_git_process_rss_kb = git?.rssKb ?? 0;
        fields.host_child_app_server_process_count = appServer?.count ?? 0;
        fields.host_child_app_server_process_rss_kb = appServer?.rssKb ?? 0;
        if (summary.oldestAgeSeconds != null) {
          fields.host_child_process_oldest_age_seconds = summary.oldestAgeSeconds;
          fields.host_descendant_process_oldest_age_seconds = summary.oldestAgeSeconds;
        }
        if (this.previousDescendantProcessSnapshot != null) {
          fields.host_descendant_process_count_delta_since_last_snapshot =
            summary.totalCount - this.previousDescendantProcessSnapshot.count;
          fields.host_descendant_process_rss_kb_delta_since_last_snapshot =
            summary.totalRssKb - this.previousDescendantProcessSnapshot.rssKb;
        }
        this.previousDescendantProcessSnapshot = {
          count: summary.totalCount,
          rssKb: summary.totalRssKb,
        };
        summary.byKind.slice(0, PROCESS_KIND_LIMIT).forEach((entry: any, index: number) => {
          const rank = index + 1;
          fields[`host_descendant_process_kind_${rank}`] = entry.kind;
          fields[`host_descendant_process_kind_${rank}_count`] = entry.count;
          fields[`host_descendant_process_kind_${rank}_rss_kb`] = entry.rssKb;
          fields[`host_descendant_process_kind_${rank}_direct_count`] = entry.directCount;
          fields[`host_descendant_process_kind_${rank}_direct_rss_kb`] = entry.directRssKb;
        });
        for (const entry of summary.byKind) {
          fields[`host_descendant_${entry.kind}_process_count`] = entry.count;
          fields[`host_descendant_${entry.kind}_rss_kb`] = entry.rssKb;
          fields[`host_descendant_${entry.kind}_direct_process_count`] = entry.directCount;
          fields[`host_descendant_${entry.kind}_direct_rss_kb`] = entry.directRssKb;
        }
        const internalBuild = isInternalBuild(this.buildFlavor);
        if (internalBuild) addCommandAggregateFields(fields, processes, basename);
        addRootProcessFields(fields, processes, internalBuild, basename);
        const kindByProcessId = new Map(processes.map((processInfo) => [processInfo.pid, processInfo.kind]));
        processes
          .filter((processInfo) => processInfo.rssKb != null)
          .sort((left, right) => (right.rssKb ?? 0) - (left.rssKb ?? 0))
          .slice(0, PROCESS_RANK_LIMIT)
          .forEach((processInfo, index) => {
            const rank = index + 1;
            fields[`host_descendant_process_rank_${rank}_kind`] = processInfo.kind;
            fields[`host_descendant_process_rank_${rank}_rss_kb`] = processInfo.rssKb ?? 0;
            fields[`host_descendant_process_rank_${rank}_depth`] = processInfo.depth;
            fields[`host_descendant_process_rank_${rank}_root_kind`] =
              kindByProcessId.get(processInfo.rootChildPid) ?? processInfo.kind;
            if (internalBuild)
              fields[`host_descendant_process_rank_${rank}_command_name`] = getCommandName(
                processInfo.command,
                basename,
              );
            if (processInfo.ageSeconds != null)
              fields[`host_descendant_process_rank_${rank}_age_seconds`] = processInfo.ageSeconds;
          });
      } catch (error) {
        this.logger().warning(`Failed to collect child process snapshot`, {
          safe: {},
          sensitive: { error },
        });
      }
    }
  };
}

if (typeof module !== `undefined`)
  module.exports = { createElectronPerformanceSnapshotCollectorClass };
