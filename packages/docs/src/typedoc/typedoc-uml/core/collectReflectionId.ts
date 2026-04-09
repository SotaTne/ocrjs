import type { SomeType } from "typedoc";
import type { ReflectionID } from "../types.js";

type SomeTypeName = SomeType["type"];

interface Multiplicity {
  exactlyOne: "1";
  zeroOrOne: "0..1";
  many: "*";
}

export type MultiplicityType = Multiplicity[keyof Multiplicity];

export type RelatedRefMap = Map<ReflectionID, MultiplicityType>;

/**
 * reflection id 収集で扱う TypeDoc の型名一覧です。
 */
export const DOC_TYPE_NAMES = {
  array: "array",
  conditional: "conditional",
  indexedAccess: "indexedAccess",
  inferred: "inferred",
  intersection: "intersection",
  intrinsic: "intrinsic",
  literal: "literal",
  mapped: "mapped",
  optional: "optional",
  predicate: "predicate",
  query: "query",
  reference: "reference",
  reflection: "reflection",
  rest: "rest",
  templateLiteral: "templateLiteral",
  tuple: "tuple",
  namedTupleMember: "namedTupleMember",
  typeOperator: "typeOperator",
  union: "union",
  unknown: "unknown",
} as const satisfies Record<SomeTypeName, SomeTypeName>;

/**
 * 値が TypeDoc の `SomeType` らしいかを判定します。
 */
function isSomeType(x: unknown): x is SomeType {
  return (
    !!x && typeof x === "object" && "type" in x && typeof x.type === "string"
  );
}

/**
 * Multiplicity の強さを比較するための優先順位です。
 */
const MULTIPLICITY_RANK: Record<MultiplicityType, number> = {
  "1": 1,
  "0..1": 2,
  "*": 3,
};

/**
 * 2つの multiplicity を比較して、より強い方を返します。
 *
 * ルールは `* > 0..1 > 1` です。
 */
function mergeMultiplicity(
  current: MultiplicityType,
  next: MultiplicityType,
): MultiplicityType {
  return MULTIPLICITY_RANK[current] >= MULTIPLICITY_RANK[next] ? current : next;
}

/**
 * 参照先 id に対して multiplicity をマージしながら追加します。
 *
 * 同じ id がすでに存在する場合は `* > 0..1 > 1` のルールで
 * より強い multiplicity を保持します。
 */
function addRelatedRef(
  out: RelatedRefMap,
  id: ReflectionID,
  multiplicity: MultiplicityType,
): void {
  const existing = out.get(id);
  if (!existing) {
    out.set(id, multiplicity);
    return;
  }

  out.set(id, mergeMultiplicity(existing, multiplicity));
}

/**
 * TypeDoc の型ノードから relation 用の multiplicity を 1 つに正規化して返します。
 *
 * この関数は構造をネストしたまま返さず、常に `1 | 0..1 | *` のいずれかへ
 * flatten します。ネストが深い場合でも、内側から伝播した strongest な
 * multiplicity だけを保持します。
 *
 * 例:
 * - `T` -> `1`
 * - `T | undefined` や optional -> `0..1`
 * - `Array<T>` / rest -> `*`
 * - `Option<Option<T>>` -> `0..1`
 * - `Option<Array<T>>` -> `*`
 *
 * @param typeNode - 解析対象の型ノードです。
 * @returns 正規化された multiplicity です。
 */
