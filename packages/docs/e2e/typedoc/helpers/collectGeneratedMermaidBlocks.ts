import fs from 'node:fs';
import path from 'node:path';
import { extractMermaidBlock } from './mermaidOutputBlocks.js';

function walkFiles(rootDir: string): string[] {
  const queue = [rootDir];
  const files: string[] = [];

  while (queue.length > 0) {
    const currentDir = queue.shift();
    if (currentDir === undefined) {
      continue;
    }

    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const absolutePath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        queue.push(absolutePath);
        continue;
      }

      files.push(absolutePath);
    }
  }

  return files.sort();
}

export function collectGeneratedMermaidBlocks(
  outputRootDir: string,
): Record<string, string> {
  const candidates = walkFiles(outputRootDir).filter(
    (absolutePath) =>
      absolutePath.endsWith('.html') || absolutePath.endsWith('.md'),
  );

  return Object.fromEntries(
    candidates.flatMap((absolutePath) => {
      const contents = fs.readFileSync(absolutePath, 'utf8');

      try {
        return [
          [
            path.relative(outputRootDir, absolutePath).replaceAll(path.sep, '/'),
            extractMermaidBlock(absolutePath, contents),
          ] as const,
        ];
      } catch {
        return [];
      }
    }),
  );
}
