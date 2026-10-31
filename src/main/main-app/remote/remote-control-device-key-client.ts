// @ts-nocheck

/** Owns native remote-control device keys and canonical signed-payload validation. */
export function createRemoteControlDeviceKeyClientClass(dependencies: Record<string, any>) {
  const { createRequire, moduleFilename, pathJoin, BufferClass = Buffer } = dependencies;
  const loadNativeAddon = createRequire(moduleFilename);
  const addonName = `remote-control-device-key.node`;
  const signatureDomain = `codex-device-key-sign-payload/v1`;
  const base64UrlPattern = /^[A-Za-z0-9_-]+$/u;

  function validateNonce(value) {
    if (!base64UrlPattern.test(value) || BufferClass.from(value, `base64url`).length < 32)
      throw Error(`Invalid remote-control device-key nonce`);
  }

  function validateDigest(value) {
    if (!base64UrlPattern.test(value) || BufferClass.from(value, `base64url`).length !== 32)
      throw Error(`Invalid remote-control device-key SHA-256 digest`);
  }

  function canonicalPayload(payload) {
    switch (payload.type) {
      case `remoteControlClientConnection`:
        if ((validateNonce(payload.nonce), payload.audience !== `remote_control_client_websocket`))
          throw Error(`Invalid remote-control device-key connection audience`);
        if (
          payload.scopes.length !== 1 ||
          payload.scopes[0] !== `remote_control_controller_websocket`
        )
          throw Error(`Invalid remote-control device-key connection scopes`);
        return (
          validateDigest(payload.tokenSha256Base64url),
          {
            accountUserId: payload.accountUserId,
            audience: payload.audience,
            clientId: payload.clientId,
            nonce: payload.nonce,
            scopes: payload.scopes,
            sessionId: payload.sessionId,
            targetOrigin: payload.targetOrigin,
            targetPath: payload.targetPath,
            tokenExpiresAt: payload.tokenExpiresAt,
            tokenSha256Base64url: payload.tokenSha256Base64url,
            type: payload.type,
          }
        );
      case `remoteControlClientEnrollment`:
        if ((validateNonce(payload.nonce), payload.audience !== `remote_control_client_enrollment`))
          throw Error(`Invalid remote-control device-key enrollment audience`);
        return (
          validateDigest(payload.deviceIdentitySha256Base64url),
          {
            accountUserId: payload.accountUserId,
            audience: payload.audience,
            challengeExpiresAt: payload.challengeExpiresAt,
            challengeId: payload.challengeId,
            clientId: payload.clientId,
            deviceIdentitySha256Base64url: payload.deviceIdentitySha256Base64url,
            nonce: payload.nonce,
            targetOrigin: payload.targetOrigin,
            targetPath: payload.targetPath,
            type: payload.type,
          }
        );
    }
  }

  function encodeSignedPayload(payload) {
    return BufferClass.from(
      JSON.stringify({ domain: signatureDomain, payload: canonicalPayload(payload) }),
      `utf8`,
    );
  }

  return class RemoteControlDeviceKeyClient {
    resourcesPath;
    addon = null;
    constructor(resourcesPath) {
      this.resourcesPath = resourcesPath;
    }
    createDeviceKey(storage) {
      return this.getAddon().createDeviceKey(storage ?? `hardware_only`);
    }
    deleteDeviceKey(keyId) {
      return this.getAddon().deleteDeviceKey(keyId);
    }
    getDeviceKeyPublic(keyId) {
      return this.getAddon().getDeviceKeyPublic(keyId);
    }
    async signDeviceKey(keyId, payload) {
      let encoded = encodeSignedPayload(payload);
      return {
        ...(await this.getAddon().signDeviceKey(keyId, encoded)),
        signedPayloadBase64: encoded.toString(`base64`),
      };
    }
    getAddon() {
      if (this.resourcesPath == null)
        throw Error(`Remote control device keys require resourcesPath`);
      return (
        (this.addon ??= loadNativeAddon(pathJoin(this.resourcesPath, `native`, addonName))),
        this.addon
      );
    }
  };
}

if (typeof module !== "undefined") {
  module.exports = { createRemoteControlDeviceKeyClientClass };
}
