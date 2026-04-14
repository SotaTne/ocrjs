import { resolveRelativeLink } from '../linker/resolveRelativeLink.js';
import type { ReflectionAbsoluteLink } from '../linker/types.js';
import {
  RELATED_TYPE_KINDS,
  type RelatedTypeNode,
} from '../model/relatedType.js';
import {
  UML_EDGE_KINDS,
  UML_NODE_KINDS,
  type UmlEdge,
  type UmlGraphModel,
  type UmlNode,
} from '../model/umlGraph.js';
import type { ReflectionID } from '../types.js';

export type UmlLinkOptions = {
  currentPageAbsoluteLink: string;
  resolveReflectionLink: (
    reflectionId: ReflectionID,
  ) => ReflectionAbsoluteLink | undefined;
};

export type UmlRenderOptions = {
  escapeAngleBracketsInMemberTypes?: boolean;
  escapeAngleBracketsInLabels?: boolean;
};

function sanitizeMermaidAlias(value: string): string {
  return `uml_${value.replace(/[^\w]/g, '_')}`;
}

function escapeMermaidString(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}

function escapeMemberTypeText(
  value: string,
  options: UmlRenderOptions | undefined,
): string {
  if (options?.escapeAngleBracketsInMemberTypes !== true) {
    return value;
  }

  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapeLabelText(
  value: string,
  options: UmlRenderOptions | undefined,
): string {
  if (options?.escapeAngleBracketsInLabels !== true) {
    return value;
  }

  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function renderRelatedType(
  node: RelatedTypeNode,
  options?: UmlRenderOptions,
): string {
  switch (node.kind) {
    case RELATED_TYPE_KINDS.reference:
    case RELATED_TYPE_KINDS.typeParameter:
    case RELATED_TYPE_KINDS.primitive:
      return escapeMemberTypeText(node.text, options);

    case RELATED_TYPE_KINDS.generic:
      return `${escapeMemberTypeText(node.text, options)}${escapeMemberTypeText('<', options)}${node.children
        .map((child) => renderRelatedType(child.node, options))
        .join(', ')}${escapeMemberTypeText('>', options)}`;

    case RELATED_TYPE_KINDS.tuple:
      return `[${node.children.map((child) => renderRelatedType(child.node, options)).join(', ')}]`;

    case RELATED_TYPE_KINDS.union:
      return node.children
        .map((child) => renderRelatedType(child.node, options))
        .join(' | ');

    case RELATED_TYPE_KINDS.object:
      return 'object';

    case RELATED_TYPE_KINDS.callable:
      return 'callable';

    default:
      throw new Error(`Unknown related type kind: ${String(node.kind)}`);
  }
}

function renderNodeStereotype(node: UmlNode): string | undefined {
  switch (node.kind) {
    case UML_NODE_KINDS.interface:
      return 'interface';

    case UML_NODE_KINDS.abstractClass:
      return 'abstract';

    case UML_NODE_KINDS.type:
      return 'type';

    case UML_NODE_KINDS.intermediate:
      return 'intermediate';

    case UML_NODE_KINDS.class:
      return undefined;

    default:
      throw new Error(`Unknown UML node kind: ${String(node.kind)}`);
  }
}

function renderNode(node: UmlNode, renderOptions?: UmlRenderOptions): string[] {
  const alias = sanitizeMermaidAlias(node.id);
  const lines: string[] = [
    `class ${alias}["${escapeLabelText(node.name, renderOptions)}"] {`,
  ];
  const stereotype = renderNodeStereotype(node);

  if (stereotype) {
    lines.push(`  <<${stereotype}>>`);
  }

  for (const member of node.members) {
    const isMethod = member.name.includes('(');
    const suffix = member.typeNode
      ? `${isMethod ? ' ' : ' : '}${renderRelatedType(member.typeNode, renderOptions)}`
      : '';
    lines.push(`  ${member.visibility}${member.name}${suffix}`);
  }

  lines.push('}');
  return lines;
}

function renderNodeClick(
  node: UmlNode,
  linkOptions?: UmlLinkOptions,
  renderOptions?: UmlRenderOptions,
): string | undefined {
  if (linkOptions === undefined || node.reflectionId === undefined) {
    return undefined;
  }

  const link = linkOptions.resolveReflectionLink(node.reflectionId);
  if (link === undefined) {
    return undefined;
  }

  const relativeLink = resolveRelativeLink(
    linkOptions.currentPageAbsoluteLink,
    link.absoluteLink,
  );
  return `click ${sanitizeMermaidAlias(node.id)} href "${escapeMermaidString(relativeLink)}" "${escapeMermaidString(escapeLabelText(node.name, renderOptions))}"`;
}

function renderEdge(edge: UmlEdge): string {
  const from = sanitizeMermaidAlias(edge.from);
  const to = sanitizeMermaidAlias(edge.to);

  const multiplicity = edge.multiplicity ? ` "${edge.multiplicity}"` : '';
  const label = edge.memberName ? ` : ${edge.memberName}` : '';

  switch (edge.kind) {
    case UML_EDGE_KINDS.extends:
      return `${from} <|-- ${to}`;

    case UML_EDGE_KINDS.implements:
      return `${from} <|.. ${to}`;

    case UML_EDGE_KINDS.association:
      return `${from} -->${multiplicity} ${to}${label}`;

    case UML_EDGE_KINDS.contains:
      return `${from} *--${multiplicity} ${to}${label}`;

    default:
      throw new Error(`Unknown UML edge kind: ${String(edge.kind)}`);
  }
}

export function renderUmlGraphAsMermaidClassDiagram(
  graph: UmlGraphModel,
  linkOptions?: UmlLinkOptions,
  renderOptions?: UmlRenderOptions,
): string {
  const lines: string[] = ['classDiagram'];

  for (const node of graph.nodeList) {
    lines.push(...renderNode(node, renderOptions));
  }

  if (graph.edges.length > 0) {
    lines.push('');
  }

  for (const edge of graph.edges) {
    lines.push(renderEdge(edge));
  }

  const clickLines = graph.nodeList
    .map((node) => renderNodeClick(node, linkOptions, renderOptions))
    .filter((line): line is string => line !== undefined);

  if (clickLines.length > 0) {
    lines.push('');
    lines.push(...clickLines);
  }

  return lines.join('\n');
}
