import { ReflectionKind } from 'typedoc';
import { describe, expect, it, vi } from 'vitest';
import { MarkdownLinkStore } from '../linker/markdownLinkStore.js';
import {
  createMermaidMarkdownContentHook,
  registerMermaidMarkdownContentHook,
} from './mermaidMarkdownContentHook.js';

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

describe('mermaidMarkdownContentHook', () => {
  it('Markdown ページでは mermaid fenced block を返す', () => {
    const entry = createReflection(2, 'Entry', { url: 'classes/Entry.md' });
    const owner = createReflection(1, 'Schedule', {
      url: 'classes/Schedule.md',
      children: [
        {
          id: 10,
          name: 'entries',
          flags: {},
          type: {
            type: 'array',
            elementType: {
              type: 'reference',
              reflection: entry,
              name: 'Entry',
            },
          },
        },
      ],
    });

    const project = createReflection(100, 'Project', {
      children: [owner, entry],
    });
    const linkStore = new MarkdownLinkStore();

    const hook = createMermaidMarkdownContentHook(createOptions, linkStore);
    const content = hook({
      urlTo: (r: any) => r.url,
      page: {
        url: 'classes/Schedule.md',
        model: owner,
        project,
      },
    } as never);

    expect(content).toBe(
      '```mermaid\nclassDiagram\nclass uml_Schedule["Schedule"] {\n  +entries : Array&lt;Entry&gt;\n}\nclass uml_Entry["Entry"] {\n}\n\numl_Schedule --> "*" uml_Entry : entries\n\nclick uml_Schedule href "Schedule.md" "Schedule"\nclick uml_Entry href "Entry.md" "Entry"\n```',
    );
  });

  it('content.begin hook を登録する', () => {
    const on = vi.fn();

    registerMermaidMarkdownContentHook(
      { on } as never,
      createOptions,
      new MarkdownLinkStore(),
    );

    expect(on).toHaveBeenCalledWith('content.begin', expect.any(Function));
  });
});
