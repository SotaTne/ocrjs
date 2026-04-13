import type { ReflectionID } from '../types.js';

/**
 * UML 用の独自型表現で扱う node 種別です。
 */
export const RELATED_TYPE_KINDS = {
  reference: 'reference',
  typeParameter: 'typeParameter',
  primitive: 'primitive',
  generic: 'generic',
  tuple: 'tuple',
  union: 'union',
  object: 'object',
  callable: 'callable',
} as const;

export type RelatedTypeKind =
  (typeof RELATED_TYPE_KINDS)[keyof typeof RELATED_TYPE_KINDS];

/**
 * relation 表示用の multiplicity です。
 */
export const MULTIPLICITY = {
  exactlyOne: '1',
  zeroOrOne: '0..1',
  many: '*',
} as const;

export type MultiplicityType = (typeof MULTIPLICITY)[keyof typeof MULTIPLICITY];

/**
 * callable / object / generic などの子ノードが担う役割です。
 */
export const RELATED_TYPE_CHILD_ROLES = {
  typeArg: 'typeArg',
  tupleItem: 'tupleItem',
  unionMember: 'unionMember',
  property: 'property',
  param: 'param',
  returns: 'returns',
} as const;

export type RelatedTypeChildRole =
  (typeof RELATED_TYPE_CHILD_ROLES)[keyof typeof RELATED_TYPE_CHILD_ROLES];

export type RelatedTypeChild = {
  role: RelatedTypeChildRole;
  node: RelatedTypeNode;
  label?: string;
};

export type RelatedTypeSyntax = {
  openToken?: string;
  closeToken?: string;
  separatorToken?: string;
  infixToken?: string;
  propertySeparatorToken?: string;
};

/**
 * node kind ごとの表示用トークンです。
 *
 * 実際の文字列化は formatter 側で行い、この層では素材だけを持ちます。
 */
export const RELATED_TYPE_SYNTAX: Record<RelatedTypeKind, RelatedTypeSyntax> = {
  reference: {},
  typeParameter: {},
  primitive: {},
  generic: {
    openToken: '<',
    closeToken: '>',
    separatorToken: ', ',
  },
  tuple: {
    openToken: '[',
    closeToken: ']',
    separatorToken: ', ',
  },
  union: {
    separatorToken: ' | ',
  },
  object: {
    openToken: '{ ',
    closeToken: ' }',
    propertySeparatorToken: '; ',
  },
  callable: {
    openToken: '(',
    closeToken: ')',
    separatorToken: ', ',
    infixToken: ' => ',
  },
};

/**
 * TypeDoc から切り出した、表示と relation 抽出の両方に使う独自 node です。
 */
export class RelatedTypeNode {
  readonly kind: RelatedTypeKind;
  readonly text: string;
  readonly multiplicity: MultiplicityType;
  readonly id: ReflectionID | undefined;
  readonly children: RelatedTypeChild[];

  constructor(
    kind: RelatedTypeKind,
    text: string,
    multiplicity: MultiplicityType = MULTIPLICITY.exactlyOne,
    id?: ReflectionID,
    children: RelatedTypeChild[] = [],
  ) {
    this.kind = kind;
    this.text = text;
    this.multiplicity = multiplicity;
    this.id = id;
    this.children = children;
  }

  get syntax(): RelatedTypeSyntax {
    return RELATED_TYPE_SYNTAX[this.kind];
  }

  withMultiplicity(multiplicity: MultiplicityType): RelatedTypeNode {
    return new RelatedTypeNode(
      this.kind,
      this.text,
      multiplicity,
      this.id,
      this.children,
    );
  }
}
