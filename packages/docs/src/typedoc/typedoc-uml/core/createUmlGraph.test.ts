import { ReflectionKind } from 'typedoc';
import { describe, expect, it } from 'vitest';
import { MULTIPLICITY, RELATED_TYPE_KINDS } from '../model/relatedType.js';
import {
  UML_EDGE_KINDS,
  UML_NODE_KINDS,
  UML_VISIBILITY,
} from '../model/umlGraph.js';
import { createUmlGraph } from './createUmlGraph.js';

function createKindOf(...allowed: ReflectionKind[]) {
  return (value: ReflectionKind | ReflectionKind[]) => {
    const values = Array.isArray(value) ? value : [value];
    return values.some((item) => allowed.includes(item));
  };
}

describe('createUmlGraph', () => {
  it('class / interface を UML node として構築する', () => {
    const targets = new Set([1, 2]);
    const modelById = new Map<number, unknown>([
      [
        1,
        {
          id: 1,
          name: 'Schedule',
          kindOf: createKindOf(ReflectionKind.Class),
          flags: {},
          children: [],
        },
      ],
      [
        2,
        {
          id: 2,
          name: 'IContent',
          kindOf: createKindOf(ReflectionKind.Interface),
          flags: {},
          children: [],
        },
      ],
    ]);

    const graph = createUmlGraph(targets, modelById);

    expect(graph.nodeList).toEqual([
      {
        id: 'Schedule',
        reflectionId: 1,
        name: 'Schedule',
        kind: UML_NODE_KINDS.class,
        members: [],
      },
      {
        id: 'IContent',
        reflectionId: 2,
        name: 'IContent',
        kind: UML_NODE_KINDS.interface,
        members: [],
      },
    ]);
  });

  it('extends と implements を UML edge に変換する', () => {
    const targets = new Set([1, 2, 3]);
    const modelById = new Map<number, unknown>([
      [
        1,
        {
          id: 1,
          name: 'OnnxWebModelLoader',
          kindOf: createKindOf(ReflectionKind.Class),
          flags: {},
          children: [],
          extendedTypes: [
            { type: 'reference', name: 'ErrorableBase', reflection: { id: 2 } },
          ],
          implementedTypes: [
            { type: 'reference', name: 'IModelLoader', reflection: { id: 3 } },
          ],
        },
      ],
      [
        2,
        {
          id: 2,
          name: 'ErrorableBase',
          kindOf: createKindOf(ReflectionKind.Class),
          flags: { isAbstract: true },
          children: [],
        },
      ],
      [
        3,
        {
          id: 3,
          name: 'IModelLoader',
          kindOf: createKindOf(ReflectionKind.Interface),
          flags: {},
          children: [],
        },
      ],
    ]);

    const graph = createUmlGraph(targets, modelById);

    expect(graph.edges).toEqual([
      {
        from: 'ErrorableBase',
        to: 'OnnxWebModelLoader',
        kind: UML_EDGE_KINDS.extends,
      },
      {
        from: 'IModelLoader',
        to: 'OnnxWebModelLoader',
        kind: UML_EDGE_KINDS.implements,
      },
    ]);
  });

  it('A extends Array<Hoge> の場合は intermediate node を経由して結ぶ', () => {
    const targets = new Set([1, 2]);
    const modelById = new Map<number, unknown>([
      [
        1,
        {
          id: 1,
          name: 'A',
          kindOf: createKindOf(ReflectionKind.Class),
          flags: {},
          children: [],
          extendedTypes: [
            {
              type: 'reference',
              name: 'Array',
              typeArguments: [
                {
                  type: 'reference',
                  name: 'Hoge',
                  reflection: { id: 2 },
                },
              ],
            },
          ],
        },
      ],
      [
        2,
        {
          id: 2,
          name: 'Hoge',
          kindOf: createKindOf(ReflectionKind.Class),
          flags: {},
          children: [],
        },
      ],
    ]);

    const graph = createUmlGraph(targets, modelById);

    expect(graph.getNode('Array<Hoge>')).toEqual({
      id: 'Array<Hoge>',
      name: 'Array<Hoge>',
      kind: UML_NODE_KINDS.intermediate,
      members: [],
    });
    expect(graph.edges).toContainEqual({
      from: 'Array<Hoge>',
      to: 'A',
      kind: UML_EDGE_KINDS.extends,
    });
    expect(graph.edges).toContainEqual({
      from: 'Array<Hoge>',
      to: 'Hoge',
      kind: UML_EDGE_KINDS.contains,
    });
  });

  it('field を member と association edge に変換する', () => {
    const targets = new Set([1, 2]);
    const modelById = new Map<number, unknown>([
      [
        1,
        {
          id: 1,
          name: 'Schedule',
          kindOf: createKindOf(ReflectionKind.Class),
          flags: {},
          children: [
            {
              name: 'content',
              flags: { isPrivate: true },
              type: {
                type: 'reference',
                name: 'Content',
                reflection: { id: 2 },
              },
            },
          ],
        },
      ],
      [
        2,
        {
          id: 2,
          name: 'Content',
          kindOf: createKindOf(ReflectionKind.Class),
          flags: {},
          children: [],
        },
      ],
    ]);

    const graph = createUmlGraph(targets, modelById);
    const schedule = graph.getNode('Schedule');

    expect(schedule?.members).toHaveLength(1);
    expect(schedule?.members[0]?.name).toBe('content');
    expect(schedule?.members[0]?.visibility).toBe(UML_VISIBILITY.private);
    expect(schedule?.members[0]?.typeNode?.text).toBe('Content');

    expect(graph.edges).toContainEqual({
      from: 'Schedule',
      to: 'Content',
      kind: UML_EDGE_KINDS.association,
      memberName: 'content',
      visibility: UML_VISIBILITY.private,
      multiplicity: MULTIPLICITY.exactlyOne,
    });
  });

  it('method を member と return type association edge に変換する', () => {
    const targets = new Set([1, 2]);
    const modelById = new Map<number, unknown>([
      [
        1,
        {
          id: 1,
          name: 'Schedule',
          kindOf: createKindOf(ReflectionKind.Class),
          flags: {},
          children: [
            {
              name: 'getEntries',
              flags: {},
              signatures: [
                {
                  parameters: [
                    {
                      name: 'limit',
                      type: {
                        type: 'intrinsic',
                        name: 'number',
                      },
                    },
                  ],
                  type: {
                    type: 'reference',
                    name: 'EntryCollection',
                    reflection: { id: 2 },
                  },
                },
              ],
            },
          ],
        },
      ],
      [
        2,
        {
          id: 2,
          name: 'EntryCollection',
          kindOf: createKindOf(ReflectionKind.Class),
          flags: {},
          children: [],
        },
      ],
    ]);

    const graph = createUmlGraph(targets, modelById);
    const schedule = graph.getNode('Schedule');

    expect(schedule?.members).toContainEqual(
      expect.objectContaining({
        name: 'getEntries(limit : number)',
        visibility: UML_VISIBILITY.public,
        typeNode: expect.objectContaining({
          text: 'EntryCollection',
        }),
      }),
    );
    expect(graph.edges).toContainEqual({
      from: 'Schedule',
      to: 'EntryCollection',
      kind: UML_EDGE_KINDS.association,
      memberName: 'getEntries',
      visibility: UML_VISIBILITY.public,
      multiplicity: MULTIPLICITY.exactlyOne,
    });
  });

  it('self 参照の member は表示するが self edge は作らない', () => {
    const targets = new Set([1]);
    const modelById = new Map<number, unknown>([
      [
        1,
        {
          id: 1,
          name: 'SelfRef',
          kindOf: createKindOf(ReflectionKind.Class),
          flags: {},
          children: [
            {
              name: 'selfValue',
              flags: {},
              type: {
                type: 'reference',
                name: 'SelfRef',
                reflection: { id: 1 },
              },
            },
            {
              name: 'getSelf',
              flags: {},
              signatures: [
                {
                  parameters: [],
                  type: {
                    type: 'reference',
                    name: 'SelfRef',
                    reflection: { id: 1 },
                  },
                },
              ],
            },
          ],
        },
      ],
    ]);

    const graph = createUmlGraph(targets, modelById);
    const selfRef = graph.getNode('SelfRef');

    expect(selfRef?.members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'selfValue',
        }),
        expect.objectContaining({
          name: 'getSelf()',
        }),
      ]),
    );
    expect(
      graph.edges.some((edge) => edge.from === 'SelfRef' && edge.to === 'SelfRef'),
    ).toBe(false);
  });

  it('Array<Foo> のような property は Foo への association として解決する', () => {
    const targets = new Set([1, 2]);
    const modelById = new Map<number, unknown>([
      [
        1,
        {
          id: 1,
          name: 'Schedule',
          kindOf: createKindOf(ReflectionKind.Class),
          flags: {},
          children: [
            {
              name: 'items',
              flags: {},
              type: {
                type: 'array',
                elementType: {
                  type: 'reference',
                  name: 'Content',
                  reflection: { id: 2 },
                },
              },
            },
          ],
        },
      ],
      [
        2,
        {
          id: 2,
          name: 'Content',
          kindOf: createKindOf(ReflectionKind.Class),
          flags: {},
          children: [],
        },
      ],
    ]);

    const graph = createUmlGraph(targets, modelById);
    const schedule = graph.getNode('Schedule');

    expect(schedule?.members[0]?.typeNode?.kind).toBe(RELATED_TYPE_KINDS.generic);
    expect(schedule?.members[0]?.typeNode?.text).toBe('Array');
    expect(schedule?.members[0]?.typeNode?.children[0]?.node.text).toBe(
      'Content',
    );
    expect(graph.edges).toContainEqual({
      from: 'Schedule',
      to: 'Content',
      kind: UML_EDGE_KINDS.association,
      memberName: 'items',
      visibility: UML_VISIBILITY.public,
      multiplicity: MULTIPLICITY.many,
    });
  });

  it('target に含まれていない参照先でも edge を張るなら node を補完する', () => {
    const targets = new Set([1]);
    const modelById = new Map<number, unknown>([
      [
        1,
        {
          id: 1,
          name: 'Polygon',
          kindOf: createKindOf(ReflectionKind.Interface),
          flags: {},
          children: [
            {
              name: 'points',
              flags: {},
              type: {
                type: 'array',
                elementType: {
                  type: 'reference',
                  name: 'Point',
                  reflection: { id: 2 },
                },
              },
            },
          ],
        },
      ],
      [
        2,
        {
          id: 2,
          name: 'Point',
          kindOf: createKindOf(ReflectionKind.Interface),
          flags: {},
          children: [],
        },
      ],
    ]);

    const graph = createUmlGraph(targets, modelById);

    expect(graph.getNode('Point')).toEqual({
      id: 'Point',
      reflectionId: 2,
      name: 'Point',
      kind: UML_NODE_KINDS.interface,
      members: [],
    });
    expect(graph.edges).toContainEqual({
      from: 'Polygon',
      to: 'Point',
      kind: UML_EDGE_KINDS.association,
      memberName: 'points',
      visibility: UML_VISIBILITY.public,
      multiplicity: MULTIPLICITY.many,
    });
  });

  it('Any<T> のような generic type parameter は intermediate node 配下に残す', () => {
    const targets = new Set([1]);
    const modelById = new Map<number, unknown>([
      [
        1,
        {
          id: 1,
          name: 'Derived',
          kindOf: createKindOf(ReflectionKind.Class),
          flags: {},
          children: [],
          extendedTypes: [
            {
              type: 'reference',
              name: 'Any',
              reflection: { id: 99 },
              typeArguments: [
                {
                  type: 'reference',
                  name: 'T',
                  refersToTypeParameter: true,
                },
              ],
            },
          ],
        },
      ],
    ]);

    const graph = createUmlGraph(targets, modelById);

    expect(graph.getNode('Any<T>')).toEqual({
      id: 'Any<T>',
      name: 'Any<T>',
      kind: UML_NODE_KINDS.intermediate,
      members: [],
    });
    expect(graph.getNode('T')).toEqual({
      id: 'T',
      name: 'T',
      kind: UML_NODE_KINDS.intermediate,
      members: [],
    });
    expect(graph.edges).toContainEqual({
      from: 'Any<T>',
      to: 'Derived',
      kind: UML_EDGE_KINDS.extends,
    });
    expect(graph.edges).toContainEqual({
      from: 'Any<T>',
      to: 'T',
      kind: UML_EDGE_KINDS.contains,
    });
  });

  it('Result<Option<Number>, Error> のようなネストした generic を intermediate node として分解する', () => {
    const targets = new Set([1, 2, 3]);
    const modelById = new Map<number, unknown>([
      [
        1,
        {
          id: 1,
          name: 'Derived',
          kindOf: createKindOf(ReflectionKind.Class),
          flags: {},
          children: [],
          extendedTypes: [
            {
              type: 'reference',
              name: 'Result',
              typeArguments: [
                {
                  type: 'reference',
                  name: 'Option',
                  typeArguments: [
                    {
                      type: 'reference',
                      name: 'Number',
                      reflection: { id: 2 },
                    },
                  ],
                },
                {
                  type: 'reference',
                  name: 'Error',
                  reflection: { id: 3 },
                },
              ],
            },
          ],
        },
      ],
      [
        2,
        {
          id: 2,
          name: 'Number',
          kindOf: createKindOf(ReflectionKind.Class),
          flags: {},
          children: [],
        },
      ],
      [
        3,
        {
          id: 3,
          name: 'Error',
          kindOf: createKindOf(ReflectionKind.Class),
          flags: {},
          children: [],
        },
      ],
    ]);

    const graph = createUmlGraph(targets, modelById);

    expect(graph.getNode('Result<Option<Number>, Error>')).toBeDefined();
    expect(graph.getNode('Option<Number>')).toBeDefined();
    expect(graph.edges).toContainEqual({
      from: 'Result<Option<Number>, Error>',
      to: 'Derived',
      kind: UML_EDGE_KINDS.extends,
    });
    expect(graph.edges).toContainEqual({
      from: 'Result<Option<Number>, Error>',
      to: 'Option<Number>',
      kind: UML_EDGE_KINDS.contains,
    });
    expect(graph.edges).toContainEqual({
      from: 'Result<Option<Number>, Error>',
      to: 'Error',
      kind: UML_EDGE_KINDS.contains,
    });
    expect(graph.edges).toContainEqual({
      from: 'Option<Number>',
      to: 'Number',
      kind: UML_EDGE_KINDS.contains,
    });
  });

  it('IErrorable<IContour> のような generic instance は generic declaration にも結びつく', () => {
    const targets = new Set([1, 2]);
    const modelById = new Map<number, unknown>([
      [
        1,
        {
          id: 1,
          name: 'IContour',
          kindOf: createKindOf(ReflectionKind.Interface),
          flags: {},
          children: [],
          extendedTypes: [
            {
              type: 'reference',
              name: 'IErrorable',
              reflection: { id: 2 },
              typeArguments: [
                {
                  type: 'reference',
                  name: 'IContour',
                  reflection: { id: 1 },
                },
              ],
            },
          ],
        },
      ],
      [
        2,
        {
          id: 2,
          name: 'IErrorable',
          kindOf: createKindOf(ReflectionKind.Interface),
          flags: {},
          typeParameters: [{ name: 'T' }],
          children: [],
        },
      ],
    ]);

    const graph = createUmlGraph(targets, modelById);

    expect(graph.getNode('IErrorable<IContour>')).toEqual({
      id: 'IErrorable<IContour>',
      name: 'IErrorable<IContour>',
      kind: UML_NODE_KINDS.intermediate,
      members: [],
    });
    expect(graph.getNode('IErrorable<T>')).toEqual({
      id: 'IErrorable<T>',
      reflectionId: 2,
      name: 'IErrorable<T>',
      kind: UML_NODE_KINDS.interface,
      members: [],
    });
    expect(graph.edges).toContainEqual({
      from: 'IErrorable<IContour>',
      to: 'IContour',
      kind: UML_EDGE_KINDS.extends,
    });
    expect(graph.edges).toContainEqual({
      from: 'IErrorable<IContour>',
      to: 'IErrorable<T>',
      kind: UML_EDGE_KINDS.contains,
    });
    expect(graph.edges).toContainEqual({
      from: 'IErrorable<IContour>',
      to: 'IContour',
      kind: UML_EDGE_KINDS.contains,
    });
  });

  it('generic の中に union がある場合も intermediate node として保持する', () => {
    const targets = new Set([1, 2, 3]);
    const modelById = new Map<number, unknown>([
      [
        1,
        {
          id: 1,
          name: 'Derived',
          kindOf: createKindOf(ReflectionKind.Class),
          flags: {},
          children: [],
          extendedTypes: [
            {
              type: 'reference',
              name: 'Result',
              typeArguments: [
                {
                  type: 'union',
                  types: [
                    {
                      type: 'reference',
                      name: 'Ok',
                      reflection: { id: 2 },
                    },
                    {
                      type: 'reference',
                      name: 'Err',
                      reflection: { id: 3 },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      [
        2,
        {
          id: 2,
          name: 'Ok',
          kindOf: createKindOf(ReflectionKind.Class),
          flags: {},
          children: [],
        },
      ],
      [
        3,
        {
          id: 3,
          name: 'Err',
          kindOf: createKindOf(ReflectionKind.Class),
          flags: {},
          children: [],
        },
      ],
    ]);

    const graph = createUmlGraph(targets, modelById);

    expect(graph.getNode('Result<Ok | Err>')).toBeDefined();
    expect(graph.getNode('Ok | Err')).toBeDefined();
    expect(graph.edges).toContainEqual({
      from: 'Result<Ok | Err>',
      to: 'Derived',
      kind: UML_EDGE_KINDS.extends,
    });
    expect(graph.edges).toContainEqual({
      from: 'Result<Ok | Err>',
      to: 'Ok | Err',
      kind: UML_EDGE_KINDS.contains,
    });
    expect(graph.edges).toContainEqual({
      from: 'Ok | Err',
      to: 'Ok',
      kind: UML_EDGE_KINDS.contains,
    });
    expect(graph.edges).toContainEqual({
      from: 'Ok | Err',
      to: 'Err',
      kind: UML_EDGE_KINDS.contains,
    });
  });

  it('Entry | Meta のような property union は独立した intermediate node として保持する', () => {
    const targets = new Set([1, 2, 3]);
    const modelById = new Map<number, unknown>([
      [
        1,
        {
          id: 1,
          name: 'Registry',
          kindOf: createKindOf(ReflectionKind.Class),
          flags: {},
          children: [
            {
              name: 'entry',
              flags: {},
              type: {
                type: 'union',
                types: [
                  {
                    type: 'reference',
                    name: 'Entry',
                    reflection: { id: 2 },
                  },
                  {
                    type: 'reference',
                    name: 'Meta',
                    reflection: { id: 3 },
                  },
                ],
              },
            },
          ],
        },
      ],
      [
        2,
        {
          id: 2,
          name: 'Entry',
          kindOf: createKindOf(ReflectionKind.Class),
          flags: {},
          children: [],
        },
      ],
      [
        3,
        {
          id: 3,
          name: 'Meta',
          kindOf: createKindOf(ReflectionKind.Class),
          flags: {},
          children: [],
        },
      ],
    ]);

    const graph = createUmlGraph(targets, modelById);

    expect(graph.getNode('Entry | Meta')).toEqual({
      id: 'Entry | Meta',
      name: 'Entry | Meta',
      kind: UML_NODE_KINDS.intermediate,
      members: [],
    });
    expect(graph.edges).toContainEqual({
      from: 'Registry',
      to: 'Entry | Meta',
      kind: UML_EDGE_KINDS.association,
      memberName: 'entry',
      visibility: UML_VISIBILITY.public,
      multiplicity: MULTIPLICITY.exactlyOne,
    });
    expect(graph.edges).toContainEqual({
      from: 'Entry | Meta',
      to: 'Entry',
      kind: UML_EDGE_KINDS.contains,
    });
    expect(graph.edges).toContainEqual({
      from: 'Entry | Meta',
      to: 'Meta',
      kind: UML_EDGE_KINDS.contains,
    });
  });

  it('Map<string, Entry | [Meta, Array<Tag>]> のような property は union / tuple を intermediate node として保持する', () => {
    const targets = new Set([1, 2, 3, 4]);
    const modelById = new Map<number, unknown>([
      [
        1,
        {
          id: 1,
          name: 'Registry',
          kindOf: createKindOf(ReflectionKind.Class),
          flags: {},
          children: [
            {
              name: 'entries',
              flags: {},
              type: {
                type: 'reference',
                name: 'Map',
                typeArguments: [
                  {
                    type: 'intrinsic',
                    name: 'string',
                  },
                  {
                    type: 'union',
                    types: [
                      {
                        type: 'reference',
                        name: 'Entry',
                        reflection: { id: 2 },
                      },
                      {
                        type: 'tuple',
                        elements: [
                          {
                            type: 'reference',
                            name: 'Meta',
                            reflection: { id: 3 },
                          },
                          {
                            type: 'array',
                            elementType: {
                              type: 'reference',
                              name: 'Tag',
                              reflection: { id: 4 },
                            },
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          ],
        },
      ],
      [
        2,
        {
          id: 2,
          name: 'Entry',
          kindOf: createKindOf(ReflectionKind.Class),
          flags: {},
          children: [],
        },
      ],
      [
        3,
        {
          id: 3,
          name: 'Meta',
          kindOf: createKindOf(ReflectionKind.Class),
          flags: {},
          children: [],
        },
      ],
      [
        4,
        {
          id: 4,
          name: 'Tag',
          kindOf: createKindOf(ReflectionKind.Class),
          flags: {},
          children: [],
        },
      ],
    ]);

    const graph = createUmlGraph(targets, modelById);

    expect(graph.getNode('Entry | [Meta, Tag]')).toEqual({
      id: 'Entry | [Meta, Tag]',
      name: 'Entry | [Meta, Tag]',
      kind: UML_NODE_KINDS.intermediate,
      members: [],
    });
    expect(graph.getNode('[Meta, Tag]')).toEqual({
      id: '[Meta, Tag]',
      name: '[Meta, Tag]',
      kind: UML_NODE_KINDS.intermediate,
      members: [],
    });
    expect(graph.edges).toContainEqual({
      from: 'Registry',
      to: 'Entry | [Meta, Tag]',
      kind: UML_EDGE_KINDS.association,
      memberName: 'entries',
      visibility: UML_VISIBILITY.public,
      multiplicity: MULTIPLICITY.exactlyOne,
    });
    expect(graph.edges).toContainEqual({
      from: 'Entry | [Meta, Tag]',
      to: 'Entry',
      kind: UML_EDGE_KINDS.contains,
    });
    expect(graph.edges).toContainEqual({
      from: 'Entry | [Meta, Tag]',
      to: '[Meta, Tag]',
      kind: UML_EDGE_KINDS.contains,
    });
    expect(graph.edges).toContainEqual({
      from: '[Meta, Tag]',
      to: 'Meta',
      kind: UML_EDGE_KINDS.contains,
    });
    expect(graph.edges).toContainEqual({
      from: '[Meta, Tag]',
      to: 'Tag',
      kind: UML_EDGE_KINDS.contains,
    });
  });

  it('class N extends Array<Value> は Array<Value> intermediate node を経由しつつ Value へ contains でつながる', () => {
    const targets = new Set([1, 2]);
    const modelById = new Map<number, unknown>([
      [
        1,
        {
          id: 1,
          name: 'N',
          kindOf: createKindOf(ReflectionKind.Class),
          flags: {},
          children: [],
          extendedTypes: [
            {
              type: 'reference',
              name: 'Array',
              typeArguments: [
                {
                  type: 'reference',
                  name: 'Value',
                  reflection: { id: 2 },
                },
              ],
            },
          ],
        },
      ],
      [
        2,
        {
          id: 2,
          name: 'Value',
          kindOf: createKindOf(ReflectionKind.Class),
          flags: {},
          children: [],
        },
      ],
    ]);

    const graph = createUmlGraph(targets, modelById);

    expect(graph.getNode('Array<Value>')).toEqual({
      id: 'Array<Value>',
      name: 'Array<Value>',
      kind: UML_NODE_KINDS.intermediate,
      members: [],
    });
    expect(graph.edges).toContainEqual({
      from: 'Array<Value>',
      to: 'N',
      kind: UML_EDGE_KINDS.extends,
    });
    expect(graph.edges).toContainEqual({
      from: 'Array<Value>',
      to: 'Value',
      kind: UML_EDGE_KINDS.contains,
    });
  });
});
