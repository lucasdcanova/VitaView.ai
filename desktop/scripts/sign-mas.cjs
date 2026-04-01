const { spawnSync, execSync } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const { signAsync } = require("@electron/osx-sign");

const SIGN_IDENTITY = "3rd Party Mac Developer Application: Lucas Canova (9D7X84MT44)";
const ENTITLEMENTS_APP = path.resolve(__dirname, "../build/entitlements.mas.plist");
const ENTITLEMENTS_CHILD = path.resolve(__dirname, "../build/entitlements.mas.inherit.plist");
const PROVISIONING_PROFILE = path.resolve(__dirname, "../build/embedded.provisionprofile");

module.exports = async function signMas(opts) {
  if (opts.platform !== "mas") {
    console.log(`  • skipping custom sign for platform=${opts.platform} (waiting for MAS call)`);
    return;
  }

  // Remove ALL extended attributes recursively
  spawnSync("xattr", ["-cr", opts.app], { stdio: "inherit" });

  // Remove existing code signatures from ALL binaries to avoid
  // "resource fork, Finder information, or similar detritus" codesign errors.
  // Electron binaries ship pre-signed and must be stripped before MAS re-signing.
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

  // Clear xattrs again after signature removal
  spawnSync("xattr", ["-cr", opts.app], { stdio: "inherit" });

  // Embed provisioning profile
  const destProfile = path.join(opts.app, "Contents", "embedded.provisionprofile");
  if (fs.existsSync(PROVISIONING_PROFILE)) {
    fs.copyFileSync(PROVISIONING_PROFILE, destProfile);
    console.log(`  • embedded provisioning profile into ${opts.app}`);
  }

  // Fix file permissions
  spawnSync("chmod", ["-R", "a+r", opts.app], { stdio: "inherit" });

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

  console.log(`  • MAS signing complete for ${opts.app}`);
};
