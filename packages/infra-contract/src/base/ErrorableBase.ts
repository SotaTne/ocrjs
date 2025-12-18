/**
 * エラー管理の基底クラス（部品）
 *
 * このクラスは public メソッドを持たず、完全に「部品」として機能します。
 * 継承先が protected メソッドを使って、独自の public API を実装します。
 */
export abstract class ErrorableBase {
  #error: Error | null = null;

  /**
   * エラーを設定（protected）
   */
  protected setError(error: Error | null): void {
    this.#error = error;
  }

  /**
   * エラー状態を確認（protected）
   */
  protected isErrorBase(): boolean {
    return this.#error !== null;
  }

  /**
   * エラー内容を取得（protected）
   */
  protected getErrorBase(): Error | null {
    return this.#error;
  }

  /**
   * エラーなら throw、正常ならそのまま返す（protected）
   */
  protected unwrapBase(): this {
    if (this.#error) throw this.#error;
    return this;
  }

  /**
   * エラーなら代替値（protected）
   */
  protected orElseBase<T extends ErrorableBase>(this: T, fallback: T): T {
    return this.#error ? fallback : this;
  }

  /**
   * エラー付きのインスタンスを作成（protected）
   */
  protected createErrorInstance(error: unknown): this {
    const instance = Object.create(this.constructor.prototype);
    const err = error instanceof Error ? error : new Error(String(error));
    ErrorableBase.prototype.setError.call(instance, err);
    return instance;
  }
}
