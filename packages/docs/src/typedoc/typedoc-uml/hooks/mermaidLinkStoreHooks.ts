import { PageEvent, type Renderer } from 'typedoc';
import {
  MarkdownPageEvent,
  type MarkdownRenderer,
} from 'typedoc-plugin-markdown';
import type { HtmlLinkStore } from '../linker/htmlLinkStore.js';
import type { MarkdownLinkStore } from '../linker/markdownLinkStore.js';
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
  renderer.on(MarkdownPageEvent.END, (event) => {
    if (!isLinkPageEventLike(event)) {
      return;
    }

    linkStore.registerPage(event);
  });
}
