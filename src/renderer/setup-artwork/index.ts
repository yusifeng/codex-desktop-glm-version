import "@rchunk/rolldown-runtime";

let setupArtworkUrl: string;
function initializeSetupArtwork(): void {
  setupArtworkUrl = new URL("setup-artwork-8805a57043b0.png", import.meta.url)
    .href;
}
export { setupArtworkUrl as n, initializeSetupArtwork as t };
