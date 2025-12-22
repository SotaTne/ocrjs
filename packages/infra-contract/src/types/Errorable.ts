/**
 * Represents a value that may either be a valid result of type T or an Error.
 * Provides methods to check for errors and to safely unwrap the value.
 * @param T The type of the valid result
 */
export type Errorable<T> = {
  isError(): boolean;
  getError(): Error | null;
  orElse(fallback: T): T;
  unwrap(): T;
};
