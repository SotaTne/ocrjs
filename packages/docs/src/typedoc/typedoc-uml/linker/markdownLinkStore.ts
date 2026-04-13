import type { ReflectionID } from '../types.js';
import { assertLinkPageEvent, registerPageLinks } from './shared.js';
import type {
  LinkPageEvent,
  ReflectionAbsoluteLink,
  ReflectionLinkStoreMap,
} from './types.js';

export class MarkdownLinkStore {
  readonly #links: ReflectionLinkStoreMap = new Map();

  registerPage(event: LinkPageEvent): void {
    assertLinkPageEvent(event);
    registerPageLinks(this.#links, event.model, event.url);
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