export function getMultiplicityFromSomeType(
  typeNode: SomeType,
): MultiplicityType {
  if (!typeNode || typeof typeNode !== "object") {
    return "1";
  }

  switch (typeNode.type) {
    case DOC_TYPE_NAMES.array:
    case DOC_TYPE_NAMES.rest: {
      const inner = isSomeType(typeNode.elementType)
        ? getMultiplicityFromSomeType(typeNode.elementType)
        : "1";
      return mergeMultiplicity("*", inner);
    }

    case DOC_TYPE_NAMES.optional: {
      const inner = isSomeType(typeNode.elementType)
        ? getMultiplicityFromSomeType(typeNode.elementType)
        : "1";
      return mergeMultiplicity("0..1", inner);
    }

    case DOC_TYPE_NAMES.namedTupleMember: {
      return isSomeType(typeNode.element)
        ? getMultiplicityFromSomeType(typeNode.element)
        : "1";
    }

    case DOC_TYPE_NAMES.tuple: {
      let current: MultiplicityType = "1";
      const elements = Array.isArray(typeNode.elements)
        ? typeNode.elements
        : [];
      for (const element of elements) {
        if (!isSomeType(element)) continue;
        current = mergeMultiplicity(
          current,
          getMultiplicityFromSomeType(element),
        );
        if (current === "*") return current;
      }
      return current;
    }

    case DOC_TYPE_NAMES.union:
    case DOC_TYPE_NAMES.intersection: {
      let current: MultiplicityType = "1";
      const types = Array.isArray(typeNode.types) ? typeNode.types : [];
      for (const child of types) {
        if (!isSomeType(child)) continue;
        current = mergeMultiplicity(
          current,
          getMultiplicityFromSomeType(child),
        );
        if (current === "*") return current;
      }
      return current;
    }

    case DOC_TYPE_NAMES.templateLiteral: {
      let current: MultiplicityType = "1";
      const tail = Array.isArray(typeNode.tail) ? typeNode.tail : [];
      for (const pair of tail) {
        const child = Array.isArray(pair) ? pair[0] : undefined;
        if (!isSomeType(child)) continue;
        current = mergeMultiplicity(
          current,
          getMultiplicityFromSomeType(child),
        );
        if (current === "*") return current;
      }
      return current;
    }

    case DOC_TYPE_NAMES.conditional: {
      let current: MultiplicityType = "1";
      const candidates = [
        typeNode.checkType,
        typeNode.extendsType,
        typeNode.trueType,
        typeNode.falseType,
      ];
      for (const child of candidates) {
        if (!isSomeType(child)) continue;
        current = mergeMultiplicity(
          current,
          getMultiplicityFromSomeType(child),
        );
        if (current === "*") return current;
      }
      return current;
    }

    case DOC_TYPE_NAMES.indexedAccess: {
      let current: MultiplicityType = "1";
      if (isSomeType(typeNode.objectType)) {
        current = mergeMultiplicity(
          current,
          getMultiplicityFromSomeType(typeNode.objectType),
        );
      }
      if (current === "*") return current;
      if (isSomeType(typeNode.indexType)) {
        current = mergeMultiplicity(
          current,
          getMultiplicityFromSomeType(typeNode.indexType),
        );
      }
      return current;
    }

    case DOC_TYPE_NAMES.inferred: {
      return isSomeType(typeNode.constraint)
        ? getMultiplicityFromSomeType(typeNode.constraint)
        : "1";
    }

    case DOC_TYPE_NAMES.mapped: {
      let current: MultiplicityType = "1";
      const candidates = [
        typeNode.parameterType,
        typeNode.templateType,
        typeNode.nameType,
      ];
      for (const child of candidates) {
        if (!isSomeType(child)) continue;
        current = mergeMultiplicity(
          current,
          getMultiplicityFromSomeType(child),
        );
        if (current === "*") return current;
      }
      return current;
    }

    case DOC_TYPE_NAMES.predicate: {
      return isSomeType(typeNode.targetType)
        ? getMultiplicityFromSomeType(typeNode.targetType)
        : "1";
    }

    case DOC_TYPE_NAMES.query: {
      return isSomeType(typeNode.queryType)
        ? getMultiplicityFromSomeType(typeNode.queryType)
        : "1";
    }

    case DOC_TYPE_NAMES.typeOperator: {
      return isSomeType(typeNode.target)
        ? getMultiplicityFromSomeType(typeNode.target)
        : "1";
    }

    default: {
      if (
        "typeArguments" in typeNode &&
        Array.isArray(typeNode.typeArguments) &&
        typeNode.typeArguments.length > 0
      ) {
        let current: MultiplicityType = "1";
        for (const child of typeNode.typeArguments) {
          if (!isSomeType(child)) continue;
          current = mergeMultiplicity(
            current,
            getMultiplicityFromSomeType(child),
          );
          if (current === "*") return current;
        }
        return current;
      }

      return "1";
    }
  }
}

/**
 * TypeDoc の型ノードから参照される reflection id を再帰的に収集します。
 *
 * 配列、union、intersection、tuple、conditional、mapped type などの
 * ネストした型もたどります。
 *
 * @param docTypeNode - 解析対象の型ノードです。
 * @param out - 見つかった reflection id と multiplicity を保持する Map です。
 */
