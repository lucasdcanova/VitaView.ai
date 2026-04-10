const { spawnSync, execSync } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const { signAsync } = require("@electron/osx-sign");

const SIGN_IDENTITY = "3rd Party Mac Developer Application: Lucas Canova (9D7X84MT44)";
const ENTITLEMENTS_APP = path.resolve(__dirname, "../build/entitlements.mas.plist");
const ENTITLEMENTS_CHILD = path.resolve(__dirname, "../build/entitlements.mas.inherit.plist");
const PROVISIONING_PROFILE = path.resolve(__dirname, "../build/embedded.provisionprofile");

/**
 * Strip ALL extended attributes, resource forks, and AppleDouble files from the
 * app bundle. codesign refuses to sign binaries that carry "detritus".
 */
function cleanDetritus(appPath) {
  spawnSync("dot_clean", ["-m", appPath], { stdio: "inherit" });
  try {
    execSync(`find "${appPath}" -name "._*" -delete 2>/dev/null`, { stdio: "inherit" });
  } catch { /* ignore */ }
  spawnSync("xattr", ["-cr", appPath], { stdio: "inherit" });
}

module.exports = async function signMas(opts) {
  if (opts.platform !== "mas") {
    console.log(`  • skipping custom sign for platform=${opts.platform} (waiting for MAS call)`);
    return;
  }

  // 1. First detritus pass
  cleanDetritus(opts.app);

  // 2. Remove existing code signatures from ALL binaries.
  //    Electron binaries ship pre-signed and must be stripped before MAS re-signing.
  try {
    const binaries = execSync(
      `find "${opts.app}" -type f -perm +111 -exec file {} \\; | grep "Mach-O" | cut -d: -f1`,
      { encoding: "utf-8" }
    ).trim().split("\n").filter(Boolean);

    for (const bin of binaries) {
      spawnSync("codesign", ["--remove-signature", bin], { stdio: "inherit" });
    }
    console.log(`  • removed existing signatures from ${binaries.length} binaries`);
  } catch (e) {
    console.warn("  • warning: could not strip signatures:", e.message);
  }

  // 3. Also deep-remove signatures from nested .app bundles
  try {
    const nestedApps = execSync(
      `find "${opts.app}" -name "*.app" -not -path "${opts.app}" -type d`,
      { encoding: "utf-8" }
    ).trim().split("\n").filter(Boolean);

    for (const nested of nestedApps) {
      spawnSync("codesign", ["--remove-signature", "--deep", nested], { stdio: "inherit" });
    }
  } catch { /* ignore */ }

  // 4. Second detritus pass (codesign --remove-signature can leave xattrs)
  cleanDetritus(opts.app);

  // 5. Embed provisioning profile
  const destProfile = path.join(opts.app, "Contents", "embedded.provisionprofile");
  if (fs.existsSync(PROVISIONING_PROFILE)) {
    fs.copyFileSync(PROVISIONING_PROFILE, destProfile);
    console.log(`  • embedded provisioning profile into ${opts.app}`);
  }

  // 6. Fix file permissions
  spawnSync("chmod", ["-R", "a+r", opts.app], { stdio: "inherit" });

  // 7. Final detritus pass right before signing — nothing touches the bundle after this
  cleanDetritus(opts.app);

  await signAsync({
    app: opts.app,
    platform: "mas",
    type: "distribution",
    entitlements: ENTITLEMENTS_APP,
    entitlementsInherit: ENTITLEMENTS_CHILD,
    entitlementsLoginHelper: ENTITLEMENTS_CHILD,
    identity: SIGN_IDENTITY,
    provisioningProfile: PROVISIONING_PROFILE,
    preAutoEntitlements: false,
  });

  // Re-sign the main binary to ensure allow-jit and disable-library-validation
  // are present. @electron/osx-sign may strip entitlements not explicitly listed
  // in the provisioning profile, but codesign accepts them for MAS builds when
  // the matching capability is enabled on the App ID.
  const mainBinary = path.join(opts.app, "Contents", "MacOS", "VitaView");
  if (fs.existsSync(mainBinary)) {
    spawnSync("codesign", [
      "--force", "--sign", SIGN_IDENTITY,
      "--entitlements", ENTITLEMENTS_APP,
      mainBinary,
    ], { stdio: "inherit" });
    // Re-sign the app bundle to update the seal after touching the main binary
    spawnSync("codesign", [
      "--force", "--sign", SIGN_IDENTITY,
      "--entitlements", ENTITLEMENTS_APP,
      opts.app,
    ], { stdio: "inherit" });
    console.log(`  • re-signed main binary with allow-jit entitlement`);
  }

  console.log(`  • MAS signing complete for ${opts.app}`);
};
