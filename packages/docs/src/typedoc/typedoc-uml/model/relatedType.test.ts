import { describe, expect, it } from 'vitest';
import {
  MULTIPLICITY,
  RELATED_TYPE_CHILD_ROLES,
  RELATED_TYPE_KINDS,
  RELATED_TYPE_SYNTAX,
  type RelatedTypeChild,
  RelatedTypeNode,
} from './relatedType.js';

function renderNode(
  node: RelatedTypeNode,
  options?: { dropMultiplicity?: boolean },
): string {
  const dropMultiplicity = options?.dropMultiplicity ?? false;

  const base = (() => {
    switch (node.kind) {
      case RELATED_TYPE_KINDS.reference:
      case RELATED_TYPE_KINDS.typeParameter:
      case RELATED_TYPE_KINDS.primitive:
        return node.text;

      case RELATED_TYPE_KINDS.generic: {
        const args = node.children.map((child) =>
          renderNode(child.node, options),
        );
        if (args.length === 0) return node.text;
        return `${node.text}${node.syntax.openToken ?? ''}${args.join(node.syntax.separatorToken ?? ', ')}${node.syntax.closeToken ?? ''}`;
      }

      case RELATED_TYPE_KINDS.tuple: {
        const items = node.children.map((child) =>
          renderNode(child.node, options),
        );
        return `${node.syntax.openToken ?? ''}${items.join(node.syntax.separatorToken ?? ', ')}${node.syntax.closeToken ?? ''}`;
      }

      case RELATED_TYPE_KINDS.union: {
        return node.children
          .map((child) => renderNode(child.node, options))
          .join(node.syntax.separatorToken ?? ' | ');
      }

      case RELATED_TYPE_KINDS.object: {
        const fields = node.children.map((child: RelatedTypeChild) => {
          const label = child.label ? `${child.label}: ` : '';
          return `${label}${renderNode(child.node, options)}`;
        });
        return `${node.syntax.openToken ?? ''}${fields.join(node.syntax.propertySeparatorToken ?? '; ')}${node.syntax.closeToken ?? ''}`;
      }

      case RELATED_TYPE_KINDS.callable: {
        const params = node.children
          .filter((child) => child.role === RELATED_TYPE_CHILD_ROLES.param)
          .map((child) => {
            const label = child.label ? `${child.label}: ` : '';
            return `${label}${renderNode(child.node, options)}`;
          });
        const returns = node.children.find(
          (child) => child.role === RELATED_TYPE_CHILD_ROLES.returns,
        );
        const returnsString = returns
          ? renderNode(returns.node, options)
          : 'void';
        return `${node.syntax.openToken ?? ''}${params.join(node.syntax.separatorToken ?? ', ')}${node.syntax.closeToken ?? ''}${node.syntax.infixToken ?? ' => '}${returnsString}`;
      }

      default:
        return node.text;
    }
  })();

  if (dropMultiplicity || node.multiplicity === MULTIPLICITY.exactlyOne) {
    return base;
  }

  return `${base} (${node.multiplicity})`;
}

