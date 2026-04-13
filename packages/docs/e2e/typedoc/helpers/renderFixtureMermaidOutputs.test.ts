import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { renderFixtureMermaidOutputs } from './renderFixtureMermaidOutputs.js';

const cleanups: Array<() => void> = [];
const PROJECT1_DIR = path.resolve(import.meta.dirname, '../fixtures/project1');

afterEach(() => {
  while (cleanups.length > 0) {
    cleanups.pop()?.();
  }
});

describe('renderFixtureMermaidOutputs', () => {
  it('fixture name から mermaid の比較情報をまとめて作れる', async () => {
    const rendered = await renderFixtureMermaidOutputs({
      fixtureName: 'project1',
    });
    cleanups.push(rendered.cleanup);

    expect(rendered.actualPaths).toBe(rendered.expectedPaths);
    expect(Object.keys(rendered.actualMermaidFiles).sort()).toEqual(
      Object.keys(rendered.expectedMermaidFiles).sort(),
    );
    expect(rendered.readOutput('Schedule.html')).toContain(
      '<pre class="mermaid">',
    );
    expect(rendered.readOutput('Schedule.md')).toContain('```mermaid');
  }, 20000);

  it('fixture dir からも mermaid の比較情報をまとめて作れる', async () => {
    const rendered = await renderFixtureMermaidOutputs({
      fixturePath: PROJECT1_DIR,
    });
    cleanups.push(rendered.cleanup);

    expect(rendered.actualPaths).toBe(rendered.expectedPaths);
  }, 20000);
});
