import fs from 'node:fs';
import path from 'node:path';
import { Application, type ProjectReflection, TSConfigReader } from 'typedoc';

const FIXTURES_DIR = path.resolve(import.meta.dirname, '../fixtures');
const TMP_ROOT_DIR = path.resolve(import.meta.dirname, '../tmp');
const UML_PLUGIN_PATH = path.resolve(
  import.meta.dirname,
  '../../../dist/typedoc/typedoc-uml/index.js',
);

export type LoadProjectOptions = {
  fixtureName?: string;
  fixtureDir?: string;
  tsconfigPath?: string;
  entryPoints?: string[];
  emit?: 'both' | 'docs' | 'none';
  includeMarkdownPlugin?: boolean;
  plugin?: string[];
  extraOptions?: Record<string, unknown>;
};

export type LoadedProject = {
  app: Application;
  fixtureDir: string;
  outDir: string;
  tmpDir: string;
  project: ProjectReflection;
  generateOutputs(): Promise<void>;
  cleanup(): void;
};

function createTempDir(): string {
  fs.mkdirSync(TMP_ROOT_DIR, { recursive: true });
  return fs.mkdtempSync(path.join(TMP_ROOT_DIR, 'typedoc-e2e-'));
}

export async function loadProject(
  options: LoadProjectOptions,
): Promise<LoadedProject> {
  const fixtureDir =
    options.fixtureDir ??
    (options.fixtureName === undefined
      ? undefined
      : path.join(FIXTURES_DIR, options.fixtureName));
  const tsconfig =
    options.tsconfigPath ??
    (fixtureDir === undefined
      ? undefined
      : path.join(fixtureDir, 'tsconfig.json'));
  if (tsconfig === undefined) {
    throw new Error(
      'Either fixtureName, fixtureDir, or tsconfigPath is required.',
    );
  }
  const resolvedFixtureDir = fixtureDir ?? path.dirname(tsconfig);
  const outDir = path.join(createTempDir(), 'out');

  const app = await Application.bootstrapWithPlugins(
    {
      entryPoints: options.entryPoints ?? [
        path.join(resolvedFixtureDir, 'src/index.ts'),
      ],
      tsconfig,
      out: outDir,
      emit: options.emit ?? 'both',
      plugin: [
        ...(options.includeMarkdownPlugin === false
          ? []
          : ['typedoc-plugin-markdown']),
        UML_PLUGIN_PATH,
        ...(options.plugin ?? []),
      ],
      ...(options.extraOptions ?? {}),
    },
    [new TSConfigReader()],
  );

  const project = await app.convert();
  if (!project) {
    throw new Error(
      `Failed to convert fixture project: ${options.fixtureName ?? fixtureDir}`,
    );
  }

  return {
    app,
    fixtureDir: resolvedFixtureDir,
    outDir,
    project,
    tmpDir: path.dirname(outDir),
    async generateOutputs() {
      await app.generateOutputs(project);
    },
    cleanup() {
      fs.rmSync(path.dirname(outDir), { recursive: true, force: true });
    },
  };
}
