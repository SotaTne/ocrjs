/**
 * Supported data types for Tensor operations.
 * Includes quantization types (int8, float16) for optimization.
 *
 * Note: bfloat16 is accepted but computed as float32 internally,
 * as most runtimes don't support native bfloat16 operations yet.
 */
export type DType =
  | 'float32'
  | 'float16'
  | 'bfloat16' // Computed as float32, toData() returns Float32Array
  | 'int32'
  | 'int8'
  | 'uint8'
  | 'bool';

/**
 * Tensor data layout format.
 * - NCHW: Batch, Channel, Height, Width (common in PyTorch, ONNX)
 * - NHWC: Batch, Height, Width, Channel (common in TensorFlow)
 */
export type TensorLayout = 'NCHW' | 'NHWC';

/**
 * Interpolation method for image resizing.
 */
export type InterpolationMethod =
  | 'nearest'
  | 'linear'
  | 'cubic'
  | 'area'
  | 'lanczos';

/**
 * Threshold type for binarization.
 */
export type ThresholdType =
  | 'binary'
  | 'binary_inv'
  | 'trunc'
  | 'tozero'
  | 'tozero_inv';

export type ColorSpace =
  | 'BGR'
  | 'RGB'
  | 'GRAY'
  | 'BGRA'
  | 'RGBA'
  | 'HSV'
  | 'LAB';

/**
 * 2D point coordinate.
 */
export type Point = [x: number, y: number];

/**
 * Axis-aligned rectangle.
 */
export type Rectangle = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Rotated rectangle with center, size, and angle.
 */
export type RotatedRectangle = {
  center: Point;
  size: [width: number, height: number];
  angle: number; // degrees
};

/**
 * Border type for morphological operations.
 */
export type BorderType = 'constant' | 'replicate' | 'reflect' | 'wrap' | 'reflect101';

/**
 * Adaptive threshold method.
 */
export type AdaptiveThresholdMethod = 'mean' | 'gaussian';

/**
 * 2x3 Affine transformation matrix.
 * [[a, b, tx], [c, d, ty]]
 */
export type AffineTransformMatrix = readonly [
  readonly [number, number, number],
  readonly [number, number, number],
];
