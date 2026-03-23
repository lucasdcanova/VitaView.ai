const { spawnSync } = require("node:child_process");
const path = require("node:path");

module.exports = async function afterPack(context) {
  const appPath = path.join(
    context.appOutDir,
    `${context.packager.appInfo.productFilename}.app`,
  );

  const result = spawnSync("xattr", ["-cr", appPath], { stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`Failed to clear extended attributes for ${appPath}`);
  }
};
