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

export function isReflectionLike(x: unknown): x is ReflectionLike {
  const ok =
    !!x &&
    typeof x === 'object' &&
    'id' in x &&
    typeof (x as ReflectionLike).id === 'number';
  return ok;
}

function findHeadingByText(
  headings: PageHeading[],
  name: string,
): PageHeading | undefined {
  return headings.find((heading) => heading.text === name);
}

export function walkReflections(
  model: ReflectionLike,
  visit: (reflection: ReflectionLike) => void,
): void {
  if (!isReflectionLike(model)) {
    return;
  }
  visit(model);

  const children = (model as ReflectionLike).children || [];

  for (const child of children) {
    if (child) {
      walkReflections(child, visit);
    }
  }
}

export function registerRawLink(
  links: ReflectionLinkStoreMap,
  id: number,
  pageUrl: string,
): void {
  // アンカーを持たない既存リンクであれば、より新しい（または事前の）URL で上書きを許可する。
  const existing = links.get(id);
  if (!existing?.anchor) {
    links.set(id, createLink(pageUrl));
  }
}

export function registerPageLinks(
  links: ReflectionLinkStoreMap,
  model: ReflectionLike,
  pageUrl: string,
): void {
  // 主役のモデルは、既存の登録があっても常にこのページの URL で上書きする。
  links.set(model.id, createLink(pageUrl));

  walkReflections(model, (reflection) => {
    // model 自身は既にセット済みなのでスキップ
    if (reflection.id === model.id) return;

    // 個別のページを持っている子要素（Class, Interface, TypeAlias 等）は、
    // 親ページ（Module や Project 等）の一部として登録されないようにする。
    if (reflection.hasOwnPage) return;

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

    // 既にその ID で個別ページへのリンク (アンカーなし) が登録されている場合は、その URL を維持しつつアンカーを補完する
    const existing = links.get(child.id);
    if (existing && !existing.anchor) {
      links.set(child.id, createLink(existing.pageUrl, heading.link));
      continue;
    }

    // 既存リンクがなければ、アンカー付きのリンクとして登録
    if (!existing) {
      links.set(child.id, createLink(pageUrl, heading.link));
    }
  }
}

export function assertLinkPageEvent(event: LinkPageEvent): void {
  if (!isReflectionLike(event.model)) {
    throw new TypeError('event.model must be reflection-like');
  }
}
