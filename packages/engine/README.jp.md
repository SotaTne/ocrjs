# Engine

## 概要

`engine` は、ocrjs の **純粋なロジック核（Kernel）** です。

ここには、OCRを実行するための **「手順（Recipe）の解釈」** と **「オーケストレーションロジック」** が記述されます。
`engine` は純粋な機能のみで記述され、バイナリ依存や環境依存を一切持ちません。

## 役割

### 1. Recipe Interpreter (レシピの解釈)

OCR の処理パイプライン（前処理・推論・後処理）を定義した **レシピ** を読み込み、実行計画を立てる機能です。

### 2. Capabilities Orchestration

`infra-contract` で定義された能力（画像処理、Tensor計算、推論）を、レシピに従って呼び出します。

- **Engine**: 指示を出す（「画像をリサイズせよ」「推論せよ」）
- **Infra**: 実行する（実際に OpenCV や ONNX Runtime が動く）

## アーキテクチャ上の制約

`engine` パッケージには以下のルールが適用されます。

1. **Pure TypeScript**: `fs` や `child_process`、バイナリライブラリへの依存は禁止。
2. **No Native Deps**: `onnxruntime` や `opencv` などを直接 import してはならない。
3. **Use Contract**: すべての重たい処理は、必ず `infra-contract` 経由で行う。

これにより、`engine` はあらゆる環境（Browser, Node.js, Deno, Edge Worker）で、全く同じコードで動作することが保証されます。
