import {
  type DeclarationReflection,
  ReflectionKind,
  type SomeType,
} from 'typedoc';
import {
  MULTIPLICITY,
  type MultiplicityType,
  RELATED_TYPE_KINDS,
  type RelatedTypeNode,
} from '../model/relatedType.js';
import {
  UML_EDGE_KINDS,
  UML_NODE_KINDS,
  UML_VISIBILITY,
  UmlGraphModel,
  type UmlNodeKind,
  type UmlVisibility,
} from '../model/umlGraph.js';
import { resolveDisplayRelatedTypeFromSomeType } from '../resolver/resolveDisplayRelatedTypeFromSomeType.js';
import { resolveRelatedTypeFromSomeType } from '../resolver/resolveRelatedTypeFromSomeType.js';

function isDeclarationReflectionLike(x: unknown): x is DeclarationReflection {
  if (!x || typeof x !== 'object') return false;
  if ('kindOf' in x && typeof x.kindOf !== 'function') return false;
  if ('id' in x && typeof x.id !== 'number') return false;
  if ('name' in x && typeof x.name !== 'string') return false;
  return true;
}

function hasSomeType(
  value: unknown,
): value is { name: string; flags?: unknown; type: SomeType } {
  if (!value || typeof value !== 'object') return false;
  if (!('name' in value) || typeof value.name !== 'string') return false;
  if (!('type' in value)) return false;

  const type = value.type;
  return !!type && typeof type === 'object' && 'type' in type;
}

function hasSignatures(
  value: unknown,
): value is {
  name: string;
  flags?: unknown;
  signatures: Array<{ type?: SomeType }>;
} {
  if (!value || typeof value !== 'object') return false;
  if (!('name' in value) || typeof value.name !== 'string') return false;
  if (!('signatures' in value) || !Array.isArray(value.signatures)) {
    return false;
  }

  return value.signatures.length > 0;
}

function toUmlNodeKind(model: DeclarationReflection): UmlNodeKind | undefined {
  if (model.kindOf(ReflectionKind.Interface)) {
    return UML_NODE_KINDS.interface;
  }

  if (model.kindOf(ReflectionKind.Class)) {
    return model.flags?.isAbstract
      ? UML_NODE_KINDS.abstractClass
      : UML_NODE_KINDS.class;
  }

  if (model.kindOf(ReflectionKind.TypeAlias)) {
    return UML_NODE_KINDS.type;
  }

  return undefined;
}

function toVisibility(raw: unknown): UmlVisibility {
  if (raw && typeof raw === 'object') {
    if ('isPrivate' in raw && raw.isPrivate === true) {
      return UML_VISIBILITY.private;
    }

    if ('isProtected' in raw && raw.isProtected === true) {
      return UML_VISIBILITY.protected;
    }
  }

  return UML_VISIBILITY.public;
}

function collectTypeParameterNames(typeParameters: unknown): string[] {
  if (!Array.isArray(typeParameters)) {
    return [];
  }

  return typeParameters.flatMap((parameter) => {
    if (
      parameter &&
      typeof parameter === 'object' &&
      'name' in parameter &&
      typeof parameter.name === 'string'
    ) {
      return [parameter.name];
    }

    return [];
  });
}

function renderTypeParameterList(typeParameters: unknown): string {
  const names = collectTypeParameterNames(typeParameters);
  return names.length === 0 ? '' : `<${names.join(', ')}>`;
}

function getDeclarationDisplayName(raw: DeclarationReflection): string {
  return `${raw.name}${renderTypeParameterList(raw.typeParameters)}`;
}

function mergeMultiplicity(
  left: MultiplicityType,
  right: MultiplicityType,
): MultiplicityType {
  if (left === MULTIPLICITY.many || right === MULTIPLICITY.many) {
    return MULTIPLICITY.many;
  }

  if (left === MULTIPLICITY.zeroOrOne || right === MULTIPLICITY.zeroOrOne) {
    return MULTIPLICITY.zeroOrOne;
  }

  return MULTIPLICITY.exactlyOne;
}

