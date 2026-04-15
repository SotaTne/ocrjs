import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveFixtureProjectPaths } from './fixtureProjectPaths.js';

describe('fixtureProjectPaths', () => {
  it('fixture name から標準の fixture paths を解決できる', () => {
    const paths = resolveFixtureProjectPaths({
      fixtureName: 'project1',
    });

    expect(paths.fixtureDir).toBe(
      path.resolve(import.meta.dirname, '../fixtures/project1'),
    );
    expect(paths.srcDir).toBe(path.join(paths.fixtureDir, 'src'));
    expect(paths.mermaidDir).toBe(path.join(paths.fixtureDir, 'mermaid'));
    expect(paths.tsconfigPath).toBe(
      path.join(paths.fixtureDir, 'tsconfig.json'),
    );
  });

  it('個別 path 指定をそのまま解決できる', () => {
    const paths = resolveFixtureProjectPaths({
      tsconfigPath: '../fixtures/project1/tsconfig.json',
      srcDir: '../fixtures/project1/src',
      mermaidDir: '../fixtures/project1/mermaid',
    });

    expect(paths.fixtureDir).toBe(
      path.resolve(import.meta.dirname, '../fixtures/project1'),
    );
    expect(paths.srcDir).toBe(
      path.resolve(import.meta.dirname, '../fixtures/project1/src'),
    );
    expect(paths.mermaidDir).toBe(
      path.resolve(import.meta.dirname, '../fixtures/project1/mermaid'),
    );
  });
});
