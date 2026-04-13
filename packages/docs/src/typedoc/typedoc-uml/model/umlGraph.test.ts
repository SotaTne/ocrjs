import { describe, expect, it } from "vitest";
import {
  MULTIPLICITY,
  RELATED_TYPE_KINDS,
  RelatedTypeNode,
} from "./relatedType.js";
import {
  UML_EDGE_KINDS,
  UML_NODE_KINDS,
  UML_VISIBILITY,
  UmlGraphModel,
} from "./umlGraph.js";

describe("UmlGraphModel", () => {
  it("member に RelatedTypeNode を保持できる", () => {
    const graph = new UmlGraphModel();

    graph.addNode({
      id: "Schedule",
      reflectionId: 1,
      name: "Schedule",
      kind: UML_NODE_KINDS.class,
      members: [
        {
          name: "content",
          visibility: UML_VISIBILITY.private,
          typeNode: new RelatedTypeNode(
            RELATED_TYPE_KINDS.reference,
            "Content",
            MULTIPLICITY.exactlyOne,
            2,
          ),
        },
      ],
    });

    const node = graph.getNode("Schedule");
    expect(node?.members[0]?.name).toBe("content");
    expect(node?.members[0]?.visibility).toBe(UML_VISIBILITY.private);
    expect(node?.members[0]?.typeNode?.text).toBe("Content");
    expect(node?.members[0]?.typeNode?.id).toBe(2);
  });

  it("association edge に memberName と visibility を保持できる", () => {
    const graph = new UmlGraphModel();

    graph.addEdge({
      from: "Schedule",
      to: "Content",
      kind: UML_EDGE_KINDS.association,
      memberName: "content",
      visibility: UML_VISIBILITY.private,
      multiplicity: MULTIPLICITY.exactlyOne,
    });

    expect(graph.edges).toEqual([
      {
        from: "Schedule",
        to: "Content",
        kind: UML_EDGE_KINDS.association,
        memberName: "content",
        visibility: UML_VISIBILITY.private,
        multiplicity: MULTIPLICITY.exactlyOne,
      },
    ]);
  });

  it("extends と implements を同じグラフに保持できる", () => {
    const graph = new UmlGraphModel();

    graph.addNode({
      id: "OnnxWebModelLoader",
      reflectionId: 10,
      name: "OnnxWebModelLoader",
      kind: UML_NODE_KINDS.class,
      members: [],
    });
    graph.addNode({
      id: "ErrorableBase",
      reflectionId: 11,
      name: "ErrorableBase",
      kind: UML_NODE_KINDS.abstractClass,
      members: [],
    });
    graph.addNode({
      id: "IModelLoader",
      reflectionId: 12,
      name: "IModelLoader",
      kind: UML_NODE_KINDS.interface,
      members: [],
    });

    graph.addEdge({
      from: "OnnxWebModelLoader",
      to: "ErrorableBase",
      kind: UML_EDGE_KINDS.extends,
    });
    graph.addEdge({
      from: "OnnxWebModelLoader",
      to: "IModelLoader",
      kind: UML_EDGE_KINDS.implements,
    });

    expect(graph.nodeList).toHaveLength(3);
    expect(graph.edges).toEqual([
      {
        from: "OnnxWebModelLoader",
        to: "ErrorableBase",
        kind: UML_EDGE_KINDS.extends,
      },
      {
        from: "OnnxWebModelLoader",
        to: "IModelLoader",
        kind: UML_EDGE_KINDS.implements,
      },
    ]);
  });
});
