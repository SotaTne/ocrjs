import { JSX } from 'typedoc';
import { describe, expect, it, vi } from 'vitest';
import {
  createMermaidHeadScript,
  registerMermaidHeadHook,
} from './mermaidHeadHook.js';

describe('mermaidHeadHook', () => {
  it('Mermaid の module script を返す', () => {
    const html = JSX.renderElement(createMermaidHeadScript());
    expect(html).toContain('<script type="module">');
    expect(html).toContain(
      'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs',
    );
    expect(html).toContain('startOnLoad: true');
    expect(html).toContain("securityLevel: 'strict'");
  });

  it('head.end hook を登録する', () => {
    const on = vi.fn();

    registerMermaidHeadHook({ on } as never);

    expect(on).toHaveBeenCalledWith('head.end', expect.any(Function));
  });
});
