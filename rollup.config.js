import dts from 'rollup-plugin-dts'
import esbuild from 'rollup-plugin-esbuild'

const bundle = config => ({
  ...config,
  input: 'src/index.ts',
  external: id => !/^[./]/.test(id),
})

export default [
  bundle({
    plugins: [esbuild()],
    output: [
      {
        file: 'dist/cjs/cwl-link.cjs',
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: 'dist/mjs/cwl-link.mjs',
        format: 'es',
        sourcemap: true,
      },
    ],
  }),
  bundle({
    plugins: [dts()],
    output: {
      file: 'dist/dts/cwl-link.d.ts',
      format: 'es',
    },
  }),
]
