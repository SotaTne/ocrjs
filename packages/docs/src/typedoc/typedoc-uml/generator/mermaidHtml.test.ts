import { describe, expect, it } from 'vitest';
import { renderMermaidAsHtml } from './mermaidHtml.js';

describe('generator/mermaidHtml', () => {
  it('複雑な member 型を含む Mermaid text を pre.mermaid HTML に変換し HTML escape する', () => {
    const mermaid = `classDiagram
class uml_Registry["Registry"] {
  +entries : Map<string, Entry | [Meta, Array<Tag>]>
}`;

    expect(renderMermaidAsHtml(mermaid)).toBe(`<pre class="mermaid">
classDiagram
class uml_Registry[&quot;Registry&quot;] {
  +entries : Map&lt;string, Entry | [Meta, Array&lt;Tag&gt;]&gt;
}
</pre>`);
  });

  it('edge と click href を含む Mermaid text も HTML escape する', () => {
    const mermaid = `classDiagram
class uml_Base["Base"] {
}
class uml_Derived["Derived"] {
}

uml_Derived <|-- uml_Base

click uml_Base href "../classes/Base.html" "Base"
click uml_Derived href "../classes/Derived.html" "Derived"`;

    expect(renderMermaidAsHtml(mermaid)).toBe(`<pre class="mermaid">
classDiagram
class uml_Base[&quot;Base&quot;] {
}
class uml_Derived[&quot;Derived&quot;] {
}

uml_Derived &lt;|-- uml_Base

click uml_Base href &quot;../classes/Base.html&quot; &quot;Base&quot;
click uml_Derived href &quot;../classes/Derived.html&quot; &quot;Derived&quot;
</pre>`);
  });

  it('引用符やアンパサンドを含む Mermaid text も HTML escape する', () => {
    const mermaid = `classDiagram
class uml_Query["Query<&"'>"] {
}`;

    expect(renderMermaidAsHtml(mermaid)).toBe(`<pre class="mermaid">
classDiagram
class uml_Query[&quot;Query&lt;&amp;&quot;&#39;&gt;&quot;] {
}
</pre>`);
  });
});
