// 应用Logger 之前的缓冲实现：真正的 logger 通过 setLogger 注入后，缓冲的
// 记录会全部转 flush 进去。保证启动最早期（还没有日志后端时）的日志不丢失。
import type { LogRecord, Logger } from "./types";
import { normalizeTags } from "./types";

const MAX_BUFFER_SIZE = 500;

export class BufferLogger implements Logger {
  private buffer: LogRecord[] = [];
  private hasLoggedDroppedLogMessage = false;

  private push(record: LogRecord) {
    if (this.buffer.length >= MAX_BUFFER_SIZE) {
      if (!this.hasLoggedDroppedLogMessage) {
        this.hasLoggedDroppedLogMessage = true;
        this.buffer.push({
          level: "warning",
          message: "Dropped buffered log message after maxBufferSize was reached",
          tags: { safe: {}, sensitive: {} },
        });
      }
      return;
    }
    this.buffer.push(record);
  }

  private createLogMethod(level: LogRecord["level"]) {
    return (message: string, tags?: LogRecord["tags"]) => {
      this.push({ level, message, tags: normalizeTags(tags) });
    };
  }

  trace = this.createLogMethod("trace");
  debug = this.createLogMethod("debug");
  info = this.createLogMethod("info");
  warning = this.createLogMethod("warning");
  error = this.createLogMethod("error");

  log = (level: LogRecord["level"], message: string, tags?: LogRecord["tags"]) => {
    this.push({ level, message, tags: normalizeTags(tags) });
  };

  flushTo(logger: Logger) {
    for (const record of this.buffer) logger.log(record.level, record.message, record.tags);
    this.buffer.length = 0;
  }

  dispose() {
    this.buffer = [];
  }
}
