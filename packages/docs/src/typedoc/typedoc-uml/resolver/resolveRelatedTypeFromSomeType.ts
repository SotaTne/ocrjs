import type { SomeType } from 'typedoc';
import {
  MULTIPLICITY,
  type MultiplicityType,
  RELATED_TYPE_CHILD_ROLES,
  RELATED_TYPE_KINDS,
  type RelatedTypeChild,
  RelatedTypeNode,
} from '../model/relatedType.js';
import {
  DOC_TYPE_NAMES,
  getMultiplicityFromSomeType,
} from './resolveRelatedRefMapFromSomeType.js';

function isSomeType(x: unknown): x is SomeType {
  return (
    !!x && typeof x === 'object' && 'type' in x && typeof x.type === 'string'
  );
}

function withInheritedMultiplicity(
  node: RelatedTypeNode,
  inherited: MultiplicityType = MULTIPLICITY.exactlyOne,
): RelatedTypeNode {
  const next =
    inherited === MULTIPLICITY.many || node.multiplicity === MULTIPLICITY.many
      ? MULTIPLICITY.many
      : inherited === MULTIPLICITY.zeroOrOne ||
          node.multiplicity === MULTIPLICITY.zeroOrOne
        ? MULTIPLICITY.zeroOrOne
        : MULTIPLICITY.exactlyOne;

  return node.withMultiplicity(next);
}

function createChildren(
  items: Array<{
    role: (typeof RELATED_TYPE_CHILD_ROLES)[keyof typeof RELATED_TYPE_CHILD_ROLES];
    typeNode: SomeType | undefined;
    label?: string;
  }>,
): RelatedTypeChild[] {
  const out: RelatedTypeChild[] = [];

  for (const item of items) {
    if (!item.typeNode) continue;
    const child: RelatedTypeChild = {
      role: item.role,
      node: resolveRelatedTypeFromSomeType(item.typeNode),
    };

    if (item.label !== undefined) {
      child.label = item.label;
    }

    out.push(child);
  }

  return out;
}

function resolveCallableReflection(
  typeNode: SomeType,
): RelatedTypeNode | undefined {
  if (typeNode.type !== DOC_TYPE_NAMES.reflection) return undefined;

  const declaration = typeNode.declaration;
  const signatures = Array.isArray(declaration?.signatures)
    ? declaration.signatures
    : [];

  const signature = signatures[0];
  if (!signature) return undefined;

  const params = Array.isArray(signature.parameters)
    ? createChildren(
        signature.parameters.map((param) => ({
          role: RELATED_TYPE_CHILD_ROLES.param,
          label: param?.name,
          typeNode: isSomeType(param?.type) ? param.type : undefined,
        })),
      )
    : [];

  const returns = isSomeType(signature.type)
    ? [
        {
          role: RELATED_TYPE_CHILD_ROLES.returns,
          node: resolveRelatedTypeFromSomeType(signature.type),
        } satisfies RelatedTypeChild,
      ]
    : [];

  return new RelatedTypeNode(
    RELATED_TYPE_KINDS.callable,
    'callable',
    getMultiplicityFromSomeType(typeNode),
    declaration?.id,
    [...params, ...returns],
  );
}

/**
 * TypeDoc の SomeType を UML 用の独自 node に変換します。
 */
