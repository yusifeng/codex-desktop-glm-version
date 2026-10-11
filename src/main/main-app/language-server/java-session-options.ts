export function buildJavaSessionOptions(input: { platform: string; pathEntries: string[] }) {
  return {
    env: {
      JAVA_HOME: ``,
      JDK_HOME: ``,
      PATH: input.pathEntries.join(input.platform === `windows` ? `;` : `:`),
    },
  };
}

if (typeof module !== `undefined`) module.exports = { buildJavaSessionOptions };
