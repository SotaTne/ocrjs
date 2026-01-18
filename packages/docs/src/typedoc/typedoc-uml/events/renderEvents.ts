import type { Reflection } from 'typedoc';
import type { MarkdownRendererEvent } from 'typedoc-plugin-markdown';
import { collectModelsFromPages } from '../core/collectModels.js';
import { createGraphIndex, type GraphIndex } from '../core/createGraph.js';
import type { PluginOptions } from '../options.js';

export function onRenderBeginEventForCollectModels(
  event: MarkdownRendererEvent,
  targets: Set<number>,
  modelById: Map<number, Reflection>,
  graphIndexRef: { current: GraphIndex },
  options: PluginOptions,
) {
  targets.clear();
  modelById.clear();

  collectModelsFromPages(event, options, targets, modelById);

  graphIndexRef.current = createGraphIndex(targets, modelById);
}
