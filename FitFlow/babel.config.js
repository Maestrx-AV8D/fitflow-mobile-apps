// babel.config.js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // other plugins can go here
      'react-native-reanimated/plugin',
    ],
  };
};