export function collectReferencedReflectionIdsFromDocTypeNode(
  docTypeNode: SomeType,
  out: RelatedRefMap,
  inheritedMultiplicity: MultiplicityType = "1",
): void {
  if (!docTypeNode || typeof docTypeNode !== "object") return;

  switch (docTypeNode.type) {
    case DOC_TYPE_NAMES.reference: {
      const ref = docTypeNode.reflection;
      if (ref && typeof ref.id === "number") {
        addRelatedRef(out, ref.id, inheritedMultiplicity);
      }

      const typeArgs = docTypeNode.typeArguments;
      if (Array.isArray(typeArgs)) {
        for (const a of typeArgs) {
          if (isSomeType(a))
            collectReferencedReflectionIdsFromDocTypeNode(
              a,
              out,
              inheritedMultiplicity,
            );
        }
      }
      return;
    }

    case DOC_TYPE_NAMES.reflection: {
      const decl = docTypeNode.declaration;
      if (decl && typeof decl.id === "number") {
        addRelatedRef(out, decl.id, inheritedMultiplicity);
      }
      return;
    }

    case DOC_TYPE_NAMES.array:
    case DOC_TYPE_NAMES.optional:
    case DOC_TYPE_NAMES.rest: {
      const el = docTypeNode.elementType;
      const nextMultiplicity = mergeMultiplicity(
        inheritedMultiplicity,
        getMultiplicityFromSomeType(docTypeNode),
      );
      if (isSomeType(el))
        collectReferencedReflectionIdsFromDocTypeNode(
          el,
          out,
          nextMultiplicity,
        );
      return;
    }

    case DOC_TYPE_NAMES.union:
    case DOC_TYPE_NAMES.intersection: {
      const types = docTypeNode.types;
      if (Array.isArray(types)) {
        for (const t of types) {
          if (isSomeType(t))
            collectReferencedReflectionIdsFromDocTypeNode(
              t,
              out,
              inheritedMultiplicity,
            );
        }
      }
      return;
    }

    case DOC_TYPE_NAMES.tuple: {
      const els = docTypeNode.elements;
      if (Array.isArray(els)) {
        for (const t of els) {
          if (isSomeType(t))
            collectReferencedReflectionIdsFromDocTypeNode(
              t,
              out,
              inheritedMultiplicity,
            );
        }
      }
      return;
    }

    case DOC_TYPE_NAMES.namedTupleMember: {
      const el = docTypeNode.element;
      if (isSomeType(el))
        collectReferencedReflectionIdsFromDocTypeNode(
          el,
          out,
          inheritedMultiplicity,
        );
      return;
    }

    case DOC_TYPE_NAMES.templateLiteral: {
      // tail: [SomeType, string][]
      const tail = docTypeNode.tail;
      if (Array.isArray(tail)) {
        for (const pair of tail) {
          const t = Array.isArray(pair) ? pair[0] : undefined;
          if (isSomeType(t))
            collectReferencedReflectionIdsFromDocTypeNode(
              t,
              out,
              inheritedMultiplicity,
            );
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
        collectReferencedReflectionIdsFromDocTypeNode(
          checkType,
          out,
          inheritedMultiplicity,
        );
      if (isSomeType(extendsType))
        collectReferencedReflectionIdsFromDocTypeNode(
          extendsType,
          out,
          inheritedMultiplicity,
        );
      if (isSomeType(trueType))
        collectReferencedReflectionIdsFromDocTypeNode(
          trueType,
          out,
          inheritedMultiplicity,
        );
      if (isSomeType(falseType))
        collectReferencedReflectionIdsFromDocTypeNode(
          falseType,
          out,
          inheritedMultiplicity,
        );
      return;
    }

    case DOC_TYPE_NAMES.indexedAccess: {
      const objectType = docTypeNode.objectType;
      const indexType = docTypeNode.indexType;
      if (isSomeType(objectType))
        collectReferencedReflectionIdsFromDocTypeNode(
          objectType,
          out,
          inheritedMultiplicity,
        );
      if (isSomeType(indexType))
        collectReferencedReflectionIdsFromDocTypeNode(
          indexType,
          out,
          inheritedMultiplicity,
        );
      return;
    }

    case DOC_TYPE_NAMES.inferred: {
      const constraint = docTypeNode.constraint;
      if (isSomeType(constraint))
        collectReferencedReflectionIdsFromDocTypeNode(
          constraint,
          out,
          inheritedMultiplicity,
        );
      return;
    }

    case DOC_TYPE_NAMES.mapped: {
      const parameterType = docTypeNode.parameterType;
      const templateType = docTypeNode.templateType;
      const nameType = docTypeNode.nameType;

      if (isSomeType(parameterType))
        collectReferencedReflectionIdsFromDocTypeNode(
          parameterType,
          out,
          inheritedMultiplicity,
        );
      if (isSomeType(templateType))
        collectReferencedReflectionIdsFromDocTypeNode(
          templateType,
          out,
          inheritedMultiplicity,
        );
      if (isSomeType(nameType))
        collectReferencedReflectionIdsFromDocTypeNode(
          nameType,
          out,
          inheritedMultiplicity,
        );
      return;
    }

    case DOC_TYPE_NAMES.predicate: {
      const targetType = docTypeNode.targetType;
      if (isSomeType(targetType))
        collectReferencedReflectionIdsFromDocTypeNode(
          targetType,
          out,
          inheritedMultiplicity,
        );
      return;
    }

    case DOC_TYPE_NAMES.query: {
      const q = docTypeNode.queryType;
      if (isSomeType(q))
        collectReferencedReflectionIdsFromDocTypeNode(
          q,
          out,
          inheritedMultiplicity,
        );
      return;
    }

    case DOC_TYPE_NAMES.typeOperator: {
      const target = docTypeNode.target;
      if (isSomeType(target))
        collectReferencedReflectionIdsFromDocTypeNode(
          target,
          out,
          inheritedMultiplicity,
        );
      return;
    }

    default: {
      if (
        !docTypeNode ||
        typeof docTypeNode !== "object" ||
        !("typeArguments" in docTypeNode)
      )
        return;
      const typeArgs = docTypeNode.typeArguments;
      if (Array.isArray(typeArgs)) {
        for (const a of typeArgs) {
          if (isSomeType(a))
            collectReferencedReflectionIdsFromDocTypeNode(
              a,
              out,
              inheritedMultiplicity,
            );
        }
      }
      return;
    }
  }
}