export function resolveRelatedTypeFromSomeType(
  typeNode: SomeType,
): RelatedTypeNode {
  switch (typeNode.type) {
    case DOC_TYPE_NAMES.reference: {
      if (typeNode.refersToTypeParameter === true) {
        return new RelatedTypeNode(
          RELATED_TYPE_KINDS.typeParameter,
          typeNode.name,
          getMultiplicityFromSomeType(typeNode),
        );
      }

      const typeArguments = Array.isArray(typeNode.typeArguments)
        ? typeNode.typeArguments.filter(isSomeType)
        : [];

      if (typeArguments.length === 0) {
        return new RelatedTypeNode(
          RELATED_TYPE_KINDS.reference,
          typeNode.name,
          getMultiplicityFromSomeType(typeNode),
          typeNode.reflection?.id,
        );
      }

      return new RelatedTypeNode(
        RELATED_TYPE_KINDS.generic,
        typeNode.name,
        getMultiplicityFromSomeType(typeNode),
        typeNode.reflection?.id,
        typeArguments.map((child) => ({
          role: RELATED_TYPE_CHILD_ROLES.typeArg,
          node: resolveRelatedTypeFromSomeType(child),
        })),
      );
    }

    case DOC_TYPE_NAMES.intrinsic:
      return new RelatedTypeNode(
        RELATED_TYPE_KINDS.primitive,
        typeNode.name,
        getMultiplicityFromSomeType(typeNode),
      );

    case DOC_TYPE_NAMES.literal:
      return new RelatedTypeNode(
        RELATED_TYPE_KINDS.primitive,
        String(typeNode.value),
        getMultiplicityFromSomeType(typeNode),
      );

    case DOC_TYPE_NAMES.reflection: {
      const callable = resolveCallableReflection(typeNode);
      if (callable) {
        return callable;
      }

      const declaration = typeNode.declaration;
      const children = Array.isArray(declaration?.children)
        ? createChildren(
            declaration.children.map((child) => ({
              role: RELATED_TYPE_CHILD_ROLES.property,
              label: child?.name,
              typeNode: isSomeType(child?.type) ? child.type : undefined,
            })),
          )
        : [];

      return new RelatedTypeNode(
        RELATED_TYPE_KINDS.object,
        'object',
        getMultiplicityFromSomeType(typeNode),
        declaration?.id,
        children,
      );
    }

    case DOC_TYPE_NAMES.array:
    case DOC_TYPE_NAMES.optional:
    case DOC_TYPE_NAMES.rest: {
      if (isSomeType(typeNode.elementType)) {
        return withInheritedMultiplicity(
          resolveRelatedTypeFromSomeType(typeNode.elementType),
          getMultiplicityFromSomeType(typeNode),
        );
      }

      return new RelatedTypeNode(
        RELATED_TYPE_KINDS.primitive,
        'unknown',
        getMultiplicityFromSomeType(typeNode),
      );
    }

    case DOC_TYPE_NAMES.union:
    case DOC_TYPE_NAMES.intersection: {
      const types = Array.isArray(typeNode.types)
        ? typeNode.types.filter(isSomeType)
        : [];
      return new RelatedTypeNode(
        RELATED_TYPE_KINDS.union,
        typeNode.type,
        getMultiplicityFromSomeType(typeNode),
        undefined,
        types.map((child) => ({
          role: RELATED_TYPE_CHILD_ROLES.unionMember,
          node: resolveRelatedTypeFromSomeType(child),
        })),
      );
    }

    case DOC_TYPE_NAMES.tuple: {
      const elements = Array.isArray(typeNode.elements)
        ? typeNode.elements.filter(isSomeType)
        : [];
      return new RelatedTypeNode(
        RELATED_TYPE_KINDS.tuple,
        'tuple',
        getMultiplicityFromSomeType(typeNode),
        undefined,
        elements.map((child) => ({
          role: RELATED_TYPE_CHILD_ROLES.tupleItem,
          node: resolveRelatedTypeFromSomeType(child),
        })),
      );
    }

    case DOC_TYPE_NAMES.namedTupleMember: {
      if (isSomeType(typeNode.element)) {
        return resolveRelatedTypeFromSomeType(typeNode.element);
      }
      break;
    }

    case DOC_TYPE_NAMES.query: {
      if (isSomeType(typeNode.queryType)) {
        return resolveRelatedTypeFromSomeType(typeNode.queryType);
      }
      break;
    }

    case DOC_TYPE_NAMES.typeOperator: {
      if (isSomeType(typeNode.target)) {
        return resolveRelatedTypeFromSomeType(typeNode.target);
      }
      break;
    }

    case DOC_TYPE_NAMES.indexedAccess: {
      if (isSomeType(typeNode.objectType)) {
        return resolveRelatedTypeFromSomeType(typeNode.objectType);
      }
      break;
    }

    case DOC_TYPE_NAMES.mapped: {
      const children = createChildren([
        {
          role: RELATED_TYPE_CHILD_ROLES.typeArg,
          typeNode: isSomeType(typeNode.parameterType)
            ? typeNode.parameterType
            : undefined,
        },
        {
          role: RELATED_TYPE_CHILD_ROLES.typeArg,
          typeNode: isSomeType(typeNode.templateType)
            ? typeNode.templateType
            : undefined,
        },
        {
          role: RELATED_TYPE_CHILD_ROLES.typeArg,
          typeNode: isSomeType(typeNode.nameType)
            ? typeNode.nameType
            : undefined,
        },
      ]);
      return new RelatedTypeNode(
        RELATED_TYPE_KINDS.generic,
        'mapped',
        getMultiplicityFromSomeType(typeNode),
        undefined,
        children,
      );
    }

    case DOC_TYPE_NAMES.conditional: {
      const children = createChildren([
        {
          role: RELATED_TYPE_CHILD_ROLES.unionMember,
          typeNode: isSomeType(typeNode.checkType)
            ? typeNode.checkType
            : undefined,
        },
        {
          role: RELATED_TYPE_CHILD_ROLES.unionMember,
          typeNode: isSomeType(typeNode.extendsType)
            ? typeNode.extendsType
            : undefined,
        },
        {
          role: RELATED_TYPE_CHILD_ROLES.unionMember,
          typeNode: isSomeType(typeNode.trueType)
            ? typeNode.trueType
            : undefined,
        },
        {
          role: RELATED_TYPE_CHILD_ROLES.unionMember,
          typeNode: isSomeType(typeNode.falseType)
            ? typeNode.falseType
            : undefined,
        },
      ]);
      return new RelatedTypeNode(
        RELATED_TYPE_KINDS.union,
        'conditional',
        getMultiplicityFromSomeType(typeNode),
        undefined,
        children,
      );
    }

    case DOC_TYPE_NAMES.inferred: {
      if (isSomeType(typeNode.constraint)) {
        return resolveRelatedTypeFromSomeType(typeNode.constraint);
      }
      break;
    }

    case DOC_TYPE_NAMES.predicate: {
      if (isSomeType(typeNode.targetType)) {
        return resolveRelatedTypeFromSomeType(typeNode.targetType);
      }
      break;
    }
    default:
      throw new Error(`Unsupported SomeType with type: ${typeNode.type}`);
  }

  return new RelatedTypeNode(
    RELATED_TYPE_KINDS.primitive,
    'unknown',
    MULTIPLICITY.exactlyOne,
  );
}
