import type { UMLGraph, UMLNode, UMLRelationship, RelationshipType } from './types';
import { extractTypeName, extractAllTypeNames } from './utils';
import { detectMultiplicity } from './detector';

/**
 * Analyzes relationships between nodes in a UML graph
 * Detects all 6 relationship types: extends, implements, creates, composition, aggregation, dependency
 * @param graph - Graph to analyze (modified in place)
 */
export function analyzeRelationships(graph: UMLGraph): void {
  // Clear any existing relationships
  graph.relationships = [];

  // Analyze each node
  for (const [nodeName, node] of graph.nodes) {
    // 1. Inheritance relationships (extends/implements)
    analyzeInheritance(node, graph);

    // 2. Factory relationships (creates)
    if (node.stereotype === 'factory') {
      analyzeFactoryRelationships(node, graph);
    }

    // 3. Property relationships (composition/aggregation)
    analyzePropertyRelationships(node, graph);

    // 4. Method dependencies (uses)
    analyzeMethodDependencies(node, graph);
  }

  // 5. Detect and mark bidirectional relationships
  detectBidirectionalRelationships(graph);

  // 6. Remove duplicate relationships
  deduplicateRelationships(graph);
}

/**
 * Analyzes inheritance relationships (extends/implements)
 * @param node - Node to analyze
 * @param graph - Complete graph
 */
function analyzeInheritance(node: UMLNode, graph: UMLGraph): void {
  const reflection = node.reflection;

  // extends (classes and interfaces)
  if (reflection.extendedTypes) {
    reflection.extendedTypes.forEach((type) => {
      const targetName = extractTypeName(type);
      if (graph.nodes.has(targetName)) {
        graph.relationships.push({
          from: node.name,
          to: targetName,
          type: 'extends',
        });
      }
    });
  }

  // implements (classes implementing interfaces)
  if ((reflection as any).implementedTypes) {
    const implementedTypes = (reflection as any).implementedTypes;
    implementedTypes.forEach((type: any) => {
      const targetName = extractTypeName(type);
      if (graph.nodes.has(targetName)) {
        graph.relationships.push({
          from: node.name,
          to: targetName,
          type: 'implements',
        });
      }
    });
  }
}

/**
 * Analyzes factory relationships (creates pattern)
 * Factories create instances of other types
 * @param node - Factory node to analyze
 * @param graph - Complete graph
 */
function analyzeFactoryRelationships(node: UMLNode, graph: UMLGraph): void {
  // Convention: ITensorFactory creates ITensor
  const factorySuffix = 'Factory';
  if (node.name.endsWith(factorySuffix)) {
    const targetName = node.name.slice(0, -factorySuffix.length);

    if (graph.nodes.has(targetName)) {
      graph.relationships.push({
        from: node.name,
        to: targetName,
        type: 'creates',
        label: '<<creates>>',
      });
      return; // Primary factory relationship found
    }
  }

  // Also check method return types for created types
  // If factory has methods that all return the same type, that's the created type
  const returnTypes = new Map<string, number>();

  node.methods.forEach((method) => {
    const returnTypeName = extractTypeName(method.returnType as any);
    if (returnTypeName && graph.nodes.has(returnTypeName) && returnTypeName !== node.name) {
      returnTypes.set(returnTypeName, (returnTypes.get(returnTypeName) || 0) + 1);
    }
  });

  // If one return type dominates (appears in multiple methods), it's likely the created type
  if (returnTypes.size > 0) {
    const sorted = Array.from(returnTypes.entries()).sort(
      (a, b) => b[1] - a[1]
    );

    const dominantEntry = sorted[0];
    if (!dominantEntry) return;

    const [dominantType] = dominantEntry;

    // Check if we haven't already added this relationship
    const exists = graph.relationships.some(
      (rel) =>
        rel.from === node.name &&
        rel.to === dominantType &&
        rel.type === 'creates'
    );

    if (!exists) {
      graph.relationships.push({
        from: node.name,
        to: dominantType,
        type: 'creates',
        label: '<<creates>>',
      });
    }
  }
}

/**
 * Analyzes property relationships (composition vs aggregation)
 * Composition = strong ownership (readonly, required)
 * Aggregation = weak reference (mutable, optional)
 * @param node - Node to analyze
 * @param graph - Complete graph
 */
