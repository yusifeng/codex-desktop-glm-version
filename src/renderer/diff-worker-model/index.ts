import {
  n as parserExport,
  t as initializeParser,
} from "@rchunk/diff-worker-model-parser";
initializeParser();
const parser = parserExport;
export { parser };
