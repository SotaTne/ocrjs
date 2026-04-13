import type { DefaultThemeRenderContext } from 'typedoc';
import { type EventHooks, JSX, type RendererHooks } from 'typedoc';
import type { HtmlLinkStore } from '../linker/htmlLinkStore.js';
import type { PluginOptions } from '../options.js';
import { createMermaidSourceForPage } from './mermaidContentShared.js';

export function createMermaidHtmlContentHook(
  getOptions: () => PluginOptions,
  linkStore: HtmlLinkStore,
): (context: DefaultThemeRenderContext) => JSX.Element {
  return (context) => {
    if (!context.page.url.endsWith('.html')) {
      return JSX.createElement(JSX.Fragment, null);
    }

    const mermaid = createMermaidSourceForPage(context, getOptions(), {
      resolveReflectionLink: (reflectionId) => linkStore.resolve(reflectionId),
    });
    if (mermaid === '') {
      return JSX.createElement(JSX.Fragment, null);
    }

    return JSX.createElement('pre', { class: 'mermaid' }, mermaid);
  };
}

export function registerMermaidHtmlContentHook(
  hooks: EventHooks<RendererHooks, JSX.Element>,
  getOptions: () => PluginOptions,
  linkStore: HtmlLinkStore,
): void {
  hooks.on(
    'content.begin',
    createMermaidHtmlContentHook(getOptions, linkStore),
  );
}
