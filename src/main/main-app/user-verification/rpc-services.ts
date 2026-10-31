// @ts-nocheck

/** Creates renderer RPC wrappers for app-server user-verification attempts. */
export function createUserVerificationRpcServices({ RpcHandlerBase }: Record<string, any>) {
  class UserVerificationAttempt extends RpcHandlerBase {
    attempt;

    constructor(attempt: any) {
      super();
      this.attempt = attempt;
    }

    wait() {
      return this.attempt.wait();
    }

    accept() {
      return this.attempt.accept();
    }

    cancel() {
      this.attempt.cancel();
    }

    [Symbol.dispose]() {
      this.attempt.cancel();
    }
  }

  class UserVerificationService extends RpcHandlerBase {
    getConnection;

    constructor(getConnection: any) {
      super();
      this.getConnection = getConnection;
    }

    async begin({ hostId, conversationId, requestId }: Record<string, any>) {
      return new UserVerificationAttempt(
        this.getConnection(hostId).userVerification.begin(conversationId, requestId),
      );
    }
  }

  return { UserVerificationAttempt, UserVerificationService };
}

if (typeof module !== "undefined") {
  module.exports = { createUserVerificationRpcServices };
}
