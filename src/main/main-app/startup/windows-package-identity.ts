/** Windows package identity used for tray/update integration. */
export function resolveWindowsPackageIdentity(flavor: string, values: {
  Agent: string;
  Dev: string;
  Nightly: string;
  InternalAlpha: string;
  PublicBeta: string;
  Prod: string;
}): string | undefined {
  switch (flavor) {
    case values.Agent:
    case values.Dev:
      return undefined;
    case values.Nightly:
      return "c4c933ff-16f4-47c7-a231-29e6bb84dccc";
    case values.InternalAlpha:
      return "c4607cac-3138-48bd-8b2a-5bc99d08e393";
    case values.PublicBeta:
      return "758400cf-36c7-43be-9335-6354d603be3a";
    case values.Prod:
      return "e5768d8b-6936-4f45-b1ad-4c5fb414cb35";
    default:
      return undefined;
  }
}

export { resolveWindowsPackageIdentity as getWindowsPackageIdentity };
if (typeof module !== "undefined") module.exports = { getWindowsPackageIdentity: resolveWindowsPackageIdentity, resolveWindowsPackageIdentity };
