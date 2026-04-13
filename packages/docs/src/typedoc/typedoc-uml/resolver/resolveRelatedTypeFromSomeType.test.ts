import type { SomeType } from 'typedoc';
import { describe, expect, it } from 'vitest';
import {
  MULTIPLICITY,
  RELATED_TYPE_CHILD_ROLES,
  RELATED_TYPE_KINDS,
} from '../model/relatedType.js';
import { resolveRelatedTypeFromSomeType } from './resolveRelatedTypeFromSomeType.js';

describe('resolveRelatedTypeFromSomeType', () => {
  it('Result<Hoge, Hoge2> を generic node に変換する', () => {
    const node = resolveRelatedTypeFromSomeType({
      type: 'reference',
      name: 'Result',
      reflection: { id: 1 },
      typeArguments: [
        {
          type: 'reference',
          name: 'Hoge',
          reflection: { id: 2 },
        },
        {
          type: 'reference',
          name: 'Hoge2',
          reflection: { id: 3 },
        },
      ],
    } as SomeType);

    expect(node.kind).toBe(RELATED_TYPE_KINDS.generic);
    expect(node.id).toBe(1);
    expect(node.children).toHaveLength(2);
    expect(node.children[0]?.role).toBe(RELATED_TYPE_CHILD_ROLES.typeArg);
    expect(node.children[0]?.node.text).toBe('Hoge');
    expect(node.children[1]?.node.text).toBe('Hoge2');
  });

  it('Any<T> の T を typeParameter node として保持する', () => {
    const node = resolveRelatedTypeFromSomeType({
      type: 'reference',
      name: 'Any',
      reflection: { id: 1 },
      typeArguments: [
        {
          type: 'reference',
          name: 'T',
          refersToTypeParameter: true,
        },
      ],
    } as SomeType);

    expect(node.kind).toBe(RELATED_TYPE_KINDS.generic);
    expect(node.text).toBe('Any');
    expect(node.children[0]?.node.kind).toBe(RELATED_TYPE_KINDS.typeParameter);
    expect(node.children[0]?.node.text).toBe('T');
    expect(node.children[0]?.node.id).toBeUndefined();
  });

  it('Foo | Bar[] を union node に変換し、Bar に * を残す', () => {
    const node = resolveRelatedTypeFromSomeType({
      type: 'union',
      types: [
        {
          type: 'reference',
          name: 'Foo',
          reflection: { id: 1 },
        },
        {
          type: 'array',
          elementType: {
            type: 'reference',
            name: 'Bar',
            reflection: { id: 2 },
          },
        },
      ],
    } as SomeType);

    expect(node.kind).toBe(RELATED_TYPE_KINDS.union);
    expect(node.children[0]?.node.text).toBe('Foo');
    expect(node.children[0]?.node.multiplicity).toBe('1');
    expect(node.children[1]?.node.text).toBe('Bar');
    expect(node.children[1]?.node.multiplicity).toBe('*');
  });

  it('inline object を object node に変換する', () => {
    const node = resolveRelatedTypeFromSomeType({
      type: 'reflection',
      declaration: {
        id: 10,
        children: [
          {
            name: 'value',
            type: {
              type: 'reference',
              name: 'Foo',
              reflection: { id: 11 },
            },
          },
        ],
      },
    } as SomeType);

    expect(node.kind).toBe(RELATED_TYPE_KINDS.object);
    expect(node.children[0]?.label).toBe('value');
    expect(node.children[0]?.node.text).toBe('Foo');
  });

  it('intrinsic type を primitive node に変換する', () => {
    const node = resolveRelatedTypeFromSomeType({
      type: 'intrinsic',
      name: 'string',
    } as SomeType);

    expect(node.kind).toBe(RELATED_TYPE_KINDS.primitive);
    expect(node.text).toBe('string');
  });

  it('Option<Option<Foo>> を壊さず解決できる', () => {
    const node = resolveRelatedTypeFromSomeType({
      type: 'optional',
      elementType: {
        type: 'optional',
        elementType: {
          type: 'reference',
          name: 'Foo',
          reflection: { id: 1 },
        },
      },
    } as SomeType);

    expect(node.kind).toBe(RELATED_TYPE_KINDS.reference);
    expect(node.text).toBe('Foo');
    expect(node.multiplicity).toBe(MULTIPLICITY.zeroOrOne);
  });

  it('Promise<Result<Foo[]>> のような wrapper ネストを壊さず解決できる', () => {
    const node = resolveRelatedTypeFromSomeType({
      type: 'reference',
      name: 'Promise',
      reflection: { id: 100 },
      typeArguments: [
        {
          type: 'reference',
          name: 'Result',
          reflection: { id: 200 },
          typeArguments: [
            {
              type: 'array',
              elementType: {
                type: 'reference',
                name: 'Foo',
                reflection: { id: 300 },
              },
            },
          ],
        },
      ],
    } as SomeType);

    expect(node.kind).toBe(RELATED_TYPE_KINDS.generic);
    expect(node.text).toBe('Promise');
    expect(node.children[0]?.node.kind).toBe(RELATED_TYPE_KINDS.generic);
    expect(node.children[0]?.node.text).toBe('Result');
    expect(node.children[0]?.node.children[0]?.node.text).toBe('Foo');
    expect(node.children[0]?.node.children[0]?.node.multiplicity).toBe(
      MULTIPLICITY.many,
    );
  });

  it('Result<Option<Number>, Error> のようなネストした generic を壊さず解決できる', () => {
    const node = resolveRelatedTypeFromSomeType({
      type: 'reference',
      name: 'Result',
      reflection: { id: 1 },
      typeArguments: [
        {
          type: 'reference',
          name: 'Option',
          reflection: { id: 2 },
          typeArguments: [
            {
              type: 'reference',
              name: 'Number',
              reflection: { id: 3 },
            },
          ],
        },
        {
          type: 'reference',
          name: 'Error',
          reflection: { id: 4 },
        },
      ],
    } as SomeType);

    expect(node.kind).toBe(RELATED_TYPE_KINDS.generic);
    expect(node.text).toBe('Result');
    expect(node.children[0]?.node.kind).toBe(RELATED_TYPE_KINDS.generic);
    expect(node.children[0]?.node.text).toBe('Option');
    expect(node.children[0]?.node.children[0]?.node.text).toBe('Number');
    expect(node.children[1]?.node.text).toBe('Error');
  });

  it('generic の中に union がある場合も壊さず解決できる', () => {
    const node = resolveRelatedTypeFromSomeType({
      type: 'reference',
      name: 'Result',
      reflection: { id: 1 },
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
    } as SomeType);

    expect(node.kind).toBe(RELATED_TYPE_KINDS.generic);
    expect(node.children[0]?.node.kind).toBe(RELATED_TYPE_KINDS.union);
    expect(
      node.children[0]?.node.children.map((child) => child.node.text),
    ).toEqual(['Ok', 'Err']);
  });

  it('Foo | [Bar?] のような union と tuple のネストを壊さず解決できる', () => {
    const node = resolveRelatedTypeFromSomeType({
      type: 'union',
      types: [
        {
          type: 'reference',
          name: 'Foo',
          reflection: { id: 1 },
        },
        {
          type: 'tuple',
          elements: [
            {
              type: 'optional',
              elementType: {
                type: 'reference',
                name: 'Bar',
                reflection: { id: 2 },
              },
            },
          ],
        },
      ],
    } as SomeType);

    expect(node.kind).toBe(RELATED_TYPE_KINDS.union);
    expect(node.children[0]?.node.text).toBe('Foo');
    expect(node.children[1]?.node.kind).toBe(RELATED_TYPE_KINDS.tuple);
    expect(node.children[1]?.node.children[0]?.node.text).toBe('Bar');
    expect(node.children[1]?.node.children[0]?.node.multiplicity).toBe(
      MULTIPLICITY.zeroOrOne,
    );
  });

  it('conditional type の各枝を壊さず解決できる', () => {
    const node = resolveRelatedTypeFromSomeType({
      type: 'conditional',
      checkType: {
        type: 'reference',
        name: 'Foo',
        reflection: { id: 1 },
      },
      extendsType: {
        type: 'reference',
        name: 'Bar',
        reflection: { id: 2 },
      },
      trueType: {
        type: 'reference',
        name: 'Baz',
        reflection: { id: 3 },
      },
      falseType: {
        type: 'reference',
        name: 'Qux',
        reflection: { id: 4 },
      },
    } as SomeType);

    expect(node.kind).toBe(RELATED_TYPE_KINDS.union);
    expect(node.children).toHaveLength(4);
    expect(node.children.map((child) => child.node.text)).toEqual([
      'Foo',
      'Bar',
      'Baz',
      'Qux',
    ]);
  });

  it('mapped type を壊さず generic 的な中間表現に解決できる', () => {
    const node = resolveRelatedTypeFromSomeType({
      type: 'mapped',
      parameterType: {
        type: 'query',
        queryType: {
          type: 'reference',
          name: 'Foo',
          reflection: { id: 10 },
        },
      },
      templateType: {
        type: 'reference',
        name: 'Bar',
        reflection: { id: 11 },
      },
      nameType: {
        type: 'reference',
        name: 'Baz',
        reflection: { id: 12 },
      },
    } as SomeType);

    expect(node.kind).toBe(RELATED_TYPE_KINDS.generic);
    expect(node.text).toBe('mapped');
    expect(node.children.map((child) => child.node.text)).toEqual([
      'Foo',
      'Bar',
      'Baz',
    ]);
  });

  it('callable を引数と戻り値つきで保持できる', () => {
    const node = resolveRelatedTypeFromSomeType({
      type: 'reflection',
      declaration: {
        id: 500,
        signatures: [
          {
            parameters: [
              {
                name: 'value',
                type: {
                  type: 'reference',
                  name: 'Foo',
                  reflection: { id: 501 },
                },
              },
            ],
            type: {
              type: 'reference',
              name: 'Bar',
              reflection: { id: 502 },
            },
          },
        ],
      },
    } as SomeType);

    expect(node.kind).toBe(RELATED_TYPE_KINDS.callable);
    expect(node.children).toHaveLength(2);
    expect(node.children[0]?.role).toBe(RELATED_TYPE_CHILD_ROLES.param);
    expect(node.children[0]?.label).toBe('value');
    expect(node.children[0]?.node.text).toBe('Foo');
    expect(node.children[1]?.role).toBe(RELATED_TYPE_CHILD_ROLES.returns);
    expect(node.children[1]?.node.text).toBe('Bar');
  });

  it('callback + generic を含む複雑な callable を保持できる', () => {
    const node = resolveRelatedTypeFromSomeType({
      type: 'reflection',
      declaration: {
        id: 700,
        signatures: [
          {
            parameters: [
              {
                name: 'callback',
                type: {
                  type: 'reflection',
                  declaration: {
                    id: 701,
                    signatures: [
                      {
                        parameters: [
                          {
                            name: 'value',
                            type: {
                              type: 'reference',
                              name: 'Option',
                              reflection: { id: 702 },
                              typeArguments: [
                                {
                                  type: 'reference',
                                  name: 'Number',
                                  reflection: { id: 703 },
                                },
                              ],
                            },
                          },
                        ],
                        type: {
                          type: 'reference',
                          name: 'Result',
                          reflection: { id: 704 },
                          typeArguments: [
                            {
                              type: 'reference',
                              name: 'Ok',
                              reflection: { id: 705 },
                            },
                            {
                              type: 'reference',
                              name: 'Error',
                              reflection: { id: 706 },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              },
            ],
            type: {
              type: 'reference',
              name: 'Promise',
              reflection: { id: 707 },
              typeArguments: [
                {
                  type: 'reference',
                  name: 'VoidResult',
                  reflection: { id: 708 },
                },
              ],
            },
          },
        ],
      },
    } as SomeType);

    expect(node.kind).toBe(RELATED_TYPE_KINDS.callable);
    expect(node.children[0]?.role).toBe(RELATED_TYPE_CHILD_ROLES.param);
    expect(node.children[0]?.node.kind).toBe(RELATED_TYPE_KINDS.callable);
    expect(node.children[0]?.node.children[0]?.node.text).toBe('Option');
    expect(
      node.children[0]?.node.children[0]?.node.children[0]?.node.text,
    ).toBe('Number');
    expect(node.children[0]?.node.children[1]?.node.text).toBe('Result');
    expect(node.children[1]?.node.text).toBe('Promise');
  });
});
