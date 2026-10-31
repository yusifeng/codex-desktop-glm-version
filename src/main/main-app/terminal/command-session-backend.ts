// @ts-nocheck

/** Owns a command session's decoded output, write scheduling, resize, exit, and disposal. */
export function createCommandSessionBackendClass(dependencies: Record<string, any>) {
  const { createUtf8Decoder, formatError } = dependencies;

  return class CommandSessionBackend {
    sessionPromise: Promise<any>;
    callbacks: any;
    options: any;
    decoder = createUtf8Decoder();
    session: any = null;
    settled = false;
    disposed = false;
    pendingInput = ``;
    scheduledWrite: Promise<void> | null = null;

    constructor(sessionPromise: Promise<any>, callbacks: any, options: any = {}) {
      this.sessionPromise = sessionPromise;
      this.callbacks = callbacks;
      this.options = options;
      this.run();
    }

    async run() {
      let exit;
      try {
        this.session = await this.sessionPromise;
        exit = { code: (await this.session.response).exitCode, signal: null };
      } catch (error) {
        exit = { code: null, signal: null, error: formatError(error) };
      }
      this.settled = true;
      const remainingOutput = this.flushDecoder();
      if (!this.disposed) {
        if (remainingOutput.length > 0) this.callbacks.onData(remainingOutput);
        this.callbacks.onExit(exit);
      }
    }

    handleOutputDelta(event: any) {
      if (this.disposed || this.settled) return;
      const output = this.decoder.write(event.chunk);
      if (output.length > 0) this.callbacks.onData(output);
    }

    write(input: string) {
      if (this.disposed || this.settled) return Promise.resolve();
      this.pendingInput += input;
      if (this.scheduledWrite != null) return this.scheduledWrite;
      const scheduledWrite = Promise.resolve().then(async () => {
        try {
          do {
            const nextInput = this.pendingInput;
            this.pendingInput = ``;
            if (!this.options.serializeWrites) this.scheduledWrite = null;
            await this.writeInput(nextInput);
          } while (this.options.serializeWrites && this.pendingInput.length > 0);
        } finally {
          if (this.scheduledWrite === scheduledWrite) this.scheduledWrite = null;
        }
      });
      this.scheduledWrite = scheduledWrite;
      return scheduledWrite;
    }

    async writeInput(input: string) {
      const session = await this.getActiveSession();
      if (session != null && !this.disposed && !this.settled)
        await session.write(Buffer.from(input, `utf8`));
    }

    async resize(cols: number, rows: number) {
      if (this.disposed || this.settled) return;
      const session = await this.getActiveSession();
      if (session != null && !this.disposed && !this.settled)
        await session.resize({ cols, rows });
    }

    async terminate() {
      if (this.disposed || this.settled) return;
      const session = await this.getActiveSession();
      if (session != null && !this.disposed && !this.settled) await session.terminate();
    }

    async dispose() {
      if (this.disposed) return;
      this.disposed = true;
      this.pendingInput = ``;
      this.flushDecoder();
      if (this.settled) return;
      const session = await this.getActiveSession();
      if (session == null || this.settled) return;
      try {
        await session.terminate();
      } catch {}
    }

    flushDecoder() {
      return this.decoder.end();
    }

    async getActiveSession() {
      if (this.session != null) return this.session;
      try {
        this.session = await this.sessionPromise;
        return this.session;
      } catch {
        return null;
      }
    }
  };
}

if (typeof module !== `undefined`) module.exports = { createCommandSessionBackendClass };
