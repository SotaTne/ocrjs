#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DOCS_JSON_PATH = '.docs/docs.json';
const WORKSPACE_MARKER = 'pnpm-workspace.yaml';

type MainOptions = {
  argv?: string[];
  cwd?: string;
  onInfo?: (message: string) => void;
  onWarn?: (message: string) => void;
  onError?: (message: string) => void;
};

type CliOptions = {
  mergeBase: string;
  workspaceBase: boolean;
};

type NormalizeResult = {
  changes: Array<{
    key: string;
    from: string;
    to: string;
  }>;
  jsonPath: string;
  warnings: string[];
};

function parseCliOptions(argv: string[]): CliOptions {
  const mergeBaseFlagIndex = argv.indexOf('--merge-base');
  if (mergeBaseFlagIndex === -1) {
    throw new Error('Missing required option: --merge-base <path>');
  }

  const mergeBase = argv[mergeBaseFlagIndex + 1];
  if (mergeBase === undefined || mergeBase.startsWith('-')) {
    throw new Error('Missing value for --merge-base');
  }

  return {
    mergeBase,
    workspaceBase: argv.includes('--workspace-base'),
  };
}

function findWorkspaceRoot(startDir: string): string {
  let currentDir = path.resolve(startDir);

  while (true) {
    if (fs.existsSync(path.join(currentDir, WORKSPACE_MARKER))) {
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      throw new Error(`Could not find ${WORKSPACE_MARKER} from ${startDir}`);
    }
    currentDir = parentDir;
  }
}

function normalizeTypedocJson(
  packageDir: string,
  mergeBase: string,
  workspaceBase: boolean,
): NormalizeResult {
  const jsonPath = path.join(packageDir, DOCS_JSON_PATH);
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Missing file: ${jsonPath}`);
  }

  const raw = fs.readFileSync(jsonPath, 'utf8');
  const json = JSON.parse(raw) as {
    files?: { entries?: Record<string, unknown> };
  };
  const changes: NormalizeResult['changes'] = [];
  const warnings: string[] = [];

  const entries = json.files?.entries;
  if (entries === undefined) {
    warnings.push(`No files.entries found in ${jsonPath}`);
  } else {
    const mergeBaseDir = workspaceBase
      ? path.resolve(findWorkspaceRoot(packageDir), mergeBase)
      : path.resolve(packageDir, mergeBase);

    for (const [key, value] of Object.entries(entries)) {
      if (typeof value !== 'string') {
        warnings.push(
          `Skipped files.entries.${key} because it is not a string`,
        );
        continue;
      }

      const absoluteEntryPath = path.resolve(packageDir, value);
      const normalizedValue = path
        .relative(mergeBaseDir, absoluteEntryPath)
        .replaceAll(path.sep, '/');
      if (normalizedValue !== value) {
        changes.push({ key, from: value, to: normalizedValue });
      }
      entries[key] = normalizedValue;
    }
  }

  fs.writeFileSync(jsonPath, `${JSON.stringify(json, null, '\t')}\n`);
  return { changes, jsonPath, warnings };
}

function isCliExecution(argv1: string | undefined): boolean {
  if (argv1 === undefined) {
    return false;
  }

  return import.meta.url === pathToFileURL(fs.realpathSync(argv1)).href;
}

/**
 * Normalizes TypeDoc serialized JSON so `files.entries` are written relative to
 * the merge target directory instead of the package directory.
 *
 * This command expects to run from the package that owns `./.docs/docs.json`.
 * Pass `--merge-base <path>` to indicate the directory where TypeDoc later runs
 * with `entryPointStrategy: "merge"`.
 *
 * By default `--merge-base` is resolved from `cwd`. If `--workspace-base` is
 * also provided, the path is resolved from the nearest directory containing
 * `pnpm-workspace.yaml`.
 *
 * CLI examples:
 * `normalize-typedoc-json --merge-base ../docs`
 * `normalize-typedoc-json --merge-base packages/docs --workspace-base`
 *
 * @param options.argv CLI arguments without the node executable or script path.
 * @param options.cwd Package directory containing `./.docs/docs.json`.
 * @param options.onError Error sink used when argument parsing or normalization fails.
 * @returns `0` on success, otherwise `1`.
 */
export function main(options: MainOptions = {}): number {
  const argv = options.argv ?? [];
  const cwd = options.cwd ?? '.';
  const onInfo = options.onInfo ?? console.info;
  const onWarn = options.onWarn ?? console.warn;
  const onError = options.onError ?? console.error;

  try {
    const cliOptions = parseCliOptions(argv);
    const result = normalizeTypedocJson(
      cwd,
      cliOptions.mergeBase,
      cliOptions.workspaceBase,
    );
    onInfo(`[normalize-typedoc-json] Updated ${result.jsonPath}`);
    for (const change of result.changes) {
      onInfo(
        `[normalize-typedoc-json] files.entries.${change.key}: ${change.from} -> ${change.to}`,
      );
    }
    if (result.changes.length === 0) {
      onWarn(
        `[normalize-typedoc-json] No entries were updated in ${result.jsonPath}`,
      );
    }
    for (const warning of result.warnings) {
      onWarn(`[normalize-typedoc-json] ${warning}`);
    }
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    onError(`[normalize-typedoc-json] ${message}`);
    return 1;
  }
}

if (isCliExecution(process.argv[1])) {
  process.exitCode = main({
    argv: process.argv.slice(2),
    cwd: process.cwd(),
  });
}
