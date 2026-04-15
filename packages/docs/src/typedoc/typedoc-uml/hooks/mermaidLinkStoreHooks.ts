import { PageEvent, RendererEvent, type Renderer } from 'typedoc';
import {
  MarkdownPageEvent,
  type MarkdownRenderer,
} from 'typedoc-plugin-markdown';
import type { HtmlLinkStore } from '../linker/htmlLinkStore.js';
import type { MarkdownLinkStore } from '../linker/markdownLinkStore.js';
import { isReflectionLike, walkReflections } from '../linker/shared.js';
import type { LinkPageEvent } from '../linker/types.js';

function isLinkPageEventLike(value: unknown): value is LinkPageEvent {
  return (
    !!value &&
    typeof value === 'object' &&
    'model' in value &&
    !!value.model &&
    typeof value.model === 'object' &&
    'id' in value.model &&
    typeof value.model.id === 'number' &&
    'name' in value.model &&
    typeof value.model.name === 'string' &&
    (typeof (value.model as any).hasOwnPage === 'boolean' ||
      (value.model as any).hasOwnPage === undefined) &&
    'url' in value &&
    typeof value.url === 'string' &&
    'pageHeadings' in value &&
    Array.isArray(value.pageHeadings)
  );
}

export function registerMermaidHtmlLinkStoreHook(
  renderer: Renderer,
  linkStore: HtmlLinkStore,
): void {
  // レンダリング開始前に、プロジェクト内の全リフレクションに割り当てられた URL を事前に登録する。
  renderer.on(RendererEvent.BEGIN, (event) => {
    // ログを整理
    const project = event.project as any;

    walkReflections(project, (reflection) => {
      if (typeof (reflection as any).url === 'string') {
        linkStore.registerRawLink(reflection.id, (reflection as any).url);
      }
    });
  });

  renderer.on(PageEvent.BEGIN, (event) => {
    if (!isLinkPageEventLike(event)) {
      return;
    }
    // ページのレンダリングが始まる直前に、このページの URL を登録する。
    // これにより、自分自身へのリンクなどは確実に正しい個別ページを指すようになる。
    linkStore.registerPage(event);
  });

  renderer.on(PageEvent.END, (event) => {
    if (!isLinkPageEventLike(event)) {
      return;
    }

    linkStore.registerPage(event);
  });
}

export function registerMermaidMarkdownLinkStoreHook(
  renderer: MarkdownRenderer,
  linkStore: MarkdownLinkStore,
): void {
  // Markdown 側でも同様に、事前登録を行う。
  renderer.on(RendererEvent.BEGIN as any, (event: any) => {
    walkReflections(event.project, (reflection) => {
      if (typeof (reflection as any).url === 'string') {
        linkStore.registerRawLink(reflection.id, (reflection as any).url);
      }
    });
  });

  renderer.on(MarkdownPageEvent.BEGIN, (event) => {
    if (!isLinkPageEventLike(event)) {
      return;
    }
    linkStore.registerPage(event);
  });

  renderer.on(MarkdownPageEvent.END, (event) => {
    if (!isLinkPageEventLike(event)) {
      return;
    }

    linkStore.registerPage(event);
  });
}
