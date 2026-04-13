import type { SomeType } from 'typedoc';
import { describe, expect, it } from 'vitest';
import {
  RELATED_TYPE_CHILD_ROLES,
  RELATED_TYPE_KINDS,
} from '../model/relatedType.js';
import { resolveDisplayRelatedTypeFromSomeType } from './resolveDisplayRelatedTypeFromSomeType.js';

describe('resolveDisplayRelatedTypeFromSomeType', () => {
  it('Array<Entry> を display 用に generic Array node として保持する', () => {
    const node = resolveDisplayRelatedTypeFromSomeType({
      type: 'array',
      elementType: {
        type: 'reference',
        name: 'Entry',
        reflection: { id: 1 },
      },
    } as SomeType);

    expect(node.kind).toBe(RELATED_TYPE_KINDS.generic);
    expect(node.text).toBe('Array');
    expect(node.children).toEqual([
      {
        role: RELATED_TYPE_CHILD_ROLES.typeArg,
        node: expect.objectContaining({
          kind: RELATED_TYPE_KINDS.reference,
          text: 'Entry',
        }),
      },
    ]);
  });

  it('Map<string, Array<Entry>> の内側 Array を保持する', () => {
    const node = resolveDisplayRelatedTypeFromSomeType({
      type: 'reference',
      name: 'Map',
      typeArguments: [
        { type: 'intrinsic', name: 'string' },
        {
          type: 'array',
          elementType: {
            type: 'reference',
            name: 'Entry',
            reflection: { id: 1 },
          },
        },
      ],
    } as SomeType);

    expect(node.kind).toBe(RELATED_TYPE_KINDS.generic);
    expect(node.text).toBe('Map');
    expect(node.children[1]?.node.kind).toBe(RELATED_TYPE_KINDS.generic);
    expect(node.children[1]?.node.text).toBe('Array');
    expect(node.children[1]?.node.children[0]?.node.text).toBe('Entry');
  });
});
