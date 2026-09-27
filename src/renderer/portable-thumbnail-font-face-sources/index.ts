import {
  i as installPopcornFontFacesExport,
  n as getPopcornFontDebugStateExport,
  r as initializeFontFaceSources,
  t as getPopcornCarlitoFontFaceSourcesFromDocumentExport,
} from "@rchunk/portable-thumbnail-font-face-source-runtime";

initializeFontFaceSources();
const installPopcornFontFaces = installPopcornFontFacesExport;
const getPopcornFontDebugState = getPopcornFontDebugStateExport;
const getPopcornCarlitoFontFaceSourcesFromDocument =
  getPopcornCarlitoFontFaceSourcesFromDocumentExport;
export {
  getPopcornCarlitoFontFaceSourcesFromDocument,
  getPopcornFontDebugState,
  installPopcornFontFaces,
};
