import {
  Reflection,
  ReflectionKind,
  type ReflectionType,
  type SomeType,
  type TypeKindMap,
} from 'typedoc';
import type { ReflectionID } from '../types.js';
import {
  type AnyAnalyzedTypeShape,
  createTypeShape,
  TYPE_SHAPES,
  type TypeShape,
} from './typeRefs.js';

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

function isSomeType(x: unknown): x is SomeType {
  return (
    !!x && typeof x === 'object' && 'type' in x && typeof x.type === 'string'
  );
}

function isReflectionType(x: SomeType): x is ReflectionType {
  return x.type === DOC_TYPE_NAMES.reference;
}

// function analyzeType(typeNode: SomeType): TypeShape {
//   const nodeType = typeNode.type;
//   // if (isReflectionType(typeNode)) {
//   //   typeNode.
//   // }
// }

// これは型分析の結果をReflectionIDとして返す
export function analyzeTypeToRef(
  typeNode: SomeType,
  allows: Set<ReflectionID>,
): AnyAnalyzedTypeShape | undefined {
  if (!isSomeType(typeNode)) return;
  return;
}
