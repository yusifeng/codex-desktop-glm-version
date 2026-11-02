import { Uf as RpcTarget } from "@chunk/shared";

export type ProjectAssignment =
  | { projectKind: "local"; projectId: string; projectOrigin?: "chatgpt" }
  | { projectKind: "remote"; projectId: string; hostId?: string };
export type Membership = { threadId: string; assignment: ProjectAssignment | null; projectless: boolean; hostId?: string };
export type MembershipRecords = { assignments: Record<string, ProjectAssignment>; projectlessThreadIds: string[] };

function parseMembership(value: any, projectlessRequired: boolean): Membership {
  if (!value || typeof value.threadId !== "string" || value.threadId.length === 0) throw new TypeError("Invalid thread membership");
  if (projectlessRequired && typeof value.projectless !== "boolean") throw new TypeError("Invalid projectless membership state");
  const assignment = value.assignment ?? null;
  if (assignment != null &&
      (!assignment || !["local", "remote"].includes(assignment.projectKind) || typeof assignment.projectId !== "string"))
    throw new TypeError("Invalid project assignment");
  return { threadId: value.threadId, assignment, projectless: value.projectless ?? false, ...(value.hostId == null ? {} : { hostId: value.hostId }) };
}

function currentMembership(records: MembershipRecords, threadId: string): Omit<Membership, "threadId"> {
  return { assignment: records.assignments[threadId] ?? null, projectless: records.projectlessThreadIds.includes(threadId) };
}

function sameAssignment(left: ProjectAssignment | null | undefined, right: ProjectAssignment | null | undefined): boolean {
  if (left == null || right == null) return left == null && right == null;
  return left.projectKind === right.projectKind && left.projectId === right.projectId &&
    (left.projectKind !== "remote" || right.projectKind !== "remote" || left.hostId === right.hostId) &&
    (left.projectKind !== "local" || right.projectKind !== "local" || left.projectOrigin === right.projectOrigin);
}

function applyMemberships(previous: MembershipRecords, changes: Membership[]) {
  const assignments = { ...previous.assignments };
  const projectless = new Set(previous.projectlessThreadIds);
  const touched = new Set<string>();
  for (const change of changes) {
    if (change.assignment == null) delete assignments[change.threadId]; else assignments[change.threadId] = change.assignment;
    change.projectless ? projectless.add(change.threadId) : projectless.delete(change.threadId);
    touched.add(change.threadId);
  }
  const memberships: Record<string, Omit<Membership, "threadId">> = {};
  let assignmentsChanged = false, projectlessChanged = false;
  for (const threadId of touched) {
    const nextAssignment = assignments[threadId] ?? null;
    const nextProjectless = projectless.has(threadId);
    const assignmentChanged = !sameAssignment(previous.assignments[threadId], nextAssignment);
    const flagChanged = previous.projectlessThreadIds.includes(threadId) !== nextProjectless;
    assignmentsChanged ||= assignmentChanged; projectlessChanged ||= flagChanged;
    if (assignmentChanged || flagChanged) memberships[threadId] = { assignment: nextAssignment, projectless: nextProjectless };
  }
  return {
    records: {
      assignments: assignmentsChanged ? assignments : previous.assignments,
      projectlessThreadIds: projectlessChanged ? [...projectless] : previous.projectlessThreadIds,
    },
    memberships,
  };
}

/** Serialized, RPC-visible thread/project membership store (original `Yce`). */
export class ThreadProjectMembershipStore extends RpcTarget {
  private pendingWrite: Promise<void> = Promise.resolve();
  private pendingCatalogWrite: Promise<void> = Promise.resolve();
  private readonly pendingThreadWrites = new Map<string, Promise<void>>();

  constructor(
    private readonly storage: { read(): MembershipRecords | Promise<MembershipRecords>; write(previous: MembershipRecords, next: MembershipRecords): void | Promise<void> },
    private readonly publish: (memberships: Record<string, Omit<Membership, "threadId">>) => void,
    private readonly writeMembership?: (membership: Membership, commit: () => Promise<void>, signal?: AbortSignal) => void | Promise<void>,
  ) { super(); }

