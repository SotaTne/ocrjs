import { describe, expect, it } from 'vitest';
import { MarkdownLinkStore } from './markdownLinkStore.js';
import type { LinkPageEvent } from './types.js';

describe('MarkdownLinkStore', () => {
  it('model 自身の id を absolute md link として登録する', () => {
    const store = new MarkdownLinkStore();
    const event = {
      url: '@ocrjs/infra-contract/interfaces/IImage.md',
      model: {
        id: 1,
        name: 'IImage',
      },
      pageHeadings: [],
    } as LinkPageEvent;

    store.registerPage(event);

    expect(store.resolve(1)).toEqual({
      absoluteLink: '@ocrjs/infra-contract/interfaces/IImage.md',
      pageUrl: '@ocrjs/infra-contract/interfaces/IImage.md',
    });
  });

  it('markdown は pageHeadings が空でも model link を維持する', () => {
    const store = new MarkdownLinkStore();
    const event = {
      url: '@ocrjs/model-onnx-web-adapter/classes/OnnxWebModelLoader.md',
      model: {
        id: 20,
        name: 'OnnxWebModelLoader',
        children: [{ id: 21, name: 'load' }],
      },
      pageHeadings: [],
    } as LinkPageEvent;

    store.registerPage(event);

    expect(store.resolve(20)?.absoluteLink).toBe(
      '@ocrjs/model-onnx-web-adapter/classes/OnnxWebModelLoader.md',
    );
    expect(store.resolve(21)).toEqual({
      absoluteLink:
        '@ocrjs/model-onnx-web-adapter/classes/OnnxWebModelLoader.md',
      pageUrl: '@ocrjs/model-onnx-web-adapter/classes/OnnxWebModelLoader.md',
    });
  });

  it('markdown は子孫も同じ page link に登録する', () => {
    const store = new MarkdownLinkStore();
    const event = {
      url: '@ocrjs/infra-contract/interfaces/ITensor.md',
      model: {
        id: 1,
        name: 'ITensor',
        children: [
          {
            id: 2,
            name: 'toImage',
            children: [{ id: 3, name: 'layout' }],
          },
        ],
      },
      pageHeadings: [],
    } as LinkPageEvent;

    store.registerPage(event);

    expect(store.resolve(2)).toEqual({
      absoluteLink: '@ocrjs/infra-contract/interfaces/ITensor.md',
      pageUrl: '@ocrjs/infra-contract/interfaces/ITensor.md',
    });
    expect(store.resolve(3)).toEqual({
      absoluteLink: '@ocrjs/infra-contract/interfaces/ITensor.md',
      pageUrl: '@ocrjs/infra-contract/interfaces/ITensor.md',
    });
  });

  it('後から登録された index page で既存の reflection page link を上書きしない', () => {
    const store = new MarkdownLinkStore();

    store.registerPage({
      url: '@ocrjs/infra-contract/classes/Base.md',
      model: {
        id: 1,
        name: 'Base',
      },
      pageHeadings: [],
    } as LinkPageEvent);

    store.registerPage({
      url: '@ocrjs/infra-contract/index.md',
      model: {
        id: 100,
        name: '@ocrjs/infra-contract',
        children: [{ id: 1, name: 'Base' }],
      },
      pageHeadings: [],
    } as LinkPageEvent);

    expect(store.resolve(1)).toEqual({
      absoluteLink: '@ocrjs/infra-contract/classes/Base.md',
      pageUrl: '@ocrjs/infra-contract/classes/Base.md',
    });
  });

  it('先に広範なページで登録されていても、後から個別ページが登録された場合は上書きする', () => {
    const store = new MarkdownLinkStore();

    // 先に README などの広範なページで Base が見つかり、登録される
    store.registerPage({
      url: 'README.md',
      model: {
        id: 100,
        name: 'Project',
        children: [{ id: 1, name: 'Base' }],
      },
      pageHeadings: [],
    } as LinkPageEvent);

    expect(store.resolve(1)).toEqual({
      absoluteLink: 'README.md',
      pageUrl: 'README.md',
    });

    // 後から Base クラス自身の個別ページが処理される
    store.registerPage({
      url: 'classes/Base.md',
      model: {
        id: 1,
        name: 'Base',
      },
      pageHeadings: [],
    } as LinkPageEvent);

    // 個別ページへのリンクに上書きされているべき
    expect(store.resolve(1)).toEqual({
      absoluteLink: 'classes/Base.md',
      pageUrl: 'classes/Base.md',
    });
  });
});
