import { describe, expect, it } from "vitest";
import {
  collectReferencedReflectionIdsFromDocTypeNode,
  getMultiplicityFromSomeType,
} from "./collectReflectionId.js";
import type { SomeType } from "typedoc";

describe("getMultiplicityFromSomeType", () => {
  // type T = Foo;
  it("単純な reference は 1 を返す", () => {
    const docTypeNode = {
      type: "reference",
      reflection: { id: 1 },
    } as SomeType;

    expect(getMultiplicityFromSomeType(docTypeNode)).toBe("1");
  });

  // type T = Foo | undefined;
  it("optional は 0..1 を返す", () => {
    const docTypeNode = {
      type: "optional",
      elementType: { type: "reference", reflection: { id: 1 } },
    } as SomeType;

    expect(getMultiplicityFromSomeType(docTypeNode)).toBe("0..1");
  });

  // type T = Foo[];
  it("array は * を返す", () => {
    const docTypeNode = {
      type: "array",
      elementType: { type: "reference", reflection: { id: 1 } },
    } as SomeType;

    expect(getMultiplicityFromSomeType(docTypeNode)).toBe("*");
  });

  // type T = [...Foo[]];
  // 実際の TypeDoc ノードとしては rest で表現されることを想定。
  it("rest は * を返す", () => {
    const docTypeNode = {
      type: "rest",
      elementType: { type: "reference", reflection: { id: 1 } },
    } as SomeType;

    expect(getMultiplicityFromSomeType(docTypeNode)).toBe("*");
  });

  // type T = Option<Option<Foo>>;
  it("Option<Option<T>> は 0..1 に flatten される", () => {
    const docTypeNode = {
      type: "optional",
      elementType: {
        type: "optional",
        elementType: { type: "reference", reflection: { id: 1 } },
      },
    } as SomeType;

    expect(getMultiplicityFromSomeType(docTypeNode)).toBe("0..1");
  });

  // type T = Option<Foo[]>;
  it("Option<Array<T>> は * を返す", () => {
    const docTypeNode = {
      type: "optional",
      elementType: {
        type: "array",
        elementType: { type: "reference", reflection: { id: 1 } },
      },
    } as SomeType;

    expect(getMultiplicityFromSomeType(docTypeNode)).toBe("*");
  });

  // type T = Array<[Foo | undefined, Bar]>;
  it("array の中に tuple や optional があっても strongest な * を返す", () => {
    const docTypeNode = {
      type: "array",
      elementType: {
        type: "tuple",
        elements: [
          {
            type: "optional",
            elementType: { type: "reference", reflection: { id: 1 } },
          },
          { type: "reference", reflection: { id: 2 } },
        ],
      },
    } as SomeType;

    expect(getMultiplicityFromSomeType(docTypeNode)).toBe("*");
  });

  /**
   * かなり異常な例:
   *
   * type T = Option<
   *   | [Array<[item?: Foo]>]
   *   | `${Bar | undefined}x`
   * >;
   */
  it("かなり異常なネストでも flat に strongest な * を返す", () => {
    const docTypeNode = {
      type: "optional",
      elementType: {
        type: "union",
        types: [
          {
            type: "tuple",
            elements: [
              {
                type: "array",
                elementType: {
                  type: "namedTupleMember",
                  element: {
                    type: "optional",
                    elementType: {
                      type: "reference",
                      reflection: { id: 1 },
                    },
                  },
                },
              },
            ],
          },
          {
            type: "templateLiteral",
            tail: [
              [
                {
                  type: "optional",
                  elementType: { type: "reference", reflection: { id: 2 } },
                },
                "x",
              ],
            ],
          },
        ],
      },
    } as SomeType;

    expect(getMultiplicityFromSomeType(docTypeNode)).toBe("*");
  });

  // type T = [item?: Foo];
  it("namedTupleMember 単体では内側の multiplicity をそのまま返す", () => {
    const docTypeNode = {
      type: "namedTupleMember",
      element: {
        type: "optional",
        elementType: { type: "reference", reflection: { id: 1 } },
      },
    } as SomeType;

    expect(getMultiplicityFromSomeType(docTypeNode)).toBe("0..1");
  });
});

