import { JSX, ReflectionKind } from 'typedoc';
import { describe, expect, it, vi } from 'vitest';
import { HtmlLinkStore } from '../linker/htmlLinkStore.js';
import {
  createMermaidHtmlContentHook,
  registerMermaidHtmlContentHook,
} from './mermaidHtmlContentHook.js';

function createReflection(
  id: number,
  name: string,
  extra: Record<string, unknown> = {},
) {
  const kinds = (extra.kinds as ReflectionKind[] | undefined) ?? [
    ReflectionKind.Class,
  ];

  const reflection = {
    id,
    name,
    kindOf(kind: unknown) {
      if (Array.isArray(kind)) {
        return kind.some((entry) => kinds.includes(entry));
      }

      return kinds.includes(kind as ReflectionKind);
    },
    getReflectionById(targetId: number) {
      if (id === targetId) return reflection;
      if (Array.isArray((reflection as any).children)) {
        return (reflection as any).children.find((c: any) => c.id === targetId);
      }
      return undefined;
    },
    ...extra,
  };

  return reflection;
}

function createOptions() {
  return {
    maxDepth: 2,
    excludeTypes: [],
    showMembers: true,
    maxMembersPerClass: 10,
  };
}

describe('mermaidHtmlContentHook', () => {
  it('HTML ページでは pre.mermaid を返す', () => {
    const base = createReflection(2, 'Base', { url: 'classes/Base.html' });
    const derived = createReflection(1, 'Derived', {
      url: 'classes/Derived.html',
      extendedTypes: [
        {
          type: 'reference',
          reflection: base,
          name: 'Base',
        },
      ],
    });

    const project = createReflection(100, 'Project', {
      children: [derived, base],
    });
    const linkStore = new HtmlLinkStore();

    const hook = createMermaidHtmlContentHook(createOptions, linkStore);
    const html = JSX.renderElement(
      hook({
        urlTo: (r: any) => r.url,
        page: {
          url: 'classes/Derived.html',
          model: derived,
          project,
        },
      } as never),
    );

    expect(html).toBe(`<pre class="mermaid">classDiagram
class uml_Derived[&quot;Derived&quot;] {
}
class uml_Base[&quot;Base&quot;] {
}

uml_Base &lt;|-- uml_Derived

click uml_Derived href &quot;Derived.html&quot; &quot;Derived&quot;
click uml_Base href &quot;Base.html&quot; &quot;Base&quot;</pre>`);
  });

  it('content.begin hook を登録する', () => {
    const on = vi.fn();

    registerMermaidHtmlContentHook(
      { on } as never,
      createOptions,
      new HtmlLinkStore(),
    );

    expect(on).toHaveBeenCalledWith('content.begin', expect.any(Function));
  });
});
