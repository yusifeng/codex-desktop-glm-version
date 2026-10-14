type BinaryPreviewUrlDependencies = {
  createObjectUrl(bytes: Uint8Array, mimeType: string): string;
  revokeObjectUrl(url: string): void;
};

/** Owns the object URL used by binary preview surfaces and revokes every superseded generation. */
export function createBinaryPreviewUrlController(dependencies: BinaryPreviewUrlDependencies) {
  let generation = 0;
  let activeUrl: string | null = null;

  const clear = () => {
    generation += 1;
    if (activeUrl != null) dependencies.revokeObjectUrl(activeUrl);
    activeUrl = null;
  };
  const update = (content: unknown, mimeType: string, publish: (url: string | null) => void) => {
    clear();
    const currentGeneration = generation;
    if (!(content instanceof Uint8Array)) {
      publish(null);
      return () => {};
    }
    const url = dependencies.createObjectUrl(content, mimeType);
    if (currentGeneration !== generation) {
      dependencies.revokeObjectUrl(url);
      return () => {};
    }
    activeUrl = url;
    publish(url);
    return () => {
      if (currentGeneration !== generation) return;
      clear();
      publish(null);
    };
  };
  return { clear, update };
}
