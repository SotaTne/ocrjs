import type { BuildOptions } from 'esbuild';
import { shared } from './base';

export const node: BuildOptions = {
  ...shared,
  platform: 'node',
  format: 'cjs',
};
