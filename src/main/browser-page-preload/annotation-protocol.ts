function createAnnotationProtocol({ object, string, unknown, number, boolean, enumValues, metadataLimits }: {
  object: (shape: Record<string, unknown>) => any;
  string: () => any;
  unknown: () => any;
  number: () => any;
  boolean: () => any;
  enumValues: (values: string[]) => any;
  metadataLimits: unknown;
}) {
  const channels = createAnnotationProtocolChannels(metadataLimits);
  const id = string().min(1).max(channels.maxIdLength);
  const role = string().max(channels.maxRoleLength).regex(new RegExp(channels.rolePattern));
  const hit = object({
    id,
    name: string().optional(),
    role: string().optional(),
    metadata: string().optional(),
    rect: object({
      x: number(), y: number(), width: number().positive(), height: number().positive(),
    }).optional(),
  });
  const response = object({
    type: enumValues(annotationSurfaceResponseTypes()),
    registrationId: id,
    requestId: string().max(channels.maxIdLength).optional(),
    customRendering: boolean().optional(),
    hit: hit.nullable().optional(),
  });
  return { channels, id, role, hit, response };
}

export { createAnnotationProtocol };
if (typeof module !== `undefined`) module.exports = { createAnnotationProtocol };
import { createAnnotationProtocolChannels } from "./annotation-protocol-channels";
import { annotationSurfaceResponseTypes } from "./annotation-protocol-response-policy";