function resolvePropertyAssociationRoot(
  node: RelatedTypeNode,
  inheritedMultiplicity: MultiplicityType = MULTIPLICITY.exactlyOne,
): RelatedTypeNode {
  if (node.kind === RELATED_TYPE_KINDS.generic && node.children.length > 0) {
    const lastChild = node.children.at(-1)?.node;
    if (lastChild !== undefined) {
      return resolvePropertyAssociationRoot(lastChild, inheritedMultiplicity);
    }
  }

  if (node.kind === RELATED_TYPE_KINDS.reference) {
    return node.withMultiplicity(
      mergeMultiplicity(inheritedMultiplicity, node.multiplicity),
    );
  }

  return node.withMultiplicity(inheritedMultiplicity);
}

function isReferenceToKnownModel(
  node: RelatedTypeNode,
  modelById: Map<number, unknown>,
): boolean {
  if (
    node.kind !== RELATED_TYPE_KINDS.reference ||
    typeof node.id !== 'number'
  ) {
    return false;
  }

  return isDeclarationReflectionLike(modelById.get(node.id));
}

function shouldMaterializePropertyRoot(
  node: RelatedTypeNode,
  modelById: Map<number, unknown>,
): boolean {
  if (isReferenceToKnownModel(node, modelById)) {
    return false;
  }

  switch (node.kind) {
    case RELATED_TYPE_KINDS.union:
    case RELATED_TYPE_KINDS.tuple:
    case RELATED_TYPE_KINDS.generic:
    case RELATED_TYPE_KINDS.object:
    case RELATED_TYPE_KINDS.callable:
      return true;

    default:
      return false;
  }
}

function renderRelatedTypeNode(node: RelatedTypeNode): string {
  switch (node.kind) {
    case RELATED_TYPE_KINDS.reference:
    case RELATED_TYPE_KINDS.typeParameter:
    case RELATED_TYPE_KINDS.primitive:
      return node.text;

    case RELATED_TYPE_KINDS.generic: {
      const inner = node.children
        .map((child) => renderRelatedTypeNode(child.node))
        .join(', ');
      return `${node.text}<${inner}>`;
    }

    case RELATED_TYPE_KINDS.tuple:
      return `[${node.children.map((child) => renderRelatedTypeNode(child.node)).join(', ')}]`;

    case RELATED_TYPE_KINDS.union:
      return node.children
        .map((child) => renderRelatedTypeNode(child.node))
        .join(' | ');

    case RELATED_TYPE_KINDS.object:
      return 'object';

    case RELATED_TYPE_KINDS.callable:
      return 'callable';

    default:
      throw new Error(`Unknown related type kind: ${String(node.kind)}`);
  }
}

function ensureIntermediateNode(graph: UmlGraphModel, nodeId: string): void {
  if (graph.getNode(nodeId)) return;

  graph.addNode({
    id: nodeId,
    name: nodeId,
    kind: UML_NODE_KINDS.intermediate,
    members: [],
  });
}

function createGraphMembers(raw: DeclarationReflection) {
  const members = [];
  const children = Array.isArray(raw.children) ? raw.children : [];
  for (const child of children) {
    if (child?.name === 'constructor') continue;

    if (hasSomeType(child)) {
      members.push({
        name: child.name,
        visibility: toVisibility(child.flags),
        typeNode: resolveDisplayRelatedTypeFromSomeType(child.type),
      });
      continue;
    }

    if (!hasSignatures(child)) continue;
    const signature = child.signatures[0];
    if (!signature?.type) continue;
    const parameters = Array.isArray(signature.parameters)
      ? signature.parameters.reduce<string[]>((acc, parameter) => {
          if (
            !parameter ||
            typeof parameter !== 'object' ||
            typeof parameter.name !== 'string' ||
            !parameter.type
          ) {
            return acc;
          }

          acc.push(
            `${parameter.name} : ${renderRelatedTypeNode(
              resolveDisplayRelatedTypeFromSomeType(parameter.type),
            )}`,
          );
          return acc;
        }, [])
      : [];
    members.push({
      name: `${child.name}${renderTypeParameterList(signature.typeParameters)}(${parameters.join(', ')})`,
      visibility: toVisibility(child.flags),
      typeNode: resolveDisplayRelatedTypeFromSomeType(signature.type),
    });
  }

  return members;
}

