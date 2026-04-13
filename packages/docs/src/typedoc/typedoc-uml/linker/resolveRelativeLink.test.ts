import { describe, expect, it } from 'vitest';
import { resolveRelativeLink } from './resolveRelativeLink.js';

describe('resolveRelativeLink', () => {
  it('同一 page なら anchor のみを返す', () => {
    expect(
      resolveRelativeLink(
        'interfaces/IImage.html',
        'interfaces/IImage.html#resize',
      ),
    ).toBe('#resize');
  });

  it('別 page なら相対 path を返す', () => {
    expect(
      resolveRelativeLink(
        '@ocrjs/infra-contract/interfaces/IImage.md',
        '@ocrjs/infra-contract/type-aliases/Point.md',
      ),
    ).toBe('../type-aliases/Point.md');
  });

  it('別 page かつ anchor があれば相対 path に連結する', () => {
    expect(
      resolveRelativeLink(
        'modules/_ocrjs_infra-contract.html',
        'interfaces/_ocrjs_infra-contract.IImage.html#resize',
      ),
    ).toBe('../interfaces/_ocrjs_infra-contract.IImage.html#resize');
  });
});
