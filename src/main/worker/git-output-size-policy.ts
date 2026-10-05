const encoder = new TextEncoder();
function utf8ByteLength(value: string): number { return encoder.encode(value).byteLength; }
export { utf8ByteLength };
if (typeof module !== `undefined`) module.exports = { utf8ByteLength };
