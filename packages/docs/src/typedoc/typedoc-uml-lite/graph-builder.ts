import type { DeclarationReflection, Context } from 'typedoc';
import type { UMLGraph, UMLNode, UMLPluginOptions } from './types';
import {
  detectStereotype,
  getRelativePath,
  extractProperties,
  extractMethods,
  extractRelatedTypeNames,
} from './detector';
import { shouldExcludeType, resolveReflection } from './utils';

/**
 * Builds a UML graph starting from a root reflection
 * Uses BFS (breadth-first search) with maximum depth constraint
 * @param rootReflection - Starting point for graph traversal
 * @param context - TypeDoc context for resolving types
 * @param options - Plugin options
 * @returns Complete UML graph with nodes and relationships
 */
export function buildUMLGraph(
  rootReflection: DeclarationReflection,
  context: Context,
  options: UMLPluginOptions
): UMLGraph {
  const graph: UMLGraph = {
    nodes: new Map(),
    relationships: [],
    rootNode: rootReflection.name,
  };

  // BFS queue: stores reflections with their depth
  const queue: Array<{ reflection: DeclarationReflection; depth: number }> = [
    { reflection: rootReflection, depth: 0 },
  ];

  // Visited set to prevent cycles
  const visited = new Set<string>();

  // Phase 1: Collect nodes using BFS
  while (queue.length > 0) {
    const { reflection, depth } = queue.shift()!;
    const typeName = reflection.name;

    // Skip if already visited or max depth exceeded
    if (visited.has(typeName) || depth > options.maxDepth) {
      continue;
    }

    // Skip excluded types (primitives, built-ins, etc.)
    if (shouldExcludeType(typeName, options)) {
      continue;
    }

    // Mark as visited
    visited.add(typeName);

    // Create UML node with all metadata
    const node: UMLNode = {
      name: typeName,
      reflection,
      stereotype: detectStereotype(reflection),
      properties: options.showMembers
        ? extractProperties(reflection, options.maxMembersPerClass)
        : [],
      methods: options.showMembers
        ? extractMethods(reflection, options.maxMembersPerClass)
        : [],
      depth,
      relativePath: getRelativePath(reflection),
    };

    graph.nodes.set(node.name, node);

    // Continue traversal if we haven't reached max depth
    if (depth < options.maxDepth) {
      const relatedTypeNames = extractRelatedTypeNames(reflection);

      // Resolve each related type and add to queue
      relatedTypeNames.forEach((relatedTypeName) => {
        // Skip if already visited
        if (visited.has(relatedTypeName)) {
          return;
        }

        // Skip excluded types
        if (shouldExcludeType(relatedTypeName, options)) {
          return;
        }

        // Try to resolve the reflection
        const relatedReflection = resolveReflection(relatedTypeName, context);

        if (relatedReflection) {
          queue.push({
            reflection: relatedReflection,
            depth: depth + 1,
          });
        }
      });
    }
  }

  // Phase 2: Analyze relationships between collected nodes
  // This is done in a separate module (relationship-analyzer.ts)
  // to keep concerns separated

  return graph;
}

/**
 * Checks if a graph is non-trivial (worth displaying)
 * A trivial graph has only one node or no relationships
 * @param graph - Graph to check
 * @returns true if graph should be displayed
 */
export function isNonTrivialGraph(graph: UMLGraph): boolean {
  // Need at least 2 nodes for meaningful relationships
  if (graph.nodes.size < 2) {
    return false;
  }

  // Could also check for relationships, but we analyze those later
  return true;
}

/**
 * Gets statistics about the graph for debugging
 * @param graph - Graph to analyze
 * @returns Statistics object
 */
export function getGraphStats(graph: UMLGraph): {
  nodeCount: number;
  relationshipCount: number;
  maxDepth: number;
  stereotypes: Record<string, number>;
} {
  const stereotypes: Record<string, number> = {};
  let maxDepth = 0;

  for (const node of graph.nodes.values()) {
    // Count stereotypes
    stereotypes[node.stereotype] = (stereotypes[node.stereotype] || 0) + 1;

    // Track max depth
    maxDepth = Math.max(maxDepth, node.depth);
  }

  return {
    nodeCount: graph.nodes.size,
    relationshipCount: graph.relationships.length,
    maxDepth,
    stereotypes,
  };
}
