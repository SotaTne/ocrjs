import type { IGeometryPolygon } from '../interfaces/primitives/IGeometryPolygon';
import type { RotatedRectangle } from './CommonTypes';

/**
 * OCR アーキテクチャ設計思想:
 *
 * このシステムは「マクロな関数型設計」と「ミクロな OOP 設計」のハイブリッドで構成されています。
 *
 * 1. ミクロな OOP (内部コンポーネント):
 *    ITensor や IImage といったプリミティブは、単なるデータではなく「自律的な計算能力を持つ小さなコンピュータ（オブジェクト）」
 *    として定義されています。これらは計算パイプラインの内部でメッセージをやり取りし、効率的に状態を管理します。
 *
 * 2. マクロな関数型 (実行モデル):
 *    一方で、Recipe や Engine 全体として見た場合、それは「画像を入力し、結果を返す」という副作用のない純粋関数として
 *    振る舞います。遅延評価され、失敗（Error）を含んだ不変な結果を生成します。
 *
 *    これは、以下のようなイメージで理解できます：
 *    ```typescript
 *    // 1. レシピの構築は、あくまで「関数の処理内容」を定義しただけ。この時点では何も実行されない（遅延評価）。
 *    const r = new Recipe<OCRResult>(...定義...);
 *
 *    // 2. 実行時に初めて画像が流れ込み、不変な結果が返される。
 *    const result = r.run(image);
 *    ```
 *    構築（OOP的な部品の組み立て）と 実行（関数的なデータ処理）が明確に分離されています。
 *
 * 3. OCRResult の役割 (Snapshot):
 *    OCRResult および OCRItem は、この巨大な「関数」の実行結果として得られる不変な「情報のスナップショット（データ）」です。
 *    これは計算機ネットワーク（オブジェクト群）から外の世界（ユーザー）へ放たれた、確定した事実（値）であるため、
 *    メソッドを持つインターフェースではなく、純粋な type として定義されます。
 */

/**
 * OCR 抽象化レベル
 */
export type OCRLevel = 'page' | 'block' | 'line' | 'word' | 'character';

/**
 * OCR 結果の最小単位（Item）
 * 確定した事実としてのデータ構造。
 */
export type OCRItem<
  P extends Record<string, unknown> = Record<string, unknown>,
> = {
  /** このアイテムの階層レベル */
  readonly level: OCRLevel;

  /** 認識されたテキスト */
  readonly text: string;

  /**
   * 空間上の位置情報
   * 歪みに強い IGeometryPolygon または標準的な RotatedRectangle
   */
  readonly box: IGeometryPolygon | RotatedRectangle;

  /** 信頼度 (0.0 - 1.0) */
  readonly confidence: number;

  /** 拡張パラメータのキー一覧 */
  readonly paramKeys: readonly (keyof P)[];

  /** モデル固有の拡張データ */
  readonly params: P;
};

/**
 * OCR 実行の最終成果物（Result）
 * 純粋関数の戻り値として定義される、不変なスナップショット。
 */
export type OCRResult<
  P extends Record<string, unknown> = Record<string, unknown>,
  C extends Record<string, unknown> = Record<string, unknown>,
> = {
  /** 検出・認識された全てのアイテム */
  readonly items: readonly OCRItem<P>[];

  /** 結果全体に紐づくメタデータ */
  readonly metadata: {
    /** 実行に使用されたレシピ名 */
    readonly recipeName: string;
    /** 元画像のサイズ（座標変換の基準） */
    readonly imageSize: { width: number; height: number };
    /** その他、実行時間やモデル情報などの自由な拡張 */
    readonly custom: C;
  };
};
