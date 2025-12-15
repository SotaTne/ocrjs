# ocr

## 概要

`ocr` は、ocrjs プロジェクトが提供する **「すぐに使える標準製品（Product）」** です。

開発者が詳細な構成（Engineの組み立てやInfraの注入）を気にすることなく、
「とりあえずOCRを使いたい」というニーズに応えるための **High-Level Wrapper** です。

## 役割

### 1. プリセットの提供

一般的なユースケースに合わせて、最適なコンポーネントをあらかじめ組み立てて提供します。

- `infra` から最適なバックエンド（Node vs Browser）を自動または設定で選択
- 標準的な `engine` 設定とレシピを適用

### 2. 簡易APIの提供

`core` や `engine` の低レベルなAPIをラップし、直感的なAPIを提供します。

```typescript
import { Ocr } from '@ocrjs/ocr';

const ocr = new Ocr();
const text = await ocr.detect('./image.png');
console.log(text);
```

## 位置づけ

- **Power User / Library Author**: `core`, `engine`, `infra` を直接組み合わせてカスタマイズします。
- **End User**: この `ocr` パッケージを使用します。

`ocr` パッケージ自体は薄いラッパーであり、実際の重たい処理はすべて `infra` に、ロジックは `engine` に委譲されます。
