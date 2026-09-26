import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const temporaryDirectory = await fs.mkdtemp(
  path.join(os.tmpdir(), "app-shared-query-hook-types-"),
);
const fixturePath = path.join(temporaryDirectory, "fixture.ts");

const fixture = `
import { _L as useQuery, iL as useMutation } from "@rchunk/app-shared";

const query = useQuery({
  queryKey: ["profile", 7] as const,
  queryFn: async ({ queryKey, signal }) => {
    const id: 7 = queryKey[1];
    const aborted: boolean = signal.aborted;
    return { id, aborted };
  },
  select: (profile) => profile.id,
});
const selectedId: 7 | undefined = query.data;
// @ts-expect-error selected query data is numeric
const invalidSelectedId: string | undefined = query.data;

const mutation = useMutation({
  mutationFn: async (id: number) => String(id),
  onSuccess(data, variables) {
    const text: string = data;
    const id: number = variables;
    return { text, id };
  },
});
mutation.mutate(1);
const mutationPromise: Promise<string> = mutation.mutateAsync(2);
// @ts-expect-error mutation variables are numeric
mutation.mutate("invalid");

const noVariableMutation = useMutation({ mutationFn: async () => true });
noVariableMutation.mutate();
`;

try {
  await fs.writeFile(fixturePath, fixture);
  const compilation = spawnSync(
    process.execPath,
    [
      path.join(ROOT, "node_modules/typescript/bin/tsc"),
      "--ignoreConfig",
      "--noEmit",
      "--strict",
      "--skipLibCheck",
      "--target",
      "esnext",
      "--module",
      "preserve",
      "--moduleResolution",
      "bundler",
      fixturePath,
      path.join(ROOT, "src/renderer/types/rchunk-modules.d.ts"),
    ],
    { encoding: "utf8" },
  );
  assert.equal(
    compilation.status,
    0,
    `query and mutation hooks preserve generic inference\n${[
      compilation.stdout,
      compilation.stderr,
    ]
      .filter(Boolean)
      .join("\n")}`,
  );
  console.log("app-shared query hook types: 1/1 assertions passed");
} finally {
  await fs.rm(temporaryDirectory, { recursive: true, force: true });
}
