import { ReflectionKind } from 'typedoc';
import { describe, expect, it } from 'vitest';
import {
  createGraphIndex,
  isDeclarationReflectionLike,
} from './createGraph.js';

describe('isDeclarationReflectionLike', () => {
  it('nullish や primitive は false を返す', () => {
    expect(isDeclarationReflectionLike(null)).toBe(false);
    expect(isDeclarationReflectionLike(undefined)).toBe(false);
    expect(isDeclarationReflectionLike('x')).toBe(false);
    expect(isDeclarationReflectionLike(1)).toBe(false);
  });

  it('id が number でない場合は false を返す', () => {
    expect(
      isDeclarationReflectionLike({
        id: '1',
        kindOf() {
          return true;
        },
      }),
    ).toBe(false);
  });

  it('kindOf が function でない場合は false を返す', () => {
    expect(
      isDeclarationReflectionLike({
        id: 1,
        kindOf: true,
      }),
    ).toBe(false);
  });

  it('最小構成の reflection-like object は true を返す', () => {
    expect(
      isDeclarationReflectionLike({
        id: 1,
        kindOf() {
          return true;
        },
      }),
    ).toBe(true);
  });
});

describe('createGraphIndex', () => {
  it('extends / implements / association / dependency を抽出する', () => {
    const targets = new Set([1, 2, 3, 4, 5]);
    const modelById = new Map<number, unknown>([
      [
        1,
        {
          id: 1,
          kindOf(kind: unknown) {
            return kind === ReflectionKind.Class;
          },
          extendedTypes: [{ type: 'reference', reflection: { id: 2 } }],
          implementedTypes: [{ type: 'reference', reflection: { id: 3 } }],
          children: [
            {
              name: 'prop',
              type: { type: 'reference', reflection: { id: 4 } },
            },
            {
              name: 'method',
              signatures: [
                {
                  parameters: [
                    {
                      name: 'input',
                      type: { type: 'reference', reflection: { id: 5 } },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    ]);

    const graph = createGraphIndex(targets, modelById);

    expect(graph.nodes).toEqual(new Set([1, 2, 3, 4, 5]));
    expect(graph.edgesById.get(1)?.get(2)).toEqual(new Set(['extends']));
    expect(graph.edgesById.get(1)?.get(3)).toEqual(new Set(['implements']));
    expect(graph.edgesById.get(1)?.get(4)).toEqual(new Set(['association']));
    expect(graph.edgesById.get(1)?.get(5)).toEqual(new Set(['dependency']));
  });

  it('targets 外への edge は張らない', () => {
    const targets = new Set([1]);
    const modelById = new Map<number, unknown>([
      [
        1,
        {
          id: 1,
          kindOf() {
            return true;
          },
          extendedTypes: [{ type: 'reference', reflection: { id: 99 } }],
        },
      ],
    ]);

    const graph = createGraphIndex(targets, modelById);

    expect(graph.edgesById.size).toBe(0);
  });

  it('既定では TypeAlias の association / dependency 解析を打ち切る', () => {
    const targets = new Set([1, 2]);
    const modelById = new Map<number, unknown>([
      [
        1,
        {
          id: 1,
          kindOf(kind: unknown) {
            return kind === ReflectionKind.TypeAlias;
          },
          children: [
            {
              name: 'prop',
              type: { type: 'reference', reflection: { id: 2 } },
            },
          ],
        },
      ],
    ]);

    const graph = createGraphIndex(targets, modelById);

    expect(graph.edgesById.size).toBe(0);
  });
});
