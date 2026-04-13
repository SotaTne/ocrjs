import mermaid from 'mermaid';

export async function validateMermaid(source: string): Promise<void> {
  await mermaid.parse(source, {
    suppressErrors: false,
  });
}