function analyzePropertyRelationships(node: UMLNode, graph: UMLGraph): void {
  node.properties.forEach((prop) => {
    const targetName = extractTypeName(prop.type as any);

    if (!targetName || !graph.nodes.has(targetName)) {
      return;
    }

    // Heuristic for composition vs aggregation:
    // - Composition: readonly AND required (multiplicity '1' or '1..*')
    // - Aggregation: mutable OR optional
    const isRequired =
      prop.multiplicity === '1' || prop.multiplicity === '1..*';
    const isComposition = prop.isReadonly && isRequired;

    graph.relationships.push({
      from: node.name,
      to: targetName,
      type: isComposition ? 'composition' : 'aggregation',
      multiplicity: prop.multiplicity,
    });
  });
}

/**
 * Analyzes method dependencies (parameter and return types)
 * These are weaker "uses" relationships
 * @param node - Node to analyze
 * @param graph - Complete graph
 */
function analyzeMethodDependencies(node: UMLNode, graph: UMLGraph): void {
  const dependencyTypes = new Set<string>();

  // Collect types from method signatures
  node.methods.forEach((method) => {
    // Parameter types
    method.parameters.forEach((param) => {
      const paramTypeNames = extractAllTypeNames(param.type as any);
      paramTypeNames.forEach((typeName) => {
        if (graph.nodes.has(typeName) && typeName !== node.name) {
          dependencyTypes.add(typeName);
        }
      });
    });

    // Return type
    const returnTypeNames = extractAllTypeNames(method.returnType as any);
    returnTypeNames.forEach((typeName) => {
      if (graph.nodes.has(typeName) && typeName !== node.name) {
        dependencyTypes.add(typeName);
      }
    });
  });

  // Add dependency relationships
  // But skip if we already have a stronger relationship (property, factory, inheritance)
  dependencyTypes.forEach((targetName) => {
    const hasStrongerRelationship = graph.relationships.some(
      (rel) =>
        rel.from === node.name &&
        rel.to === targetName &&
        (rel.type === 'extends' ||
          rel.type === 'implements' ||
          rel.type === 'creates' ||
          rel.type === 'composition' ||
          rel.type === 'aggregation')
    );

    if (!hasStrongerRelationship) {
      graph.relationships.push({
        from: node.name,
        to: targetName,
        type: 'dependency',
      });
    }
  });
}

/**
 * Detects bidirectional relationships (e.g., IImage <--> ITensor)
 * Marks them for special rendering in Mermaid
 * @param graph - Graph to analyze
 */
function detectBidirectionalRelationships(graph: UMLGraph): void {
  const bidirectionalPairs = new Set<string>();

  // Find pairs with relationships in both directions
  graph.relationships.forEach((rel, index) => {
    const reverse = graph.relationships.find(
      (r, i) =>
        i !== index &&
        r.from === rel.to &&
        r.to === rel.from &&
        r.type === rel.type
    );

    if (reverse) {
      // Create a canonical key (sorted names)
      const key = [rel.from, rel.to].sort().join('|');
      bidirectionalPairs.add(key);
    }
  });

  // Mark bidirectional relationships
  // (Could be used in rendering to show <--> instead of two separate arrows)
  graph.relationships.forEach((rel) => {
    const key = [rel.from, rel.to].sort().join('|');
    if (bidirectionalPairs.has(key)) {
      (rel as any).isBidirectional = true;
    }
  });
}

/**
 * Removes duplicate relationships
 * Keeps only unique (from, to, type) combinations
 * @param graph - Graph to deduplicate
 */
function deduplicateRelationships(graph: UMLGraph): void {
  const seen = new Set<string>();
  const uniqueRelationships: UMLRelationship[] = [];

  graph.relationships.forEach((rel) => {
    const key = `${rel.from}|${rel.to}|${rel.type}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueRelationships.push(rel);
    }
  });

  graph.relationships = uniqueRelationships;
}

/**
 * Gets relationship type priority for conflict resolution
 * Higher priority relationships override lower ones
 * @param type - Relationship type
 * @returns Priority (higher = more important)
 */
function getRelationshipPriority(type: RelationshipType): number {
  switch (type) {
    case 'extends':
      return 6; // Highest priority
    case 'implements':
      return 5;
    case 'creates':
      return 4;
    case 'composition':
      return 3;
    case 'aggregation':
      return 2;
    case 'dependency':
      return 1; // Lowest priority
  }
}
