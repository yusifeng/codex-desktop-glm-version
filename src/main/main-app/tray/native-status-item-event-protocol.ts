/** Owns validation for events emitted by the native status-item addon. */
export function createNativeStatusItemEventProtocol(schema: any) {
  const eventSchema = schema.vf("type", [
    schema.wf({ type: schema.bf("menu-update") }),
    schema.wf({ type: schema.bf("menu-open") }),
    schema.wf({ type: schema.bf("menu-close") }),
    schema.wf({ type: schema.bf("quit") }),
    schema.wf({ type: schema.bf("open-thread"), path: schema.Of() }),
    schema.wf({ type: schema.bf("computer-use/stop-application"), applicationId: schema.Of() }),
    schema.wf({
      type: schema.bf("computer-history/pause"),
      duration: schema.df(["thirty_minutes", "one_hour", "until_tomorrow"]),
    }),
    schema.wf({ type: schema.bf("computer-history/resume") }),
    schema.wf({
      type: schema.bf("computer-history/update-observation"),
      scope: schema.df(["app", "url"]),
      target: schema.Of(),
      observe: schema.gf(),
    }),
    schema.wf({
      type: schema.bf("computer-history/clear-history"),
      scope: schema.df(["application_session", "last_ten_minutes", "last_hour", "last_day"]),
      applicationName: schema.Of().optional(),
      startedAt: schema.Of().optional(),
      endedAt: schema.Of().nullable().optional(),
    }),
    schema.wf({ type: schema.bf("computer-history/show-history") }),
    schema.wf({ type: schema.bf("computer-history/open-settings") }),
    schema.wf({
      type: schema.bf("service-state-changed"),
      processIdentifier: schema.Cf().int().positive(),
      computerUseActive: schema.gf(),
      computerHistoryState: schema.df(["stopped", "running", "paused"]),
    }),
  ]);
  return {
    parseNativeEvent(value: unknown) {
      return eventSchema.safeParse(value);
    },
  };
}

if (typeof module !== "undefined") module.exports = { createNativeStatusItemEventProtocol };
