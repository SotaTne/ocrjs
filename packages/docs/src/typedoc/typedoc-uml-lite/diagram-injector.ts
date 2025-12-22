import type { Application, Context } from 'typedoc';
import { DeclarationReflection, ReflectionKind } from 'typedoc';
import type { UMLPluginOptions } from './types';
import { buildUMLGraph } from './graph-builder';
import { analyzeRelationships } from './relationship-analyzer';
import { renderMermaidDiagram } from './mermaid-renderer';
import { getDefaultOptions, shouldExcludeType } from './utils';

/**
 * Diagram Injector - Hook-based approach for UML diagram generation
 *
 * This class uses typedoc-plugin-markdown's hooks API instead of modifying comments directly.
 * Benefits:
 * - Cleaner separation of concerns
 * - Works with actual rendered content
 * - Knows output format (HTML vs Markdown)
 * - Can inject at precise positions
 */
export class DiagramInjector {
  private options: UMLPluginOptions;
  private app: Application;
  private processedReflections: Set<string> = new Set();

  constructor(app: Application) {
    this.app = app;
    this.options = this.getPluginOptions();
  }

  /**
   * Hook callback for markdownHooks.on('content.begin')
   * Injects UML diagram at the beginning of the content section
   *
   * @param context - Markdown theme context with page information
   * @returns UML diagram markdown string or empty string
   */
  public onContentBegin = (context: any): string => {
    try {
      const page = context.page;
      if (!page || !page.model) {
        return '';
      }

      const reflection = page.model;

      // Only process declaration reflections (interfaces, classes, etc.)
      if (!this.shouldGenerateDiagram(reflection)) {
        return '';
      }

      // Prevent duplicates - check if we've already processed this reflection
      const reflectionId = reflection.id || reflection.name;
      if (this.processedReflections.has(reflectionId)) {
        return '';
      }

      // Also check if diagram already exists in comments (from comment injection)
      if (reflection.comment) {
        const existingText = reflection.comment.summary
          ?.map((part: any) => part.text || '')
          .join('');
        if (existingText && existingText.includes('## UML Class Diagram')) {
          // Diagram already in comments, don't add via hooks
          return '';
        }
      }

      this.processedReflections.add(reflectionId);

      // Build UML graph using existing logic
      const graph = buildUMLGraph(
        reflection,
        { project: page.project } as Context,
        this.options
      );

      // Analyze relationships
      analyzeRelationships(graph);

      // Check if graph has meaningful content
      const rootNode = graph.nodes.get(graph.rootNode);
      if (!rootNode) {
        return '';
      }

      const hasMeaningfulContent =
        rootNode.properties.length > 0 ||
        rootNode.methods.length > 0 ||
        graph.relationships.length > 0;

      if (!hasMeaningfulContent) {
        return '';
      }

      // Detect output format from page URL
      const isHtmlOutput = page.url.endsWith('.html');
      const format = isHtmlOutput ? 'html' : 'markdown';

      // Render Mermaid diagram
      const mermaidCode = renderMermaidDiagram(graph, format);

      // Return diagram section (will be injected at content.begin)
      return `\n## UML Class Diagram\n\n${mermaidCode}\n\n`;
    } catch (error) {
      console.error(
        `[UML Plugin] Error generating diagram for ${context.page?.model?.name}:`,
        error
      );
      return '';
    }
  };

  /**
   * Determines if a diagram should be generated for this reflection
   *
   * @param reflection - TypeDoc reflection to check
   * @returns true if diagram should be generated
   */
  private shouldGenerateDiagram(reflection: any): boolean {
    // Must be a declaration reflection
    if (!(reflection instanceof DeclarationReflection)) {
      return false;
    }

    // Only generate for specific kinds
    const validKinds = [
      ReflectionKind.Interface,
      ReflectionKind.Class,
      ReflectionKind.Enum,
      ReflectionKind.TypeAlias,
    ];

    if (!validKinds.includes(reflection.kind)) {
      return false;
    }

    // Check exclusion list
    if (shouldExcludeType(reflection.name, this.options)) {
      return false;
    }

    return true;
  }

  /**
   * Gets plugin options from TypeDoc application
   *
   * @returns UML plugin options
   */
  private getPluginOptions(): UMLPluginOptions {
    const maxDepth = this.app.options.getValue('umlMaxDepth') as number;
    const excludeTypesStr = this.app.options.getValue('umlExcludeTypes') as string;
    const showMembers = this.app.options.getValue('umlShowMembers') as boolean;
    const maxMembersPerClass = this.app.options.getValue(
      'umlMaxMembersPerClass'
    ) as number;

    const excludeTypes = excludeTypesStr
      ? excludeTypesStr
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    return getDefaultOptions({
      maxDepth: maxDepth || 2,
      excludeTypes,
      showMembers: showMembers !== false,
      maxMembersPerClass: maxMembersPerClass || 10,
    });
  }
}
