# infra-contract

## 概要

`infra-contract` は、ocrjs の実行に必要な **計算・処理能力（Capabilities）** を定義するインターフェース層です。
例えば、モデルの実行のためにonnxを使う場合などもその契約方法をここに記述します。

Engine（ロジック層）が「何をしたいか」を記述し、Infra（実装層）が「どう実現するか」を提供する、その **契約（Contract）** を管理します。

## 設計思想: Atomic Interfaces (1機能 = 1インターフェース)

この層では、巨大なServiceクラスではなく、**機能ごとの最小単位（Atomic）なインターフェース** を定義します。
これにより、Engineは必要な機能だけを選択的に利用でき、Infraは各機能を独立して実装・差し替えが可能になります。

### 定義される能力 (Capabilities) の例

#### Image Processing (画像処理)

画像の変形・加工を行う単機能インターフェース群です。

- `IResizer`: リサイズ機能
- `INormalizer`: 正規化機能
- `IGrayscaleConverter`: グレースケール変換機能
- `IPadder`: パディング機能

#### Tensor Math (数値計算)

多次元配列（Tensor）に対する計算を行う単機能インターフェース群です。

- `ITensorArgmax`: Argmax計算機能
- `ITensorSoftmax`: Softmax計算機能
- `IMatrixMultiplier`: 行列積計算機能

#### Inference (推論)

- `IModelRunner`: モデル実行機能

## 役割と重要性

この Atomic な設計により、以下のメリットが生まれます。

1. **Engineの実装がシンプルになる**: Engineは「IResizer」が必要であることを宣言するだけで、余計な機能への依存を持ちません。
2. **Infraの実装が柔軟になる**: 例えば「ResizeはCanvasでやるが、NormalizeはWasmでやる」といった細かい実装の組み合わせ（Mix & Match）が可能になります。

Engine はこれらの Atomic Interface を組み合わせ（オーケストレーションし）、OCRという大きな機能を実現します。
