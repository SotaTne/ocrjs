# infra

## 概要

`infra` は、`infra-contract` で定義された契約を実装する **「重たい処理」の提供層** です。

ここには、環境依存のバイナリ、ネイティブバインディング、大規模な演算ライブラリなど、**純粋なTypeScriptだけでは完結しない「物理的な」実装** が集約されます。

## 提供する実装の例

環境に応じて、最適な実装を提供します。

### Node.js 環境向け

- **Image**: `sharp` や `jimp`, `opencv4nodejs` を使用した高速な画像処理
- **Inference**: `onnxruntime-node` を使用したネイティブ推論
- **Math**: SIMD最適化された演算処理

### Browser 環境向け

- **Image**: `Canvas API` や `ImageBitmap`, `opencv.js` (Wasm) を使用した処理
- **Inference**: `onnxruntime-web` (Wasm / WebGL / WebGPU) を使用した推論

## 設計意図

ocrjs において、**「環境依存のコード」や「外部ライブラリへの依存」は、全てこの `infra` パッケージ内に閉じ込められます。**

これにより、他のパッケージ（`core`, `engine`, `ocr`）はクリーンな状態を保ち、
「Node.js でしか動かない」「ブラウザだと動かない」といった環境問題から解放されます。
