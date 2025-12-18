export abstract class ErrorableBase {
  #error: Error | null = null;

  /**
   * エラーを設定（protected）
   * ※ constructor / guard 内でのみ使うこと
   */
  protected setError(error: Error | null): void {
    this.#error = error;
  }

  protected isErrorBase(): boolean {
    return this.#error !== null;
  }

  protected getErrorBase(): Error | null {
    return this.#error;
  }

  protected unwrapBase(): this {
    if (this.#error) throw this.#error;
    return this;
  }

  protected orElseBase<T extends ErrorableBase>(this: T, fallback: T): T {
    return this.#error ? fallback : this;
  }

  /**
   * 安全な short-circuit + error capture
   *
   * - すでに error 状態なら何もしない
   * - 例外が出たら「正規インスタンス」に error を注入
   */
  protected guard<T extends this>(fn: () => T): T {
    if (this.#error) return this as T;

    try {
      return fn();
    } catch (e) {
      this.setError(e instanceof Error ? e : new Error(String(e)));
      return this as T;
    }
  }
}
