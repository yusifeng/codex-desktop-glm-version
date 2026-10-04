type WebMcpDescriptorSchema = {
  safeParse(value: unknown): { success: true; data: unknown } | { success: false };
};

type WebMcpDescriptorSerializerOptions = {
  descriptorForPageSchema: WebMcpDescriptorSchema;
  maxTools: number;
  maxTotalDescriptorBytes: number;
};

function descriptorByteSize(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}

function createWebMcpDescriptorSerializer(options: WebMcpDescriptorSerializerOptions) {
  const serializeDescriptors = (value: unknown[]): unknown[] | null => {
    if (value.length === 0 || value.length > options.maxTools) return value.length === 0 ? [] : null;
    const parsed = options.descriptorForPageSchema.safeParse(value);
    if (!parsed.success) return null;
    let bytes: number;
    try {
      bytes = descriptorByteSize(parsed.data);
    } catch {
      return null;
    }
    return bytes <= options.maxTotalDescriptorBytes ? (parsed.data as unknown[]) : null;
  };

  const collectDescriptors = (value: unknown[]): unknown[] => {
    if (value.length > options.maxTools) return [];
    return (
      serializeDescriptors(
        value.map((descriptor: any) => ({
          ...descriptor,
          inputSchema: descriptor.inputSchema == null ? null : JSON.parse(descriptor.inputSchema),
        })),
      ) ?? []
    );
  };

  return { serializeDescriptors, collectDescriptors };
}

export { createWebMcpDescriptorSerializer, descriptorByteSize };
if (typeof module !== `undefined`) module.exports = { createWebMcpDescriptorSerializer, descriptorByteSize };
