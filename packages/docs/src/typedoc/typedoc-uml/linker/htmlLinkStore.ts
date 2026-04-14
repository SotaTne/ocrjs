import type { ReflectionID } from '../types.js';
import {
  assertLinkPageEvent,
  registerChildLinksFromHeadings,
  registerPageLinks,
  registerRawLink,
} from './shared.js';
import type {
  LinkPageEvent,
  ReflectionAbsoluteLink,
  ReflectionLinkStoreMap,
} from './types.js';

export class HtmlLinkStore {
  readonly #links: ReflectionLinkStoreMap = new Map();

  registerRawLink(id: number, pageUrl: string): void {
    registerRawLink(this.#links, id, pageUrl);
  }

  registerPage(event: LinkPageEvent): void {
    assertLinkPageEvent(event);
    registerPageLinks(this.#links, event.model, event.url);
    registerChildLinksFromHeadings(
      this.#links,
      event.model.children,
      event.url,
      event.pageHeadings,
    );
  }

  resolve(id: ReflectionID): ReflectionAbsoluteLink | undefined {
    return this.#links.get(id);
  }

  has(id: ReflectionID): boolean {
    return this.#links.has(id);
  }

  get size(): number {
    return this.#links.size;
  }
}
