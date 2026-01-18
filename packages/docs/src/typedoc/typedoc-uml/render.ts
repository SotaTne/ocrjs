import type { MarkdownRendererEvent } from 'typedoc-plugin-markdown';

// ここで
export function onMarkdownRendererBegin(event: MarkdownRendererEvent): void {
  event.pages.forEach((page) => {
    page.model.parent;
  });
}
