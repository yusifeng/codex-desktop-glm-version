// Hash chaining and tamper propagation through a four-block blockchain.
import "@rchunk/rolldown-runtime";

type ChainState = "original" | "tamper_block_1" | "tamper_block_2" | "tamper_block_3";
interface BlockchainValues { chainState?: unknown }

const blockchainHashChainType = "BLOCKCHAIN_HASH_CHAIN";
const blockchainHashChainThumbnail = "blockchain-hash-chain-v1";
const blockchainHashChainParameters = { chainState: { kind: "enum" as const, defaultValue: "original" as ChainState, allowedValues: ["original", "tamper_block_1", "tamper_block_2", "tamper_block_3"] as ChainState[] } };
const blockchainHashChainSpecification = { type: blockchainHashChainType, version: 2, thumbnailAssetKey: blockchainHashChainThumbnail, parameters: blockchainHashChainParameters };
const defaultChainState = blockchainHashChainSpecification.parameters.chainState.defaultValue;
const chainStates = blockchainHashChainSpecification.parameters.chainState.allowedValues;
const genesisPreviousHash = "00000000";
const originalPayloads = ["GENESIS", "ALICE>BOB:4", "BOB>CHEN:2", "CHEN>DANA:1"];
const tamperedPayloads = ["GENESIS", "ALICE>BOB:8", "BOB>CHEN:9", "CHEN>DANA:6"];
const tamperedIndexes: Record<ChainState, number> = { original: -1, tamper_block_1: 1, tamper_block_2: 2, tamper_block_3: 3 };
const isChainState = (value: unknown): value is ChainState => chainStates.some((state) => state === value);
const normalizeBlockchainValues = (values: BlockchainValues) => ({ chainState: isChainState(values.chainState) ? values.chainState : defaultChainState });
const tamperedIndexForState = (state: ChainState): number => tamperedIndexes[state];
const chainStateForTamperedIndex = (index: number): ChainState => chainStates.find((state) => tamperedIndexForState(state) === index) ?? defaultChainState;
const fnv1aHash = (value: string): string => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) { hash ^= value.charCodeAt(index); hash = Math.imul(hash, 16777619); }
  return (hash >>> 0).toString(16).padStart(8, "0");
};
const blockHash = (index: number, payload: string, previousHash: string): string => fnv1aHash(`${index}|${payload}|${previousHash}`);
const canonicalChain = (() => {
  let previousHash = genesisPreviousHash;
  return originalPayloads.map((payload, index) => { const hash = blockHash(index, payload, previousHash); const block = { index, payload, previousHash, hash }; previousHash = hash; return block; });
})();
const calculateBlockchain = (values: BlockchainValues) => {
  const { chainState } = normalizeBlockchainValues(values);
  const tamperedIndex = tamperedIndexForState(chainState);
  let calculatedPreviousHash = genesisPreviousHash;
  return canonicalChain.map((block) => {
    const isTampered = block.index === tamperedIndex;
    const payload = isTampered ? tamperedPayloads[block.index] : block.payload;
    const calculatedHash = blockHash(block.index, payload, calculatedPreviousHash);
    const previousHashMatches = block.previousHash === calculatedPreviousHash;
    const blockHashMatches = block.hash === calculatedHash;
    const result = { index: block.index, originalPayload: block.payload, payload, storedPreviousHash: block.previousHash, originalHash: block.hash, calculatedPreviousHash, calculatedHash, isTampered, previousHashMatches, blockHashMatches, isValid: previousHashMatches && blockHashMatches };
    calculatedPreviousHash = calculatedHash;
    return result;
  });
};
const firstInvalidBlockIndex = (blocks: ReturnType<typeof calculateBlockchain>): number => blocks.find((block) => !block.isValid)?.index ?? -1;

function initializeBlockchainHashChainSpecification(): void {}
function initializeBlockchainHashChainModel(): void {}

export { firstInvalidBlockIndex as a, normalizeBlockchainValues as c, chainStateForTamperedIndex as i, initializeBlockchainHashChainSpecification as l, defaultChainState as n, tamperedIndexForState as o, calculateBlockchain as r, initializeBlockchainHashChainModel as s, chainStates as t, blockchainHashChainSpecification as u };
