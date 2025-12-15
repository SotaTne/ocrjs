# Core

## 概要

`core` は **ocrjs 全体における最上位のドメイン層**であり、
OCR という概念を **最も抽象的かつ表面的な意味論のレベル**で定義する層です。

この層は、**「OCRとは何か」という不変の契約**のみを定義し、
実装詳細（どのように動くか）を一切持ちません。

## Core の責務

### 1. ドメイン概念の定義

- **Input / Output**: OCR に何が入力され、何が出力されるか（型定義）
- **Lifecycle**: OCR インスタンスの生成から破棄までの状態遷移

### 2. 純粋性の保持

`core` は以下のような「変化しやすい技術詳細」を一切知りません。知ってはなりません。

- **実行ランタイム** (Node.js, Browser, Deno, Edge...)
- **モデル形式** (ONNX, TFLite, OpenVINO...)
- **計算バックエンド** (Wasm, WebGPU, CUDA...)
- **画像処理ライブラリ** (OpenCV, Sharp, Canvas...)

これらの技術的詳細は、すべて下位レイヤ（`infra`）や中間レイヤ（`engine`）で隠蔽され、`core` には影響を与えません。

## レイヤ構造における位置

```text
[ Application Layer (ocr) ]
        |
        v
[ Domain Layer (core) ] <--- [ Engine (Logic) ]
        ^
        |
[ Contract Layer (infra-contract) ]
        ^
        |
[ Infrastructure Layer (infra) ]
```

`core` は全ての中心にあり、他の一切に依存しません。
この「退屈で安定した」性質こそが、ocrjs の高い移植性と拡張性を支えています。
