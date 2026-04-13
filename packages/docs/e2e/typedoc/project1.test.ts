import { afterEach, describe, expect, it } from 'vitest';
import { renderFixtureMermaidOutputs } from './helpers/renderFixtureMermaidOutputs.js';

const cleanups: Array<() => void> = [];

afterEach(() => {
  while (cleanups.length > 0) {
    cleanups.pop()?.();
  }
});

describe('e2e/typedoc/project1', () => {
  it('mermaid fixture が一文字も欠けずに挿入される', async () => {
    const rendered = await renderFixtureMermaidOutputs({
      fixtureName: 'project1',
    });
    cleanups.push(rendered.cleanup);

    expect(rendered.actualPaths).toBe(rendered.expectedPaths);
    for (const [filePath, expectedBlock] of Object.entries(
      rendered.expectedMermaidFiles,
    ).sort(([left], [right]) => left.localeCompare(right))) {
      expect(rendered.actualMermaidFiles[filePath]).toBe(expectedBlock);
    }
  }, 40000);

  it('mermaid fixture が想定位置に挿入される', async () => {
    const rendered = await renderFixtureMermaidOutputs({
      fixtureName: 'project1',
    });
    cleanups.push(rendered.cleanup);

    expect(rendered.actualPaths).toBe(rendered.expectedPaths);

    const scheduleHtml = rendered.readOutput('Schedule.html');
    const scheduleMd = rendered.readOutput('Schedule.md');
    expect(scheduleHtml.indexOf('<pre class="mermaid">')).toBeLessThan(
      scheduleHtml.indexOf('entries'),
    );
    expect(scheduleMd.indexOf('```mermaid')).toBeLessThan(
      scheduleMd.indexOf('entries'),
    );
  }, 40000);
});
