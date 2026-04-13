import type { UmlEdge, UmlGraphModel } from '../model/umlGraph.js';

export type UmlGraphValidationIssue = {
  code: 'missing-from-node' | 'missing-to-node';
  edge: UmlEdge;
  nodeId: string;
};

export function validateUmlGraph(
  graph: UmlGraphModel,
): UmlGraphValidationIssue[] {
  const issues: UmlGraphValidationIssue[] = [];

  for (const edge of graph.edges) {
    if (!graph.getNode(edge.from)) {
      issues.push({
        code: 'missing-from-node',
        edge,
        nodeId: edge.from,
      });
    }

    if (!graph.getNode(edge.to)) {
      issues.push({
        code: 'missing-to-node',
        edge,
        nodeId: edge.to,
      });
    }
  }

  return issues;
}
