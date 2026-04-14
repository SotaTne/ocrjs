import { afterEach, describe, expect, it } from 'vitest';
import { renderFixtureMermaidOutputs } from './helpers/renderFixtureMermaidOutputs.js';

const cleanups: Array<() => void> = [];

afterEach(() => {
  while (cleanups.length > 0) {
    cleanups.pop()?.();
  }
});

describe('e2e/typedoc/project4', () => {
  it('generic を含む class と method の mermaid fixture が一文字も欠けずに挿入される', async () => {
    const rendered = await renderFixtureMermaidOutputs({
      fixtureName: 'project4',
    });
    cleanups.push(rendered.cleanup);

    expect(rendered.actualPaths).toBe(rendered.expectedPaths);

    for (const [filePath, expectedBlock] of Object.entries(
      rendered.expectedMermaidFiles,
    ).sort(([left], [right]) => left.localeCompare(right))) {
      expect(rendered.actualMermaidFiles[filePath]).toBe(expectedBlock);
    }
  }, 120000);
});
