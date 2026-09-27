import {
  n as parserExport,
  t as initializeParser,
} from "@rchunk/diff-worker-algorithm-parser";
initializeParser();
const parser = parserExport;
export { parser };
