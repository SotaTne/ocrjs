import type { EventHooks } from 'typedoc';
import type {
  MarkdownRendererHooks,
  MarkdownThemeContext,
} from 'typedoc-plugin-markdown';
import { renderMermaidAsMarkdown } from '../generator/mermaidMd.js';
import type { MarkdownLinkStore } from '../linker/markdownLinkStore.js';
import type { PluginOptions } from '../options.js';
import { createMermaidSourceForPage } from './mermaidContentShared.js';

export function createMermaidMarkdownContentHook(
  getOptions: () => PluginOptions,
  linkStore: MarkdownLinkStore,
): (context: MarkdownThemeContext) => string {
  return (context) => {
    if (!context.page.url.endsWith('.md')) {
      return '';
    }

    const mermaid = createMermaidSourceForPage(context, getOptions(), {
      resolveReflectionLink: (reflectionId) => linkStore.resolve(reflectionId),
    }, {
      escapeAngleBracketsInMemberTypes: true,
    });
    if (mermaid === '') {
      return '';
    }

    return renderMermaidAsMarkdown(mermaid);
  };
}

export function registerMermaidMarkdownContentHook(
  hooks: EventHooks<MarkdownRendererHooks, string>,
  getOptions: () => PluginOptions,
  linkStore: MarkdownLinkStore,
): void {
  hooks.on(
    'content.begin',
    createMermaidMarkdownContentHook(getOptions, linkStore),
  );
}
