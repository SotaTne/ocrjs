import { shared } from '@ocrjs/config-esbuild';
import { build } from "esbuild";

const config = {
  ...shared,
  entryPoints: ['src/index.ts'],
  outdir: 'dist',
};

await build(config)
