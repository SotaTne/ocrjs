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
      resolveReflectionLink: (reflectionId) => {
        const project = (context as any).page?.project;
        const reflection = project?.getReflectionById(reflectionId);
        if (reflection) {
          // TypeDoc が提供する現在のページからの相対 URL を取得する
          const relativeUrl = context.urlTo(reflection);
          if (relativeUrl && relativeUrl !== '') {
            // resolveRelativeLink で二重に相対化されないように、
            // 現在のページのディレクトリパスを補完して「プロジェクトルートからのパス」に見せかける
            const currentPageUrl = context.page.url;
            const currentDir = currentPageUrl.includes('/')
              ? currentPageUrl.substring(0, currentPageUrl.lastIndexOf('/') + 1)
              : '';

            // relativeUrl が "../types/A.html" で currentDir が "interfaces/" の場合、
            // "interfaces/../types/A.html" は論理的に "/types/A.html" になる。
            // これを resolveRelativeLink に渡せば、最終的にまた "../types/A.html" が得られる。
            return {
              absoluteLink: `${currentDir}${relativeUrl}`,
              pageUrl: `${currentDir}${relativeUrl}`,
            };
          }
        }
        return linkStore.resolve(reflectionId);
      },
    }, {
      escapeAngleBracketsInMemberTypes: true,
      escapeAngleBracketsInLabels: true,
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
