import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

export type PreviewE2eMdOptions = {
  host: string;
  noOpen: boolean;
  port: string;
  silent: boolean;
};

const E2E_TYPEDOC_FIXTURES_DIR = path.resolve(
  import.meta.dirname,
  '../../e2e/typedoc/fixtures',
);

function resolveFixtureDir(projectName: string): string {
  return path.resolve(E2E_TYPEDOC_FIXTURES_DIR, projectName);
}

export async function previewE2eMarkdown(
  projectName: string,
  options: PreviewE2eMdOptions,
): Promise<number> {
  const fixtureDir = resolveFixtureDir(projectName);
  if (!fs.existsSync(fixtureDir)) {
    throw new Error(`E2E fixture project not found: ${projectName}`);
  }

  const args = [
    fixtureDir,
    '--glob',
    '**/*.md',
    '--host',
    options.host,
    '--port',
    options.port,
  ];

  if (options.noOpen) {
    args.push('--no-open');
  }

  if (options.silent) {
    args.push('--silent');
  }

  return await new Promise<number>((resolve, reject) => {
    const child = spawn('mdts', args, {
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('close', (code) => {
      resolve(code ?? 1);
    });
  });
}