function ensureDeclarationNode(
  graph: UmlGraphModel,
  raw: DeclarationReflection,
): void {
  const displayName = getDeclarationDisplayName(raw);

  if (graph.getNode(displayName)) {
    return;
  }

  const kind = toUmlNodeKind(raw);
  if (!kind) {
    return;
  }

  graph.addNode({
    id: displayName,
    reflectionId: raw.id,
    name: displayName,
    kind,
    members: createGraphMembers(raw),
  });
}

function resolveGraphNodeId(
  node: RelatedTypeNode,
  modelById: Map<number, unknown>,
): string {
  if (
    node.kind === RELATED_TYPE_KINDS.reference &&
    typeof node.id === 'number'
  ) {
    const model = modelById.get(node.id);
    if (isDeclarationReflectionLike(model)) {
      return getDeclarationDisplayName(model);
    }
  }

  return renderRelatedTypeNode(node);
}

function addIntermediateTypeEdges(
  graph: UmlGraphModel,
  fromId: string,
  node: RelatedTypeNode,
  modelById: Map<number, unknown>,
  rootKind: typeof UML_EDGE_KINDS.extends | typeof UML_EDGE_KINDS.implements,
): void {
  const nodeId = resolveGraphNodeId(node, modelById);

  if (
    node.kind === RELATED_TYPE_KINDS.reference &&
    typeof node.id === 'number'
  ) {
    const targetModel = modelById.get(node.id);
    if (isDeclarationReflectionLike(targetModel)) {
      ensureDeclarationNode(graph, targetModel);
      graph.addEdge({
        from: fromId,
        to: getDeclarationDisplayName(targetModel),
        kind: rootKind,
      });
      return;
    }
  }

  ensureIntermediateNode(graph, nodeId);
  graph.addEdge({
    from: fromId,
    to: nodeId,
    kind: rootKind,
  });

  for (const child of node.children) {
    const childId = resolveGraphNodeId(child.node, modelById);

    if (
      child.node.kind !== RELATED_TYPE_KINDS.reference ||
      typeof child.node.id !== 'number'
    ) {
      ensureIntermediateNode(graph, childId);
    } else {
      const targetModel = modelById.get(child.node.id);
      if (!isDeclarationReflectionLike(targetModel)) {
        ensureIntermediateNode(graph, childId);
      } else {
        ensureDeclarationNode(graph, targetModel);
      }
    }

    graph.addEdge({
      from: nodeId,
      to: childId,
      kind: UML_EDGE_KINDS.contains,
    });

    if (child.node.children.length > 0) {
      addContainedChildren(graph, childId, child.node, modelById);
    }
  }
}

function addContainedChildren(
  graph: UmlGraphModel,
  fromId: string,
  node: RelatedTypeNode,
  modelById: Map<number, unknown>,
): void {
  for (const child of node.children) {
    const childId = resolveGraphNodeId(child.node, modelById);

    if (
      child.node.kind !== RELATED_TYPE_KINDS.reference ||
      typeof child.node.id !== 'number'
    ) {
      ensureIntermediateNode(graph, childId);
    } else {
      const targetModel = modelById.get(child.node.id);
      if (!isDeclarationReflectionLike(targetModel)) {
        ensureIntermediateNode(graph, childId);
      } else {
        ensureDeclarationNode(graph, targetModel);
      }
    }

    graph.addEdge({
      from: fromId,
      to: childId,
      kind: UML_EDGE_KINDS.contains,
    });

    if (child.node.children.length > 0) {
      addContainedChildren(graph, childId, child.node, modelById);
    }
  }
}

