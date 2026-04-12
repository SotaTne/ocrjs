import { afterEach, describe, expect, it } from 'vitest';
import { loadProject } from './helpers/loadProject.js';

const cleanups: Array<() => void> = [];

afterEach(() => {
  while (cleanups.length > 0) {
    cleanups.pop()?.();
  }
});

describe('e2e/typedoc/project1', () => {
  it('継承・所持・interface 実装を持つ fixture として読み込める', async () => {
    const loaded = await loadProject({
      fixtureName: 'project1',
      emit: 'none',
    });
    cleanups.push(loaded.cleanup);

    expect(loaded.project.children?.map((child) => child.name)).toEqual(
      expect.arrayContaining(['Base', 'Entry', 'IScheduleOwner', 'Schedule']),
    );

    const schedule = loaded.project.children?.find(
      (child) => child.name === 'Schedule',
    );

    expect(schedule).toBeDefined();
    expect(schedule?.extendedTypes?.map((type) => type.type)).toContain(
      'reference',
    );
    expect(schedule?.implementedTypes?.map((type) => type.type)).toContain(
      'reference',
    );
    expect(schedule?.children?.map((child) => child.name)).toContain('entries');
  });

  it.todo(
    'HTML / Markdown 出力に Mermaid 断片を挿入する。plugin event 実装が有効になったら generateOutputs() まで確認する',
  );
});
