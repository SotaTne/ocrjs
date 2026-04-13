export function renderMermaidAsMarkdown(mermaid: string): string {
  return `\`\`\`mermaid\n${mermaid}\n\`\`\``;
}
