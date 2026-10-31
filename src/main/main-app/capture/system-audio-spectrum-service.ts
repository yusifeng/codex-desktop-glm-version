// @ts-nocheck

/** Owns the supported-platform gate, lazy spectrum singleton, and renderer subscriptions. */
export function createSystemAudioSpectrumRuntime(dependencies: Record<string, any>) {
  const { RpcHandlerBase, platform, getSystemVersion, loadSpectrumCapture } = dependencies;
  let sharedCapture;

  class SystemAudioSpectrumService extends RpcHandlerBase {
    #origin;
    #subscriptions = new Set();
    #dispose = () => this[Symbol.dispose]();
    constructor(origin) {
      (super(),
        (this.#origin = origin),
        origin.once(`destroyed`, this.#dispose),
        origin.once(`render-process-gone`, this.#dispose));
    }
    subscribe(callback) {
      let subscription = new SystemAudioSpectrumSubscription(callback.dup(), (value) =>
        this.#subscriptions.delete(value),
      );
      return (this.#subscriptions.add(subscription), subscription);
    }
    [Symbol.dispose]() {
      (this.#origin.removeListener(`destroyed`, this.#dispose),
        this.#origin.removeListener(`render-process-gone`, this.#dispose));
      for (let subscription of this.#subscriptions) subscription.unsubscribe();
    }
  }

  class SystemAudioSpectrumSubscription extends RpcHandlerBase {
    #callback;
    #remove;
    #unsubscribeCapture;
    #disposed = !1;
    #levelsInFlight = !1;
    constructor(callback, remove) {
      (super(),
        (this.#callback = callback),
        (this.#remove = remove),
        sharedCapture == null
          ? Promise.resolve()
              .then(loadSpectrumCapture)
              .then(({ SpectrumCapture }) => {
                this.#disposed || ((sharedCapture ??= new SpectrumCapture()), this.#attach(sharedCapture));
              })
              .catch(() => this.#publish({ type: `error`, reason: `capture-failed` }))
          : this.#attach(sharedCapture),
        callback.onRpcBroken(() => this.unsubscribe()));
    }
    unsubscribe() {
      this.#disposed ||
        ((this.#disposed = !0),
        this.#remove(this),
        this.#unsubscribeCapture?.(),
        this.#callback[Symbol.dispose]());
    }
    [Symbol.dispose]() {
      this.unsubscribe();
    }
    #attach(capture) {
      this.#unsubscribeCapture = capture.subscribe((event) => this.#publish(event));
    }
    #publish(event) {
      this.#disposed ||
        (event.type === `levels`
          ? this.#levelsInFlight ||
            ((this.#levelsInFlight = !0),
            this.#callback(event)
              .catch(() => this.unsubscribe())
              .finally(() => {
                this.#levelsInFlight = !1;
              }))
          : (this.#callback(event).catch(() => this.unsubscribe()),
            event.type === `error` && this.unsubscribe()));
    }
  }

  function createSystemAudioSpectrumService(origin) {
    if (platform !== `darwin`) return;
    let [major, minor] = getSystemVersion().split(`.`).map(Number);
    if (!(major < 14 || (major === 14 && minor < 2)))
      return new SystemAudioSpectrumService(origin);
  }

  return {
    createSystemAudioSpectrumService,
    SystemAudioSpectrumService,
    SystemAudioSpectrumSubscription,
  };
}

if (typeof module !== "undefined") {
  module.exports = { createSystemAudioSpectrumRuntime };
}