describe("collectReferencedReflectionIdsFromDocTypeNode", () => {
  // type T = Wrapper<Foo>;
  it("reference と typeArguments から id と multiplicity を収集する", () => {
    const out = new Map<number, "1" | "0..1" | "*">();
    const docTypeNode = {
      type: "reference",
      reflection: { id: 1 },
      typeArguments: [{ type: "reference", reflection: { id: 2 } }],
    } as SomeType;

    collectReferencedReflectionIdsFromDocTypeNode(docTypeNode, out);

    expect(out).toEqual(
      new Map([
        [1, "1"],
        [2, "1"],
      ]),
    );
  });

  // type T = Foo | Bar[];
  it("Foo | Bar[] の場合は Foo に 1、Bar に * を付ける", () => {
    const out = new Map<number, "1" | "0..1" | "*">();
    const docTypeNode = {
      type: "union",
      types: [
        { type: "reference", reflection: { id: 1 } },
        {
          type: "array",
          elementType: { type: "reference", reflection: { id: 2 } },
        },
      ],
    } as SomeType;

    collectReferencedReflectionIdsFromDocTypeNode(docTypeNode, out);

    expect(out).toEqual(
      new Map([
        [1, "1"],
        [2, "*"],
      ]),
    );
  });

  // type T = Foo | [Bar?];
  it("union と tuple のネストから strongest な multiplicity を収集する", () => {
    const out = new Map<number, "1" | "0..1" | "*">();
    const docTypeNode = {
      type: "union",
      types: [
        { type: "reference", reflection: { id: 1 } },
        {
          type: "tuple",
          elements: [
            {
              type: "optional",
              elementType: { type: "reference", reflection: { id: 2 } },
            },
          ],
        },
      ],
    } as SomeType;

    collectReferencedReflectionIdsFromDocTypeNode(docTypeNode, out);

    expect(out).toEqual(
      new Map([
        [1, "1"],
        [2, "0..1"],
      ]),
    );
  });

  // type T = Promise<Result<Foo[]>>;
  it("wrapper の内部型も relation として追跡する", () => {
    const out = new Map<number, "1" | "0..1" | "*">();
    const docTypeNode = {
      type: "reference",
      reflection: { id: 100 },
      typeArguments: [
        {
          type: "reference",
          reflection: { id: 200 },
          typeArguments: [
            {
              type: "array",
              elementType: {
                type: "reference",
                reflection: { id: 300 },
              },
            },
          ],
        },
      ],
    } as SomeType;

    collectReferencedReflectionIdsFromDocTypeNode(docTypeNode, out);

    expect(out).toEqual(
      new Map([
        [100, "1"],
        [200, "1"],
        [300, "*"],
      ]),
    );
  });

  // type T = TParam extends Foo ? Bar : Baz;
  it("conditional type の各枝から id を収集する", () => {
    const out = new Map<number, "1" | "0..1" | "*">();
    const docTypeNode = {
      type: "conditional",
      checkType: { type: "reference", reflection: { id: 1 } },
      extendsType: { type: "reference", reflection: { id: 2 } },
      trueType: { type: "reference", reflection: { id: 3 } },
      falseType: { type: "reference", reflection: { id: 4 } },
    } as SomeType;

    collectReferencedReflectionIdsFromDocTypeNode(docTypeNode, out);

    expect(out).toEqual(
      new Map([
        [1, "1"],
        [2, "1"],
        [3, "1"],
        [4, "1"],
      ]),
    );
  });

  // type T = { value: Foo };
  // inline object / function type などで reflection ノードになるケースを想定。
  it("reflection ノード直下の declaration.id を拾う", () => {
    const out = new Map<number, "1" | "0..1" | "*">();
    const docTypeNode = {
      type: "reflection",
      declaration: { id: 50 },
    } as SomeType;

    collectReferencedReflectionIdsFromDocTypeNode(docTypeNode, out);

    expect(out).toEqual(new Map([[50, "1"]]));
  });

  // type Fn = (...items: Foo[]) => void;
  it("rest から参照される id には * を付ける", () => {
    const out = new Map<number, "1" | "0..1" | "*">();
    const docTypeNode = {
      type: "rest",
      elementType: { type: "reference", reflection: { id: 60 } },
    } as SomeType;

    collectReferencedReflectionIdsFromDocTypeNode(docTypeNode, out);

    expect(out).toEqual(new Map([[60, "*"]]));
  });

  // type T = Foo["name"];
  it("indexedAccess でも relation を壊さず拾う", () => {
    const out = new Map<number, "1" | "0..1" | "*">();
    const docTypeNode = {
      type: "indexedAccess",
      objectType: { type: "reference", reflection: { id: 70 } },
      indexType: { type: "literal", value: "name" },
    } as SomeType;

    collectReferencedReflectionIdsFromDocTypeNode(docTypeNode, out);

    expect(out).toEqual(new Map([[70, "1"]]));
  });

  // type T = { [K in keyof Foo]: Bar };
  it("mapped type でも relation を壊さず拾う", () => {
    const out = new Map<number, "1" | "0..1" | "*">();
    const docTypeNode = {
      type: "mapped",
      parameterType: {
        type: "query",
        queryType: { type: "reference", reflection: { id: 80 } },
      },
      templateType: { type: "reference", reflection: { id: 81 } },
      nameType: { type: "reference", reflection: { id: 82 } },
    } as SomeType;

    collectReferencedReflectionIdsFromDocTypeNode(docTypeNode, out);

    expect(out).toEqual(
      new Map([
        [80, "1"],
        [81, "1"],
        [82, "1"],
      ]),
    );
  });

  // type T = typeof Foo | keyof Bar;
  it("query と typeOperator でも relation を壊さず拾う", () => {
    const out = new Map<number, "1" | "0..1" | "*">();
    const docTypeNode = {
      type: "union",
      types: [
        {
          type: "query",
          queryType: { type: "reference", reflection: { id: 90 } },
        },
        {
          type: "typeOperator",
          target: { type: "reference", reflection: { id: 91 } },
        },
      ],
    } as SomeType;

    collectReferencedReflectionIdsFromDocTypeNode(docTypeNode, out);

    expect(out).toEqual(
      new Map([
        [90, "1"],
        [91, "1"],
      ]),
    );
  });

  // type T = Foo | (Foo | undefined) | Foo[];
  it("同じ id が複数経路から見つかったら strongest な multiplicity にマージする", () => {
    const out = new Map<number, "1" | "0..1" | "*">();
    const docTypeNode = {
      type: "union",
      types: [
        { type: "reference", reflection: { id: 1 } },
        {
          type: "optional",
          elementType: { type: "reference", reflection: { id: 1 } },
        },
        {
          type: "array",
          elementType: { type: "reference", reflection: { id: 1 } },
        },
      ],
    } as SomeType;

    collectReferencedReflectionIdsFromDocTypeNode(docTypeNode, out);

    expect(out).toEqual(new Map([[1, "*"]]));
  });

  // type T = Foo | (Foo | undefined);
  it("同じ id が 1 と 0..1 で重なったら 0..1 にマージする", () => {
    const out = new Map<number, "1" | "0..1" | "*">();
    const docTypeNode = {
      type: "union",
      types: [
        { type: "reference", reflection: { id: 100 } },
        {
          type: "optional",
          elementType: { type: "reference", reflection: { id: 100 } },
        },
      ],
    } as SomeType;

    collectReferencedReflectionIdsFromDocTypeNode(docTypeNode, out);

    expect(out).toEqual(new Map([[100, "0..1"]]));
  });
});
