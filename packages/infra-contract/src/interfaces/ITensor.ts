import type { DType, TensorLayout } from '../types/CommonTypes';
import type { IErrorable } from '../types/Errorable';
import type { IImage } from './IImage';

/**
 * Represents a handle to a Tensor computation.
 *
 * This interface follows the "Recursive Computer" philosophy.
 * An ITensor instance is not the data itself, but a handle to a computation unit
 * that resides in some backend (CPU, WebGPU, Wasm, etc).
 *
 * All mathematical operations return a new ITensor handle synchronously (building the graph/queue),
 * while raw data access is asynchronous.
 */
export interface ITensor extends IErrorable<ITensor> {
  /**
   * shape of the tensor.
   * e.g., [1, 3, 224, 224]
   */
  readonly shape: readonly number[];

  /**
   * Data type of the tensor.
   * Note: bfloat16 tensors are computed as float32 internally.
   */
  readonly dtype: DType;

  /**
   * Casts the tensor to a different data type.
   * @param dtype Target data type
   */
  cast(dtype: DType): ITensor;

  /**
   * Element-wise addition.
   * @param other Tensor to add
   */
  add(other: ITensor): ITensor;

  /**
   * Element-wise subtraction.
   * @param other Tensor to subtract
   */
  sub(other: ITensor): ITensor;

  /**
   * Element-wise multiplication.
   * @param other Tensor to multiply
   */
  mul(other: ITensor): ITensor;

  /**
   * Element-wise division.
   * @param other Tensor to divide
   */
  div(other: ITensor): ITensor;

  /**
   * Matrix multiplication (Dot product).
   * @param other Tensor to multiply
   */
  matmul(other: ITensor): ITensor;

  /**
   * Permutes the dimensions of the tensor.
   * @param axes New order of dimensions
   */
  permute(axes: readonly number[]): ITensor;

  /**
   * Reshapes the tensor.
   * @param dims New dimensions
   */
  reshape(dims: readonly number[]): ITensor;

  /**
   * Remove single-dimensional entries from the shape.
   * @param dim Dimension to squeeze (optional)
   */
  squeeze(dim?: number): ITensor;

  /**
   * Add a single-dimensional entry to the shape.
   * @param dim Dimension to insert
   */
  unsqueeze(dim: number): ITensor;

  /**
   * Broadcasts the tensor to a new shape.
   * @param shape Target shape
   */
  broadcastTo(shape: readonly number[]): ITensor;

  /**
   * Extracts a slice of the tensor.
   * Python equivalent: tensor[starts[0]:ends[0]:steps[0], ...]
   * @param starts Starting indices for each dimension
   * @param ends Ending indices for each dimension
   * @param axes Axes to slice (optional, default all)
   * @param steps Steps for each dimension (optional, default 1)
   */
  slice(
    starts: readonly number[],
    ends: readonly number[],
    axes?: readonly number[],
    steps?: readonly number[],
  ): ITensor;

  /**
   * Transposes two dimensions of the tensor.
   * @param dim0 First dimension
   * @param dim1 Second dimension
   */
  transpose(dim0: number, dim1: number): ITensor;

  /**
   * Concatenates tensors along a specified axis.
   * Note: This is usually a static method in frameworks, but here defined as instance method for chaining/OOP.
   * `this` is the first tensor, `others` are appended.
   * @param others Tensors to concatenate with this one
   * @param axis Axis to concatenate along
   */
  concat(others: ITensor[], axis: number): ITensor;

  /**
   * Clips the values of the tensor to a specified range.
   * @param min Minimum value
   * @param max Maximum value
   */
  clip(min: number, max: number): ITensor;

  /**
   * Scatter update (pickAndSet).
   * Creates a NEW tensor with values updated at specified indices.
   * @param indices Indices to update
   * @param value Values to put at indices
   * @param axis Axis along which to scatter
   */
  scatter(indices: readonly number[], value: ITensor, axis?: number): ITensor;

  /**
   * Returns the indices of the maximum values along an axis.
   * @param axis Axis to reduce
   * @param keepDims Whether to keep the reduced dimension (default false)
   */
  argmax(axis: number, keepDims?: boolean): ITensor;

  /**
   * Computes the maximum value along an axis.
   * @param axis Axis to reduce
   * @param keepDims Whether to keep the reduced dimension (default false)
   */
  reduceMax(axis: number, keepDims?: boolean): ITensor;

  /**
   * Computes the mean value along an axis.
   * @param axis Axis to reduce (optional, default all)
   * @param keepDims Whether to keep the reduced dimension (default false)
   */
  mean(axis?: number, keepDims?: boolean): ITensor;

  /**
   * Computes the standard deviation along an axis.
   * @param axis Axis to reduce (optional, default all)
   * @param keepDims Whether to keep the reduced dimension (default false)
   */
  std(axis?: number, keepDims?: boolean): ITensor;

  /**
   * Convert tensor to IImage.
   * Assumes tensor is in image format (3D or 4D with batch dimension).
   * @param layout Input tensor layout (default 'NCHW')
   * @returns IImage with values normalized to [0, 255] range
   */
  toImage(layout?: TensorLayout): IImage;

  /**
   * Transfers the data from the backend to the host (CPU).
   * This is the only way to inspect the actual values.
   *
   * Note: For bfloat16 tensors, returns Float32Array as they are
   * computed as float32 internally.
   *
   * this method include unwrap internally and will throw error if the tensor is in error state.
   *
   * @returns Promise resolving to typed array of the tensor data
   * @throws Error if the tensor is in error state (propagated from the computation graph)
   */
  toData(): Promise<
    | Float32Array // float32 and bfloat16 both return Float32Array
    | Int32Array
    | Float16Array
    | Int8Array
    | Uint8Array
    | Uint8ClampedArray
  >;

  /**
   * Clean up resources (GPU buffers, Wasm memory) associated with this handle.
   */
  dispose(): ITensor; // return None ITensor Object any case to allow chaining
}
