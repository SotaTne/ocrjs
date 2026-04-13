import { describe, expect, it } from 'vitest';
import { HtmlLinkStore } from './htmlLinkStore.js';
import type { LinkPageEvent } from './types.js';

describe('HtmlLinkStore', () => {
  it('model 自身の id を absolute html link として登録する', () => {
    const store = new HtmlLinkStore();
    const event = {
      url: 'classes/Schedule.html',
      model: {
        id: 1,
        name: 'Schedule',
      },
      pageHeadings: [],
    } as LinkPageEvent;

    store.registerPage(event);

    expect(store.resolve(1)).toEqual({
      absoluteLink: 'classes/Schedule.html',
      pageUrl: 'classes/Schedule.html',
    });
  });

  it('pageHeadings の name 一致から child を anchor 付き html link として登録する', () => {
    const store = new HtmlLinkStore();
    const event = {
      url: 'modules/_ocrjs_infra-contract.html',
      model: {
        id: 1,
        name: '@ocrjs/infra-contract',
        children: [
          { id: 10, name: 'AdaptiveThresholdMethod' },
          { id: 11, name: 'TensorLayout' },
        ],
      },
      pageHeadings: [
        { link: '#adaptivethresholdmethod', text: 'AdaptiveThresholdMethod' },
        { link: '#tensorlayout', text: 'TensorLayout' },
      ],
    } as LinkPageEvent;

    store.registerPage(event);

    expect(store.resolve(10)).toEqual({
      absoluteLink:
        'modules/_ocrjs_infra-contract.html#adaptivethresholdmethod',
      pageUrl: 'modules/_ocrjs_infra-contract.html',
      anchor: '#adaptivethresholdmethod',
    });
    expect(store.resolve(11)).toEqual({
      absoluteLink: 'modules/_ocrjs_infra-contract.html#tensorlayout',
      pageUrl: 'modules/_ocrjs_infra-contract.html',
      anchor: '#tensorlayout',
    });
  });

  it('heading が無い child は登録しない', () => {
    const store = new HtmlLinkStore();
    const event = {
      url: 'interfaces/IImage.html',
      model: {
        id: 1,
        name: 'IImage',
        children: [{ id: 2, name: 'width' }],
      },
      pageHeadings: [],
    } as LinkPageEvent;

    store.registerPage(event);

    expect(store.resolve(2)).toEqual({
      absoluteLink: 'interfaces/IImage.html',
      pageUrl: 'interfaces/IImage.html',
    });
  });

  it('heading が無くても子孫は page 単位 link として登録する', () => {
    const store = new HtmlLinkStore();
    const event = {
      url: 'interfaces/IModel.html',
      model: {
        id: 1,
        name: 'IModel',
        children: [
          {
            id: 2,
            name: 'forward',
            children: [{ id: 3, name: 'inputs' }],
          },
        ],
      },
      pageHeadings: [],
    } as LinkPageEvent;

    store.registerPage(event);

    expect(store.resolve(2)).toEqual({
      absoluteLink: 'interfaces/IModel.html',
      pageUrl: 'interfaces/IModel.html',
    });
    expect(store.resolve(3)).toEqual({
      absoluteLink: 'interfaces/IModel.html',
      pageUrl: 'interfaces/IModel.html',
    });
  });

  it('後から登録された hierarchy page で既存の reflection page link を上書きしない', () => {
    const store = new HtmlLinkStore();

    store.registerPage({
      url: 'classes/Base.html',
      model: {
        id: 1,
        name: 'Base',
      },
      pageHeadings: [],
    } as LinkPageEvent);

    store.registerPage({
      url: 'hierarchy.html',
      model: {
        id: 100,
        name: 'Hierarchy',
        children: [{ id: 1, name: 'Base' }],
      },
      pageHeadings: [],
    } as LinkPageEvent);

    expect(store.resolve(1)).toEqual({
      absoluteLink: 'classes/Base.html',
      pageUrl: 'classes/Base.html',
    });
  });
});
