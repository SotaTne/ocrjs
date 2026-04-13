import { describe, expect, it } from 'vitest';
import { renderMermaidAsMarkdown } from './mermaidMd.js';

describe('generator/mermaidMd', () => {
  it('複雑な member 型を含む Mermaid text を mermaid fenced code block に変換する', () => {
    const mermaid = `classDiagram
class uml_Registry["Registry"] {
  +entries : Map<string, Entry | [Meta, Array<Tag>]>
}`;

    expect(renderMermaidAsMarkdown(mermaid)).toBe(`\`\`\`mermaid
classDiagram
class uml_Registry["Registry"] {
  +entries : Map<string, Entry | [Meta, Array<Tag>]>
}
\`\`\``);
  });

  it('edge と click href を含む Mermaid text もそのまま fenced block に包む', () => {
    const mermaid = `classDiagram
class uml_Base["Base"] {
}
class uml_Derived["Derived"] {
}

uml_Derived <|-- uml_Base

click uml_Base href "../classes/Base.html" "Base"
click uml_Derived href "../classes/Derived.html" "Derived"`;

    expect(renderMermaidAsMarkdown(mermaid)).toBe(`\`\`\`mermaid
classDiagram
class uml_Base["Base"] {
}
class uml_Derived["Derived"] {
}

uml_Derived <|-- uml_Base

click uml_Base href "../classes/Base.html" "Base"
click uml_Derived href "../classes/Derived.html" "Derived"
\`\`\``);
  });

  it('HTML のような escape をせず raw な Mermaid text を維持する', () => {
    const mermaid = `classDiagram
class uml_Query["Query<&"'>"] {
}`;

    expect(renderMermaidAsMarkdown(mermaid)).toBe(`\`\`\`mermaid
classDiagram
class uml_Query["Query<&"'>"] {
}
\`\`\``);
  });
});
