import type { SomeType } from 'typedoc';
import type { ReflectionID } from '../types.js';

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

export function collectReferencedReflectionIdsFromDocTypeNode(
  docTypeNode: SomeType,
  out: Set<ReflectionID>,
): void {
  if (!docTypeNode || typeof docTypeNode !== 'object') return;

  switch (docTypeNode.type) {
    case DOC_TYPE_NAMES.reference: {
      const ref = docTypeNode.reflection;
      if (ref && typeof ref.id === 'number') out.add(ref.id);

      const typeArgs = docTypeNode.typeArguments;
      if (Array.isArray(typeArgs)) {
        for (const a of typeArgs) {
          if (isSomeType(a))
            collectReferencedReflectionIdsFromDocTypeNode(a, out);
        }
      }
      return;
    }

    case DOC_TYPE_NAMES.reflection: {
      const decl = docTypeNode.declaration;
      if (decl && typeof decl.id === 'number') out.add(decl.id);
      return;
    }

    case DOC_TYPE_NAMES.array:
    case DOC_TYPE_NAMES.optional:
    case DOC_TYPE_NAMES.rest: {
      const el = docTypeNode.elementType;
      if (isSomeType(el))
        collectReferencedReflectionIdsFromDocTypeNode(el, out);
      return;
    }

    case DOC_TYPE_NAMES.union:
    case DOC_TYPE_NAMES.intersection: {
      const types = docTypeNode.types;
      if (Array.isArray(types)) {
        for (const t of types) {
          if (isSomeType(t))
            collectReferencedReflectionIdsFromDocTypeNode(t, out);
        }
      }
      return;
    }

    case DOC_TYPE_NAMES.tuple: {
      const els = docTypeNode.elements;
      if (Array.isArray(els)) {
        for (const t of els) {
          if (isSomeType(t))
            collectReferencedReflectionIdsFromDocTypeNode(t, out);
        }
      }
      return;
    }

    case DOC_TYPE_NAMES.namedTupleMember: {
      const el = docTypeNode.element;
      if (isSomeType(el))
        collectReferencedReflectionIdsFromDocTypeNode(el, out);
      return;
    }

    case DOC_TYPE_NAMES.templateLiteral: {
      // tail: [SomeType, string][]
      const tail = docTypeNode.tail;
      if (Array.isArray(tail)) {
        for (const pair of tail) {
          const t = Array.isArray(pair) ? pair[0] : undefined;
          if (isSomeType(t))
            collectReferencedReflectionIdsFromDocTypeNode(t, out);
        }
      }
      return;
    }

    case DOC_TYPE_NAMES.conditional: {
      const checkType = docTypeNode.checkType;
      const extendsType = docTypeNode.extendsType;
      const trueType = docTypeNode.trueType;
      const falseType = docTypeNode.falseType;

      if (isSomeType(checkType))
        collectReferencedReflectionIdsFromDocTypeNode(checkType, out);
      if (isSomeType(extendsType))
        collectReferencedReflectionIdsFromDocTypeNode(extendsType, out);
      if (isSomeType(trueType))
        collectReferencedReflectionIdsFromDocTypeNode(trueType, out);
      if (isSomeType(falseType))
        collectReferencedReflectionIdsFromDocTypeNode(falseType, out);
      return;
    }

    case DOC_TYPE_NAMES.indexedAccess: {
      const objectType = docTypeNode.objectType;
      const indexType = docTypeNode.indexType;
      if (isSomeType(objectType))
        collectReferencedReflectionIdsFromDocTypeNode(objectType, out);
      if (isSomeType(indexType))
        collectReferencedReflectionIdsFromDocTypeNode(indexType, out);
      return;
    }

    case DOC_TYPE_NAMES.inferred: {
      const constraint = docTypeNode.constraint;
      if (isSomeType(constraint))
        collectReferencedReflectionIdsFromDocTypeNode(constraint, out);
      return;
    }

    case DOC_TYPE_NAMES.mapped: {
      const parameterType = docTypeNode.parameterType;
      const templateType = docTypeNode.templateType;
      const nameType = docTypeNode.nameType;

      if (isSomeType(parameterType))
        collectReferencedReflectionIdsFromDocTypeNode(parameterType, out);
      if (isSomeType(templateType))
        collectReferencedReflectionIdsFromDocTypeNode(templateType, out);
      if (isSomeType(nameType))
        collectReferencedReflectionIdsFromDocTypeNode(nameType, out);
      return;
    }

    case DOC_TYPE_NAMES.predicate: {
      const targetType = docTypeNode.targetType;
      if (isSomeType(targetType))
        collectReferencedReflectionIdsFromDocTypeNode(targetType, out);
      return;
    }

    case DOC_TYPE_NAMES.query: {
      const q = docTypeNode.queryType;
      if (isSomeType(q)) collectReferencedReflectionIdsFromDocTypeNode(q, out);
      return;
    }

    case DOC_TYPE_NAMES.typeOperator: {
      const target = docTypeNode.target;
      if (isSomeType(target))
        collectReferencedReflectionIdsFromDocTypeNode(target, out);
      return;
    }

    default: {
      if (
        !docTypeNode ||
        typeof docTypeNode !== 'object' ||
        !('typeArguments' in docTypeNode)
      )
        return;
      const typeArgs = docTypeNode.typeArguments;
      if (Array.isArray(typeArgs)) {
        for (const a of typeArgs) {
          if (isSomeType(a))
            collectReferencedReflectionIdsFromDocTypeNode(a, out);
        }
      }
      return;
    }
  }
}
