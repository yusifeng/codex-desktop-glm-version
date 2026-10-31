// @ts-nocheck

/** Creates the renderer RPC facade and disposable session for thread read-state ownership. */
export function createThreadReadStateRpcServices(dependencies: Record<string, any>) {
  const { RpcHandlerBase, createUsingScope } = dependencies;

  class ThreadReadStateSession extends RpcHandlerBase {
    session;
    cleanup;

    constructor(session: any, cleanup: () => void) {
      super();
      this.session = session;
      this.cleanup = cleanup;
    }

    set(value: unknown) {
      return this.session.set(value);
    }

    clearForLogout() {
      return this.session.clearForLogout();
    }

    unsubscribe() {
      this.session[Symbol.dispose]();
      const cleanup = this.cleanup;
      this.cleanup = null;
      cleanup?.();
    }

    [Symbol.dispose]() {
      this.unsubscribe();
    }
  }

  class ThreadReadStateService extends RpcHandlerBase {
    owner;

    constructor(owner: any) {
      super();
      this.owner = owner;
    }

    async getExecutionHostKeys() {
      return this.owner.executionHostKeysByHostId;
    }

    async open(callbackHandle: any, options: unknown) {
      const callback = callbackHandle.dup();
      let sessionFacade;
      let retired = false;
      let result;
      try {
        result = await this.owner.open((event: Record<string, any>) => {
          try {
            var scope = createUsingScope();
            scope.u(callback(event));
            if (event.type === `retired`) {
              retired = true;
              sessionFacade?.unsubscribe();
            }
          } catch (error) {
            scope.e = error;
          } finally {
            scope.d();
          }
        }, options);
      } catch (error) {
        callback[Symbol.dispose]();
        throw error;
      }

      if (result.status !== `ready`) {
        callback[Symbol.dispose]();
        return result;
      }

      sessionFacade = new ThreadReadStateSession(result.session, () => {
        callback[Symbol.dispose]();
      });
      callback.onRpcBroken(() => sessionFacade?.unsubscribe());
      if (retired) sessionFacade.unsubscribe();
      return { ...result, session: sessionFacade };
    }
  }

  return { ThreadReadStateService, ThreadReadStateSession };
}

if (typeof module !== "undefined") {
  module.exports = { createThreadReadStateRpcServices };
}
