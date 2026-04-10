const { spawnSync, execSync } = require("node:child_process");
const path = require("node:path");

module.exports = async function afterPack(context) {
  const appPath = path.join(
    context.appOutDir,
    `${context.packager.appInfo.productFilename}.app`,
  );
  const infoPlist = path.join(appPath, "Contents", "Info.plist");

  // Note: --jitless was previously injected here via LSEnvironment.
  // Removed because it crashes V8 initialization on Electron 41 + ARM64
  // (EXC_BREAKPOINT in v8::Isolate::Initialize). The allow-jit entitlement
  // in entitlements.mas.plist handles the MAS sandbox W^X requirement.

  // Remove AppleDouble/resource fork files (._files)
  spawnSync("dot_clean", ["-m", appPath], { stdio: "inherit" });

  // Clear ALL extended attributes recursively
  spawnSync("xattr", ["-cr", appPath], { stdio: "inherit" });

  // Also clear xattrs on the appOutDir in case there are loose files
  spawnSync("xattr", ["-cr", context.appOutDir], { stdio: "inherit" });

  // Fix permissions
  spawnSync("chmod", ["-R", "a+r", appPath], { stdio: "inherit" });

  console.log(`  • after-pack: cleared xattrs and resource forks for ${appPath}`);
};
