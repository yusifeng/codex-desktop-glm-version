export function buildPyrightSessionOptions(input: {
  platform: string;
  pathEntries: string[];
  pythonCommand?: string | null;
}) {
  return {
    env: {
      PATH: input.pathEntries.join(input.platform === `windows` ? `;` : `:`),
      PYTHONHOME: ``,
      PYTHONPATH: ``,
      VIRTUAL_ENV: ``,
    },
    workspaceConfiguration:
      input.pythonCommand == null ? undefined : { python: { pythonPath: input.pythonCommand } },
  };
}

if (typeof module !== `undefined`) module.exports = { buildPyrightSessionOptions };
