// Packet delivery, loss, retransmission, and timing for TCP versus UDP.
import "@rchunk/rolldown-runtime";

type NetworkProtocol = "tcp" | "udp";
type PacketLossMode = "none" | "drop_packet_3";
interface TcpUdpValues { protocol?: unknown; lossMode?: unknown }

const tcpVsUdpType = "TCP_VS_UDP";
const tcpVsUdpThumbnail = "tcp-vs-udp-v1";
const tcpVsUdpParameters = {
  protocol: { kind: "enum" as const, defaultValue: "tcp" as NetworkProtocol, allowedValues: ["tcp", "udp"] as NetworkProtocol[] },
  lossMode: { kind: "enum" as const, defaultValue: "drop_packet_3" as PacketLossMode, allowedValues: ["none", "drop_packet_3"] as PacketLossMode[] },
};
const tcpVsUdpSpecification = { type: tcpVsUdpType, version: 2, thumbnailAssetKey: tcpVsUdpThumbnail, parameters: tcpVsUdpParameters };
const packetIds = [1, 2, 3, 4, 5];
const protocols = tcpVsUdpSpecification.parameters.protocol.allowedValues;
const lossModes = tcpVsUdpSpecification.parameters.lossMode.allowedValues;
const defaultTcpUdpValues = { protocol: tcpVsUdpSpecification.parameters.protocol.defaultValue, lossMode: tcpVsUdpSpecification.parameters.lossMode.defaultValue };
const isProtocol = (value: unknown): value is NetworkProtocol => protocols.some((protocol) => protocol === value);
const isLossMode = (value: unknown): value is PacketLossMode => lossModes.some((lossMode) => lossMode === value);
const normalizeTcpUdpValues = (values: TcpUdpValues) => ({ protocol: isProtocol(values.protocol) ? values.protocol : defaultTcpUdpValues.protocol, lossMode: isLossMode(values.lossMode) ? values.lossMode : defaultTcpUdpValues.lossMode });
const packetDelivery = (values: TcpUdpValues) => {
  const normalized = normalizeTcpUdpValues(values);
  const packetIsDropped = normalized.lossMode === "drop_packet_3";
  const retransmits = packetIsDropped && normalized.protocol === "tcp";
  return {
    deliveredPacketIds: !packetIsDropped || retransmits ? packetIds : packetIds.filter((packetId) => packetId !== 3),
    missingPacketIds: packetIsDropped && !retransmits ? [3] : [],
    retransmittedPacketIds: retransmits ? [3] : [],
    usesAcknowledgments: normalized.protocol === "tcp",
    establishesConnection: normalized.protocol === "tcp",
  };
};
const transferDuration = (values: TcpUdpValues): number => {
  const normalized = normalizeTcpUdpValues(values);
  return normalized.protocol === "tcp" ? normalized.lossMode === "drop_packet_3" ? 5700 : 4300 : 3400;
};
const clampUnit = (value: number): number => Math.min(1, Math.max(0, value));
const normalizedTimelineProgress = (time: number, start: number, duration: number): number => clampUnit((time - start) / duration);
const packetTimelineStart = (protocol: NetworkProtocol, packetId: number): number => (protocol === "tcp" ? 850 : 300) + (packetId - 1) * 430;
const udpCompletionTime = (): number => 3650;

function initializeTcpVsUdpSpecification(): void {}
function initializeTcpVsUdpModel(): void {}

export { packetTimelineStart as a, transferDuration as c, normalizeTcpUdpValues as d, initializeTcpVsUdpSpecification as f, protocols as i, packetDelivery as l, lossModes as n, normalizedTimelineProgress as o, tcpVsUdpSpecification as p, packetIds as r, udpCompletionTime as s, defaultTcpUdpValues as t, initializeTcpVsUdpModel as u };
