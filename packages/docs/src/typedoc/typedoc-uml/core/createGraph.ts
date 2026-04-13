import { type DeclarationReflection, ReflectionKind } from 'typedoc';
import {
  RELATED_TYPE_KINDS,
  type RelatedTypeNode,
} from '../model/relatedType.js';
import { resolveRelatedTypeFromSomeType } from '../resolver/resolveRelatedTypeFromSomeType.js';

/**
 * UML 用に抽出する関係の種類です。
 */
export type EdgeKind = 'extends' | 'implements' | 'association' | 'dependency';

/**
 * UML 表示の元になる隣接グラフです。
 *
 * `nodes` は対象 reflection の集合、`edgesById` は
 * `from -> to -> relationship kinds` の形で保持します。
 */
export type GraphIndex = {
  nodes: Set<number>;
  edgesById: Map<number, Map<number, Set<EdgeKind>>>;
};

type AddEdgesFromTypeParams = {
  typeNode: unknown;
  kind: EdgeKind;
  from: number;
  targets: Set<number>;
  edgesById: GraphIndex['edgesById'];
};

/**
 * 隣接グラフに有向エッジを追加します。
 */
function addEdge(
  edgesById: GraphIndex['edgesById'],
  from: number,
  to: number,
  kind: EdgeKind,
) {
  let existingEdges = edgesById.get(from);
  if (!existingEdges) {
    existingEdges = new Map<number, Set<EdgeKind>>();
    edgesById.set(from, existingEdges);
  }

  let existingEdgeKinds = existingEdges.get(to);
  if (!existingEdgeKinds) {
    existingEdgeKinds = new Set<EdgeKind>();
    existingEdges.set(to, existingEdgeKinds);
  }

  existingEdgeKinds.add(kind);
}

function collectReferenceIdsFromRelatedTypeNode(
  node: RelatedTypeNode,
  out: Set<number>,
): void {
  if (
    node.kind === RELATED_TYPE_KINDS.reference &&
    typeof node.id === 'number'
  ) {
    out.add(node.id);
  }

  for (const child of node.children) {
    collectReferenceIdsFromRelatedTypeNode(child.node, out);
  }
}

/**
 * 単一の型ノードから参照先 id を収集し、対象範囲内の edge を追加します。
 */
function addEdgesFromType({
  typeNode,
  kind,
  from,
  targets,
  edgesById,
}: AddEdgesFromTypeParams): void {
  if (!typeNode || typeof typeNode !== 'object') return;

  const relatedType = resolveRelatedTypeFromSomeType(typeNode as never);
  const relatedRefs = new Set<number>();
  collectReferenceIdsFromRelatedTypeNode(relatedType, relatedRefs);

  for (const to of relatedRefs) {
    if (to === from) continue;
    if (!targets.has(to)) continue;
    addEdge(edgesById, from, to, kind);
  }
}

export function isDeclarationReflectionLike(
  x: unknown,
): x is DeclarationReflection {
  if (!x || typeof x !== 'object') return false;

  // TypeDoc の DeclarationReflection が持つ最低限っぽい形
  // kindOf は Reflection が持つ
  if ('kindOf' in x && typeof x.kindOf !== 'function') return false;
  // id は Reflection が持つ
  if ('id' in x && typeof x.id !== 'number') return false;

  return true;
}

export type CreateGraphOptions = {
  /**
   * TypeAlias に対して association / dependency 解析を打ち切るかどうかです。
   */
  stopAtTypeAlias?: boolean;
};

const DEFAULT_OPTS: Required<CreateGraphOptions> = {
  stopAtTypeAlias: true,
};

/**
 * 収集済み reflection から UML 用の関係グラフを生成します。
 *
 * グラフは `targets` に含まれる id だけを対象にし、外部ページへの
 * エッジは張りません。
 *
 * @param targets - 今回の描画対象となる reflection id 集合です。
 * @param modelById - id から reflection を引くための辞書です。
 * @param opts - グラフ生成時のオプションです。
 * @returns 各ページイベントから再利用できるグラフです。
 */
export function createGraphIndex(
  targets: Set<number>,
  modelById: Map<number, unknown>,
  opts: CreateGraphOptions = DEFAULT_OPTS,
): GraphIndex {
  const options = { ...DEFAULT_OPTS, ...opts };
  const edgesById: GraphIndex['edgesById'] = new Map();

  for (const id of targets) {
    const raw = modelById.get(id);
    if (!isDeclarationReflectionLike(raw)) continue;

    const m = raw;

    // 継承（extends）
    if (Array.isArray(m.extendedTypes)) {
      for (const t of m.extendedTypes) {
        addEdgesFromType({
          typeNode: t,
          kind: 'extends',
          from: id,
          targets,
          edgesById,
        });
      }
    }

    // 実装（implements）
    if (Array.isArray(m.implementedTypes)) {
      for (const t of m.implementedTypes) {
        addEdgesFromType({
          typeNode: t,
          kind: 'implements',
          from: id,
          targets,
          edgesById,
        });
      }
    }

    // TypeAlias はここで打ち止め（association や引数型は解析しない）
    if (options.stopAtTypeAlias && m.kindOf(ReflectionKind.TypeAlias)) {
      continue;
    }

    // 所持（association）: プロパティ型（＋必要ならメソッド引数型）
    const children = Array.isArray(m.children) ? m.children : [];
    for (const c of children) {
      // プロパティ/フィールド/メソッド宣言などの .type
      if (c?.type) {
        addEdgesFromType({
          typeNode: c.type,
          kind: 'association',
          from: id,
          targets,
          edgesById,
        });
        console.log('association', c.name);
      }

      // メソッド引数型（dependency）

      const sigs = Array.isArray(c?.signatures) ? c.signatures : [];
      for (const s of sigs) {
        const params = Array.isArray(s?.parameters) ? s.parameters : [];
        for (const p of params) {
          if (p?.type) {
            addEdgesFromType({
              typeNode: p.type,
              kind: 'dependency',
              from: id,
              targets,
              edgesById,
            });
            console.log('dependency', p.name);
          }
        }
      }
    }
  }

  // 呼び出し側で targets を clear しても壊れないようにコピー
  return { nodes: new Set(targets), edgesById };
}