describe('RelatedTypeNode', () => {
  it('generic 用の表示素材を持てる', () => {
    const node = new RelatedTypeNode(
      RELATED_TYPE_KINDS.generic,
      'Result',
      MULTIPLICITY.exactlyOne,
      1,
      [
        {
          role: RELATED_TYPE_CHILD_ROLES.typeArg,
          node: new RelatedTypeNode(
            RELATED_TYPE_KINDS.reference,
            'Hoge',
            MULTIPLICITY.exactlyOne,
            2,
          ),
        },
        {
          role: RELATED_TYPE_CHILD_ROLES.typeArg,
          node: new RelatedTypeNode(
            RELATED_TYPE_KINDS.reference,
            'Hoge2',
            MULTIPLICITY.exactlyOne,
            3,
          ),
        },
      ],
    );

    expect(node.text).toBe('Result');
    expect(node.syntax).toEqual(RELATED_TYPE_SYNTAX.generic);
    expect(node.children[0]?.node.text).toBe('Hoge');
    expect(node.children[1]?.node.text).toBe('Hoge2');
  });

  it('generic を単純な formatter で再構成できる', () => {
    const node = new RelatedTypeNode(
      RELATED_TYPE_KINDS.generic,
      'Result',
      MULTIPLICITY.exactlyOne,
      1,
      [
        {
          role: RELATED_TYPE_CHILD_ROLES.typeArg,
          node: new RelatedTypeNode(
            RELATED_TYPE_KINDS.reference,
            'Hoge',
            MULTIPLICITY.exactlyOne,
            2,
          ),
        },
        {
          role: RELATED_TYPE_CHILD_ROLES.typeArg,
          node: new RelatedTypeNode(
            RELATED_TYPE_KINDS.reference,
            'Hoge2',
            MULTIPLICITY.exactlyOne,
            3,
          ),
        },
      ],
    );

    expect(renderNode(node)).toBe('Result<Hoge, Hoge2>');
  });

  it('callable 用の表示素材を持てる', () => {
    const node = new RelatedTypeNode(
      RELATED_TYPE_KINDS.callable,
      'callable',
      MULTIPLICITY.exactlyOne,
      undefined,
      [
        {
          role: RELATED_TYPE_CHILD_ROLES.param,
          label: 'value',
          node: new RelatedTypeNode(
            RELATED_TYPE_KINDS.reference,
            'Foo',
            MULTIPLICITY.exactlyOne,
            1,
          ),
        },
        {
          role: RELATED_TYPE_CHILD_ROLES.returns,
          node: new RelatedTypeNode(
            RELATED_TYPE_KINDS.reference,
            'Bar',
            MULTIPLICITY.exactlyOne,
            2,
          ),
        },
      ],
    );

    expect(node.syntax.openToken).toBe('(');
    expect(node.syntax.closeToken).toBe(')');
    expect(node.syntax.infixToken).toBe(' => ');
    expect(node.children[0]?.role).toBe(RELATED_TYPE_CHILD_ROLES.param);
    expect(node.children[0]?.label).toBe('value');
    expect(node.children[1]?.role).toBe(RELATED_TYPE_CHILD_ROLES.returns);
  });

  it('callable を単純な formatter で再構成できる', () => {
    const node = new RelatedTypeNode(
      RELATED_TYPE_KINDS.callable,
      'callable',
      MULTIPLICITY.exactlyOne,
      undefined,
      [
        {
          role: RELATED_TYPE_CHILD_ROLES.param,
          label: 'value',
          node: new RelatedTypeNode(
            RELATED_TYPE_KINDS.reference,
            'Foo',
            MULTIPLICITY.exactlyOne,
            1,
          ),
        },
        {
          role: RELATED_TYPE_CHILD_ROLES.returns,
          node: new RelatedTypeNode(
            RELATED_TYPE_KINDS.reference,
            'Bar',
            MULTIPLICITY.exactlyOne,
            2,
          ),
        },
      ],
    );

    expect(renderNode(node)).toBe('(value: Foo) => Bar');
  });

  it('union と multiplicity を単純な formatter で再構成できる', () => {
    const node = new RelatedTypeNode(
      RELATED_TYPE_KINDS.union,
      'union',
      MULTIPLICITY.exactlyOne,
      undefined,
      [
        {
          role: RELATED_TYPE_CHILD_ROLES.unionMember,
          node: new RelatedTypeNode(
            RELATED_TYPE_KINDS.reference,
            'Foo',
            MULTIPLICITY.exactlyOne,
            1,
          ),
        },
        {
          role: RELATED_TYPE_CHILD_ROLES.unionMember,
          node: new RelatedTypeNode(
            RELATED_TYPE_KINDS.reference,
            'Bar',
            MULTIPLICITY.many,
            2,
          ),
        },
      ],
    );

    expect(renderNode(node)).toBe('Foo | Bar (*)');
    expect(renderNode(node, { dropMultiplicity: true })).toBe('Foo | Bar');
  });

  it('複雑な構造体でも単純な formatter で再構成できる', () => {
    const node = new RelatedTypeNode(
      RELATED_TYPE_KINDS.object,
      'object',
      MULTIPLICITY.exactlyOne,
      undefined,
      [
        {
          role: RELATED_TYPE_CHILD_ROLES.property,
          label: 'items',
          node: new RelatedTypeNode(
            RELATED_TYPE_KINDS.generic,
            'Result',
            MULTIPLICITY.exactlyOne,
            1,
            [
              {
                role: RELATED_TYPE_CHILD_ROLES.typeArg,
                node: new RelatedTypeNode(
                  RELATED_TYPE_KINDS.reference,
                  'Foo',
                  MULTIPLICITY.exactlyOne,
                  2,
                ),
              },
              {
                role: RELATED_TYPE_CHILD_ROLES.typeArg,
                node: new RelatedTypeNode(
                  RELATED_TYPE_KINDS.union,
                  'union',
                  MULTIPLICITY.exactlyOne,
                  undefined,
                  [
                    {
                      role: RELATED_TYPE_CHILD_ROLES.unionMember,
                      node: new RelatedTypeNode(
                        RELATED_TYPE_KINDS.reference,
                        'Bar',
                        MULTIPLICITY.zeroOrOne,
                        3,
                      ),
                    },
                    {
                      role: RELATED_TYPE_CHILD_ROLES.unionMember,
                      node: new RelatedTypeNode(
                        RELATED_TYPE_KINDS.reference,
                        'Baz',
                        MULTIPLICITY.many,
                        4,
                      ),
                    },
                  ],
                ),
              },
            ],
          ),
        },
        {
          role: RELATED_TYPE_CHILD_ROLES.property,
          label: 'transform',
          node: new RelatedTypeNode(
            RELATED_TYPE_KINDS.callable,
            'callable',
            MULTIPLICITY.exactlyOne,
            undefined,
            [
              {
                role: RELATED_TYPE_CHILD_ROLES.param,
                label: 'input',
                node: new RelatedTypeNode(
                  RELATED_TYPE_KINDS.tuple,
                  'tuple',
                  MULTIPLICITY.exactlyOne,
                  undefined,
                  [
                    {
                      role: RELATED_TYPE_CHILD_ROLES.tupleItem,
                      node: new RelatedTypeNode(
                        RELATED_TYPE_KINDS.reference,
                        'Qux',
                        MULTIPLICITY.exactlyOne,
                        5,
                      ),
                    },
                    {
                      role: RELATED_TYPE_CHILD_ROLES.tupleItem,
                      node: new RelatedTypeNode(
                        RELATED_TYPE_KINDS.reference,
                        'Quux',
                        MULTIPLICITY.zeroOrOne,
                        6,
                      ),
                    },
                  ],
                ),
              },
              {
                role: RELATED_TYPE_CHILD_ROLES.returns,
                node: new RelatedTypeNode(
                  RELATED_TYPE_KINDS.reference,
                  'Output',
                  MULTIPLICITY.exactlyOne,
                  7,
                ),
              },
            ],
          ),
        },
      ],
    );

    expect(renderNode(node)).toBe(
      '{ items: Result<Foo, Bar (0..1) | Baz (*)>; transform: (input: [Qux, Quux (0..1)]) => Output }',
    );
    expect(renderNode(node, { dropMultiplicity: true })).toBe(
      '{ items: Result<Foo, Bar | Baz>; transform: (input: [Qux, Quux]) => Output }',
    );
  });

  it('withMultiplicity で multiplicity を差し替えられる', () => {
    const node = new RelatedTypeNode(
      RELATED_TYPE_KINDS.reference,
      'Foo',
      MULTIPLICITY.many,
      1,
    );

    const updated = node.withMultiplicity(MULTIPLICITY.zeroOrOne);

    expect(node.multiplicity).toBe(MULTIPLICITY.many);
    expect(updated.text).toBe('Foo');
    expect(updated.multiplicity).toBe(MULTIPLICITY.zeroOrOne);
  });
});
