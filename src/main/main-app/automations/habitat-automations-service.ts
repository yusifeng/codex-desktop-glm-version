// @ts-nocheck

export function createHabitatAutomationsServiceClass({
  automationRuntime: n,
  desktopApiRuntime: a,
  createLogger,
  defaultFetch,
  randomUUID,
}) {
  const OOe = n.wf({
      target: n
        .vf(`type`, [
          n.wf({ type: n.bf(`project`), project_id: n.Of().min(1) }),
          n.wf({ type: n.bf(`projectless`) }),
        ])
        .nullable(),
      compatibility_cwds: n.hf(n.Of().min(1)),
      execution_environment: n.df([`local`, `worktree`]),
      local_environment_config_path: n.Of().nullable(),
      plugin_template_id: n.Of().nullable(),
    }),
    ZE = n.wf({
      id: n.Of().min(1),
      created_at: n.Of(),
      updated_at: n.Of(),
      title: n.Of(),
      schedule: n.Of(),
      is_enabled: n.gf(),
      prompt: n.Of(),
      executor: n.bf(`local`),
      installation_id: n.Pf(),
      legacy_automation_id: n.Of().min(1),
      model: n.Of().nullable(),
      notification_policy: n.gd.nullable(),
      reasoning_effort: n._d.nullable(),
      target_thread_id: n.Of().nullable(),
      local_configuration: OOe.nullable(),
    }),
    kOe = n.wf({ items: n.hf(ZE), cursor: n.Of().nullable().optional() }),
    QE = n.wf({ status: n.df([`not_enrolled`, `accepted`, `complete`]) }),
    AOe = class HabitatAutomationsService extends n.Uf {
      appServerClient;
      desktopApiOptions;
      globalState;
      isRolloutEnabled;
      fetch;
      onChanged;
      logger = createLogger(`habitat-automations`);
      owner = null;
      operationTail = Promise.resolve();
      migrationPromise = null;
      syncPromise = null;
      migrationError;
      enrollmentStatus = null;
      enrollmentOwnerKey = null;
      constructor(e, t, n, r, i = defaultFetch, a = () => {}) {
        (super(),
          (this.appServerClient = e),
          (this.desktopApiOptions = t),
          (this.globalState = n),
          (this.isRolloutEnabled = r),
          (this.fetch = i),
          (this.onChanged = a));
      }
      handlePrincipalChanged(e) {
        let t = this.globalState.get(a.N),
          r =
            e == null || t == null
              ? null
              : { accountId: e.accountId, userId: e.userId, installationId: t },
          i = r == null ? null : this.getPersistedStatus(r),
          o = i === `in_progress`;
        ((this.enrollmentStatus = null),
          (this.enrollmentOwnerKey = null),
          (this.owner = o || i === `complete` ? r : null),
          n.Br(this.owner, o ? `in_progress` : `complete`),
          (this.migrationError = void 0));
      }
      async getState() {
        let e = await this.appServerClient.getAuthenticatedPrincipal();
        if (e == null)
          return (this.handlePrincipalChanged(null), this.state(`unavailable`));
        let t = this.globalState.get(a.N);
        if (t == null)
          return this.isRolloutEnabled()
            ? this.state(
                this.getPersistedStatus(e) === `declined`
                  ? `declined`
                  : `eligible`,
              )
            : this.state(`unavailable`);
        let r = { accountId: e.accountId, userId: e.userId, installationId: t };
        await this.readEnrollment(r);
        let i = this.getPersistedStatus(r) ?? this.getPersistedStatus(e),
          o = i === `in_progress`;
        return (
          (this.owner = o || i === `complete` ? r : null),
          n.Br(this.owner, o ? `in_progress` : `complete`),
          this.migrationPromise == null
            ? i === `complete` && this.enrollmentStatus === `complete`
              ? this.state(`complete`)
              : !this.isRolloutEnabled() &&
                  this.enrollmentStatus === `not_enrolled`
                ? this.state(`unavailable`)
                : i === `declined` && this.enrollmentStatus === `not_enrolled`
                  ? this.state(`declined`)
                  : this.migrationError == null
                    ? this.state(`eligible`)
                    : this.state(`error`, this.migrationError)
            : this.state(`migrating`)
        );
      }
      async migrate(e) {
        if (this.migrationPromise != null) return this.migrationPromise;
        if (
          !this.isRolloutEnabled() &&
          this.globalState.get(`electron-automations-installation-id`) == null
        )
          return this.state(`unavailable`);
        this.migrationPromise = this.enqueue(async () => {
          let t = await this.getCurrentOwner(e);
          if (
            (this.enrollmentOwnerKey !==
              `${t.accountId}:${t.userId}:${t.installationId}` &&
              (await this.readEnrollment(t)),
            this.enrollmentStatus === `not_enrolled`)
          ) {
            if (!this.isRolloutEnabled()) return this.state(`unavailable`);
            await this.writeEnrollment(t, `accept`);
          }
          if (
            this.getPersistedStatus(t) === `complete` &&
            this.enrollmentStatus === `complete`
          )
            return this.state(`complete`);
          ((this.migrationError = void 0),
            await this.persistStatus(t, `in_progress`),
            await this.checkOwner(t));
          let r = new Map(),
            i = n.Mr(r),
            a = new Set(i.map(({ id: e }) => e));
          if (n.Dr(a))
            return (
              (this.migrationError = `Some automations could not be migrated.`),
              this.state(`error`, this.migrationError)
            );
          let o = (
              await Promise.all(
                i.map(async (e) => {
                  try {
                    let n = await this.saveAndVerify(null, e, t, e.id);
                    return (
                      await this.checkOwner(t),
                      { automation: e, response: n }
                    );
                  } catch (t) {
                    return (
                      this.logger().warning(
                        `Failed to migrate a desktop automation`,
                        {
                          safe: {},
                          sensitive: { automationId: e.id, error: t },
                        },
                      ),
                      null
                    );
                  }
                }),
              )
            ).filter((e) => e != null),
            s = new Map();
          if (
            (n.Mr(s),
            o.length !== i.length ||
              n.Dr(a) ||
              i.some(({ id: e }) => r.get(e) !== s.get(e)))
          )
            return (
              (this.migrationError = `Some automations could not be migrated.`),
              this.state(`error`, this.migrationError)
            );
          (await this.checkOwner(t), (this.owner = t), n.Br(t, `in_progress`));
          for (let { automation: e, response: i } of o)
            if (
              n.Fr(e.id, { ...nD(i, e), status: e.status }, t, r.get(e.id)) ==
              null
            )
              throw Error(`Migrated automation could not be adopted locally`);
          return (
            n.Dr() || (await this.syncOwner(t), await this.checkOwner(t)),
            n.Dr()
              ? ((this.migrationError = `Some automations could not be migrated.`),
                this.state(`error`, this.migrationError))
              : (await this.writeEnrollment(t, `complete`),
                await this.persistStatus(t, `complete`),
                n.Br(t, `complete`),
                this.state(`complete`))
          );
        }).catch(
          (e) => (
            this.logger().warning(
              `Desktop automation migration did not finish`,
              {
                safe: {},
                sensitive: { error: e },
              },
            ),
            (this.migrationError = `Automation migration could not finish. Try again.`),
            this.state(`error`, this.migrationError)
          ),
        );
        try {
          return await this.migrationPromise;
        } finally {
          ((this.migrationPromise = null), this.onChanged());
        }
      }
      async decline(e) {
        if (!this.isRolloutEnabled()) return;
        if (
          this.globalState.get(`electron-automations-installation-id`) == null
        ) {
          let t = await this.appServerClient.getAuthenticatedPrincipal();
          if (t?.accountId !== e.accountId || t.userId !== e.userId)
            throw Error(`The signed-in automation owner changed`);
          await this.persistStatus(e, `declined`);
          return;
        }
        let t = await this.getCurrentOwner(e);
        this.getPersistedStatus(t) !== `in_progress` &&
          this.getPersistedStatus(t) !== `complete` &&
          (await this.persistStatus(t, `declined`));
      }
      list() {
        return n.Ar();
      }
      isMigrationInProgress() {
        return this.migrationPromise != null;
      }
      getMigrationOwner() {
        return this.owner != null &&
          this.getPersistedStatus(this.owner) === `complete`
          ? { accountId: this.owner.accountId, userId: this.owner.userId }
          : null;
      }
      getHostedInstallationId() {
        return this.usableOwner?.installationId ?? null;
      }
      isLocalMigrationActive() {
        let e =
          this.owner == null ? void 0 : this.getPersistedStatus(this.owner);
        return (
          this.migrationPromise != null ||
          e === `in_progress` ||
          e === `complete`
        );
      }
      async sync() {
        let e = this.usableOwner;
        if (e != null)
          return (
            (this.syncPromise =
              this.syncPromise ??
              this.enqueue(() => this.syncOwner(e)).finally(() => {
                this.syncPromise = null;
              })),
            this.syncPromise
          );
      }
      async create(e, t = []) {
        if (this.usableOwner == null) {
          if (this.isLocalMigrationActive())
            throw Error(`Automation migration is in progress`);
          return n.yr(e, t);
        }
        return this.enqueue(async () => {
          let r = await this.getActiveOwner(),
            i = n.yr(e, t, { persist: !1 });
          if (i == null) return null;
          let a = await this.saveAndVerify(null, i, r, i.id),
            o = n.vr(nD(a, i), r, i.id);
          if (o == null)
            throw Error(`Created automation could not be cached locally`);
          return o;
        });
      }
      async update(e, t = []) {
        if (!n.Or(e.id)) {
          if (this.isLocalMigrationActive())
            throw Error(`Automation migration is in progress`);
          return n.Vr(e, t);
        }
        return this.enqueue(async () => {
          let r = await this.getActiveOwner(),
            i = n.Vr(e, t, { persist: !1 });
          if (i == null) return null;
          let a = n.Sr(e.id);
          if (a == null)
            throw Error(`Automation is missing its local identity`);
          let o = await this.saveAndVerify(e.id, i, r, a),
            s = n.vr(nD(o, i), r, a);
          if (s == null)
            throw Error(`Updated automation could not be cached locally`);
          return s;
        });
      }
      async delete(e) {
        if (!n.Or(e)) {
          if (this.isLocalMigrationActive())
            throw Error(`Automation migration is in progress`);
          return { item: n.xr(e), status: n.br(e) };
        }
        return this.enqueue(async () => {
          let t = await this.getActiveOwner(),
            r = n.xr(e);
          return r == null
            ? { item: null, status: `not_found` }
            : (await this.request(
                t,
                `delete automation`,
                `/automations/remove`,
                `POST`,
                {
                  automation_id: e,
                },
              ),
              { item: r, status: n.br(e) });
        });
      }
      async deleteArchivedHeartbeat(e) {
        let t = n.xr(e);
        if (t?.kind !== `heartbeat`) return `not_found`;
        let r = this.owner;
        if (r == null || !n.Or(e)) {
          if (!this.isLocalMigrationActive())
            return (await this.delete(e)).status;
          if (n.Vr({ ...t, status: `DELETED` }) == null)
            return `state_cleanup_failed`;
        } else if (
          n.vr(
            { ...t, status: `DELETED`, nextRunAt: null },
            r,
            n.Sr(e) ?? void 0,
          ) == null
        )
          return `state_cleanup_failed`;
        return (this.onChanged(), await this.sync(), `deleted`);
      }
      state(e, t) {
        return {
          status: e,
          pendingCount: n.Mr().length || +!!n.Dr(),
          migratedCount: this.list().filter(({ id: e }) => n.Or(e)).length,
          consentAccepted:
            this.enrollmentStatus === `accepted` ||
            this.enrollmentStatus === `complete`,
          error: t,
        };
      }
      enqueue(e) {
        let t = this.operationTail.then(e, e);
        return (
          (this.operationTail = t.then(() => void 0).catch(() => void 0)),
          t
        );
      }
      getPersistedStatus(e) {
        let t = `${e.accountId}:${e.userId}${e.installationId == null ? `` : `:${e.installationId}`}`;
        return this.globalState.get(a.M)?.[t];
      }
      async persistStatus(e, t) {
        let n = `${e.accountId}:${e.userId}${e.installationId == null ? `` : `:${e.installationId}`}`,
          r = this.globalState.get(a.M);
        this.globalState.update(a.M, (e) => ({ ...e, [n]: t }));
        try {
          await this.globalState.flushOrThrow();
        } catch (e) {
          throw (this.globalState.set(a.M, r ?? void 0), e);
        }
      }
      async getCurrentOwner(e) {
        let t = this.globalState.get(a.N);
        if (t == null) {
          let n = await this.appServerClient.getAuthenticatedPrincipal();
          if (
            n?.accountId !== e.accountId ||
            n.userId !== e.userId ||
            !this.isRolloutEnabled()
          )
            throw Error(`The signed-in automation owner or rollout changed`);
          ((t = randomUUID()),
            this.globalState.set(a.N, t),
            await this.globalState.flushOrThrow());
        }
        let n = { ...e, installationId: t };
        return (await this.checkOwner(n), n);
      }
      async getActiveOwner() {
        let e = this.usableOwner;
        if (e == null)
          throw Error(`Local automation cloud storage is unavailable`);
        return (await this.checkOwner(e), e);
      }
      get usableOwner() {
        return this.owner != null &&
          this.getPersistedStatus(this.owner) === `complete`
          ? this.owner
          : null;
      }
      async checkOwner(e) {
        let t = await this.appServerClient.getAuthenticatedPrincipal();
        if (
          t?.accountId !== e.accountId ||
          t.userId !== e.userId ||
          this.globalState.get(`electron-automations-installation-id`) !==
            e.installationId
        )
          throw Error(`The signed-in automation owner or rollout changed`);
      }
      async readEnrollment(e) {
        let t = new URLSearchParams({ installation_id: e.installationId }),
          { status: n } = QE.parse(
            await this.request(
              e,
              `read local automation enrollment`,
              `/automations/local_storage_enrollment?${t.toString()}`,
              `GET`,
            ),
          );
        ((this.enrollmentStatus = n),
          (this.enrollmentOwnerKey = `${e.accountId}:${e.userId}:${e.installationId}`));
      }
      async writeEnrollment(e, t) {
        let { status: n } = QE.parse(
          await this.request(
            e,
            `update local automation enrollment`,
            `/automations/local_storage_enrollment`,
            `POST`,
            { installation_id: e.installationId, action: t },
          ),
        );
        if (
          n !== (t === `accept` ? `accepted` : `complete`) &&
          (t !== `accept` || n !== `complete`)
        )
          throw Error(`Local automation enrollment was not confirmed`);
        ((this.enrollmentStatus = n),
          (this.enrollmentOwnerKey = `${e.accountId}:${e.userId}:${e.installationId}`));
      }
      async syncOwner(e) {
        await this.checkOwner(e);
        let t = n.Nr(e);
        await Promise.all(
          t.map((t) =>
            this.request(
              e,
              `delete archived heartbeat`,
              `/automations/remove`,
              `POST`,
              {
                automation_id: t,
              },
            ),
          ),
        );
        let r = [],
          i = new Set(),
          a = async (t) => {
            let n = new URLSearchParams({
              filter: `local`,
              installation_id: e.installationId,
              limit: `100`,
            });
            t != null && n.set(`cursor`, t);
            let o = kOe.parse(
              await this.request(
                e,
                `list local automations`,
                `/automations?${n.toString()}`,
                `GET`,
              ),
            );
            for (let t of o.items) {
              if (t.installation_id !== e.installationId)
                throw Error(`Local automation belongs to another installation`);
              r.push(t);
            }
            if (o.cursor != null) {
              if (i.size >= 100 || i.has(o.cursor))
                throw Error(
                  `Local automation discovery returned invalid pagination`,
                );
              (i.add(o.cursor), await a(o.cursor));
            }
          };
        (await a(null), await this.checkOwner(e));
        for (let t of r)
          if (n.vr(nD(t, n.xr(t.id)), e, t.legacy_automation_id) == null)
            throw Error(`Cloud automation could not be cached locally`);
        let o = new Set(r.map(({ id: e }) => e));
        for (let e of t) o.has(e) || n.br(e);
        (n.Lr(o, e), this.onChanged());
      }
      async saveAndVerify(e, t, n, r) {
        let i = jOe(t),
          a = ZE.parse(
            await this.request(
              n,
              e == null ? `create local automation` : `update local automation`,
              `/automations/save`,
              `POST`,
              {
                default_timezone:
                  Intl.DateTimeFormat().resolvedOptions().timeZone || `UTC`,
                email_enabled: !1,
                executor: `local`,
                installation_id: n.installationId,
                is_enabled: t.status === `ACTIVE`,
                jawbone_id: e,
                legacy_automation_id: r,
                local_configuration: i,
                notification_policy: t.notificationPolicy ?? null,
                notifications_enabled: !1,
                model: t.model,
                prompt: t.prompt,
                reasoning_effort: t.reasoningEffort,
                schedule: tD(t.rrule),
                target_thread_id:
                  t.kind === `heartbeat` ? t.targetThreadId : null,
                timing_mode: 0,
                title: t.name,
              },
            ),
          );
        if (e == null && !$E(a, t, i)) {
          if (
            a.installation_id !== n.installationId ||
            a.legacy_automation_id !== r
          )
            throw Error(`Existing automation belongs to another installation`);
          return this.saveAndVerify(a.id, t, n, r);
        }
        let o = ZE.parse(
          await this.request(
            n,
            `verify saved automation`,
            `/automation/${encodeURIComponent(a.id)}`,
            `GET`,
          ),
        );
        if (
          o.id !== a.id ||
          o.installation_id !== n.installationId ||
          o.legacy_automation_id !== r ||
          !$E(o, t, i)
        )
          throw Error(`Saved automation could not be independently verified`);
        return o;
      }
      async request(e, t, r, i, o) {
        await this.checkOwner(e);
        let s = await a.vt(
          {
            action: t,
            appServerClient: this.appServerClient,
            desktopApiOptions: this.desktopApiOptions,
            path: r,
            beforeSend: () => this.checkOwner(e),
            request: {
              method: i,
              headers: o == null ? {} : { "Content-Type": `application/json` },
              signal: AbortSignal.timeout(15e3),
              body: o == null ? void 0 : JSON.stringify(o),
            },
          },
          this.fetch,
        );
        if (
          (await this.checkOwner(e),
          s.status === 404 &&
            r === `/automations/remove` &&
            n.wf({ detail: n.wf({ code: n.Of() }) }).safeParse(await s.json())
              .data?.detail.code === `automation_not_found`)
        ) {
          await this.checkOwner(e);
          return;
        }
        if (!s.ok) throw Error(`${t} failed (${s.status})`);
        let c = s.status === 204 ? void 0 : await s.json();
        return (await this.checkOwner(e), c);
      }
    };
  function $E(e, t, n) {
    return (
      e.title === t.name &&
      e.prompt === t.prompt &&
      e.model === t.model &&
      e.notification_policy === (t.notificationPolicy ?? null) &&
      e.reasoning_effort === t.reasoningEffort &&
      e.target_thread_id ===
        (t.kind === `heartbeat` ? t.targetThreadId : null) &&
      e.is_enabled === (t.status === `ACTIVE`) &&
      eD(e.schedule) === eD(tD(t.rrule)) &&
      JSON.stringify(e.local_configuration) === JSON.stringify(n)
    );
  }
  function eD(e) {
    let t = e
      .split(/\r?\n/)
      .map((e) => e.trim())
      .filter((e) => ![``, `BEGIN:VEVENT`, `END:VEVENT`].includes(e));
    return t.length === 1 && t[0].startsWith(`RRULE:`)
      ? t[0].slice(6)
      : t.join(`
`);
  }
  function tD(e) {
    let t = e.trim();
    return t.includes(`BEGIN:VEVENT`)
      ? t
      : `BEGIN:VEVENT\n${
          t.includes(`
`) || t.startsWith(`RRULE:`)
            ? t
            : `RRULE:${t}`
        }\nEND:VEVENT`;
  }
  function jOe(e) {
    if (!n.bd(e)) return null;
    let t = e.target;
    return {
      target:
        t?.type === `project`
          ? { type: `project`, project_id: t.projectId }
          : t,
      compatibility_cwds: [...e.cwds],
      execution_environment: e.executionEnvironment,
      local_environment_config_path: e.localEnvironmentConfigPath,
      plugin_template_id: e.pluginTemplateId,
    };
  }
  function nD(e, t) {
    let r = e.local_configuration,
      i = t != null && eD(t.rrule) === eD(e.schedule),
      a = i ? t.nextRunAt : null,
      o = eD(e.schedule);
    !i &&
      n.kr(o) &&
      (a = n.Er({
        rrule: o,
        now: Date.parse(t == null ? e.created_at : e.updated_at) - 1,
      }));
    let s = {
      id: e.id,
      name: e.title,
      prompt: e.prompt,
      status: e.is_enabled ? `ACTIVE` : `PAUSED`,
      model: e.model,
      reasoningEffort: e.reasoning_effort,
      notificationPolicy: e.notification_policy ?? void 0,
      rrule: i ? t.rrule : eD(e.schedule),
      nextRunAt: a,
      lastRunAt: t?.lastRunAt ?? null,
      createdAt: t?.createdAt ?? Date.parse(e.created_at),
      updatedAt: Date.parse(e.updated_at),
    };
    if (e.target_thread_id != null)
      return { ...s, kind: `heartbeat`, targetThreadId: e.target_thread_id };
    if (r == null)
      throw Error(`Cron automation is missing its local execution settings`);
    return {
      ...s,
      kind: `cron`,
      pluginTemplateId: r.plugin_template_id,
      target:
        r.target?.type === `project`
          ? { type: `project`, projectId: r.target.project_id }
          : r.target,
      cwds: r.compatibility_cwds.map(n.Ns),
      executionEnvironment: r.execution_environment,
      localEnvironmentConfigPath: r.local_environment_config_path,
    };
  }
  return AOe;
}

if (typeof module !== "undefined")
  module.exports = { createHabitatAutomationsServiceClass };
