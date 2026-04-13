import {
  type FixtureProjectInput,
  resolveFixtureProjectPaths,
} from './fixtureProjectPaths.js';
import { loadProject } from './loadProject.js';
import {
  collectFixtureTsFiles,
  collectMermaidFixtureFiles,
  generateExpectedMermaidFixturePaths,
  stringifyFilePaths,
} from './mermaidFixturePaths.js';
import {
  collectOutputMermaidFiles,
  readOutputFileByBaseName,
} from './mermaidOutputBlocks.js';

export async function renderFixtureMermaidOutputs(
  options: FixtureProjectInput,
): Promise<{
  expectedPaths: string;
  actualPaths: string;
  expectedMermaidFiles: Record<string, string>;
  actualMermaidFiles: Record<string, string>;
  readOutput(fileName: string): string;
  cleanup(): void;
}> {
  const { fixtureDir, mermaidDir, srcDir, tsconfigPath } =
    resolveFixtureProjectPaths(options);

  const fixtureFiles = collectMermaidFixtureFiles(mermaidDir);
  const expectedMermaidPaths = generateExpectedMermaidFixturePaths(
    collectFixtureTsFiles(srcDir),
  );
  const htmlPaths = expectedMermaidPaths.filter((filePath) =>
    filePath.endsWith('.html'),
  );
  const mdPaths = expectedMermaidPaths.filter((filePath) =>
    filePath.endsWith('.md'),
  );
  const htmlLoaded =
    'fixtureName' in options
      ? await loadProject({
          fixtureName: options.fixtureName,
          entryPoints: [`${srcDir}/index.ts`],
          includeMarkdownPlugin: false,
          extraOptions: {
            readme: 'none',
          },
        })
      : await loadProject({
          fixtureDir,
          tsconfigPath,
          entryPoints: [`${srcDir}/index.ts`],
          includeMarkdownPlugin: false,
          extraOptions: {
            readme: 'none',
          },
        });
  const mdLoaded =
    'fixtureName' in options
      ? await loadProject({
          fixtureName: options.fixtureName,
          entryPoints: [`${srcDir}/index.ts`],
          extraOptions: {
            readme: 'none',
          },
        })
      : await loadProject({
          fixtureDir,
          tsconfigPath,
          entryPoints: [`${srcDir}/index.ts`],
          extraOptions: {
            readme: 'none',
          },
        });

  await htmlLoaded.generateOutputs();
  await mdLoaded.generateOutputs();

  const actualHtmlFiles = collectOutputMermaidFiles(
    htmlLoaded.tmpDir,
    htmlPaths,
  );
  const actualMdFiles = collectOutputMermaidFiles(mdLoaded.tmpDir, mdPaths);

  return {
    expectedPaths: stringifyFilePaths(expectedMermaidPaths),
    actualPaths: stringifyFilePaths({
      ...actualHtmlFiles,
      ...actualMdFiles,
    }),
    expectedMermaidFiles: fixtureFiles,
    actualMermaidFiles: {
      ...actualHtmlFiles,
      ...actualMdFiles,
    },
    readOutput(fileName: string) {
      const outputRootDir = fileName.endsWith('.md')
        ? mdLoaded.tmpDir
        : htmlLoaded.tmpDir;
      return readOutputFileByBaseName(outputRootDir, fileName);
    },
    cleanup() {
      htmlLoaded.cleanup();
      mdLoaded.cleanup();
    },
  };
}
