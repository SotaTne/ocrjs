import type { BuildOptions } from 'esbuild';

export const shared: BuildOptions = {
  sourcemap: true,
  bundle: true,
  minify: false,
  target: 'esnext',
  platform: 'neutral',
  format: 'esm',
  packages: 'external',
};
