const { spawnSync } = require("node:child_process");
const path = require("node:path");

module.exports = async function afterPack(context) {
  const appPath = path.join(
    context.appOutDir,
    `${context.packager.appInfo.productFilename}.app`,
  );

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
