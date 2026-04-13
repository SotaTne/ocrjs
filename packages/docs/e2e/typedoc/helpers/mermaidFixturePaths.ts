import fs from 'node:fs';
import path from 'node:path';

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

export function collectFixtureTsFiles(srcDir: string): string[] {
  return walkFiles(srcDir)
    .map((absolutePath) => path.relative(srcDir, absolutePath))
    .filter((relativePath) => relativePath.endsWith('.ts'))
    .filter((relativePath) => path.basename(relativePath) !== 'index.ts')
    .map((relativePath) => relativePath.replaceAll(path.sep, '/'))
    .sort();
}

export function generateExpectedMermaidFixturePaths(
  tsFiles: string[],
): string[] {
  return tsFiles
    .flatMap((tsFile) => {
      const withoutExtension = tsFile.replace(/\.ts$/u, '');
      return [`${withoutExtension}.html`, `${withoutExtension}.md`];
    })
    .sort();
}

export function collectMermaidFixtureFiles(
  mermaidDir: string,
): Record<string, string> {
  const files = walkFiles(mermaidDir);

  return Object.fromEntries(
    files.map((absolutePath) => [
      path.relative(mermaidDir, absolutePath).replaceAll(path.sep, '/'),
      fs.readFileSync(absolutePath, 'utf8').trimEnd(),
    ]),
  );
}

export function stringifyFilePaths(
  paths: readonly string[] | Record<string, string>,
): string {
  const sortedPaths = Array.isArray(paths)
    ? [...paths].sort()
    : Object.keys(paths).sort();

  return sortedPaths.join('\n');
}
