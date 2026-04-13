import path from 'node:path';

export type FixtureProjectInput =
  | {
      fixtureName: string;
    }
  | {
      fixturePath: string;
    }
  | {
      tsconfigPath: string;
      srcDir: string;
      mermaidDir: string;
    };

export type FixtureProjectPaths = {
  fixtureDir: string;
  mermaidDir: string;
  srcDir: string;
  tsconfigPath: string;
};

export function resolveFixtureProjectPaths(
  options: FixtureProjectInput,
): FixtureProjectPaths {
  const fixtureDir =
    'fixtureName' in options
      ? path.resolve(import.meta.dirname, `../fixtures/${options.fixtureName}`)
      : 'fixturePath' in options
        ? path.resolve(import.meta.dirname, options.fixturePath)
        : path.dirname(path.resolve(import.meta.dirname, options.tsconfigPath));

  return {
    fixtureDir,
    srcDir:
      'srcDir' in options
        ? path.resolve(import.meta.dirname, options.srcDir)
        : path.join(fixtureDir, 'src'),
    mermaidDir:
      'mermaidDir' in options
        ? path.resolve(import.meta.dirname, options.mermaidDir)
        : path.join(fixtureDir, 'mermaid'),
    tsconfigPath:
      'tsconfigPath' in options
        ? path.resolve(import.meta.dirname, options.tsconfigPath)
        : path.join(fixtureDir, 'tsconfig.json'),
  };
}
