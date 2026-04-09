import { ReflectionKind } from 'typedoc';
import { describe, expect, it } from 'vitest';
import { collectModelsFromPages } from './collectModels.js';

function createOptions() {
  return {
    maxDepth: 2,
    excludeTypes: [],
    showMembers: true,
    maxMembersPerClass: 10,
  };
}

function createKindOf(...kinds: ReflectionKind[]) {
  return (kind: ReflectionKind | ReflectionKind[]) => {
    if (Array.isArray(kind)) {
      return kind.some((item) => kinds.includes(item));
    }

    return kinds.includes(kind);
  };
}

describe('collectModelsFromPages', () => {
  it('ページ全体を走査して後段の全体解析用の入力を集める', () => {
    const targets = new Set<number>();
    const modelById = new Map<number, unknown>();

    collectModelsFromPages(
      {
        pages: [
          {
            model: {
              id: 1,
              name: 'A',
              kindOf: createKindOf(ReflectionKind.Class),
            },
          },
          {
            model: {
              id: 2,
              name: 'B',
              kindOf: createKindOf(ReflectionKind.Interface),
            },
          },
        ],
      } as never,
      createOptions(),
      targets,
      modelById as never,
    );

    expect(targets).toEqual(new Set([1, 2]));
    expect([...modelById.keys()]).toEqual([1, 2]);
  });

  it('Class / Interface / TypeAlias を収集する', () => {
    const targets = new Set<number>();
    const modelById = new Map<number, unknown>();

    collectModelsFromPages(
      {
        pages: [
          {
            model: {
              id: 1,
              name: 'A',
              kindOf: createKindOf(ReflectionKind.Class),
            },
          },
          {
            model: {
              id: 2,
              name: 'B',
              kindOf: createKindOf(ReflectionKind.Interface),
            },
          },
          {
            model: {
              id: 3,
              name: 'Alias',
              kindOf: createKindOf(ReflectionKind.TypeAlias),
            },
          },
        ],
      } as never,
      createOptions(),
      targets,
      modelById as never,
    );

    expect([...targets]).toEqual([1, 2, 3]);
    expect(modelById.has(1)).toBe(true);
    expect(modelById.has(2)).toBe(true);
    expect(modelById.has(3)).toBe(true);
  });

  it('同名でも id が異なれば別の model として収集する', () => {
    const targets = new Set<number>();
    const modelById = new Map<number, unknown>();

    collectModelsFromPages(
      {
        pages: [
          {
            model: {
              id: 10,
              name: 'SameName',
              kindOf: createKindOf(ReflectionKind.Class),
            },
          },
          {
            model: {
              id: 20,
              name: 'SameName',
              kindOf: createKindOf(ReflectionKind.Interface),
            },
          },
        ],
      } as never,
      createOptions(),
      targets,
      modelById as never,
    );

    expect(targets).toEqual(new Set([10, 20]));
    expect(modelById.has(10)).toBe(true);
    expect(modelById.has(20)).toBe(true);
  });

  it('対象外 kind の model は無視する', () => {
    const targets = new Set<number>();
    const modelById = new Map<number, unknown>();

    collectModelsFromPages(
      {
        pages: [
          {
            model: {
              id: 1,
              name: 'Ignored',
              kindOf() {
                return false;
              },
            },
          },
        ],
      } as never,
      createOptions(),
      targets,
      modelById as never,
    );

    expect(targets.size).toBe(0);
    expect(modelById.size).toBe(0);
  });

  it('excludeTypes は Class や Interface には適用しない', () => {
    const targets = new Set<number>();
    const modelById = new Map<number, unknown>();

    collectModelsFromPages(
      {
        pages: [
          {
            model: {
              id: 1,
              name: 'IgnoredByNameButClass',
              kindOf: createKindOf(ReflectionKind.Class),
            },
          },
          {
            model: {
              id: 2,
              name: 'IgnoredByNameButInterface',
              kindOf: createKindOf(ReflectionKind.Interface),
            },
          },
        ],
      } as never,
      {
        ...createOptions(),
        excludeTypes: ['IgnoredByNameButClass', 'IgnoredByNameButInterface'],
      },
      targets,
      modelById as never,
    );

    expect(targets).toEqual(new Set([1, 2]));
    expect(modelById.has(1)).toBe(true);
    expect(modelById.has(2)).toBe(true);
  });

  it('excludeTypes に含まれる TypeAlias を除外する', () => {
    const targets = new Set<number>();
    const modelById = new Map<number, unknown>();

    collectModelsFromPages(
      {
        pages: [
          {
            model: {
              id: 1,
              name: 'IgnoredAlias',
              kindOf: createKindOf(ReflectionKind.TypeAlias),
            },
          },
        ],
      } as never,
      {
        ...createOptions(),
        excludeTypes: ['IgnoredAlias'],
      },
      targets,
      modelById as never,
    );

    expect(targets.size).toBe(0);
    expect(modelById.size).toBe(0);
  });
});
