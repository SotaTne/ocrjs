import { describe, expect, it } from 'vitest';
import { validateMermaidAliases } from './validateMermaidAliases.js';

describe('validateMermaidAliases', () => {
  it('定義済み alias だけを参照する mermaid は問題なし', () => {
    expect(
      validateMermaidAliases(`classDiagram
class uml_A["A"] {
}
class uml_B["B"] {
}

uml_A --> "1" uml_B : child
click uml_A href "../README.md" "A"`),
    ).toEqual([]);
  });

  it('未定義 alias を参照する edge と click を検出する', () => {
    expect(
      validateMermaidAliases(`classDiagram
class uml_A["A"] {
}

uml_A --> "*" uml_Missing : child
click uml_Other href "../README.md" "Other"`),
    ).toEqual([
      {
        code: 'missing-node-alias',
        alias: 'uml_Missing',
        line: 'uml_A --> "*" uml_Missing : child',
      },
      {
        code: 'missing-node-alias',
        alias: 'uml_Other',
        line: 'click uml_Other href "../README.md" "Other"',
      },
    ]);
  });
});
