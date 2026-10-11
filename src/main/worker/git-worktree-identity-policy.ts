async function createGitWorktreeIdentity(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export { createGitWorktreeIdentity };
if (typeof module !== "undefined") module.exports = { createGitWorktreeIdentity };
