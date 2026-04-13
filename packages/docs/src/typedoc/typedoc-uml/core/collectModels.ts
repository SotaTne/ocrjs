import { type Reflection, ReflectionKind } from 'typedoc';
import type { MarkdownRendererEvent } from 'typedoc-plugin-markdown';
import type { PluginOptions } from '../options.js';
import type { ReflectionID } from '../types.js';

/**
 * レンダリング対象ページから UML 生成に使う reflection を収集します。
 *
 * 現時点では `Class`、`Interface`、`TypeAlias` だけを対象とし、
 * `excludeTypes` に含まれる TypeAlias は収集対象から除外します。
 *
 * この関数の責務は「ページ単位の model を全走査して、後段の全体解析に渡す
 * 入力集合を作ること」だけです。UML の生成、関係の解析、出力形式ごとの
 * 整形はここでは行いません。
 *
 * 収集結果の真実は `name` ではなく `id` です。同名の型が存在しても、
 * `targets` と `modelById` は reflection id を基準に扱います。
 *
 * `excludeTypes` は OOP ベースの設計において「class として扱う必要がない」
 * TypeAlias を除外するためのものなので、TypeAlias に対してのみ適用します。
 *
 * @param event - render begin 時点のページ一覧を含むイベントです。
 * @param options - 収集対象の絞り込みに使うプラグイン設定です。
 * @param targets - 収集した reflection id を追加する可変 Set です。
 * @param modelById - 収集した reflection を id で引けるようにする可変 Map です。
 */
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
