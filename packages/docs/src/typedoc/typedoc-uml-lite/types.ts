import type { DeclarationReflection } from 'typedoc';

/**
 * UML stereotypes for class diagram annotation
 */
export type Stereotype =
  | 'interface'
  | 'abstract'
  | 'factory'
  | 'enumeration'
  | 'class';

/**
 * Multiplicity/cardinality for properties and relationships
 */
export type Multiplicity =
  | '1'       // Required single
  | '0..1'    // Optional single
  | '0..*'    // Optional array
  | '1..*';   // Required array

/**
 * Visibility modifiers for members
 */
export type Visibility = 'public' | 'private' | 'protected';

/**
 * Relationship types for UML diagrams
 */
export type RelationshipType =
  | 'extends'      // Inheritance → <|--
  | 'implements'   // Implementation → <|..
  | 'creates'      // Factory pattern → ..>
  | 'composition'  // Strong ownership → *--
  | 'aggregation'  // Weak reference → o--
  | 'dependency';  // Uses → -->

/**
 * Property representation with multiplicity and visibility
 */
export interface UMLProperty {
  /** Property name */
  name: string;

  /** Type string (can be complex like "readonly number[]") */
  type: string;

  /** Cardinality of the property */
  multiplicity: Multiplicity;

  /** Visibility modifier */
  visibility: Visibility;

  /** Whether property is readonly */
  isReadonly: boolean;
}

/**
 * Method parameter representation
 */
export interface UMLParameter {
  /** Parameter name */
  name: string;

  /** Parameter type string */
  type: string;

  /** Whether parameter is optional */
  isOptional: boolean;
}

/**
 * Method representation with parameters and return type
 */
export interface UMLMethod {
  /** Method name */
  name: string;

  /** Method parameters */
  parameters: UMLParameter[];

  /** Return type string */
  returnType: string;

  /** Visibility modifier */
  visibility: Visibility;
}

/**
 * Represents a node in the UML class diagram
 */
export interface UMLNode {
  /** Fully qualified name (e.g., "ITensor", "ErrorableBase") */
  name: string;

  /** TypeDoc reflection reference for accessing rich metadata */
  reflection: DeclarationReflection;

  /** Detected stereotype */
  stereotype: Stereotype;

  /** Public properties with types and multiplicity */
  properties: UMLProperty[];

  /** Public methods with signatures */
  methods: UMLMethod[];

  /** Distance from root node (0 = root, max 2) */
  depth: number;

  /** Relative path to documentation page (e.g., "interfaces/ITensor.html") */
  relativePath: string;
}

/**
 * Represents a relationship between two types in UML diagram
 */
export interface UMLRelationship {
  /** Source type name */
  from: string;

  /** Target type name */
  to: string;

  /** Type of relationship */
  type: RelationshipType;

  /** Optional multiplicity for composition/aggregation */
  multiplicity?: string;

  /** Optional label (e.g., "<<creates>>" for factories) */
  label?: string;
}

/**
 * Graph representation for UML diagram
 */
export interface UMLGraph {
  /** Map of node name to UMLNode */
  nodes: Map<string, UMLNode>;

  /** Array of relationships between nodes */
  relationships: UMLRelationship[];

  /** Name of the root node (starting point) */
  rootNode: string;
}

/**
 * Plugin configuration options
 */
export interface UMLPluginOptions {
  /** Maximum depth for graph traversal (default: 2) */
  maxDepth: number;

  /** Types to exclude from diagrams */
  excludeTypes: string[];

  /** Whether to include primitive types */
  includePrimitives: boolean;

  /** Output format detection mode */
  outputFormat: 'auto' | 'html' | 'markdown';

  /** Whether to show members (properties/methods) */
  showMembers: boolean;

  /** Maximum number of members to show per class */
  maxMembersPerClass: number;
}
