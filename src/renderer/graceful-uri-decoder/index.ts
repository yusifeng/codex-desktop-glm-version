import * as RuntimeChunk from "@rchunk/rolldown-runtime";

void RuntimeChunk;

function gracefulDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return value;
  }
}

function initializeGracefulUriDecoder(): void {}

export { initializeGracefulUriDecoder as n, gracefulDecodeURIComponent as t };
