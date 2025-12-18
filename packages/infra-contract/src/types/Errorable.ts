export type Errorable<T> = {
  isError(): boolean;
  getError(): Error | null;
  orElse(fallback: T): T;
  unwrap(): T;
};
