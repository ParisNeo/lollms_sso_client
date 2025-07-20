import { terser } from '@rollup/plugin-terser';

export default {
  input: 'lollms_sso_client.js',
  output: [
    {
      file: 'dist/lollms_sso_client.esm.js',
      format: 'esm'
    },
    {
      file: 'dist/lollms_sso_client.umd.js',
      format: 'umd',
      name: 'LollmsSSOClient'
    },
    {
      file: 'dist/lollms_sso_client.min.js',
      format: 'umd',
      name: 'LollmsSSOClient',
      plugins: [terser()]
    }
  ]
};