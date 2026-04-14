export interface IErrorable<T> {
  orElse(fallback: T): T;
}
