import { ReflectionKind } from 'typedoc';
import type { MarkdownPageEvent } from 'typedoc-plugin-markdown';
import type { GraphIndex } from '../core/createGraph.js';
import type { PluginOptions } from '../options.js';

export function onMarkdownPageEndEvent(
  event: MarkdownPageEvent,
  options: PluginOptions,
  graphIndexRef: { current: GraphIndex },
) {
  const model = event.model;

  if (!model || typeof model !== 'object') return;
  if (!('id' in model) || typeof model.id !== 'number') return;
  if (!('kindOf' in model) || typeof model.kindOf !== 'function') return;

  if (!model.kindOf([ReflectionKind.Class, ReflectionKind.Interface])) return;

  const modelId = model.id;

  const graphIndex = graphIndexRef.current;

  if (!graphIndex.nodes.has(modelId)) return;

  if (options.showMembers) {
  }
}
