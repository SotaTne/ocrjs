import type { SomeType } from 'typedoc';
import type { ReflectionID } from '../types.js';

/**
 * Legacy flat resolver.
 *
 * NOTE:
 * 現在の本命は `resolveRelatedTypeFromSomeType` が返す中間表現です。
 * このファイルは移行完了までの互換用途として残しています。
 * 新規の機能追加先にはしないでください。
 */
type SomeTypeName = SomeType['type'];

interface IMultiplicity {
  exactlyOne: '1';
  zeroOrOne: '0..1';
  many: '*';
}

export type MultiplicityType = IMultiplicity[keyof IMultiplicity];

export type RelatedRefMap = Map<ReflectionID, MultiplicityType>;

/**
 * Legacy flat resolver が参照する TypeDoc の型名一覧です。
 */
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

/**
 * 値が TypeDoc の `SomeType` らしいかを判定します。
 */
function isSomeType(x: unknown): x is SomeType {
  return (
    !!x && typeof x === 'object' && 'type' in x && typeof x.type === 'string'
  );
}

/**
 * Multiplicity の強さを比較するための優先順位です。
 */
const MULTIPLICITY_RANK: Record<MultiplicityType, number> = {
  '1': 1,
  '0..1': 2,
  '*': 3,
};

/**
 * 2つの multiplicity を比較して、より強い方を返します。
 *
 * ルールは `* > 0..1 > 1` です。
 */
function mergeMultiplicity(
  current: MultiplicityType,
  next: MultiplicityType,
): MultiplicityType {
  return MULTIPLICITY_RANK[current] >= MULTIPLICITY_RANK[next] ? current : next;
}

/**
 * 参照先 id に対して multiplicity をマージしながら追加します。
 *
 * 同じ id がすでに存在する場合は `* > 0..1 > 1` のルールで
 * より強い multiplicity を保持します。
 */
function _addRelatedRef(
  out: RelatedRefMap,
  id: ReflectionID,
  multiplicity: MultiplicityType,
): void {
  const existing = out.get(id);
  if (!existing) {
    out.set(id, multiplicity);
    return;
  }

  out.set(id, mergeMultiplicity(existing, multiplicity));
}

/**
 * Legacy helper.
 *
 * NOTE:
 * 構造を保持しない flat な multiplicity 解決です。
 * いずれ新しい RelatedTypeNode ベースの解決へ置き換える想定です。
 */
