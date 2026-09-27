import {
  n as ensurePopcornSpreadsheetFontsLoadedExport,
  r as initializePortableThumbnailFonts,
  t as arePopcornSpreadsheetFontsReadyExport,
} from "@rchunk/portable-thumbnail-font-runtime";

initializePortableThumbnailFonts();
const ensurePopcornSpreadsheetFontsLoaded =
  ensurePopcornSpreadsheetFontsLoadedExport;
const arePopcornSpreadsheetFontsReady = arePopcornSpreadsheetFontsReadyExport;
export { arePopcornSpreadsheetFontsReady, ensurePopcornSpreadsheetFontsLoaded };
