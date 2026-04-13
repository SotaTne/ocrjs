function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderMermaidAsHtml(mermaid: string): string {
  return `<pre class="mermaid">\n${escapeHtml(mermaid)}\n</pre>`;
}
