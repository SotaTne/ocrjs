import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { collectGeneratedMermaidBlocks } from './collectGeneratedMermaidBlocks.js';

const TMP_DIR = path.resolve(import.meta.dirname, '../tmp');
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
  const dir = fs.mkdtempSync(path.join(TMP_DIR, 'generated-mermaid-'));
  cleanups.push(dir);
  return dir;
}

describe('collectGeneratedMermaidBlocks', () => {
  it('html / markdown の mermaid block だけを集める', () => {
    const rootDir = createTempDir();
    const htmlDir = path.join(rootDir, 'html/classes');
    const mdDir = path.join(rootDir, 'md/pkg');

    fs.mkdirSync(htmlDir, { recursive: true });
    fs.mkdirSync(mdDir, { recursive: true });

    fs.writeFileSync(
      path.join(htmlDir, 'Base.html'),
      '<main><pre class="mermaid">classDiagram</pre></main>',
    );
    fs.writeFileSync(
      path.join(mdDir, 'Base.md'),
      '# Title\n\n```mermaid\nclassDiagram\n```',
    );
    fs.writeFileSync(path.join(mdDir, 'Plain.md'), '# no mermaid');

    expect(collectGeneratedMermaidBlocks(rootDir)).toEqual({
      'html/classes/Base.html': '<pre class="mermaid">classDiagram</pre>',
      'md/pkg/Base.md': '```mermaid\nclassDiagram\n```',
    });
  });
});
