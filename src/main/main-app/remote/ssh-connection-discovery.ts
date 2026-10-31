type SshConnectionDiscoveryDependencies = {
  fs: any;
  path: any;
  os: any;
  createLogger(name: string): any;
  parseSshConfig(source: string): any[];
  directiveType: number;
  executeCommand(options: any): { wait(): Promise<any> };
  hostIdFromAlias(alias: string): string;
};

/** Owns recursive SSH config discovery and resolved connection projection. */
export function createSshConnectionDiscovery(dependencies: SshConnectionDiscoveryDependencies) {
  const fs = dependencies.fs.default ?? dependencies.fs;
  const path = dependencies.path.default ?? dependencies.path;
  const os = dependencies.os.default ?? dependencies.os;
  const logger = dependencies.createLogger("remote-connections/discovery");
  const wildcardAlias = /[!*?[\]]/;
  const globPattern = /[*?[\]{}()]/;
  const excludedAliases = new Set(["colima"]);
  const excludedHostnames = new Set(["github.com"]);

  function directiveValues(directive: any) {
    return Array.isArray(directive.value)
      ? directive.value.map((entry: any) => entry.val).filter(Boolean)
      : directive.value.split(/\s+/u).filter(Boolean);
  }

  function scalarDirectiveValue(directive: any) {
    if (Array.isArray(directive.value))
      return directive.value.map((entry: any) => entry.val).join("").trim();
    const value = directive.value.trim();
    return value.length === 0 ? null : value;
  }

  function literalHostAliases(directive: any) {
    return directiveValues(directive)
      .filter((alias: string) => alias.length > 0)
      .filter((alias: string) => !wildcardAlias.test(alias));
  }

  function flattenDirectives(config: any[]): any[] {
    const directives: any[] = [];
    for (const directive of config) {
      if (directive.type !== dependencies.directiveType) continue;
      directives.push(directive);
      if ("config" in directive) directives.push(...flattenDirectives(directive.config));
    }
    return directives;
  }

  function expandHome(value: string) {
    return value === "~"
      ? os.homedir()
      : value.startsWith("~/") || value.startsWith("~\\")
        ? path.join(os.homedir(), value.slice(2))
        : value;
  }

  function resolveIncludePaths({ sshConfigRootDirectory, includeValue }: any) {
    const matches: string[] = [];
    for (const value of includeValue) {
      const expanded = expandHome(value);
      const pattern = path.isAbsolute(expanded)
        ? expanded
        : path.resolve(sshConfigRootDirectory, expanded);
      const globMatches = fs.globSync(pattern);
      if (globMatches.length === 0 && !globPattern.test(pattern)) {
        if (fs.existsSync(pattern)) matches.push(pattern);
        continue;
      }
      matches.push(...globMatches.filter((candidate: string) => fs.statSync(candidate).isFile()));
    }
    return matches;
  }

  function collectSshAliases({
    configPath,
    sshConfigRootDirectory,
    discoveredAliases,
    visitedConfigPaths,
  }: any) {
    if (visitedConfigPaths.has(configPath)) return;
    visitedConfigPaths.add(configPath);
    const config = dependencies.parseSshConfig(fs.readFileSync(configPath, "utf8"));
    for (const directive of config) {
      if (directive.type !== dependencies.directiveType) continue;
      const parameter = directive.param.toLowerCase();
      if (parameter === "host" && "config" in directive) {
        const alias = literalHostAliases(directive)[0];
        if (alias != null) discoveredAliases.add(alias);
        continue;
      }
      if (parameter === "include")
        for (const includePath of resolveIncludePaths({
          sshConfigRootDirectory,
          includeValue: directiveValues(directive),
        }))
          collectSshAliases({
            configPath: includePath,
            sshConfigRootDirectory,
            discoveredAliases,
            visitedConfigPaths,
          });
    }
  }

  function collectAliases(entrypointPath: string) {
    const discoveredAliases = new Set<string>();
    const visitedConfigPaths = new Set<string>();
    const resolvedEntrypoint = path.resolve(entrypointPath);
    collectSshAliases({
      configPath: resolvedEntrypoint,
      sshConfigRootDirectory: path.dirname(resolvedEntrypoint),
      discoveredAliases,
      visitedConfigPaths,
    });
    return Array.from(discoveredAliases);
  }

  function discoverSshAliases(entrypointPath: string) {
    try {
      if (!fs.existsSync(entrypointPath)) {
        logger().info("ssh_config_entrypoint_missing", {
          safe: {},
          sensitive: { entrypointPath },
        });
        return [];
      }
      logger().info("discovery_started", { safe: {}, sensitive: { entrypointPath } });
      const collectedAliases = collectAliases(entrypointPath);
      const aliases = collectedAliases.filter((alias) =>
        !excludedAliases.has(alias.trim().toLowerCase()));
      logger().info("discovery_completed", {
        safe: {
          collectedAliasCount: collectedAliases.length,
          filteredAliasCount: collectedAliases.length - aliases.length,
        },
        sensitive: { entrypointPath, collectedAliases, filteredAliases: aliases },
      });
      return aliases.sort((left, right) => left.localeCompare(right));
    } catch (error) {
      logger().warning("failed to discover remote SSH connections", {
        safe: {},
        sensitive: { error },
      });
      throw Error("Failed to discover remote SSH connections.");
    }
  }

  function parseResolvedSshConfig(source: string) {
    const config = dependencies.parseSshConfig(source);
    let hostname: string | null = null;
    let port: number | null = null;
    let identity: string | null = null;
    for (const directive of flattenDirectives(config)) {
      const parameter = directive.param.toLowerCase();
      const value = scalarDirectiveValue(directive);
      if (value == null) continue;
      if (parameter === "hostname" && hostname == null) {
        hostname = value;
        continue;
      }
      if (parameter === "port" && port == null) {
        const parsedPort = Number(value);
        if (Number.isSafeInteger(parsedPort)) port = parsedPort;
        continue;
      }
      if (parameter === "identityfile" && identity == null && value !== "none") identity = value;
    }
    return { hostname, port, identity };
  }

  async function resolveSshAlias({ entrypointPath, sshAlias }: any) {
    const { stdout, stderr, code } = await dependencies.executeCommand({
      args: ["ssh", "-G", "-F", entrypointPath, sshAlias],
      spawnInsideWsl: false,
    }).wait();
    if (code !== 0) {
      logger().warning("failed to resolve discovered SSH alias", {
        safe: {},
        sensitive: { entrypointPath, sshAlias, stderr },
      });
      return null;
    }
    const resolved = parseResolvedSshConfig(stdout);
    if (!resolved.hostname) {
      logger().info("resolved_ssh_alias_missing_hostname", {
        safe: {},
        sensitive: { entrypointPath, sshAlias },
      });
      return null;
    }
    const normalizedHostname = resolved.hostname.trim().toLowerCase();
    if (excludedHostnames.has(normalizedHostname)) {
      logger().info("resolved_ssh_alias_excluded", {
        safe: {},
        sensitive: { entrypointPath, sshAlias, hostname: resolved.hostname },
      });
      return null;
    }
    return {
      hostId: dependencies.hostIdFromAlias(sshAlias),
      displayName: sshAlias,
      source: "discovered",
      autoConnect: false,
      sshAlias,
      sshHost: resolved.hostname,
      sshPort: resolved.port,
      identity: resolved.identity,
    };
  }

  return {
    collectAliases,
    collectSshAliases,
    directiveValues,
    discoverSshAliases,
    expandHome,
    flattenDirectives,
    literalHostAliases,
    parseResolvedSshConfig,
    resolveIncludePaths,
    resolveSshAlias,
    scalarDirectiveValue,
  };
}
