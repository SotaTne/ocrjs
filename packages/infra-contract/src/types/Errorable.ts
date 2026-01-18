export interface IErrorStateBase {
  isError(): boolean;
  getError(): Error | null;
  unwrap(): this;
}

export interface IErrorable<T extends IErrorStateBase> extends IErrorStateBase {
  orElse(fallback: T): T;
}
