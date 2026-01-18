import { type DeclarationReflection, ReflectionKind } from 'typedoc';
import type { MarkdownPageEvent } from 'typedoc-plugin-markdown';
import type { GraphIndex } from '../core/createGraph.js';
import type { PluginOptions } from '../options.js';
import { isReferenceType, isReflectionType } from '../utils.js';

type Uml = {
  base: number;
};

function isDeclarationReflectionLike(x: unknown): x is DeclarationReflection {
  if (!x || typeof x !== 'object') return false;

  // TypeDoc の DeclarationReflection が持つ最低限っぽい形
  // kindOf は Reflection が持つ
  if ('kindOf' in x && typeof x.kindOf !== 'function') return false;
  // id は Reflection が持つ
  if ('id' in x && typeof x.id !== 'number') return false;

  return true;
}

export function CommonEvent({
  graphIndexRef,
  options,
  event,
}: {
  graphIndexRef: { current: GraphIndex };
  options: PluginOptions;
  event: MarkdownPageEvent;
}): Uml | null {
  const model = event.model;

  if (!model || typeof model !== 'object') return null;
  if (!('id' in model) || typeof model.id !== 'number') return null;
  if (!('kindOf' in model) || typeof model.kindOf !== 'function') return null;

  if (!model.kindOf([ReflectionKind.Class, ReflectionKind.Interface]))
    return null;

  const modelId = model.id;

  const graphIndex = graphIndexRef.current;

  if (!graphIndex.nodes.has(modelId)) return null;

  if (!isDeclarationReflectionLike(model)) return null;

  const children = Array.isArray(model.children) ? model.children : [];

  const extendAll = model.extendedTypes || [];

  const implAll = model.implementedTypes || [];

  for (const child of children) {
    //console.log(child.name);
  }
  const modelName = model.name;

  // console.log(modelName);

  for (const extend of extendAll) {
    if (isReferenceType(extend)) {
      const reference = extend.reflection;
      if (!reference) {
        console.log('no reference', extend);
      } else {
        console.log(modelName, '->', reference.name);
        // console.log(reference);

        if (graphIndex.nodes.has(reference.id)) {
          console.log('has', reference.name);
        } else {
          console.log('not has', reference.name);
        }
      }
    } else {
      console.log('not reference', extend);
    }
  }

  for (const impl of implAll) {
    console.log('impl', impl);
    if (isReferenceType(impl)) {
      const reference = impl.reflection;
      if (!reference) {
        console.log('no reference', impl);
      } else {
        console.log(modelName, '-->', reference.name);
        // console.log(reference);
      }
    } else {
      console.log('not reference', impl);
    }
  }

  return null;
}
