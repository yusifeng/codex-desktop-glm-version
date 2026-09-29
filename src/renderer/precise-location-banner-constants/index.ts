import "@rchunk/rolldown-runtime";

let preciseLocationBannerBeacon: string;
let initialized = false;

function initializePreciseLocationBannerConstants(): void {
  if (initialized) return;
  initialized = true;
  preciseLocationBannerBeacon = "precise_location_banner_beacon";
}

export { initializePreciseLocationBannerConstants as n, preciseLocationBannerBeacon as t };
