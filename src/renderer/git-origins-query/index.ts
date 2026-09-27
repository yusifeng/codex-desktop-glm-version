import {
  CSt as initializeGitOriginsQuery,
  SSt as gitOriginsQuery,
} from "@rchunk/app-initial";

initializeGitOriginsQuery();

export { gitOriginsQuery as gitOriginsQuery$ };