export function getMultiplicityFromSomeType(
  typeNode: SomeType,
): MultiplicityType {
  if (!typeNode || typeof typeNode !== 'object') {
    return '1';
  }

  switch (typeNode.type) {
    case DOC_TYPE_NAMES.array:
    case DOC_TYPE_NAMES.rest: {
      const inner = isSomeType(typeNode.elementType)
        ? getMultiplicityFromSomeType(typeNode.elementType)
        : '1';
      return mergeMultiplicity('*', inner);
    }

    case DOC_TYPE_NAMES.optional: {
      const inner = isSomeType(typeNode.elementType)
        ? getMultiplicityFromSomeType(typeNode.elementType)
        : '1';
      return mergeMultiplicity('0..1', inner);
    }

    case DOC_TYPE_NAMES.namedTupleMember: {
      return isSomeType(typeNode.element)
        ? getMultiplicityFromSomeType(typeNode.element)
        : '1';
    }

    case DOC_TYPE_NAMES.tuple: {
      let current: MultiplicityType = '1';
      const elements = Array.isArray(typeNode.elements)
        ? typeNode.elements
        : [];
      for (const element of elements) {
        if (!isSomeType(element)) continue;
        current = mergeMultiplicity(
          current,
          getMultiplicityFromSomeType(element),
        );
        if (current === '*') return current;
      }
      return current;
    }

    case DOC_TYPE_NAMES.union:
    case DOC_TYPE_NAMES.intersection: {
      let current: MultiplicityType = '1';
      const types = Array.isArray(typeNode.types) ? typeNode.types : [];
      for (const child of types) {
        if (!isSomeType(child)) continue;
        current = mergeMultiplicity(
          current,
          getMultiplicityFromSomeType(child),
        );
        if (current === '*') return current;
      }
      return current;
    }

    case DOC_TYPE_NAMES.templateLiteral: {
      let current: MultiplicityType = '1';
      const tail = Array.isArray(typeNode.tail) ? typeNode.tail : [];
      for (const pair of tail) {
        const child = Array.isArray(pair) ? pair[0] : undefined;
        if (!isSomeType(child)) continue;
        current = mergeMultiplicity(
          current,
          getMultiplicityFromSomeType(child),
        );
        if (current === '*') return current;
      }
      return current;
    }

    case DOC_TYPE_NAMES.conditional: {
      let current: MultiplicityType = '1';
      const candidates = [
        typeNode.checkType,
        typeNode.extendsType,
        typeNode.trueType,
        typeNode.falseType,
      ];
      for (const child of candidates) {
        if (!isSomeType(child)) continue;
        current = mergeMultiplicity(
          current,
          getMultiplicityFromSomeType(child),
        );
        if (current === '*') return current;
      }
      return current;
    }

    case DOC_TYPE_NAMES.indexedAccess: {
      let current: MultiplicityType = '1';
      if (isSomeType(typeNode.objectType)) {
        current = mergeMultiplicity(
          current,
          getMultiplicityFromSomeType(typeNode.objectType),
        );
      }
      if (current === '*') return current;
      if (isSomeType(typeNode.indexType)) {
        current = mergeMultiplicity(
          current,
          getMultiplicityFromSomeType(typeNode.indexType),
        );
      }
      return current;
    }

    case DOC_TYPE_NAMES.inferred: {
      return isSomeType(typeNode.constraint)
        ? getMultiplicityFromSomeType(typeNode.constraint)
        : '1';
    }

    case DOC_TYPE_NAMES.mapped: {
      let current: MultiplicityType = '1';
      const candidates = [
        typeNode.parameterType,
        typeNode.templateType,
        typeNode.nameType,
      ];
      for (const child of candidates) {
        if (!isSomeType(child)) continue;
        current = mergeMultiplicity(
          current,
          getMultiplicityFromSomeType(child),
        );
        if (current === '*') return current;
      }
      return current;
    }

    case DOC_TYPE_NAMES.predicate: {
      return isSomeType(typeNode.targetType)
        ? getMultiplicityFromSomeType(typeNode.targetType)
        : '1';
    }

    case DOC_TYPE_NAMES.query: {
      return isSomeType(typeNode.queryType)
        ? getMultiplicityFromSomeType(typeNode.queryType)
        : '1';
    }

    case DOC_TYPE_NAMES.typeOperator: {
      return isSomeType(typeNode.target)
        ? getMultiplicityFromSomeType(typeNode.target)
        : '1';
    }

    default: {
      if (
        'typeArguments' in typeNode &&
        Array.isArray(typeNode.typeArguments) &&
        typeNode.typeArguments.length > 0
      ) {
        let current: MultiplicityType = '1';
        for (const child of typeNode.typeArguments) {
          if (!isSomeType(child)) continue;
          current = mergeMultiplicity(
            current,
            getMultiplicityFromSomeType(child),
          );
          if (current === '*') return current;
        }
        return current;
      }

      return '1';
    }
  }
}

/*
 * Legacy helper.
 *
 * NOTE:
 * 構造を保持せず、`ReflectionID -> multiplicity` の flat map に潰す実装。
 * 新しい relation 解決では `resolveRelatedTypeFromSomeType` を使うため、
 * ここは移行完了までコメントアウトして退避しておく。
 *
 * export function collectReferencedReflectionIdsFromDocTypeNode(...) { ... }
 */