  async setAssignment(value: any, signal?: AbortSignal): Promise<void> {
    const parsed = parseMembership(value, false);
    const current = await this.storage.read();
    await this.apply([{ ...parsed, projectless: current.projectlessThreadIds.includes(parsed.threadId) }], signal);
  }
  async setProjectless(value: any): Promise<void> {
    const parsed = parseMembership({ ...value, assignment: null }, true);
    const current = await this.storage.read();
    await this.apply([{ ...parsed, assignment: current.assignments[parsed.threadId] ?? null }]);
  }
  async setMembership(value: any): Promise<void> { await this.restoreMemberships([value]); }
  async restoreMemberships(values: any[]): Promise<void> { await this.apply(values.map((value) => parseMembership(value, true))); }
  async assignIfUnassigned(values: any[]): Promise<void> { await this.apply(values.map((value) => parseMembership(value, true)), undefined, true); }
  async moveLocalProjectThreadsToProjectless(projectId: string): Promise<void> {
    if (!projectId) throw new TypeError("Invalid project id");
    await this.transform((records) => Object.entries(records.assignments).flatMap(([threadId, assignment]) =>
      assignment.projectKind === "local" && assignment.projectId === projectId
        ? [{ threadId, assignment: null, projectless: true }] : []));
  }
  async reset(): Promise<void> {
    await this.transform((records) => [...new Set([...Object.keys(records.assignments), ...records.projectlessThreadIds])]
      .map((threadId) => ({ threadId, assignment: null, projectless: false })));
  }
  async flush(): Promise<void> {
    await Promise.allSettled([...this.pendingThreadWrites.values(), this.pendingCatalogWrite]);
    await this.pendingWrite;
  }

  private apply(changes: Membership[], signal?: AbortSignal, onlyIfUnassigned = false): Promise<unknown> {
    if (!this.writeMembership) return this.commit((records) => {
      const occupied = onlyIfUnassigned ? new Set([...Object.keys(records.assignments), ...records.projectlessThreadIds]) : null;
      return changes.filter((change) => !occupied?.has(change.threadId));
    });
    return this.applyExternal(changes, signal, onlyIfUnassigned, this.pendingCatalogWrite, true);
  }

  private async transform(createChanges: (records: MembershipRecords) => Membership[]): Promise<void> {
    if (!this.writeMembership) { await this.commit(createChanges); return; }
    const priorThreads = [...this.pendingThreadWrites.values()], priorCatalog = this.pendingCatalogWrite;
    const task = (async () => {
      await Promise.allSettled(priorThreads); await priorCatalog; await this.pendingWrite;
      await this.applyExternal(createChanges(await this.storage.read()), undefined, false, Promise.resolve(), false);
    })();
    this.pendingCatalogWrite = task.then(() => {}, () => {});
    await task;
  }

  private async applyExternal(changes: Membership[], signal: AbortSignal | undefined, onlyIfUnassigned: boolean, barrier: Promise<unknown>, serializeThreads: boolean): Promise<unknown[]> {
    const chunks: Membership[][] = [];
    for (let index = 0; index < changes.length; index += 8) chunks.push(changes.slice(index, index + 8));
    let previousChunk = barrier;
    const tasks = chunks.map((chunk) => {
      const chunkBarrier = previousChunk;
      const work = chunk.map((change) => {
        const run = async () => {
          await chunkBarrier; await this.pendingWrite;
          const records = await this.storage.read();
          const current = currentMembership(records, change.threadId);
          if (onlyIfUnassigned && (current.assignment != null || current.projectless)) return [];
          let committed: unknown[] = [];
          await this.writeMembership?.({ ...current, ...change }, async () => { committed = await this.commit(() => [{ ...current, ...change }]); }, signal);
          return committed;
        };
        if (!serializeThreads) return run();
        const operation = (this.pendingThreadWrites.get(change.threadId) ?? Promise.resolve()).then(run);
        const settled = operation.then(() => {}, () => {}).finally(() => {
          if (this.pendingThreadWrites.get(change.threadId) === settled) this.pendingThreadWrites.delete(change.threadId);
        });
        this.pendingThreadWrites.set(change.threadId, settled);
        return operation;
      });
      const result = Promise.allSettled(work).then((settled) => settled.flatMap((entry) => {
        if (entry.status === "rejected") throw entry.reason;
        return entry.value;
      }));
      previousChunk = result; return result;
    });
    const settled = await Promise.allSettled(tasks);
    return settled.flatMap((entry) => { if (entry.status === "rejected") throw entry.reason; return entry.value; });
  }

  private commit(createChanges: (records: MembershipRecords) => Membership[]): Promise<any[]> {
    const operation = this.pendingWrite.then(async () => {
      const previous = await this.storage.read();
      const { records, memberships } = applyMemberships(previous, createChanges(previous));
      const threadIds = Object.keys(memberships);
      if (threadIds.length === 0) return [];
      const result = threadIds.map((threadId) => ({ threadId, ...currentMembership(previous, threadId) }));
      try { await this.storage.write(previous, records); }
      catch (error) {
        const current = await this.storage.read();
        const rollback = applyMemberships(previous, threadIds.map((threadId) => ({ threadId, ...currentMembership(current, threadId) }))).memberships;
        if (Object.keys(rollback).length > 0) this.publish(rollback);
        throw error;
      }
      this.publish(memberships); return result;
    });
    this.pendingWrite = operation.then(() => {}, () => {});
    return operation;
  }
}

export { ThreadProjectMembershipStore as n };
