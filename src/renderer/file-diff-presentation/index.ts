import "@rchunk/app-shared";
import {
  n as initializeFileDiffPresentation,
  t as FileDiffPresentation,
} from "@rchunk/file-diff-presentation-core";
import "@rchunk/register-pierre-themes";

initializeFileDiffPresentation();

export { FileDiffPresentation };
