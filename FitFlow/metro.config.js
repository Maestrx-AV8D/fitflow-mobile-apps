// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 1) Preserve your custom extensions (incl. ts/tsx/cjs)
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'ts',
  'tsx',
  'cjs',
];

// 2) Tell Metro to look at module/main if react-native export is missing
config.resolver.exportFields = [
  'react-native',
  'module',
  'main',
];

module.exports = config;