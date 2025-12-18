import type { DType } from '../types/CommonTypes';
import type { Errorable } from '../types/Errorable';
import type { ITensor } from './ITensor';

/**
 * Factory interface for creating ITensor instances.
 * Implementations provide concrete tensor creation logic.
 */
export interface ITensorFactory extends Errorable<ITensorFactory> {
  /**
   * Creates a tensor filled with zeros.
   * @param shape Tensor shape
   * @param dtype Data type
   */
  zeros(shape: readonly number[], dtype: DType): ITensor;

  /**
   * Creates a tensor filled with ones.
   * @param shape Tensor shape
   * @param dtype Data type
   */
  ones(shape: readonly number[], dtype: DType): ITensor;

  /**
   * Creates a tensor from an array of data.
   * @param data Source data array
   * @param shape Tensor shape (must match data length)
   * @param dtype Data type
   */
  fromArray(
    data:
      | number[]
      | Float32Array
      | Int32Array
      | Float16Array
      | Int8Array
      | Uint8Array
      | Uint8ClampedArray,
    shape: readonly number[],
    dtype: DType,
  ): ITensor;
}
