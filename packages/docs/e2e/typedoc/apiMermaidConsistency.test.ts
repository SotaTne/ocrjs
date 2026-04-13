import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateMermaidAliases } from '../../src/typedoc/typedoc-uml/generator/validateMermaidAliases.js';
import { collectGeneratedMermaidBlocks } from './helpers/collectGeneratedMermaidBlocks.js';

const API_DIR = path.resolve(import.meta.dirname, '../../api');

describe('e2e/typedoc/apiMermaidConsistency', () => {
  it('generated api docs の mermaid block は未定義 alias を参照しない', () => {
    const blocks = collectGeneratedMermaidBlocks(API_DIR);

    expect(Object.keys(blocks).length).toBeGreaterThan(0);

    for (const [filePath, block] of Object.entries(blocks).sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      expect(validateMermaidAliases(block), filePath).toEqual([]);
    }
  });
});
