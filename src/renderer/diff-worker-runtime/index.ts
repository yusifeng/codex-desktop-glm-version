import {
  n as parserExport,
  t as initializeParser,
} from "@rchunk/diff-worker-runtime-parser";
initializeParser();
const parser = parserExport;
export { parser };
