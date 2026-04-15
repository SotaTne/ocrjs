import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { main } from '../src/normalize-typedoc-json.ts';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const BASIC_FIXTURE_DIR = path.join(TEST_DIR, 'fixtures/basic');
const TMP_DIR = path.resolve(TEST_DIR, '../tmp');

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath: string, value: unknown): void {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, '\t')}\n`);
}

function mockConsole() {
  const info = vi.spyOn(console, 'info').mockImplementation(() => {});
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});

  return {
    error,
    info,
    restore() {
      info.mockRestore();
      warn.mockRestore();
      error.mockRestore();
    },
    warn,
  };
}

function withBasicFixture(run: (packageDir: string) => void): void {
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const repoDir = fs.mkdtempSync(path.join(TMP_DIR, 'normalize-typedoc-json-'));

  try {
    fs.writeFileSync(
      path.join(repoDir, 'pnpm-workspace.yaml'),
      'packages:\n  - packages/*\n',
    );
    const packageDir = path.join(repoDir, 'packages/scripts');
    const docsDir = path.join(packageDir, '.docs');
    fs.mkdirSync(docsDir, { recursive: true });
    writeJson(
      path.join(docsDir, 'docs.json'),
      readJson(path.join(BASIC_FIXTURE_DIR, 'input.json')),
    );
    run(packageDir);
  } finally {
    fs.rmSync(repoDir, { recursive: true, force: true });
  }
}

describe('main', () => {
  it('normalizes typedoc entries relative to merge base', () => {
    const mockedConsole = mockConsole();

    try {
      withBasicFixture((packageDir) => {
        const exitCode = main({
          argv: ['--merge-base', '../docs'],
          cwd: packageDir,
        });

        expect(exitCode).toBe(0);
        expect(readJson(path.join(packageDir, '.docs/docs.json'))).toEqual(
          readJson(path.join(BASIC_FIXTURE_DIR, 'expected.json')),
        );
        expect(mockedConsole.info).toHaveBeenCalledWith(
          expect.stringContaining('.docs/docs.json'),
        );
        expect(mockedConsole.info).toHaveBeenCalledWith(
          '[normalize-typedoc-json] files.entries.1: src/index.ts -> ../scripts/src/index.ts',
        );
        expect(mockedConsole.warn).not.toHaveBeenCalled();
        expect(mockedConsole.error).not.toHaveBeenCalled();
      });
    } finally {
      mockedConsole.restore();
    }
  });

  it('resolves merge base from workspace root when requested', () => {
    const mockedConsole = mockConsole();

    try {
      withBasicFixture((packageDir) => {
        const exitCode = main({
          argv: ['--merge-base', 'packages/docs', '--workspace-base'],
          cwd: packageDir,
        });

        expect(exitCode).toBe(0);
        expect(readJson(path.join(packageDir, '.docs/docs.json'))).toEqual(
          readJson(path.join(BASIC_FIXTURE_DIR, 'expected.json')),
        );
        expect(mockedConsole.warn).not.toHaveBeenCalled();
        expect(mockedConsole.error).not.toHaveBeenCalled();
      });
    } finally {
      mockedConsole.restore();
    }
  });

  it('returns a non-zero exit code when merge base is missing', () => {
    const mockedConsole = mockConsole();

    try {
      const exitCode = main({
        argv: [],
        cwd: '/tmp',
      });

      expect(exitCode).toBe(1);
      expect(mockedConsole.info).not.toHaveBeenCalled();
      expect(mockedConsole.warn).not.toHaveBeenCalled();
      expect(mockedConsole.error).toHaveBeenCalledWith(
        '[normalize-typedoc-json] Missing required option: --merge-base <path>',
      );
    } finally {
      mockedConsole.restore();
    }
  });
});
