import {
  type DeclarationReflection,
  ReflectionKind,
  type SomeType,
} from 'typedoc';
import { collectReferencedReflectionIdsFromDocTypeNode } from './collectReflectionId.js';

export type EdgeKind = 'extends' | 'implements' | 'association' | 'dependency';

export type GraphIndex = {
  nodes: Set<number>;
  edgesById: Map<number, Map<number, Set<EdgeKind>>>;
};

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

function isDeclarationReflectionLike(x: unknown): x is DeclarationReflection {
  if (!x || typeof x !== 'object') return false;

  // TypeDoc の DeclarationReflection が持つ最低限っぽい形
  // kindOf は Reflection が持つ
  if ('kindOf' in x && typeof x.kindOf !== 'function') return false;
  // id は Reflection が持つ
  if ('id' in x && typeof x.id !== 'number') return false;

  return true;
}

export type CreateGraphOptions = {
  /** メソッド引数型も dependency 関係として含める（ノイズ増えやすいのでデフォルト false 推奨） */
  includeMethodTypes?: boolean;
  /** TypeAlias の場合、association/dependency/メソッド解析を打ち切る */
  stopAtTypeAlias?: boolean;
};

const DEFAULT_OPTS: Required<CreateGraphOptions> = {
  includeMethodTypes: false,
  stopAtTypeAlias: true,
};

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

    const addEdgesFromType = (typeNode: unknown, kind: EdgeKind) => {
      if (!typeNode || typeof typeNode !== 'object') return;
      const rel = new Set<number>();
      collectReferencedReflectionIdsFromDocTypeNode(typeNode as SomeType, rel);

      for (const to of rel) {
        if (to === id) continue; // 自己ループ除外
        if (!targets.has(to)) continue; // ページ外へは張らない
        addEdge(edgesById, id, to, kind);
      }
    };

    // 継承（extends）
    if (Array.isArray(m.extendedTypes)) {
      for (const t of m.extendedTypes) {
        addEdgesFromType(t, 'extends');
      }
    }

    // 実装（implements）
    if (Array.isArray(m.implementedTypes)) {
      for (const t of m.implementedTypes) {
        addEdgesFromType(t, 'implements');
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
        addEdgesFromType(c.type, 'association');
        console.log('association', c.name);
      }

      // メソッド引数型（ノイズ増えがちなのでオプション）
      if (options.includeMethodTypes) {
        const sigs = Array.isArray(c?.signatures) ? c.signatures : [];
        for (const s of sigs) {
          const params = Array.isArray(s?.parameters) ? s.parameters : [];
          for (const p of params) {
            if (p?.type) {
              addEdgesFromType(p.type, 'dependency');
              console.log('dependency', p.name);
            }
          }
        }
      }
    }
  }

  // 呼び出し側で targets を clear しても壊れないようにコピー
  return { nodes: new Set(targets), edgesById };
}
