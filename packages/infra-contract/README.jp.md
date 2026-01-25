# infra-contract

## 概要

`infra-contract` は、ocrjs の実行に必要な **契約（Contract）** を定義するインターフェース層です。
Engine（ロジック層）が「何をしたいか」を記述し、Infra（実装層）が「どう実現するか」を提供するための境界を管理します。

## 設計思想: Atomic Interfaces (1機能 = 1インターフェース)

この層では、巨大なServiceクラスではなく、**機能ごとの最小単位（Atomic）なインターフェース** を定義します。
これにより、Engineは必要な機能だけを選択的に利用でき、Infraは各機能を独立して実装・差し替えが可能になります。

### インターフェースの分類

現在は 3 つの分類で構成されています。

#### 1. primitives

OCR のドメイン上の **最小実体（Primitives）** を定義します。
Tensor や Image などの **情報を持つ完結体** と、それらの生成契約を扱います。

- `ITensor`, `ITensorFactory`
- `IImage`, `IImageFactory`
- `IModel`, `IModelLoader`
- `IGeometryPolygon`, `IContour`

#### 2. traits

後付け可能な **振る舞いの契約（Traits）** を定義します。
Flow や並列・並行実行のような、実装戦略に依存する行為を扱います。

- `IParallelExecutor`
- `IConcurrentExecutor`

#### 3. platform

Wasm / Worker / WebGPU など、実行環境に依存する **基盤的な制御** を定義します。
Engine から見た「最適な実行計画の制御点」を扱います。

- `IFlowController`

## 役割と重要性

この Atomic な設計により、以下のメリットが生まれます。

1. **Engineの実装がシンプルになる**: Engine は必要な primitives / traits / platform を宣言するだけで、余計な依存を持ちません。
2. **Infraの実装が柔軟になる**: 実行環境や最適化戦略を差し替えても、契約を守れば互換性を維持できます。

Engine はこれらの Atomic Interface を組み合わせ（オーケストレーションし）、OCRという大きな機能を実現します。

## 設計ルール

### traits

- **1 trait = 1 機能** を原則とする
- traits が拡張する対象は **primitives のみ**
- 同じ primitives が同じ traits を持つ場合、その traits の機能は **platform を経由せず利用可能**
- 例: 比較 trait を持つ **同じ** primitives は、platform の機能を使わず比較できる

### platform

- **1 platform = 1 機能** を原則とする
- platform は **traits の存在を前提に利用可能な機能** を提供する
- 例: `ISortFlowController` は「比較 trait を持つ primitives をソートできる」ことを保証する
- platform が interface である理由は、wasm / webgpu / worker など環境ごとに **最適な実装を差し替えられるようにするため**
- 必要であれば **複数 traits -> 1 platform** の組み合わせも許容する
