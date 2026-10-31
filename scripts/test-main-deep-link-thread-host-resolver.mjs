import assert from "node:assert/strict";
import fs from "node:fs";
import { resolveDeepLinkThreadHost } from "../src/main/main-app/deep-links/thread-host-resolver.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

function createCatalog({ hosts, indexedHost, owners }) {
  const reads = [];
  return {
    reads,
    catalog: {
      readStatus: () => ({ hosts: hosts.map((hostId) => ({ hostId })) }),
      readThreadHostId: () => indexedHost,
      readEntries: (identities) => {
        reads.push(identities);
        return owners.includes(identities[0].hostId) ? [{ identity: identities[0] }] : [];
      },
    },
  };
}

{
  const harness = createCatalog({
    hosts: ["origin", "indexed", "remote"],
    indexedHost: "indexed",
    owners: ["origin", "indexed"],
  });
  equal(resolveDeepLinkThreadHost({
    threadId: "thread",
    originHostId: "origin",
    catalog: harness.catalog,
    hasAppServerConnection: () => true,
  }), "origin");
  equal(harness.reads, [[{ hostId: "origin", threadId: "thread" }]]);
}

{
  const harness = createCatalog({
    hosts: ["origin", "indexed", "remote"],
    indexedHost: "indexed",
    owners: ["indexed", "remote"],
  });
  equal(resolveDeepLinkThreadHost({
    threadId: "thread",
    originHostId: "origin",
    catalog: harness.catalog,
    hasAppServerConnection: (hostId) => hostId !== "origin",
  }), "indexed");
  equal(harness.reads, [[{ hostId: "indexed", threadId: "thread" }]]);
}

{
  const harness = createCatalog({
    hosts: ["remote-a", "remote-b"],
    indexedHost: "missing-index",
    owners: ["remote-b"],
  });
  equal(resolveDeepLinkThreadHost({
    threadId: "thread",
    originHostId: "missing-origin",
    catalog: harness.catalog,
    hasAppServerConnection: () => true,
  }), "remote-b");
  equal(harness.reads, [
    [{ hostId: "remote-a", threadId: "thread" }],
    [{ hostId: "remote-b", threadId: "thread" }],
  ]);
}

{
  const harness = createCatalog({ hosts: ["remote"], indexedHost: "remote", owners: [] });
  equal(resolveDeepLinkThreadHost({
    threadId: "thread",
    originHostId: "origin",
    catalog: harness.catalog,
    hasAppServerConnection: () => true,
  }), "origin");
  equal(resolveDeepLinkThreadHost({
    threadId: "thread",
    originHostId: null,
    catalog: harness.catalog,
    hasAppServerConnection: () => false,
  }), "local");
}

equal(resolveDeepLinkThreadHost({
  threadId: "thread",
  originHostId: null,
  catalog: null,
  hasAppServerConnection: () => true,
}), "local");

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("resolveDeepLinkThreadHost"), true);
equal(main.includes("resolveDeepLinkThreadHost({"), true);
equal(main.includes("function vit("), false);

console.log(`${assertions} main deep-link thread-host resolver assertions passed`);
