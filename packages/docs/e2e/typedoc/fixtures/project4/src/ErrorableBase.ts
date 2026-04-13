import type { IErrorable } from './IErrorable.js';

export abstract class ErrorableBase<E extends Error = Error> {
  protected orElseBase<T extends IErrorable<T>>(self: T, fallback: T): T {
    return fallback;
  }

  protected guard<T extends this>(fn: () => T | Promise<T>): T | Promise<T> {
    return fn();
  }
}
