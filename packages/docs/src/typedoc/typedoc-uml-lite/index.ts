import type { Application, Context, RendererEvent } from 'typedoc';
import { Comment, DeclarationReflection, ParameterType, ReflectionKind } from 'typedoc';
import { DiagramInjector } from './diagram-injector';
import { HtmlEnhancer } from './html-enhancer';
import { buildUMLGraph } from './graph-builder';
import { analyzeRelationships } from './relationship-analyzer';
import { renderMermaidDiagram } from './mermaid-renderer';
import { getDefaultOptions, shouldExcludeType } from './utils';

/**
 * TypeDoc UML Lite Plugin (v2 - Hooks API)
 * Automatically generates Mermaid UML class diagrams for interfaces, classes, and enums
 *
 * Features:
 * - Detects stereotypes (interface, abstract, factory, enumeration)
 * - Calculates multiplicities (1, 0..1, 0..*, 1..*)
 * - Identifies 6 relationship types (extends, implements, creates, composition, aggregation, dependency)
 * - Generates interactive links to documentation pages
 * - Supports both HTML and Markdown output
 * - Max 2-hop graph traversal for embedded diagrams
 * - Uses typedoc-plugin-markdown hooks API for cleaner integration
 *
 * @param app - TypeDoc application instance
 */
export function load(app: Application): void {
  console.log('[UML Plugin] Loading TypeDoc UML Lite plugin (v2 - Hybrid)');

  // Register plugin options
  registerOptions(app);

  // Hybrid Approach for typedoc-plugin-markdown multi-output:
  // 1. Comment injection FIRST (for TypeDoc's native HTML theme)
  // 2. Hooks API (for typedoc-plugin-markdown's Markdown output)
  // Both approaches run independently to support dual output

  // Create diagram injector once (reused for all outputs to prevent duplicates)
  const injector = new DiagramInjector(app);
  let hooksRegistered = false;
  let commentsInjected = false;

  // Hook into renderer events
  app.renderer.on('beginRender' as any, (event: RendererEvent) => {
    const renderer = app.renderer as any;

    // STEP 1: Inject into comments (for HTML output with native TypeDoc theme)
    // This must happen FIRST, before any rendering
    if (!commentsInjected) {
      console.log('[UML Plugin] Injecting diagrams into comments (for HTML)');
      const contextLike = { project: event.project } as Context;
      injectDiagramsIntoComments(contextLike, app);
      commentsInjected = true;
    }

    // STEP 2: Register hooks (for Markdown output)
    // Check if typedoc-plugin-markdown is loaded
    if (!renderer.markdownHooks) {
      console.log('[UML Plugin] No markdown hooks available (HTML-only mode)');
      return;
    }

    // Register hooks only once (beginRender fires multiple times for multi-output)
    if (!hooksRegistered) {
      console.log('[UML Plugin] Registering hooks (for Markdown)');

      // Hook into content.begin to inject diagrams for Markdown output
      renderer.markdownHooks.on('content.begin', injector.onContentBegin);

      // Check if HTML output is enabled for interactive enhancement
      const outputs = app.options.getValue('outputs') as any[];
      const hasHtmlOutput = outputs?.some((out: any) => out.name === 'html');

      if (hasHtmlOutput) {
        console.log('[UML Plugin] Enabling interactive Mermaid.js for HTML');

        // Create HTML enhancer for Mermaid.js injection
        const enhancer = new HtmlEnhancer(app);

        // Register async job to enhance HTML after rendering
        renderer.postMarkdownRenderAsyncJobs.push(
          enhancer.enhance.bind(enhancer),
        );
      }

      hooksRegistered = true;
    }
  });

  console.log('[UML Plugin] Plugin loaded successfully');
}

/**
 * Injects UML diagrams into JSDoc comments (for HTML output)
 * TypeDoc's HTML theme reads from reflection comments
 */
function injectDiagramsIntoComments(context: Context, app: Application): void {
  const options = getPluginOptions(app);

  const reflections = context.project.getReflectionsByKind(
    ReflectionKind.Interface |
      ReflectionKind.Class |
      ReflectionKind.Enum |
      ReflectionKind.TypeAlias
  );

  let count = 0;

  reflections.forEach((reflection) => {
    if (!(reflection instanceof DeclarationReflection)) {
      return;
    }

    if (shouldExcludeType(reflection.name, options)) {
      return;
    }

    try {
      const graph = buildUMLGraph(reflection, context, options);
      analyzeRelationships(graph);

      const rootNode = graph.nodes.get(graph.rootNode);
      if (!rootNode) return;

      const hasMeaningfulContent =
        rootNode.properties.length > 0 ||
        rootNode.methods.length > 0 ||
        graph.relationships.length > 0;

      if (!hasMeaningfulContent) return;

      const mermaidCode = renderMermaidDiagram(graph, 'html');

      // Inject into comment
      if (!reflection.comment) {
        reflection.comment = new Comment();
      }

      // Check if already injected (avoid duplicates)
      const existingText = reflection.comment.summary
        ?.map((part: any) => part.text || '')
        .join('');

      if (existingText && existingText.includes('## UML Class Diagram')) {
        return;
      }

      const umlSection = `\n\n## UML Class Diagram\n\n${mermaidCode}\n`;

      if (reflection.comment.summary && Array.isArray(reflection.comment.summary)) {
        reflection.comment.summary.push({
          kind: 'text',
          text: umlSection,
        } as any);
      } else {
        reflection.comment.summary = [
          {
            kind: 'text',
            text: umlSection,
          } as any,
        ];
      }

      count++;
    } catch (error) {
      console.error(`[UML Plugin] Error processing ${reflection.name}:`, error);
    }
  });

  console.log(`[UML Plugin] Injected ${count} diagrams into comments`);
}

/**
 * Gets plugin options from TypeDoc configuration
 */
function getPluginOptions(app: Application) {
  const maxDepth = app.options.getValue('umlMaxDepth') as number;
  const excludeTypesStr = app.options.getValue('umlExcludeTypes') as string;
  const showMembers = app.options.getValue('umlShowMembers') as boolean;
  const maxMembersPerClass = app.options.getValue('umlMaxMembersPerClass') as number;

  const excludeTypes = excludeTypesStr
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return getDefaultOptions({
    maxDepth: maxDepth || 2,
    excludeTypes,
    showMembers: showMembers !== false,
    maxMembersPerClass: maxMembersPerClass || 10,
  });
}

/**
 * Registers plugin-specific options with TypeDoc
 * @param app - TypeDoc application
 */
function registerOptions(app: Application): void {
  app.options.addDeclaration({
    name: 'umlMaxDepth',
    help: 'Maximum depth for UML graph traversal (default: 2)',
    type: ParameterType.Number,
    defaultValue: 2,
  });

  app.options.addDeclaration({
    name: 'umlExcludeTypes',
    help: 'Comma-separated list of types to exclude from UML diagrams',
    type: ParameterType.String,
    defaultValue: '',
  });

  app.options.addDeclaration({
    name: 'umlShowMembers',
    help: 'Whether to show class members (properties/methods) in diagrams',
    type: ParameterType.Boolean,
    defaultValue: true,
  });

  app.options.addDeclaration({
    name: 'umlMaxMembersPerClass',
    help: 'Maximum number of members to show per class',
    type: ParameterType.Number,
    defaultValue: 10,
  });
}
