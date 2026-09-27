import {
  n as parserExport,
  t as initializeParser,
} from "@rchunk/diff-worker-renderer-parser";
initializeParser();
const parser = parserExport;
export { parser };
