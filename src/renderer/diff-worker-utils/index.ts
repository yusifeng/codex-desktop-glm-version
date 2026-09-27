import {
  n as parserExport,
  t as initializeParser,
} from "@rchunk/diff-worker-utils-parser";
initializeParser();
const parser = parserExport;
export { parser };
