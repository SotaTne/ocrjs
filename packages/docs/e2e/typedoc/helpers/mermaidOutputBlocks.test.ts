import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  collectMermaidFixtureFiles,
  stringifyFilePaths,
} from './mermaidFixturePaths.js';
import {
  collectOutputMermaidFiles,
  extractMermaidBlock,
  readOutputFileByBaseName,
} from './mermaidOutputBlocks.js';

const TMP_DIR = path.resolve(import.meta.dirname, '../tmp');
const PROJECT1_DIR = path.resolve(import.meta.dirname, '../fixtures/project1');
const PROJECT1_MERMAID_DIR = path.join(PROJECT1_DIR, 'mermaid');
const cleanups: string[] = [];

afterEach(() => {
  while (cleanups.length > 0) {
    const current = cleanups.pop();
    if (current !== undefined) {
      fs.rmSync(current, { recursive: true, force: true });
    }
  }
});

function createTempDir(): string {
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const dir = fs.mkdtempSync(path.join(TMP_DIR, 'mermaid-fixtures-'));
  cleanups.push(dir);
  return dir;
}

describe('mermaidOutputBlocks', () => {
  it('html と markdown の mermaid block を抽出できる', () => {
    expect(
      extractMermaidBlock(
        'Schedule.html',
        '<main><pre class="mermaid">classDiagram</pre></main>',
      ),
    ).toBe('<pre class="mermaid">classDiagram</pre>');

    expect(
      extractMermaidBlock(
        'Schedule.md',
        '# Title\n\n```mermaid\nclassDiagram\n```\n\nbody',
      ),
    ).toBe('```mermaid\nclassDiagram\n```');
  });

  it('fixture file と output から mermaid files をまとめられる', () => {
    const outputDir = createTempDir();
    const classesDir = path.join(outputDir, 'classes');
    const interfacesDir = path.join(outputDir, 'interfaces');

    fs.mkdirSync(classesDir, { recursive: true });
    fs.mkdirSync(interfacesDir, { recursive: true });

    fs.writeFileSync(
      path.join(classesDir, 'Base.html'),
      '<pre class="mermaid">base</pre>',
    );
    fs.writeFileSync(
      path.join(classesDir, 'Entry.html'),
      '<pre class="mermaid">entry</pre>',
    );
    fs.writeFileSync(
      path.join(classesDir, 'EntryCollection.html'),
      '<pre class="mermaid">entry-collection</pre>',
    );
    fs.writeFileSync(
      path.join(classesDir, 'EntryList.html'),
      '<pre class="mermaid">entry-list</pre>',
    );
    fs.writeFileSync(
      path.join(classesDir, 'Schedule.html'),
      '<pre class="mermaid">schedule</pre>',
    );
    fs.writeFileSync(
      path.join(classesDir, 'TypedEntryListOwner.html'),
      '<pre class="mermaid">typed-entry-list-owner</pre>',
    );
    fs.writeFileSync(
      path.join(interfacesDir, 'IScheduleOwner.html'),
      '<pre class="mermaid">interface</pre>',
    );
    fs.writeFileSync(
      path.join(classesDir, 'Base.md'),
      '```mermaid\nbase-md\n```',
    );
    fs.writeFileSync(
      path.join(classesDir, 'Entry.md'),
      '```mermaid\nentry-md\n```',
    );
    fs.writeFileSync(
      path.join(classesDir, 'EntryCollection.md'),
      '```mermaid\nentry-collection-md\n```',
    );
    fs.writeFileSync(
      path.join(classesDir, 'EntryList.md'),
      '```mermaid\nentry-list-md\n```',
    );
    fs.writeFileSync(
      path.join(classesDir, 'Schedule.md'),
      '```mermaid\nschedule-md\n```',
    );
    fs.writeFileSync(
      path.join(classesDir, 'TypedEntryListOwner.md'),
      '```mermaid\ntyped-entry-list-owner-md\n```',
    );
    fs.writeFileSync(
      path.join(interfacesDir, 'IScheduleOwner.md'),
      '```mermaid\ninterface-md\n```',
    );

    const fixtureFiles = collectMermaidFixtureFiles(PROJECT1_MERMAID_DIR);
    const expectedPaths = Object.keys(fixtureFiles);
    const outputFiles = collectOutputMermaidFiles(outputDir, expectedPaths);

    expect(stringifyFilePaths(outputFiles)).toBe(
      [
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
      ].join('\n'),
    );

    expect(Object.keys(outputFiles).sort()).toEqual(expectedPaths.sort());
    expect(readOutputFileByBaseName(outputDir, 'Base.html')).toBe(
      '<pre class="mermaid">base</pre>',
    );
  });
});
