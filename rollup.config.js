// see https://github.com/rozek/build-configuration-study

import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser'

export default {
  input: './src/syncableStore.ts',
  output: [
    {
      file:     './dist/syncableStore.js',
      format:    'umd', // builds for both Node.js and Browser
      name:      'syncableStore', // required for UMD modules
      noConflict:true,
      sourcemap: true,
      plugins: [terser({ format:{ comments:false, safari10:true } })],
    },{
      file:     './dist/syncableStore.esm.js',
      format:   'esm',
      sourcemap:true,
    }
  ],
  plugins: [
    typescript(),
  ],
};