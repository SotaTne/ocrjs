import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadProject } from './loadProject.js';

const cleanups: Array<() => void> = [];

afterEach(() => {
  while (cleanups.length > 0) {
    cleanups.pop()?.();
  }
});

describe('e2e/typedoc/helpers/loadProject', () => {
  it('fixture project を TypeDoc Application で convert できる', async () => {
    const loaded = await loadProject({
      fixtureName: 'project1',
      emit: 'none',
    });
    cleanups.push(loaded.cleanup);

    expect(loaded.project).toBeDefined();
    expect(fs.existsSync(path.join(loaded.fixtureDir, 'tsconfig.json'))).toBe(
      true,
    );
    expect(loaded.outDir.endsWith('/out')).toBe(true);
  });
});
