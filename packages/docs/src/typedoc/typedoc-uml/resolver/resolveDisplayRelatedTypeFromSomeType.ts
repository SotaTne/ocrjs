import type { SomeType } from 'typedoc';
import {
  MULTIPLICITY,
  RELATED_TYPE_CHILD_ROLES,
  RELATED_TYPE_KINDS,
  type RelatedTypeChild,
  RelatedTypeNode,
} from '../model/relatedType.js';
import { DOC_TYPE_NAMES } from './resolveRelatedRefMapFromSomeType.js';
import { resolveRelatedTypeFromSomeType } from './resolveRelatedTypeFromSomeType.js';

function isSomeType(x: unknown): x is SomeType {
  return (
    !!x && typeof x === 'object' && 'type' in x && typeof x.type === 'string'
  );
}

function createArrayNode(elementType: SomeType): RelatedTypeNode {
  const child: RelatedTypeChild = {
    role: RELATED_TYPE_CHILD_ROLES.typeArg,
    node: resolveDisplayRelatedTypeFromSomeType(elementType),
  };

  return new RelatedTypeNode(
    RELATED_TYPE_KINDS.generic,
    'Array',
    MULTIPLICITY.exactlyOne,
    undefined,
    [child],
  );
}

export function resolveDisplayRelatedTypeFromSomeType(
  typeNode: SomeType,
): RelatedTypeNode {
  switch (typeNode.type) {
    case DOC_TYPE_NAMES.array:
      if (isSomeType(typeNode.elementType)) {
        return createArrayNode(typeNode.elementType);
      }

      return new RelatedTypeNode(
        RELATED_TYPE_KINDS.generic,
        'Array',
        MULTIPLICITY.exactlyOne,
        undefined,
        [],
      );

    case DOC_TYPE_NAMES.reference: {
      const typeArguments = Array.isArray(typeNode.typeArguments)
        ? typeNode.typeArguments.filter(isSomeType)
        : [];

      if (typeArguments.length === 0) {
        return resolveRelatedTypeFromSomeType(typeNode);
      }

      return new RelatedTypeNode(
        RELATED_TYPE_KINDS.generic,
        typeNode.name,
        MULTIPLICITY.exactlyOne,
        typeNode.reflection?.id,
        typeArguments.map((child) => ({
          role: RELATED_TYPE_CHILD_ROLES.typeArg,
          node: resolveDisplayRelatedTypeFromSomeType(child),
        })),
      );
    }

    case DOC_TYPE_NAMES.optional:
    case DOC_TYPE_NAMES.rest:
      if (isSomeType(typeNode.elementType)) {
        return resolveDisplayRelatedTypeFromSomeType(typeNode.elementType);
      }

      return resolveRelatedTypeFromSomeType(typeNode);

    case DOC_TYPE_NAMES.union:
    case DOC_TYPE_NAMES.intersection:
      return new RelatedTypeNode(
        RELATED_TYPE_KINDS.union,
        typeNode.type,
        MULTIPLICITY.exactlyOne,
        undefined,
        (Array.isArray(typeNode.types) ? typeNode.types : [])
          .filter(isSomeType)
          .map((child) => ({
            role: RELATED_TYPE_CHILD_ROLES.unionMember,
            node: resolveDisplayRelatedTypeFromSomeType(child),
          })),
      );

    case DOC_TYPE_NAMES.tuple:
      return new RelatedTypeNode(
        RELATED_TYPE_KINDS.tuple,
        'tuple',
        MULTIPLICITY.exactlyOne,
        undefined,
        (Array.isArray(typeNode.elements) ? typeNode.elements : [])
          .filter(isSomeType)
          .map((child) => ({
            role: RELATED_TYPE_CHILD_ROLES.tupleItem,
            node: resolveDisplayRelatedTypeFromSomeType(child),
          })),
      );

    default:
      return resolveRelatedTypeFromSomeType(typeNode);
  }
}
