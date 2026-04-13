import type { MarkdownApplication } from 'typedoc-plugin-markdown';
import { registerMermaidHeadHook } from './hooks/mermaidHeadHook.js';
import { registerMermaidHtmlContentHook } from './hooks/mermaidHtmlContentHook.js';
import {
  registerMermaidHtmlLinkStoreHook,
  registerMermaidMarkdownLinkStoreHook,
} from './hooks/mermaidLinkStoreHooks.js';
import { registerMermaidMarkdownContentHook } from './hooks/mermaidMarkdownContentHook.js';
import { HtmlLinkStore } from './linker/htmlLinkStore.js';
import { MarkdownLinkStore } from './linker/markdownLinkStore.js';
import { getPluginOptions, OPTIONS } from './options.js';

export function load(app: MarkdownApplication): void {
  const htmlLinkStore = new HtmlLinkStore();
  const markdownLinkStore = new MarkdownLinkStore();

  app.options.addDeclaration(OPTIONS.umlExcludeTypes);
  app.options.addDeclaration(OPTIONS.umlMaxDepth);
  app.options.addDeclaration(OPTIONS.umlMaxMembersPerClass);
  app.options.addDeclaration(OPTIONS.umlShowMembers);
  registerMermaidHeadHook(app.renderer.hooks);
  registerMermaidHtmlLinkStoreHook(app.renderer, htmlLinkStore);
  registerMermaidHtmlContentHook(
    app.renderer.hooks,
    () => getPluginOptions(app.options),
    htmlLinkStore,
  );
  if (app.renderer.markdownHooks) {
    registerMermaidMarkdownLinkStoreHook(app.renderer, markdownLinkStore);
    registerMermaidMarkdownContentHook(
      app.renderer.markdownHooks,
      () => getPluginOptions(app.options),
      markdownLinkStore,
    );
  }
}
