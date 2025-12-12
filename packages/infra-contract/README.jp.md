# infra-contract

## 概要

`infra-contract` は、ocrjs において
OCR 実行に必要なインフラストラクチャが満たすべき要件を、
**実装非依存な契約として定義する層**です。

この層は、ドメインや実行ロジックが特定の実行基盤
（onnx / wasm / web worker / native runtime など）に依存しないために存在します。

この層は、`ocrjs`のビジネスロジックと実行環境の橋渡しを担います。

`infra-contract` は処理を持たず、
**「何ができなければならないか」だけを定義します。**