function addPropertyAssociation(
  graph: UmlGraphModel,
  fromId: string,
  memberName: string,
  visibility: UmlVisibility,
  node: RelatedTypeNode,
  modelById: Map<number, unknown>,
): void {
  const rootNode = resolvePropertyAssociationRoot(node);

  if (
    isReferenceToKnownModel(rootNode, modelById) &&
    typeof rootNode.id === 'number'
  ) {
    const targetModel = modelById.get(rootNode.id);
    if (!isDeclarationReflectionLike(targetModel)) {
      return;
    }
    ensureDeclarationNode(graph, targetModel);

    graph.addEdge({
      from: fromId,
      to: getDeclarationDisplayName(targetModel),
      kind: UML_EDGE_KINDS.association,
      memberName,
      visibility,
      multiplicity: rootNode.multiplicity,
    });
    return;
  }

  if (!shouldMaterializePropertyRoot(rootNode, modelById)) {
    return;
  }

  const rootId = resolveGraphNodeId(rootNode, modelById);
  ensureIntermediateNode(graph, rootId);
  graph.addEdge({
    from: fromId,
    to: rootId,
    kind: UML_EDGE_KINDS.association,
    memberName,
    visibility,
    multiplicity: rootNode.multiplicity,
  });

  addContainedChildren(graph, rootId, rootNode, modelById);
}

type CreateUmlGraphOptions = {
  stopAtTypeAlias?: boolean;
};

const DEFAULT_OPTIONS: Required<CreateUmlGraphOptions> = {
  stopAtTypeAlias: true,
};

/**
 * 収集済み reflection から docs 用 UML graph を構築します。
 *
 * これは `createGraph.ts` の後継候補で、最終的には
 * `UmlGraphModel` を直接組み立てるための core です。
 */
export function createUmlGraph(
  targets: Set<number>,
  modelById: Map<number, unknown>,
  options: CreateUmlGraphOptions = DEFAULT_OPTIONS,
): UmlGraphModel {
  const resolvedOptions = { ...DEFAULT_OPTIONS, ...options };
  const graph = new UmlGraphModel();

  for (const id of targets) {
    const raw = modelById.get(id);
    if (!isDeclarationReflectionLike(raw)) continue;

    const kind = toUmlNodeKind(raw);
    if (!kind) continue;

    graph.addNode({
      id: getDeclarationDisplayName(raw),
      reflectionId: id,
      name: getDeclarationDisplayName(raw),
      kind,
      members: createGraphMembers(raw),
    });
  }

  for (const id of targets) {
    const raw = modelById.get(id);
    if (!isDeclarationReflectionLike(raw)) continue;

    const from = getDeclarationDisplayName(raw);

    if (Array.isArray(raw.extendedTypes)) {
      for (const typeNode of raw.extendedTypes) {
        const resolved = resolveRelatedTypeFromSomeType(typeNode);
        addIntermediateTypeEdges(
          graph,
          from,
          resolved,
          modelById,
          UML_EDGE_KINDS.extends,
        );
      }
    }

    if (Array.isArray(raw.implementedTypes)) {
      for (const typeNode of raw.implementedTypes) {
        const resolved = resolveRelatedTypeFromSomeType(typeNode);
        addIntermediateTypeEdges(
          graph,
          from,
          resolved,
          modelById,
          UML_EDGE_KINDS.implements,
        );
      }
    }

    if (
      resolvedOptions.stopAtTypeAlias &&
      raw.kindOf(ReflectionKind.TypeAlias)
    ) {
      continue;
    }

    const children = Array.isArray(raw.children) ? raw.children : [];
    for (const child of children) {
      if (child?.name === 'constructor') continue;

      if (child?.type) {
        const typeNode = resolveRelatedTypeFromSomeType(child.type);
        addPropertyAssociation(
          graph,
          from,
          child.name,
          toVisibility(child.flags),
          typeNode,
          modelById,
        );
        continue;
      }

      if (!hasSignatures(child)) continue;
      const signature = child.signatures[0];
      if (!signature?.type) continue;

      const typeNode = resolveRelatedTypeFromSomeType(signature.type);
      addPropertyAssociation(
        graph,
        from,
        child.name,
        toVisibility(child.flags),
        typeNode,
        modelById,
      );
    }
  }

  return graph;
}
