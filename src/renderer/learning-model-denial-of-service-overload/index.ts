// Denial-of-service overload manifest. Release chunk: type-1f93f10ec695.js.
import "@rchunk/rolldown-runtime";

const denialOfServiceOverloadSpecification = {
  type: "DENIAL_OF_SERVICE_OVERLOAD",
  version: 3,
  thumbnailAssetKey: "denial-of-service-overload-v1",
  parameters: {
    server_capacity: { kind: "integer" as const, defaultValue: 120, min: 100, max: 300 },
    legitimate_request_rate: { kind: "integer" as const, defaultValue: 40, min: 10, max: 80 },
  },
};

function initializeDenialOfServiceOverloadSpecification(): void {}

export { denialOfServiceOverloadSpecification as n, initializeDenialOfServiceOverloadSpecification as t };
