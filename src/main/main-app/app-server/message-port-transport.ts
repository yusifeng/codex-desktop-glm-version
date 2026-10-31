// @ts-nocheck

/** Async transport adapter over Electron's MessagePortMain. */
export class MessagePortTransport {
  encodingLevel = `structuredClonable`;
  #port;
  #resolveReceive;
  #rejectReceive;
  #queue = [];
  #error;

  constructor(port: any) {
    this.#port = port;
    port.start();
    port.on(`message`, (event: Record<string, any>) => {
      if (this.#error) return;
      if (event.data == null) {
        this.#fail(Error(`Peer closed MessagePort connection.`));
      } else if (this.#resolveReceive) {
        const resolve = this.#resolveReceive;
        this.#resolveReceive = undefined;
        this.#rejectReceive = undefined;
        resolve(event.data);
      } else {
        this.#queue.push(event.data);
      }
    });
    port.on(`close`, () => {
      this.#fail(Error(`MessagePort message error.`));
    });
  }

  send(message: unknown) {
    if (this.#error) throw this.#error;
    this.#port.postMessage(message);
  }

  async receive() {
    if (this.#queue.length > 0) {
      const message = this.#queue.shift();
      if (message != null) return message;
    }
    if (this.#error) throw this.#error;
    return new Promise((resolve, reject) => {
      this.#resolveReceive = resolve;
      this.#rejectReceive = reject;
    });
  }

  abort(error: unknown) {
    try {
      this.#port.postMessage(null);
    } catch {}
    this.#port.close();
    this.#error ||= error;
  }

  #fail(error: unknown) {
    if (this.#error) return;
    this.#error = error;
    if (this.#rejectReceive) {
      const reject = this.#rejectReceive;
      this.#rejectReceive = undefined;
      this.#resolveReceive = undefined;
      reject(error);
    }
  }
}

export function createMessagePortRemoteMainFactory(dependencies: Record<string, any>) {
  const { RemoteMainTransport } = dependencies;
  return function createMessagePortRemoteMain(port: any, service: any, options: any) {
    const transport = new MessagePortTransport(port);
    return new RemoteMainTransport(transport, service, options).getRemoteMain();
  };
}

if (typeof module !== "undefined") {
  module.exports = { MessagePortTransport, createMessagePortRemoteMainFactory };
}
