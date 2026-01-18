import { type Reflection, ReflectionKind } from 'typedoc';
import type { MarkdownRendererEvent } from 'typedoc-plugin-markdown';
import type { PluginOptions } from '../options.js';
import type { ReflectionID } from '../types.js';

export function collectModelsFromPages(
  event: MarkdownRendererEvent,
  options: PluginOptions,
  targets: Set<ReflectionID>,
  modelById: Map<ReflectionID, Reflection>,
) {
  const excludedTypes = options.excludeTypes ?? [];

  for (const page of event.pages) {
    const m = page.model;
    if (!m || typeof m !== 'object') continue;
    if (!('id' in m) || typeof m.id !== 'number') continue;
    if (!('kindOf' in m) || typeof m.kindOf !== 'function') continue;

    if (
      !m.kindOf([
        ReflectionKind.Class,
        ReflectionKind.Interface,
        ReflectionKind.TypeAlias,
      ])
    )
      continue;

    if (m.kindOf(ReflectionKind.TypeAlias) && excludedTypes.includes(m.name))
      continue;

    targets.add(m.id);
    modelById.set(m.id, m);
  }
}
