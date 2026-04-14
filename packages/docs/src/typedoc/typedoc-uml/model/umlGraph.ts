import type { ReflectionID } from '../types.js';
import type { MultiplicityType, RelatedTypeNode } from './relatedType.js';

/**
 * UML の可視性です。
 */
export const UML_VISIBILITY = {
  public: '+',
  protected: '#',
  private: '-',
} as const;

export type UmlVisibility =
  (typeof UML_VISIBILITY)[keyof typeof UML_VISIBILITY];

/**
 * UML ノード種別です。
 */
export const UML_NODE_KINDS = {
  class: 'class',
  interface: 'interface',
  abstractClass: 'abstractClass',
  type: 'type',
  intermediate: 'intermediate',
} as const;

export type UmlNodeKind = (typeof UML_NODE_KINDS)[keyof typeof UML_NODE_KINDS];

/**
 * UML エッジ種別です。
 */
export const UML_EDGE_KINDS = {
  extends: 'extends',
  implements: 'implements',
  association: 'association',
  contains: 'contains',
} as const;

export type UmlEdgeKind = (typeof UML_EDGE_KINDS)[keyof typeof UML_EDGE_KINDS];

/**
 * UML member です。
 *
 * property や field の元型は `RelatedTypeNode` として保持します。
 * これにより後からリンク付き表示や relation 解決ができます。
 */
export type UmlMember = {
  name: string;
  visibility: UmlVisibility;
  typeNode?: RelatedTypeNode;
};

/**
 * UML node です。
 */
export type UmlNode = {
  id: string;
  reflectionId?: ReflectionID;
  name: string;
  kind: UmlNodeKind;
  members: UmlMember[];
};

/**
 * UML edge です。
 *
 * property 由来の association は `memberName` と `visibility` を持てます。
 */
export type UmlEdge = {
  from: string;
  to: string;
  kind: UmlEdgeKind;
  memberName?: string;
  visibility?: UmlVisibility;
  multiplicity?: MultiplicityType;
};

/**
 * docs 用 UML グラフの最終モデルです。
 */
export class UmlGraphModel {
  readonly nodes = new Map<string, UmlNode>();
  readonly edges: UmlEdge[] = [];
  readonly #edgeKeys = new Set<string>();

  addNode(node: UmlNode): void {
    this.nodes.set(node.id, node);
  }

  getNode(id: string): UmlNode | undefined {
    return this.nodes.get(id);
  }

  addEdge(edge: UmlEdge): void {
    const key = [
      edge.from,
      edge.to,
      edge.kind,
      edge.memberName ?? '',
      edge.visibility ?? '',
      edge.multiplicity ?? '',
    ].join('\u0000');

    if (this.#edgeKeys.has(key)) {
      return;
    }

    this.#edgeKeys.add(key);
    this.edges.push(edge);
  }

  get nodeList(): UmlNode[] {
    return [...this.nodes.values()];
  }
}
