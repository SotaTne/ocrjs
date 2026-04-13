import type { PageHeading } from 'typedoc';
import type {
  LinkPageEvent,
  ReflectionAbsoluteLink,
  ReflectionLike,
  ReflectionLinkStoreMap,
} from './types.js';

function createLink(pageUrl: string, anchor?: string): ReflectionAbsoluteLink {
  const link: ReflectionAbsoluteLink = {
    absoluteLink: anchor ? `${pageUrl}${anchor}` : pageUrl,
    pageUrl,
  };

  if (anchor !== undefined) {
    link.anchor = anchor;
  }

  return link;
}

function isReflectionLike(x: unknown): x is ReflectionLike {
  return (
    !!x &&
    typeof x === 'object' &&
    'id' in x &&
    typeof x.id === 'number' &&
    'name' in x &&
    typeof x.name === 'string'
  );
}

function findHeadingByText(
  headings: PageHeading[],
  name: string,
): PageHeading | undefined {
  return headings.find((heading) => heading.text === name);
}

function walkReflections(
  model: ReflectionLike,
  visit: (reflection: ReflectionLike) => void,
): void {
  visit(model);

  if (!Array.isArray(model.children)) return;

  for (const child of model.children) {
    if (!isReflectionLike(child)) continue;
    walkReflections(child, visit);
  }
}

export function registerPageLinks(
  links: ReflectionLinkStoreMap,
  model: ReflectionLike,
  pageUrl: string,
): void {
  walkReflections(model, (reflection) => {
    if (!links.has(reflection.id)) {
      links.set(reflection.id, createLink(pageUrl));
    }
  });
}

export function registerChildLinksFromHeadings(
  links: ReflectionLinkStoreMap,
  children: Array<ReflectionLike | undefined> | undefined,
  pageUrl: string,
  pageHeadings: PageHeading[],
): void {
  if (!Array.isArray(children)) return;

  for (const child of children) {
    if (!isReflectionLike(child)) continue;

    const heading = findHeadingByText(pageHeadings, child.name);
    if (!heading?.link) continue;

    links.set(child.id, createLink(pageUrl, heading.link));
  }
}

export function assertLinkPageEvent(event: LinkPageEvent): void {
  if (!isReflectionLike(event.model)) {
    throw new TypeError('event.model must be reflection-like');
  }
}
