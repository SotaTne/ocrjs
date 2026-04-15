import type { EventHooks, Reflection } from 'typedoc';
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

    const mermaid = createMermaidSourceForPage(
      context,
      getOptions(),
      {
        resolveReflectionLink: (reflectionId) => {
          const page = (
            context as unknown as {
              page: {
                project?: { getReflectionById: (id: number) => unknown };
              };
            }
          ).page;
          const project = page?.project;
          const reflection = project?.getReflectionById(reflectionId) as
            | { url?: string }
            | undefined;
          if (reflection) {
            // TypeDoc が提供する現在のページからの相対 URL を取得する
            const relativeUrl = context.urlTo(reflection as Reflection);
            if (relativeUrl && relativeUrl !== '') {
              const currentPageUrl = context.page.url;
              const currentDir = currentPageUrl.includes('/')
                ? currentPageUrl.slice(0, currentPageUrl.lastIndexOf('/') + 1)
                : '';

              return {
                absoluteLink: `${currentDir}${relativeUrl}`,
                pageUrl: `${currentDir}${relativeUrl}`,
              };
            }
          }
          return linkStore.resolve(reflectionId);
        },
      },
      {
        escapeAngleBracketsInMemberTypes: true,
        escapeAngleBracketsInLabels: true,
      },
    );
    return mermaid === '' ? '' : renderMermaidAsMarkdown(mermaid);
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
