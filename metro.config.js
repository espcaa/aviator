const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Modify the config for SVG support
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer/expo"),
};

config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts.filter((ext) => ext !== "svg"),
  sourceExts: [...config.resolver.sourceExts, "svg"],
};

// Apply NativeWind configuration
module.exports = withNativeWind(config, { input: "./global.css" });
