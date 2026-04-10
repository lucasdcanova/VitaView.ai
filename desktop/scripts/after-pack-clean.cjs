const { spawnSync } = require("node:child_process");
const path = require("node:path");

module.exports = async function afterPack(context) {
  const appPath = path.join(
    context.appOutDir,
    `${context.packager.appInfo.productFilename}.app`,
  );

  // Remove AppleDouble/resource fork files that break codesign
  spawnSync("dot_clean", ["-m", appPath], { stdio: "inherit" });
  spawnSync("xattr", ["-cr", appPath], { stdio: "inherit" });
  spawnSync("chmod", ["-R", "a+r", appPath], { stdio: "inherit" });

  console.log(`  • after-pack: cleared xattrs and resource forks for ${appPath}`);
};
