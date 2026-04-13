// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import {
  MULTIPLICITY,
  RELATED_TYPE_KINDS,
  RelatedTypeNode,
} from '../model/relatedType.js';
import {
  UML_EDGE_KINDS,
  UML_NODE_KINDS,
  UML_VISIBILITY,
  UmlGraphModel,
} from '../model/umlGraph.js';
import { validateMermaid } from '../test/helpers/validateMermaid.js';
import { renderUmlGraphAsMermaidClassDiagram } from './umlGenerator.js';

describe('generator/umlGenerator', () => {
  it('最小の classDiagram として単一 class を構文成立させる', async () => {
    const graph = new UmlGraphModel();
    graph.addNode({
      id: 'Only',
      name: 'Only',
      kind: UML_NODE_KINDS.class,
      members: [],
    });
    const mermaid = renderUmlGraphAsMermaidClassDiagram(graph);

    expect(mermaid).toBe(`classDiagram
class uml_Only["Only"] {
}`);
    await expect(validateMermaid(mermaid)).resolves.toBeUndefined();
  });

  it('特定の graph を Mermaid classDiagram に変換できる', async () => {
    const graph = new UmlGraphModel();
    graph.addNode({
      id: 'Schedule',
      reflectionId: 1,
      name: 'Schedule',
      kind: UML_NODE_KINDS.class,
      members: [
        {
          name: 'entries',
          visibility: UML_VISIBILITY.public,
          typeNode: new RelatedTypeNode(
            RELATED_TYPE_KINDS.generic,
            'Array',
            MULTIPLICITY.exactlyOne,
            undefined,
            [
              {
                role: 'typeArg',
                node: new RelatedTypeNode(
                  RELATED_TYPE_KINDS.reference,
                  'Entry',
                  MULTIPLICITY.exactlyOne,
                  2,
                ),
              },
            ],
          ),
        },
      ],
    });
    graph.addNode({
      id: 'IEntry',
      reflectionId: 2,
      name: 'IEntry',
      kind: UML_NODE_KINDS.interface,
      members: [],
    });
    graph.addEdge({
      from: 'Schedule',
      to: 'IEntry',
      kind: UML_EDGE_KINDS.association,
      memberName: 'entries',
      multiplicity: MULTIPLICITY.many,
    });

    const mermaid = renderUmlGraphAsMermaidClassDiagram(graph, {
      currentPageAbsoluteLink: 'modules/_ocrjs_infra-contract.html',
      resolveReflectionLink(reflectionId) {
        if (reflectionId === 1) {
          return {
            absoluteLink: 'classes/Schedule.html',
            pageUrl: 'classes/Schedule.html',
          };
        }

        if (reflectionId === 2) {
          return {
            absoluteLink: 'interfaces/IEntry.html',
            pageUrl: 'interfaces/IEntry.html',
          };
        }

        return undefined;
      },
    });

    expect(mermaid).toBe(`classDiagram
class uml_Schedule["Schedule"] {
  +entries : Array<Entry>
}
class uml_IEntry["IEntry"] {
  <<interface>>
}

uml_Schedule --> "*" uml_IEntry : entries

click uml_Schedule href "../classes/Schedule.html" "Schedule"
click uml_IEntry href "../interfaces/IEntry.html" "IEntry"`);
    await expect(validateMermaid(mermaid)).resolves.toBeUndefined();
  });

  it('Markdown 用には member 型文字列だけ < > を escape できる', () => {
    const graph = new UmlGraphModel();
    graph.addNode({
      id: 'Schedule',
      name: 'Schedule',
      kind: UML_NODE_KINDS.class,
      members: [
        {
          name: 'entries',
          visibility: UML_VISIBILITY.public,
          typeNode: new RelatedTypeNode(
            RELATED_TYPE_KINDS.generic,
            'Array',
            MULTIPLICITY.exactlyOne,
            undefined,
            [
              {
                role: 'typeArg',
                node: new RelatedTypeNode(
                  RELATED_TYPE_KINDS.reference,
                  'Entry',
                  MULTIPLICITY.exactlyOne,
                ),
              },
            ],
          ),
        },
      ],
    });
    graph.addNode({
      id: 'Typed',
      name: 'Typed',
      kind: UML_NODE_KINDS.type,
      members: [],
    });
    graph.addEdge({
      from: 'Schedule',
      to: 'Typed',
      kind: UML_EDGE_KINDS.extends,
    });

    const mermaid = renderUmlGraphAsMermaidClassDiagram(graph, undefined, {
      escapeAngleBracketsInMemberTypes: true,
    });

    expect(mermaid).toBe(`classDiagram
class uml_Schedule["Schedule"] {
  +entries : Array&lt;Entry&gt;
}
class uml_Typed["Typed"] {
  <<type>>
}

uml_Schedule <|-- uml_Typed`);
  });

  it('Markdown 用には node label と click label の < > も escape できる', () => {
    const graph = new UmlGraphModel();
    graph.addNode({
      id: 'ErrorableBase<E>',
      reflectionId: 1,
      name: 'ErrorableBase<E>',
      kind: UML_NODE_KINDS.abstractClass,
      members: [],
    });

    const mermaid = renderUmlGraphAsMermaidClassDiagram(
      graph,
      {
        currentPageAbsoluteLink: 'README.md',
        resolveReflectionLink() {
          return {
            absoluteLink: 'README.md',
            pageUrl: 'README.md',
          };
        },
      },
      {
        escapeAngleBracketsInLabels: true,
      },
    );

    expect(mermaid).toBe(`classDiagram
class uml_ErrorableBase_E_["ErrorableBase&lt;E&gt;"] {
  <<abstract>>
}

click uml_ErrorableBase_E_ href "README.md" "ErrorableBase&lt;E&gt;"`);
  });

  it('method member を classDiagram の member 行として出力できる', () => {
    const graph = new UmlGraphModel();
    graph.addNode({
      id: 'Schedule',
      name: 'Schedule',
      kind: UML_NODE_KINDS.class,
      members: [
        {
          name: 'getEntries(limit : number)',
          visibility: UML_VISIBILITY.public,
          typeNode: new RelatedTypeNode(
            RELATED_TYPE_KINDS.reference,
            'EntryCollection',
            MULTIPLICITY.exactlyOne,
          ),
        },
      ],
    });

    const mermaid = renderUmlGraphAsMermaidClassDiagram(graph);

    expect(mermaid).toBe(`classDiagram
class uml_Schedule["Schedule"] {
  +getEntries(limit : number) EntryCollection
}`);
  });

  it('class / interface / abstract / intermediate を含む diagram を構文として成立させる', async () => {
    const graph = new UmlGraphModel();
    graph.addNode({
      id: 'Concrete',
      name: 'Concrete',
      kind: UML_NODE_KINDS.class,
      members: [],
    });
    graph.addNode({
      id: 'IEntry',
      name: 'IEntry',
      kind: UML_NODE_KINDS.interface,
      members: [],
    });
    graph.addNode({
      id: 'Base',
      name: 'Base',
      kind: UML_NODE_KINDS.abstractClass,
      members: [],
    });
    graph.addNode({
      id: 'Result<Option<Number>, Error>',
      name: 'Result<Option<Number>, Error>',
      kind: UML_NODE_KINDS.intermediate,
      members: [],
    });
    const mermaid = renderUmlGraphAsMermaidClassDiagram(graph);

    expect(mermaid).toBe(`classDiagram
class uml_Concrete["Concrete"] {
}
class uml_IEntry["IEntry"] {
  <<interface>>
}
class uml_Base["Base"] {
  <<abstract>>
}
class uml_Result_Option_Number___Error_["Result<Option<Number>, Error>"] {
  <<intermediate>>
}`);
    await expect(validateMermaid(mermaid)).resolves.toBeUndefined();
  });

  it('extends / implements / association / contains を含む diagram を構文として成立させる', async () => {
    const graph = new UmlGraphModel();
    graph.addNode({
      id: 'Derived',
      name: 'Derived',
      kind: UML_NODE_KINDS.class,
      members: [],
    });
    graph.addNode({
      id: 'Base',
      name: 'Base',
      kind: UML_NODE_KINDS.abstractClass,
      members: [],
    });
    graph.addNode({
      id: 'IEntry',
      name: 'IEntry',
      kind: UML_NODE_KINDS.interface,
      members: [],
    });
    graph.addNode({
      id: 'Option<Entry>',
      name: 'Option<Entry>',
      kind: UML_NODE_KINDS.intermediate,
      members: [],
    });
    graph.addEdge({
      from: 'Derived',
      to: 'Base',
      kind: UML_EDGE_KINDS.extends,
    });
    graph.addEdge({
      from: 'Derived',
      to: 'IEntry',
      kind: UML_EDGE_KINDS.implements,
    });
    graph.addEdge({
      from: 'Derived',
      to: 'Option<Entry>',
      kind: UML_EDGE_KINDS.association,
      memberName: 'entry',
      multiplicity: MULTIPLICITY.zeroOrOne,
    });
    graph.addEdge({
      from: 'Option<Entry>',
      to: 'IEntry',
      kind: UML_EDGE_KINDS.contains,
    });
    const mermaid = renderUmlGraphAsMermaidClassDiagram(graph);

    expect(mermaid).toBe(`classDiagram
class uml_Derived["Derived"] {
}
class uml_Base["Base"] {
  <<abstract>>
}
class uml_IEntry["IEntry"] {
  <<interface>>
}
class uml_Option_Entry_["Option<Entry>"] {
  <<intermediate>>
}

uml_Derived <|-- uml_Base
uml_Derived <|.. uml_IEntry
uml_Derived --> "0..1" uml_Option_Entry_ : entry
uml_Option_Entry_ *-- uml_IEntry`);
    await expect(validateMermaid(mermaid)).resolves.toBeUndefined();
  });

  it('class N extends Array<Value> の intermediate node を含む diagram を構文として成立させる', async () => {
    const graph = new UmlGraphModel();
    graph.addNode({
      id: 'N',
      name: 'N',
      kind: UML_NODE_KINDS.class,
      members: [],
    });
    graph.addNode({
      id: 'Array<Value>',
      name: 'Array<Value>',
      kind: UML_NODE_KINDS.intermediate,
      members: [],
    });
    graph.addNode({
      id: 'Value',
      name: 'Value',
      kind: UML_NODE_KINDS.class,
      members: [],
    });
    graph.addEdge({
      from: 'N',
      to: 'Array<Value>',
      kind: UML_EDGE_KINDS.extends,
    });
    graph.addEdge({
      from: 'Array<Value>',
      to: 'Value',
      kind: UML_EDGE_KINDS.contains,
    });
    const mermaid = renderUmlGraphAsMermaidClassDiagram(graph);

    expect(mermaid).toBe(`classDiagram
class uml_N["N"] {
}
class uml_Array_Value_["Array<Value>"] {
  <<intermediate>>
}
class uml_Value["Value"] {
}

uml_N <|-- uml_Array_Value_
uml_Array_Value_ *-- uml_Value`);
    await expect(validateMermaid(mermaid)).resolves.toBeUndefined();
  });

  it('Entry | Meta の intermediate node を含む property association を構文として成立させる', async () => {
    const graph = new UmlGraphModel();
    graph.addNode({
      id: 'Registry',
      name: 'Registry',
      kind: UML_NODE_KINDS.class,
      members: [],
    });
    graph.addNode({
      id: 'Entry | Meta',
      name: 'Entry | Meta',
      kind: UML_NODE_KINDS.intermediate,
      members: [],
    });
    graph.addNode({
      id: 'Entry',
      name: 'Entry',
      kind: UML_NODE_KINDS.class,
      members: [],
    });
    graph.addNode({
      id: 'Meta',
      name: 'Meta',
      kind: UML_NODE_KINDS.class,
      members: [],
    });
    graph.addEdge({
      from: 'Registry',
      to: 'Entry | Meta',
      kind: UML_EDGE_KINDS.association,
      memberName: 'entry',
      multiplicity: MULTIPLICITY.exactlyOne,
    });
    graph.addEdge({
      from: 'Entry | Meta',
      to: 'Entry',
      kind: UML_EDGE_KINDS.contains,
    });
    graph.addEdge({
      from: 'Entry | Meta',
      to: 'Meta',
      kind: UML_EDGE_KINDS.contains,
    });
    const mermaid = renderUmlGraphAsMermaidClassDiagram(graph);

    expect(mermaid).toBe(`classDiagram
class uml_Registry["Registry"] {
}
class uml_Entry___Meta["Entry | Meta"] {
  <<intermediate>>
}
class uml_Entry["Entry"] {
}
class uml_Meta["Meta"] {
}

uml_Registry --> "1" uml_Entry___Meta : entry
uml_Entry___Meta *-- uml_Entry
uml_Entry___Meta *-- uml_Meta`);
    await expect(validateMermaid(mermaid)).resolves.toBeUndefined();
  });

  it('ネストした generic / tuple / union を Mermaid classDiagram に変換できる', async () => {
    const graph = new UmlGraphModel();
    graph.addNode({
      id: 'Registry',
      name: 'Registry',
      kind: UML_NODE_KINDS.class,
      members: [
        {
          name: 'entries',
          visibility: UML_VISIBILITY.public,
          typeNode: new RelatedTypeNode(
            RELATED_TYPE_KINDS.generic,
            'Map',
            MULTIPLICITY.exactlyOne,
            undefined,
            [
              {
                role: 'typeArg',
                node: new RelatedTypeNode(
                  RELATED_TYPE_KINDS.reference,
                  'string',
                ),
              },
              {
                role: 'typeArg',
                node: new RelatedTypeNode(
                  RELATED_TYPE_KINDS.union,
                  '',
                  MULTIPLICITY.exactlyOne,
                  undefined,
                  [
                    {
                      role: 'unionMember',
                      node: new RelatedTypeNode(
                        RELATED_TYPE_KINDS.reference,
                        'Entry',
                        MULTIPLICITY.exactlyOne,
                        20,
                      ),
                    },
                    {
                      role: 'unionMember',
                      node: new RelatedTypeNode(
                        RELATED_TYPE_KINDS.tuple,
                        '',
                        MULTIPLICITY.exactlyOne,
                        undefined,
                        [
                          {
                            role: 'tupleItem',
                            node: new RelatedTypeNode(
                              RELATED_TYPE_KINDS.reference,
                              'Meta',
                              MULTIPLICITY.exactlyOne,
                              21,
                            ),
                          },
                          {
                            role: 'tupleItem',
                            node: new RelatedTypeNode(
                              RELATED_TYPE_KINDS.generic,
                              'Array',
                              MULTIPLICITY.exactlyOne,
                              undefined,
                              [
                                {
                                  role: 'typeArg',
                                  node: new RelatedTypeNode(
                                    RELATED_TYPE_KINDS.reference,
                                    'Tag',
                                    MULTIPLICITY.exactlyOne,
                                    22,
                                  ),
                                },
                              ],
                            ),
                          },
                        ],
                      ),
                    },
                  ],
                ),
              },
            ],
          ),
        },
      ],
    });

    const mermaid = renderUmlGraphAsMermaidClassDiagram(graph);

    expect(mermaid).toBe(`classDiagram
class uml_Registry["Registry"] {
  +entries : Map<string, Entry | [Meta, Array<Tag>]>
}`);
    await expect(validateMermaid(mermaid)).resolves.toBeUndefined();
  });

  it('Entry | [Meta, Tag] と [Meta, Tag] の intermediate node を含む diagram を構文として成立させる', async () => {
    const graph = new UmlGraphModel();
    graph.addNode({
      id: 'Registry',
      name: 'Registry',
      kind: UML_NODE_KINDS.class,
      members: [],
    });
    graph.addNode({
      id: 'Entry | [Meta, Tag]',
      name: 'Entry | [Meta, Tag]',
      kind: UML_NODE_KINDS.intermediate,
      members: [],
    });
    graph.addNode({
      id: '[Meta, Tag]',
      name: '[Meta, Tag]',
      kind: UML_NODE_KINDS.intermediate,
      members: [],
    });
    graph.addNode({
      id: 'Entry',
      name: 'Entry',
      kind: UML_NODE_KINDS.class,
      members: [],
    });
    graph.addNode({
      id: 'Meta',
      name: 'Meta',
      kind: UML_NODE_KINDS.class,
      members: [],
    });
    graph.addNode({
      id: 'Tag',
      name: 'Tag',
      kind: UML_NODE_KINDS.class,
      members: [],
    });
    graph.addEdge({
      from: 'Registry',
      to: 'Entry | [Meta, Tag]',
      kind: UML_EDGE_KINDS.association,
      memberName: 'entries',
      multiplicity: MULTIPLICITY.exactlyOne,
    });
    graph.addEdge({
      from: 'Entry | [Meta, Tag]',
      to: 'Entry',
      kind: UML_EDGE_KINDS.contains,
    });
    graph.addEdge({
      from: 'Entry | [Meta, Tag]',
      to: '[Meta, Tag]',
      kind: UML_EDGE_KINDS.contains,
    });
    graph.addEdge({
      from: '[Meta, Tag]',
      to: 'Meta',
      kind: UML_EDGE_KINDS.contains,
    });
    graph.addEdge({
      from: '[Meta, Tag]',
      to: 'Tag',
      kind: UML_EDGE_KINDS.contains,
    });
    const mermaid = renderUmlGraphAsMermaidClassDiagram(graph);

    expect(mermaid).toBe(`classDiagram
class uml_Registry["Registry"] {
}
class uml_Entry____Meta__Tag_["Entry | [Meta, Tag]"] {
  <<intermediate>>
}
class uml__Meta__Tag_["[Meta, Tag]"] {
  <<intermediate>>
}
class uml_Entry["Entry"] {
}
class uml_Meta["Meta"] {
}
class uml_Tag["Tag"] {
}

uml_Registry --> "1" uml_Entry____Meta__Tag_ : entries
uml_Entry____Meta__Tag_ *-- uml_Entry
uml_Entry____Meta__Tag_ *-- uml__Meta__Tag_
uml__Meta__Tag_ *-- uml_Meta
uml__Meta__Tag_ *-- uml_Tag`);
    await expect(validateMermaid(mermaid)).resolves.toBeUndefined();
  });

  it('reflection link を click href として埋め込める', async () => {
    const graph = new UmlGraphModel();
    graph.addNode({
      id: 'Schedule',
      reflectionId: 1,
      name: 'Schedule',
      kind: UML_NODE_KINDS.class,
      members: [],
    });

    const mermaid = renderUmlGraphAsMermaidClassDiagram(graph, {
      currentPageAbsoluteLink: 'modules/_ocrjs_infra-contract.html',
      resolveReflectionLink(reflectionId) {
        if (reflectionId !== 1) {
          return undefined;
        }

        return {
          absoluteLink: 'classes/Schedule.html',
          pageUrl: 'classes/Schedule.html',
        };
      },
    });

    expect(mermaid).toBe(`classDiagram
class uml_Schedule["Schedule"] {
}

click uml_Schedule href "../classes/Schedule.html" "Schedule"`);
    await expect(validateMermaid(mermaid)).resolves.toBeUndefined();
  });

  it('非単語文字を含む node id を alias に正規化しても構文として成立させる', async () => {
    const graph = new UmlGraphModel();
    graph.addNode({
      id: 'Result<Option<Number>, Error>',
      name: 'Result<Option<Number>, Error>',
      kind: UML_NODE_KINDS.intermediate,
      members: [],
    });
    const mermaid = renderUmlGraphAsMermaidClassDiagram(graph);

    expect(mermaid).toBe(`classDiagram
class uml_Result_Option_Number___Error_["Result<Option<Number>, Error>"] {
  <<intermediate>>
}`);
    await expect(validateMermaid(mermaid)).resolves.toBeUndefined();
  });
});
