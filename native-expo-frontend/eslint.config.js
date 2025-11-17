// https://docs.expo.dev/guides/using-eslint/
import { defineConfig } from 'eslint/config';
import expoConfig from 'eslint-config-expo/flat.js';
import reactNativePlugin from 'eslint-plugin-react-native';

export default defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
    plugins: {
      'react-native': reactNativePlugin,
    },
    rules: {
      'react-native/no-inline-styles': 'warn',
      'react-native/no-raw-text': 'error',
    },
  },
]);

