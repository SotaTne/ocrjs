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
      resolveReflectionLink: (reflectionId) => {
        // コンテキストの urlTo は相対パスを返すため、二重相対化を避けるために
        // reflection.url (プロジェクトルートからのパス) を優先して使用する。
        const project = (context as any).page?.project;
        const reflection = project?.getReflectionById(reflectionId);
        if (reflection && (reflection as any).url) {
          return {
            absoluteLink: (reflection as any).url,
            pageUrl: (reflection as any).url,
          };
        }
        return linkStore.resolve(reflectionId);
      },
    }, {
      escapeAngleBracketsInMemberTypes: true,
      escapeAngleBracketsInLabels: true,
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
