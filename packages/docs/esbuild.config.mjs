import { node } from '@ocrjs/config-esbuild';
import { build } from "esbuild";

const config = {
  ...node,
  entryPoints: ['src/cli/index.ts','src/typedoc/typedoc-uml-lite/index.ts'],
  outdir: 'dist',
  // TypeDoc plugins should not bundle TypeDoc itself or its dependencies
  external: ['typedoc', 'typescript'],
  format: 'cjs',
};

await build(config)
