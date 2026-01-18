/// Define Ref pattern

import type { ReflectionID } from '../types.js';

export const TYPE_SHAPES = {
  plain: 'plain',
  optional: 'optional',
  likeArray: 'likeArray',
  likeFunction: 'likeFunction',
  likeUnion: 'likeUnion',
  likeIntersection: 'likeIntersection',
  unknown: 'unknown',
} as const;

export type TypeShape = (typeof TYPE_SHAPES)[keyof typeof TYPE_SHAPES];

export type FunctionRefs = {
  params: Set<ReflectionID>;
  returns: Set<ReflectionID>;
};

type AddRefsParamBase = ReflectionID | ReflectionID[] | Set<ReflectionID>;

export type AddRefsParam =
  | AddRefsParamBase
  | { params: AddRefsParamBase; returns: AddRefsParamBase };

/** AddRefsParamBase を Set<ReflectionID> に正規化 */
function toSet(x: AddRefsParamBase): Set<ReflectionID> {
  if (x instanceof Set) return x;
  if (Array.isArray(x)) return new Set(x);
  return new Set([x]);
}

function isFunctionAddRefsParam(x: AddRefsParam): x is {
  params: AddRefsParamBase;
  returns: AddRefsParamBase;
} {
  return !!x && typeof x === 'object' && 'params' in x && 'returns' in x;
}

/**
 * refs の内部表現（Set系 or FunctionRefs系）を抽象化
 * R = refs の実体型
 */
export abstract class BaseTypeShape<R> {
  abstract readonly shape: TypeShape;
  abstract readonly refs: R;

  /** refs を追加（実装は shape によって異なる） */
  abstract addRefs(refs: AddRefsParam, allows: Set<ReflectionID>): void;

  /**
   * generator が共通で使える「参照ID全集合」
   * このidはすべてreflection
   */
  abstract get allRefs(): Set<ReflectionID>;
}

/**
 * refs が Set<ReflectionID> の shape 共通実装
 * （plain / optional / likeArray / likeUnion / likeIntersection など）
 */
abstract class SetRefsShape extends BaseTypeShape<Set<ReflectionID>> {
  readonly refs = new Set<ReflectionID>();

  addRefs(refs: AddRefsParam, allows: Set<ReflectionID>): void {
    if (isFunctionAddRefsParam(refs)) return;

    const set = toSet(refs as AddRefsParamBase);
    for (const id of set) {
      if (!allows.has(id)) continue;
      this.refs.add(id);
    }
  }

  get allRefs(): Set<ReflectionID> {
    return new Set(this.refs);
  }
}

export class AnalyzedPlain extends SetRefsShape {
  readonly shape = TYPE_SHAPES.plain;
}

export class AnalyzedOptional extends SetRefsShape {
  readonly shape = TYPE_SHAPES.optional;
}

export class AnalyzedLikeArray extends SetRefsShape {
  readonly shape = TYPE_SHAPES.likeArray;
}

export class AnalyzedLikeUnion extends SetRefsShape {
  readonly shape = TYPE_SHAPES.likeUnion;
}

export class AnalyzedLikeIntersection extends SetRefsShape {
  readonly shape = TYPE_SHAPES.likeIntersection;
}

/**
 * function は params と returns を分けて保持したいので別実装
 */
export class AnalyzedLikeFunction extends BaseTypeShape<FunctionRefs> {
  readonly shape = TYPE_SHAPES.likeFunction;
  readonly refs: FunctionRefs = {
    params: new Set<ReflectionID>(),
    returns: new Set<ReflectionID>(),
  };

  addRefs(refs: AddRefsParam, allows: Set<ReflectionID>): void {
    if (!isFunctionAddRefsParam(refs)) return;

    for (const id of toSet(refs.params)) {
      if (!allows.has(id)) continue;
      this.refs.params.add(id);
    }
    for (const id of toSet(refs.returns)) {
      if (!allows.has(id)) continue;
      this.refs.returns.add(id);
    }
  }

  get allRefs(): Set<ReflectionID> {
    return new Set<ReflectionID>([...this.refs.params, ...this.refs.returns]);
  }
}

/**
 * unknown は refs を持たない（or 常に空）
 * addRefs されても無視
 */
export class AnalyzedUnknown extends BaseTypeShape<Set<ReflectionID>> {
  readonly shape = TYPE_SHAPES.unknown;
  readonly refs = new Set<ReflectionID>();

  addRefs(_refs: AddRefsParam, _allows: Set<ReflectionID>): void {
    // noop
  }

  get allRefs(): Set<ReflectionID> {
    return new Set();
  }
}

/**
 * 便利: shape からインスタンス生成するファクトリ
 * analyzer 側で `new ...` を散らさないため
 */
export function createTypeShape(shape: TypeShape): AnyAnalyzedTypeShape {
  switch (shape) {
    case TYPE_SHAPES.plain:
      return new AnalyzedPlain();
    case TYPE_SHAPES.optional:
      return new AnalyzedOptional();
    case TYPE_SHAPES.likeArray:
      return new AnalyzedLikeArray();
    case TYPE_SHAPES.likeFunction:
      return new AnalyzedLikeFunction();
    case TYPE_SHAPES.likeUnion:
      return new AnalyzedLikeUnion();
    case TYPE_SHAPES.likeIntersection:
      return new AnalyzedLikeIntersection();
    default:
      return new AnalyzedUnknown();
  }
}

// 外から型で使いたい場合
export type AnyAnalyzedTypeShape =
  | AnalyzedPlain
  | AnalyzedOptional
  | AnalyzedLikeArray
  | AnalyzedLikeFunction
  | AnalyzedLikeUnion
  | AnalyzedLikeIntersection
  | AnalyzedUnknown;
