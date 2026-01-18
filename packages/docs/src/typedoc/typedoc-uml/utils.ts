import type {
  ArrayType,
  ConditionalType,
  IndexedAccessType,
  InferredType,
  IntersectionType,
  IntrinsicType,
  LiteralType,
  MappedType,
  NamedTupleMember,
  OptionalType,
  PredicateType,
  QueryType,
  ReferenceType,
  ReflectionType,
  RestType,
  SomeType,
  TemplateLiteralType,
  TupleType,
  TypeOperatorType,
  UnionType,
  UnknownType,
} from 'typedoc';

export type Mode = 'html' | 'md' | 'unknown';

export function getMode(url: string): Mode {
  const u = url.split('?')[0]?.toLowerCase();

  if (u?.endsWith('.html')) return 'html';
  if (u?.endsWith('.md')) return 'md';
  return 'unknown';
}

type SomeTypeName = SomeType['type'];

export const DOC_TYPE_NAMES = {
  array: 'array',
  conditional: 'conditional',
  indexedAccess: 'indexedAccess',
  inferred: 'inferred',
  intersection: 'intersection',
  intrinsic: 'intrinsic',
  literal: 'literal',
  mapped: 'mapped',
  optional: 'optional',
  predicate: 'predicate',
  query: 'query',
  reference: 'reference',
  reflection: 'reflection',
  rest: 'rest',
  templateLiteral: 'templateLiteral',
  tuple: 'tuple',
  namedTupleMember: 'namedTupleMember',
  typeOperator: 'typeOperator',
  union: 'union',
  unknown: 'unknown',
} as const satisfies Record<SomeTypeName, SomeTypeName>;

export function isArrayType(x: SomeType): x is ArrayType {
  return x.type === DOC_TYPE_NAMES.array;
}

export function isConditionalType(x: SomeType): x is ConditionalType {
  return x.type === DOC_TYPE_NAMES.conditional;
}

export function isIndexedAccessType(x: SomeType): x is IndexedAccessType {
  return x.type === DOC_TYPE_NAMES.indexedAccess;
}

export function isInferredType(x: SomeType): x is InferredType {
  return x.type === DOC_TYPE_NAMES.inferred;
}

export function isIntersectionType(x: SomeType): x is IntersectionType {
  return x.type === DOC_TYPE_NAMES.intersection;
}

export function isIntrinsicType(x: SomeType): x is IntrinsicType {
  return x.type === DOC_TYPE_NAMES.intrinsic;
}

export function isLiteralType(x: SomeType): x is LiteralType {
  return x.type === DOC_TYPE_NAMES.literal;
}

export function isMappedType(x: SomeType): x is MappedType {
  return x.type === DOC_TYPE_NAMES.mapped;
}

export function isOptionalType(x: SomeType): x is OptionalType {
  return x.type === DOC_TYPE_NAMES.optional;
}

export function isPredicateType(x: SomeType): x is PredicateType {
  return x.type === DOC_TYPE_NAMES.predicate;
}

export function isQueryType(x: SomeType): x is QueryType {
  return x.type === DOC_TYPE_NAMES.query;
}

export function isReferenceType(x: SomeType): x is ReferenceType {
  return x.type === DOC_TYPE_NAMES.reference;
}

export function isReflectionType(x: SomeType): x is ReflectionType {
  return x.type === DOC_TYPE_NAMES.reflection;
}

export function isRestType(x: SomeType): x is RestType {
  return x.type === DOC_TYPE_NAMES.rest;
}

export function isTemplateLiteralType(x: SomeType): x is TemplateLiteralType {
  return x.type === DOC_TYPE_NAMES.templateLiteral;
}

export function isTupleType(x: SomeType): x is TupleType {
  return x.type === DOC_TYPE_NAMES.tuple;
}

export function isNamedTupleMemberType(x: SomeType): x is NamedTupleMember {
  return x.type === DOC_TYPE_NAMES.namedTupleMember;
}

export function isTypeOperatorType(x: SomeType): x is TypeOperatorType {
  return x.type === DOC_TYPE_NAMES.typeOperator;
}

export function isUnionType(x: SomeType): x is UnionType {
  return x.type === DOC_TYPE_NAMES.union;
}

export function isUnknownType(x: SomeType): x is UnknownType {
  return x.type === DOC_TYPE_NAMES.unknown;
}
