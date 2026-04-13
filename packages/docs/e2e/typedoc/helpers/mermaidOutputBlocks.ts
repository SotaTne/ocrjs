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

function findOutputFileByBaseName(rootDir: string, fileName: string): string {
  const matches = walkFiles(rootDir).filter(
    (absolutePath) => path.basename(absolutePath) === fileName,
  );

  if (matches.length === 0) {
    throw new Error(`Output file not found: ${fileName}`);
  }

  if (matches.length > 1) {
    throw new Error(`Multiple output files matched: ${fileName}`);
  }

  const absolutePath = matches[0];
  if (!absolutePath) {
    throw new Error(`Output file not found: ${fileName}`);
  }

  return absolutePath;
}

export function readOutputFileByBaseName(
  outputRootDir: string,
  fileName: string,
): string {
  return fs.readFileSync(
    findOutputFileByBaseName(outputRootDir, fileName),
    'utf8',
  );
}

export function extractMermaidBlock(
  outputPath: string,
  contents: string,
): string {
  if (outputPath.endsWith('.html')) {
    const start = contents.indexOf('<pre class="mermaid">');
    const end = contents.indexOf('</pre>', start);

    if (start === -1 || end === -1) {
      throw new Error(`Mermaid HTML block not found: ${outputPath}`);
    }

    return contents.slice(start, end + '</pre>'.length);
  }

  if (outputPath.endsWith('.md')) {
    const start = contents.indexOf('```mermaid');
    const end = contents.indexOf('\n```', start + '```mermaid'.length);

    if (start === -1 || end === -1) {
      throw new Error(`Mermaid markdown block not found: ${outputPath}`);
    }

    return contents.slice(start, end + '\n```'.length);
  }

  throw new Error(`Unsupported output file type: ${outputPath}`);
}

export function collectOutputMermaidFiles(
  outputRootDir: string,
  expectedPaths: readonly string[],
): Record<string, string> {
  return Object.fromEntries(
    [...expectedPaths].sort().map((relativePath) => {
      const outputFileName = path.basename(relativePath);
      const outputFilePath = findOutputFileByBaseName(
        outputRootDir,
        outputFileName,
      );
      const contents = fs.readFileSync(outputFilePath, 'utf8');

      return [relativePath, extractMermaidBlock(outputFilePath, contents)];
    }),
  );
}
