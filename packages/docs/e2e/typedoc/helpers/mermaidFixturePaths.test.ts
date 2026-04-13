import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  collectFixtureTsFiles,
  collectMermaidFixtureFiles,
  generateExpectedMermaidFixturePaths,
  stringifyFilePaths,
} from './mermaidFixturePaths.js';

const PROJECT1_DIR = path.resolve(import.meta.dirname, '../fixtures/project1');
const PROJECT1_SRC_DIR = path.join(PROJECT1_DIR, 'src');
const PROJECT1_MERMAID_DIR = path.join(PROJECT1_DIR, 'mermaid');

describe('mermaidFixturePaths', () => {
  it('fixture の ts ファイルから期待する mermaid fixture path を生成できる', () => {
    const tsFiles = collectFixtureTsFiles(PROJECT1_SRC_DIR);

    expect(tsFiles).toEqual([
      'Base.ts',
      'Entry.ts',
      'EntryCollection.ts',
      'EntryList.ts',
      'IScheduleOwner.ts',
      'Schedule.ts',
      'TypedEntryListOwner.ts',
    ]);
    expect(generateExpectedMermaidFixturePaths(tsFiles)).toEqual([
      'Base.html',
      'Base.md',
      'Entry.html',
      'Entry.md',
      'EntryCollection.html',
      'EntryCollection.md',
      'EntryList.html',
      'EntryList.md',
      'IScheduleOwner.html',
      'IScheduleOwner.md',
      'Schedule.html',
      'Schedule.md',
      'TypedEntryListOwner.html',
      'TypedEntryListOwner.md',
    ]);
  });

  it('fixture path 一覧を diff しやすい string に変換できる', () => {
    expect(
      stringifyFilePaths({
        'Schedule.md': 'x',
        'Base.html': 'y',
      }),
    ).toBe(['Base.html', 'Schedule.md'].join('\n'));
  });

  it('mermaid fixture を record で読める', () => {
    const files = collectMermaidFixtureFiles(PROJECT1_MERMAID_DIR);

    expect(Object.keys(files)).toContain('Base.html');
    expect(Object.keys(files)).toContain('Schedule.md');
  });
});
