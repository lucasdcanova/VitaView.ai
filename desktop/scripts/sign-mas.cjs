const { spawnSync } = require("node:child_process");
const path = require("node:path");
const { sign } = require("@electron/osx-sign");

const SIGN_IDENTITY = "Apple Distribution: Lucas Canova (9D7X84MT44)";
const ENTITLEMENTS_APP = path.resolve(__dirname, "../build/entitlements.mas.plist");
const ENTITLEMENTS_CHILD = path.resolve(__dirname, "../build/entitlements.mas.inherit.plist");

module.exports = async function signMas(opts) {
  const clearAttrs = spawnSync("xattr", ["-cr", opts.app], { stdio: "inherit" });
  if (clearAttrs.status !== 0) {
    throw new Error(`Failed to clear extended attributes for ${opts.app}`);
  }

  return sign({
    ...opts,
    entitlements: ENTITLEMENTS_APP,
    entitlementsInherit: ENTITLEMENTS_CHILD,
    entitlementsLoginHelper: ENTITLEMENTS_APP,
    identity: SIGN_IDENTITY,
    preAutoEntitlements: false,
    timestamp: "none",
  });
};
