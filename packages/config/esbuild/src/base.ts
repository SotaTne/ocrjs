import type { BuildOptions } from 'esbuild';

export const shared: BuildOptions = {
  sourcemap: true,
  minify: false,
  bundle: true,
  target: 'esnext',
  platform: 'neutral',
  format: 'esm',
};
