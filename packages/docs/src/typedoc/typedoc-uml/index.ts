import type { Reflection } from 'typedoc';
import type { MarkdownApplication } from 'typedoc-plugin-markdown';
import {
  MarkdownPageEvent,
  MarkdownRendererEvent,
} from 'typedoc-plugin-markdown';
import type { GraphIndex } from './core/createGraph.js';
import { CommonEvent } from './events/pageCommonEvents.js';
import { onHtmlPageEndEvent } from './events/pageHtmlEvents.js';
import { onMarkdownPageEndEvent } from './events/pageMdEvents.js';
import { onRenderBeginEventForCollectModels } from './events/renderEvents.js';
import { getPluginOptions, OPTIONS } from './options.js';
import { getMode } from './utils.js';

export function load(app: MarkdownApplication): void {
  app.options.addDeclaration(OPTIONS.umlExcludeTypes);
  app.options.addDeclaration(OPTIONS.umlMaxDepth);
  app.options.addDeclaration(OPTIONS.umlMaxMembersPerClass);
  app.options.addDeclaration(OPTIONS.umlShowMembers);

  const getOptions = () => getPluginOptions(app.options);

  const targets = new Set<number>();
  const modelById = new Map<number, Reflection>();
  const graphIndexRef: { current: GraphIndex } = {
    current: { nodes: new Set(), edgesById: new Map() },
  };

  // common process
  app.renderer.on(MarkdownRendererEvent.BEGIN, (event) => {
    targets.clear();
    modelById.clear();
    graphIndexRef.current = { nodes: new Set(), edgesById: new Map() };
    const options = getOptions();
    onRenderBeginEventForCollectModels(
      event,
      targets,
      modelById,
      graphIndexRef,
      options,
    );
  });

  app.renderer.on(MarkdownPageEvent.END, (event) => {
    const mode = getMode(event.url);
    const options = getOptions();
    if (mode === 'unknown') {
      console.warn(`[uml] Unknown target: ${event.url}`);
      return;
    }
    CommonEvent({
      graphIndexRef,
      event,
      options,
    });
    if (mode === 'html') {
      onHtmlPageEndEvent(event, options, graphIndexRef);
      return;
    }
    if (mode === 'md') {
      onMarkdownPageEndEvent(event, options, graphIndexRef);
      return;
    }
  });
}
