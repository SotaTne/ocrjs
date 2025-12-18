import type { BuildOptions } from 'esbuild';
import { shared } from './base';

export const browser: BuildOptions = {
  ...shared,
  platform: 'browser',
};
