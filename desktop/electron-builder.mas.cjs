const baseConfig = require("./package.json").build;

module.exports = {
  ...baseConfig,
  appId: "br.com.lucascanova.vitaview",
  directories: {
    ...baseConfig.directories,
    output: "release-mas",
  },
  mac: {
    ...baseConfig.mac,
    identity: "Lucas Canova (9D7X84MT44)",
    icon: "../ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png",
    sign: "./scripts/sign-mas.cjs",
    timestamp: "none",
    target: [
      {
        target: "mas",
        arch: ["arm64"],
      },
    ],
    bundleShortVersion: "1.0",
    bundleVersion: "1",
  },
  mas: {
    ...(baseConfig.mas || {}),
    identity: "Lucas Canova (9D7X84MT44)",
    entitlements: "build/entitlements.mas.plist",
    entitlementsInherit: "build/entitlements.mas.inherit.plist",
    sign: "./scripts/sign-mas.cjs",
    timestamp: "none",
    type: "distribution",
    bundleShortVersion: "1.0",
    bundleVersion: "1",
  },
  afterPack: "./scripts/after-pack-mas.cjs",
};
