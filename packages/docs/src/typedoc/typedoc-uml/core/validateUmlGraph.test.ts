import { describe, expect, it } from 'vitest';
import {
  UML_EDGE_KINDS,
  UML_NODE_KINDS,
  UmlGraphModel,
} from '../model/umlGraph.js';
import { validateUmlGraph } from './validateUmlGraph.js';

describe('validateUmlGraph', () => {
  it('edge の from/to が両方存在する場合は問題なし', () => {
    const graph = new UmlGraphModel();
    graph.addNode({
      id: 'A',
      name: 'A',
      kind: UML_NODE_KINDS.class,
      members: [],
    });
    graph.addNode({
      id: 'B',
      name: 'B',
      kind: UML_NODE_KINDS.class,
      members: [],
    });
    graph.addEdge({
      from: 'A',
      to: 'B',
      kind: UML_EDGE_KINDS.association,
    });

    expect(validateUmlGraph(graph)).toEqual([]);
  });

  it('存在しない to node を検出する', () => {
    const graph = new UmlGraphModel();
    graph.addNode({
      id: 'A',
      name: 'A',
      kind: UML_NODE_KINDS.class,
      members: [],
    });
    graph.addEdge({
      from: 'A',
      to: 'Missing',
      kind: UML_EDGE_KINDS.association,
    });

    expect(validateUmlGraph(graph)).toEqual([
      {
        code: 'missing-to-node',
        edge: {
          from: 'A',
          to: 'Missing',
          kind: UML_EDGE_KINDS.association,
        },
        nodeId: 'Missing',
      },
    ]);
  });
});
