import { createTaggedLogger } from "@chunk/logger";
import { Uf as RpcTarget } from "@chunk/shared";

export type GithubRequestHandler = (
  method: string,
  params: Record<string, unknown>,
  operationSource: unknown,
  signal: AbortSignal,
) => Promise<unknown>;

export class GithubOperation<Result = unknown> extends RpcTarget {
  private readonly abortController = new AbortController();
  private readonly result: Promise<Result>;
  private settled = false;

  constructor(run: (signal: AbortSignal) => Promise<Result>) {
    super();
    this.result = run(this.abortController.signal).finally(() => { this.settled = true; });
    this.result.catch((error) => {
      if (!this.abortController.signal.aborted)
        createTaggedLogger("github").warning("GitHub operation failed", { safe: {}, sensitive: { error } });
    });
  }

  wait(): Promise<Result> {
    return this.result;
  }

  [Symbol.dispose](): void {
    if (!this.settled) this.abortController.abort();
  }
}

export class GithubRequestClient extends RpcTarget {
  constructor(private readonly handleRequest: GithubRequestHandler) {
    super();
  }

  request<Result = unknown>(method: string, params: Record<string, unknown>, operationSource?: unknown): GithubOperation<Result> {
    return new GithubOperation((signal) => this.handleRequest(method, params, operationSource, signal) as Promise<Result>);
  }
}
