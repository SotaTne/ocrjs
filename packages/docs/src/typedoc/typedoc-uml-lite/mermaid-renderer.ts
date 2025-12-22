import type {
  UMLGraph,
  UMLNode,
  UMLRelationship,
  RelationshipType,
  Visibility,
} from './types';
import { visibilityToSymbol } from './detector';

/**
 * Renders a UML graph as Mermaid class diagram
 * Uses HTML block approach for better compatibility (avoids Markdown parsing issues)
 * @param graph - Graph to render
 * @param outputFormat - Output format ('html' or 'markdown')
 * @returns Mermaid diagram as HTML block
 */
export function renderMermaidDiagram(
  graph: UMLGraph,
  outputFormat: 'html' | 'markdown'
): string {
  const lines: string[] = [];

  // Build pure Mermaid code (no fences)
  lines.push('classDiagram');

  // Render class definitions
  for (const [nodeName, node] of graph.nodes) {
    lines.push(...renderNodeDefinition(node));
  }

  // Add blank line between definitions and relationships
  if (graph.relationships.length > 0) {
    lines.push('');
  }

  // Render relationships
  graph.relationships.forEach((rel) => {
    lines.push(renderRelationship(rel));
  });

  // Add interactive links
  if (graph.nodes.size > 0) {
    lines.push('');
    for (const [nodeName, node] of graph.nodes) {
      lines.push(renderInteractiveLink(nodeName, node.relativePath));
    }
  }

  const mermaidCode = lines.join('\n');

  // For HTML output (comment injection): Use markdown code fences
  // TypeDoc will convert to <pre><code class="language-mermaid">, then HtmlEnhancer converts to Mermaid format
  // For Markdown output: Code fences work directly
  return `\`\`\`mermaid\n${mermaidCode}\n\`\`\``;
}

/**
 * Renders a single node definition with stereotype, properties, and methods
 * @param node - Node to render
 * @returns Array of lines for this node
 */
function renderNodeDefinition(node: UMLNode): string[] {
  const lines: string[] = [];
  const members: string[] = [];

  // Stereotype annotation (if not a regular class and stereotype is valid)
  if (
    node.stereotype &&
    node.stereotype !== 'class' &&
    node.stereotype.trim()
  ) {
    members.push(`  <<${node.stereotype}>>`);
  }

  // Properties
  node.properties.forEach((prop) => {
    const visibility = visibilityToSymbol(prop.visibility);
    // NOTE: Mermaid doesn't support 'readonly' keyword or multiplicity in attributes
    // - 'readonly' is not supported by Mermaid classDiagram syntax
    // - Multiplicity belongs to relationships, not attributes (shown in o--, *--, etc.)
    // Format: +name : type (with spaces around colon)
    members.push(
      `  ${visibility}${prop.name} : ${prop.type}`
    );
  });

  // Methods
  node.methods.forEach((method) => {
    const visibility = visibilityToSymbol(method.visibility);

    // Format parameters: name:type (no spaces)
    // NOTE: Mermaid doesn't support optional parameter syntax (?)
    const params = method.parameters
      .map((p) => `${p.name}:${p.type}`)
      .join(', ');

    // Format: +methodName(param:type) ReturnType (space before return type, no colon)
    members.push(
      `  ${visibility}${method.name}(${params}) ${method.returnType}`
    );
  });

  // CRITICAL: Mermaid v10+ rejects empty braces {}
  // Empty classes must be written without braces
  if (members.length === 0) {
    // No members: emit class name only (no braces)
    lines.push(`class ${sanitizeClassName(node.name)}`);
  } else {
    // Has members: emit with braces
    lines.push(`class ${sanitizeClassName(node.name)} {`);
    lines.push(...members);
    lines.push('}');
  }

  return lines;
}

/**
 * Renders a relationship between two nodes
 * @param rel - Relationship to render
 * @returns Mermaid relationship syntax
 */
function renderRelationship(rel: UMLRelationship): string {
  const fromClass = sanitizeClassName(rel.from);
  const toClass = sanitizeClassName(rel.to);
  const arrow = getRelationshipArrow(rel.type);

  // Build relationship line
  let line = `${fromClass} ${arrow}`;

  // Add multiplicity if present (for composition/aggregation)
  if (rel.multiplicity) {
    line += ` "${rel.multiplicity}"`;
  }

  line += ` ${toClass}`;

  // Add label if present (for creates, etc.)
  if (rel.label) {
    line += ` : ${rel.label}`;
  }

  return line;
}

/**
 * Maps relationship type to Mermaid arrow syntax
 * @param type - Relationship type
 * @returns Mermaid arrow string
 */
function getRelationshipArrow(type: RelationshipType): string {
  switch (type) {
    case 'extends':
      return '<|--'; // Inheritance (solid line, closed arrow)

    case 'implements':
      return '<|..'; // Implementation (dashed line, closed arrow)

    case 'creates':
      return '..>'; // Dependency with stereotype (dashed line, open arrow)

    case 'composition':
      return '*--'; // Composition (solid line, filled diamond)

    case 'aggregation':
      return 'o--'; // Aggregation (solid line, hollow diamond)

    case 'dependency':
      return '-->'; // Dependency (solid line, open arrow)

    default:
      return '-->'; // Default fallback
  }
}

/**
 * Renders interactive link for a class/interface
 * Uses Mermaid's click syntax to make nodes clickable
 * @param className - Name of the class
 * @param relativePath - Relative path to documentation page
 * @returns Mermaid click directive
 */
function renderInteractiveLink(
  className: string,
  relativePath: string
): string {
  const sanitized = sanitizeClassName(className);
  const tooltip = `View ${className} documentation`;

  // Mermaid click syntax: click ClassName href "path" "tooltip"
  return `click ${sanitized} href "${relativePath}" "${tooltip}"`;
}

/**
 * Sanitizes class name for Mermaid
 * Mermaid class names cannot contain certain special characters
 * @param name - Original class name
 * @returns Sanitized name
 */
function sanitizeClassName(name: string): string {
  // Replace any non-alphanumeric characters (except underscore) with underscore
  // Keep the name readable but Mermaid-safe
  return name.replace(/[^\w]/g, '_');
}

/**
 * Detects output format from context
 * Checks if markdown plugin is active
 * @param plugins - Array of active plugin names
 * @param outputDir - Output directory path
 * @returns Detected format
 */
export function detectOutputFormat(
  plugins: string[],
  outputDir: string
): 'html' | 'markdown' {
  // Check if typedoc-plugin-markdown is loaded
  if (plugins.includes('typedoc-plugin-markdown')) {
    return 'markdown';
  }

  // Check output directory path
  if (outputDir.includes('/md') || outputDir.includes('markdown')) {
    return 'markdown';
  }

  // Default to HTML
  return 'html';
}

/**
 * Creates a compact representation of the diagram for debugging
 * @param graph - Graph to summarize
 * @returns Summary string
 */
export function summarizeDiagram(graph: UMLGraph): string {
  const nodeNames = Array.from(graph.nodes.keys()).join(', ');
  const relCount = graph.relationships.length;

  return `UML Diagram: ${graph.nodes.size} nodes (${nodeNames}), ${relCount} relationships`;
}
