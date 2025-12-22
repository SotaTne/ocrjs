import { shared } from '@ocrjs/config-esbuild';
import { build } from "esbuild";

const config = {
  ...shared,
  entryPoints: ['scripts/cli.ts'],
  outdir: 'dist',
};

await build(config)
