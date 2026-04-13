import { type DeclarationReflection, ReflectionKind } from 'typedoc';
import { createUmlGraph } from '../core/createUmlGraph.js';
import type { UmlRenderOptions } from '../generator/umlGenerator.js';
import { renderUmlGraphAsMermaidClassDiagram } from '../generator/umlGenerator.js';
import type { ReflectionAbsoluteLink } from '../linker/types.js';
import type { PluginOptions } from '../options.js';
import type { ReflectionID } from '../types.js';

type ReflectionLike = {
  id: ReflectionID;
  name: string;
  children?: unknown[];
  extendedTypes?: unknown[];
  implementedTypes?: unknown[];
  kindOf(kind: ReflectionKind | ReflectionKind[]): boolean;
};

export type HookContextLike = {
  page?: {
    url?: string;
    model?: unknown;
    project?: unknown;
  };
};

export type MermaidLinkResolver = {
  resolveReflectionLink: (
    reflectionId: ReflectionID,
  ) => ReflectionAbsoluteLink | undefined;
};

function isReflectionLike(value: unknown): value is ReflectionLike {
  return (
    !!value &&
    typeof value === 'object' &&
    'id' in value &&
    typeof value.id === 'number' &&
    'name' in value &&
    typeof value.name === 'string' &&
    'kindOf' in value &&
    typeof value.kindOf === 'function'
  );
}

function isRenderableReflection(
  reflection: unknown,
  options: PluginOptions,
): reflection is DeclarationReflection {
  if (!isReflectionLike(reflection)) {
    return false;
  }

  if (
    !reflection.kindOf([
      ReflectionKind.Class,
      ReflectionKind.Interface,
      ReflectionKind.TypeAlias,
    ])
  ) {
    return false;
  }

  if (
    reflection.kindOf(ReflectionKind.TypeAlias) &&
    options.excludeTypes.includes(reflection.name)
  ) {
    return false;
  }

  return true;
}

function walkReflections(
  value: unknown,
  visit: (reflection: ReflectionLike) => void,
): void {
  if (!isReflectionLike(value)) {
    return;
  }

  visit(value);

  if (!Array.isArray(value.children)) {
    return;
  }

  for (const child of value.children) {
    walkReflections(child, visit);
  }
}

function collectProjectModelById(project: unknown): Map<ReflectionID, unknown> {
  const modelById = new Map<ReflectionID, unknown>();

  walkReflections(project, (reflection) => {
    modelById.set(reflection.id, reflection);
  });

  return modelById;
}

function collectReflectionIdsFromType(
  value: unknown,
  out: Set<ReflectionID>,
): void {
  if (!value || typeof value !== 'object') {
    return;
  }

  if ('reflection' in value && isReflectionLike(value.reflection)) {
    out.add(value.reflection.id);
  }

  if ('type' in value && value.type && typeof value.type === 'object') {
    collectReflectionIdsFromType(value.type, out);
  }

  if ('elementType' in value) {
    collectReflectionIdsFromType(value.elementType, out);
  }

  if ('types' in value && Array.isArray(value.types)) {
    for (const child of value.types) {
      collectReflectionIdsFromType(child, out);
    }
  }

  if ('typeArguments' in value && Array.isArray(value.typeArguments)) {
    for (const child of value.typeArguments) {
      collectReflectionIdsFromType(child, out);
    }
  }

  if ('elements' in value && Array.isArray(value.elements)) {
    for (const child of value.elements) {
      collectReflectionIdsFromType(child, out);
    }
  }

  if ('declaration' in value) {
    collectReflectionIdsFromType(value.declaration, out);
  }
}

function collectAdjacentReflectionIds(
  reflection: ReflectionLike,
): Set<ReflectionID> {
  const ids = new Set<ReflectionID>();

  for (const typeNode of reflection.extendedTypes ?? []) {
    collectReflectionIdsFromType(typeNode, ids);
  }

  for (const typeNode of reflection.implementedTypes ?? []) {
    collectReflectionIdsFromType(typeNode, ids);
  }

  for (const child of reflection.children ?? []) {
    if (!child || typeof child !== 'object') {
      continue;
    }

    if ('type' in child) {
      collectReflectionIdsFromType(child.type, ids);
    }
  }

  return ids;
}

function collectTargetIds(
  root: ReflectionLike,
  modelById: Map<ReflectionID, unknown>,
  maxDepth: number,
): Set<ReflectionID> {
  const targets = new Set<ReflectionID>([root.id]);
  const queue: Array<{ id: ReflectionID; depth: number }> = [
    { id: root.id, depth: 0 },
  ];

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined || current.depth >= maxDepth) {
      continue;
    }

    const model = modelById.get(current.id);
    if (!isReflectionLike(model)) {
      continue;
    }

    for (const nextId of collectAdjacentReflectionIds(model)) {
      if (targets.has(nextId)) {
        continue;
      }

      if (!isReflectionLike(modelById.get(nextId))) {
        continue;
      }

      targets.add(nextId);
      queue.push({ id: nextId, depth: current.depth + 1 });
    }
  }

  return targets;
}

export function createMermaidSourceForPage(
  context: HookContextLike,
  options: PluginOptions,
  linkResolver?: MermaidLinkResolver,
  renderOptions?: UmlRenderOptions,
): string {
  const model = context.page?.model;
  const project = context.page?.project;
  const pageUrl = context.page?.url;

  if (!isRenderableReflection(model, options)) {
    return '';
  }

  const modelById = collectProjectModelById(project);
  if (!modelById.has(model.id)) {
    modelById.set(model.id, model);
  }

  const targets = collectTargetIds(model, modelById, options.maxDepth);
  const graph = createUmlGraph(targets, modelById);
  return renderUmlGraphAsMermaidClassDiagram(
    graph,
    pageUrl === undefined || linkResolver === undefined
      ? undefined
      : {
          currentPageAbsoluteLink: pageUrl,
          resolveReflectionLink: linkResolver.resolveReflectionLink,
        },
    renderOptions,
  );
}
