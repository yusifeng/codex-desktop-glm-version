// @ts-nocheck

type WebsitePreviewFetchDependencies = {
  request(options: Record<string, any>): any;
  Response?: typeof Response;
  Headers?: typeof Headers;
  ReadableStream?: typeof ReadableStream;
  DOMException?: typeof DOMException;
  maxResponseBytes?: number;
};

/** Creates the bounded, redirect-manual Electron net fetch used by website previews. */
export function createWebsitePreviewFetch(dependencies: WebsitePreviewFetchDependencies) {
  const ResponseConstructor = dependencies.Response ?? Response;
  const HeadersConstructor = dependencies.Headers ?? Headers;
  const ReadableStreamConstructor = dependencies.ReadableStream ?? ReadableStream;
  const DOMExceptionConstructor = dependencies.DOMException ?? DOMException;
  const maxResponseBytes = dependencies.maxResponseBytes ?? 2 * 1024 * 1024;

  return function fetchWebsitePreview(url: string, { signal }: { signal?: AbortSignal } = {}) {
    signal?.throwIfAborted();
    return new Promise<Response>((resolve, reject) => {
      const request = dependencies.request({
        url,
        method: `GET`,
        credentials: `omit`,
        redirect: `manual`,
        referrerPolicy: `no-referrer`,
      });
      let bodyController: ReadableStreamDefaultController | null = null;
      let settled = false;
      const removeAbortListener = () => signal?.removeEventListener(`abort`, abort);
      const fail = (error: unknown) => {
        if (settled) return;
        settled = true;
        removeAbortListener();
        bodyController?.error(error);
        reject(error);
        request.abort();
      };
      const abort = () =>
        fail(new DOMExceptionConstructor(`Website preview canceled`, `AbortError`));

      signal?.addEventListener(`abort`, abort, { once: true });
      request.on(`error`, fail);
      request.on(`redirect`, (statusCode: number, _method: string, redirectUrl: string) => {
        if (settled) return;
        try {
          const response = new ResponseConstructor(null, {
            status: statusCode,
            headers: { location: redirectUrl },
          });
          settled = true;
          removeAbortListener();
          resolve(response);
          request.abort();
        } catch (error) {
          fail(Error(`Invalid website preview redirect`, { cause: error }));
        }
      });
      request.on(`response`, (incoming: any) => {
        if (settled) return;
        try {
          const headers = new HeadersConstructor();
          for (const [name, values] of Object.entries(incoming.headers)) {
            for (const value of Array.isArray(values) ? values : [values]) {
              headers.append(name, value as string);
            }
          }
          let receivedBytes = 0;
          const body = new ReadableStreamConstructor({
            start(controller: ReadableStreamDefaultController) {
              bodyController = controller;
              incoming.on(`error`, fail);
              incoming.on(`aborted`, abort);
              incoming.on(`end`, () => {
                if (!settled) {
                  settled = true;
                  removeAbortListener();
                  controller.close();
                }
              });
              incoming.on(`data`, (chunk: Uint8Array) => {
                if (settled) return;
                receivedBytes += chunk.byteLength;
                if (receivedBytes > maxResponseBytes) {
                  fail(Error(`Website preview response is too large`));
                  return;
                }
                controller.enqueue(chunk);
              });
            },
            cancel() {
              if (!settled) {
                settled = true;
                removeAbortListener();
                request.abort();
              }
            },
          });
          if (
            incoming.statusCode === 204 ||
            incoming.statusCode === 205 ||
            incoming.statusCode === 304
          ) {
            const response = new ResponseConstructor(null, {
              status: incoming.statusCode,
              headers,
            });
            body.cancel();
            resolve(response);
          } else {
            resolve(new ResponseConstructor(body, { status: incoming.statusCode, headers }));
          }
        } catch (error) {
          fail(Error(`Invalid website preview response`, { cause: error }));
        }
      });
      if (signal?.aborted) abort();
      else request.end();
    });
  };
}

if (typeof module !== `undefined`) {
  module.exports = { createWebsitePreviewFetch };
}
