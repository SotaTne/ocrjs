import type { EventHooks, RendererHooks } from 'typedoc';
import { JSX } from 'typedoc';

const MERMAID_MODULE_SCRIPT = `
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';

mermaid.initialize({
  startOnLoad: true,
  securityLevel: 'strict',
});
`.trim();

export function createMermaidHeadScript() {
  return JSX.createElement(
    'script',
    { type: 'module' },
    JSX.createElement(JSX.Raw, { html: MERMAID_MODULE_SCRIPT }),
  );
}

export function registerMermaidHeadHook(
  hooks: EventHooks<RendererHooks, JSX.Element>,
): void {
  hooks.on('head.end', (context) => {
    if (!context.page.url.endsWith('.html')) {
      return JSX.createElement(JSX.Fragment, null);
    }

    return createMermaidHeadScript();
  });
}
