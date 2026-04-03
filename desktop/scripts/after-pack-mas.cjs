const { spawnSync, execSync } = require("node:child_process");
const path = require("node:path");

module.exports = async function afterPack(context) {
  const appPath = path.join(
    context.appOutDir,
    `${context.packager.appInfo.productFilename}.app`,
  );
  const infoPlist = path.join(appPath, "Contents", "Info.plist");

  // Inject NODE_OPTIONS=--jitless into LSEnvironment so V8 starts in
  // interpreter-only mode BEFORE any JavaScript runs. This is required
  // because macOS 26+ enforces strict W^X in the App Store sandbox,
  // blocking all V8 JIT compilation. The app.commandLine.appendSwitch
  // approach in main.ts only affects child processes — the main process
  // V8 is already initialized by the time that code executes.
  try {
    execSync(
      `/usr/libexec/PlistBuddy -c "Add :LSEnvironment:NODE_OPTIONS string '--jitless'" "${infoPlist}"`,
      { stdio: "inherit" }
    );
    console.log(`  • after-pack: injected NODE_OPTIONS=--jitless into LSEnvironment`);
  } catch {
    // Key may already exist from electron-builder defaults
    execSync(
      `/usr/libexec/PlistBuddy -c "Set :LSEnvironment:NODE_OPTIONS '--jitless'" "${infoPlist}"`,
      { stdio: "inherit" }
    );
    console.log(`  • after-pack: updated NODE_OPTIONS=--jitless in LSEnvironment`);
  }

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
