import type {
  AdaptiveThresholdMethod,
  AffineTransformMatrix,
  BorderType,
  ColorSpace,
  DType,
  InterpolationMethod,
  Point,
  Rectangle,
  TensorLayout,
  ThresholdType,
} from '../types/CommonTypes';
import type { IErrorable } from '../types/Errorable';
import type { IContour } from './IContour';
import type { ITensor } from './ITensor';

/**
 * Image representation independent of underlying implementation.
 * Can be backed by cv.Mat (OpenCV), Canvas, or other formats.
 *
 * This interface follows the same principles as ITensor - it's a handle
 * to image data that may reside in different backends (CPU, GPU, WebGL).
 */
export interface IImage extends IErrorable<IImage> {
  /**
   * Image width in pixels.
   */
  readonly width: number;

  /**
   * Image height in pixels.
   */
  readonly height: number;

  /**
   * Number of channels.
   * - 1: Grayscale
   * - 3: RGB
   * - 4: RGBA
   */
  readonly channels: number;

  readonly colorSpace: ColorSpace; // 'RGB', 'BGR', 'GRAY', etc.

  /**
   * Resize image to specified dimensions.
   * @param width Target width
   * @param height Target height
   * @param interpolation Interpolation method (default 'linear')
   */
  resize(
    width: number,
    height: number,
    interpolation?: InterpolationMethod,
  ): IImage;

  /**
   * Convert to a different color space.
   * Source color space is automatically determined from the current colorSpace property.
   * @param target Target color space
   * @example
   * ```typescript
   * const rgb = bgrImage.convertTo('RGB');  // BGR -> RGB
   * const gray = rgbImage.convertTo('GRAY'); // RGB -> GRAY
   * const bgr = grayImage.convertTo('BGR');  // GRAY -> BGR
   * ```
   */
  convertTo(target: ColorSpace): IImage;

  /**
   * Convert image to grayscale.
   * Convenience method equivalent to convertTo('GRAY').
   * Automatically handles any source color space (BGR, RGB, BGRA, RGBA, etc.).
   * If image is already grayscale, returns a clone.
   */
  toGrayscale(): IImage;

  /**
   * Apply threshold to image.
   * Typically used on grayscale images.
   * @param threshold Threshold value
   * @param maxValue Maximum value to use with binary threshold
   * @param type Threshold type (default 'binary')
   */
  threshold(threshold: number, maxValue: number, type?: ThresholdType): IImage;

  /**
   * Apply adaptive threshold.
   * Better than simple threshold for images with varying illumination.
   * @param maxValue Maximum value for thresholded pixels
   * @param method Adaptive method ('mean' or 'gaussian')
   * @param blockSize Size of pixel neighborhood (must be odd)
   * @param C Constant subtracted from mean/weighted mean
   */
  adaptiveThreshold(
    maxValue: number,
    method: AdaptiveThresholdMethod,
    blockSize: number,
    C: number,
  ): IImage;

  /**
   * Threshold image based on color range.
   * Pixels within [lower, upper] range become white, others black.
   * @param lower Lower boundary array (per channel)
   * @param upper Upper boundary array (per channel)
   */
  inRange(lower: readonly number[], upper: readonly number[]): IImage;

  /**
   * Normalize image values to specified range.
   * @param alpha Lower bound of output range
   * @param beta Upper bound of output range
   */
  normalize(alpha: number, beta: number): IImage;

  /**
   * Apply Gaussian blur to reduce noise.
   * @param kernelSize Size of Gaussian kernel (must be odd)
   * @param sigma Gaussian standard deviation (0 = auto-calculate)
   */
  gaussianBlur(kernelSize: number, sigma?: number): IImage;

  /**
   * Apply median blur to remove salt-and-pepper noise.
   * @param kernelSize Size of the kernel (must be odd)
   */
  medianBlur(kernelSize: number): IImage;

  /**
   * Apply bilateral filter (edge-preserving smoothing).
   * @param d Diameter of pixel neighborhood
   * @param sigmaColor Filter sigma in color space
   * @param sigmaSpace Filter sigma in coordinate space
   */
  bilateralFilter(d: number, sigmaColor: number, sigmaSpace: number): IImage;

  /**
   * Apply simple averaging blur.
   * @param kernelSize Size of the kernel
   */
  blur(kernelSize: number): IImage;

  /**
   * Invert image colors (negative).
   */
  invert(): IImage;

  /**
   * Crop image by axis-aligned rectangle.
   * @param rect Rectangle to crop
   */
  crop(rect: Rectangle): IImage;

  /**
   * Crop image by polygon (with perspective transform).
   * Useful for extracting rotated text regions.
   * @param polygon Points defining the polygon (at least 4 points)
   * @returns Cropped and perspective-corrected image
   */
  cropPolygon(polygon: readonly Point[]): IImage;

  /**
   * Rotate image by specified angle.
   * @param angle Rotation angle (90, 180, or 270 degrees)
   */
  rotate(angle: 90 | 180 | 270): IImage;

  /**
   * Rotate image by arbitrary angle.
   * @param angle Rotation angle in degrees (positive = counter-clockwise)
   * @param center Center of rotation (default: image center)
   * @param scale Scale factor (default: 1.0)
   */
  rotateArbitrary(angle: number, center?: Point, scale?: number): IImage;

  /**
   * Apply affine transformation.
   * @param matrix 2x3 affine transformation matrix
   */
  warpAffine(matrix: AffineTransformMatrix): IImage;

  /**
   * Find contours in binary image.
   * Image should be binary (thresholded) before calling this.
   * @returns Array of detected contours
   * @throws Error if the image is not single-channel binary
   */
  findContours(): IContour[];

  /**
   * Draw contours on image.
   * @param contours Contours to draw
   * @param color Color value (grayscale or [R, G, B])
   * @param thickness Line thickness (-1 for filled)
   */
  drawContours(
    contours: readonly IContour[],
    color: number | readonly [number, number, number],
    thickness?: number,
  ): IImage;

  /**
   * Label connected components in binary image.
   * @returns Object with labels (IImage) and count (number of components)
   */
  connectedComponents(): { labels: IImage; count: number };

  /**
   * Apply morphological dilation.
   * @param kernelSize Size of the structuring element
   * @param iterations Number of times dilation is applied (default 1)
   */
  dilate(kernelSize: number, iterations?: number): IImage;

  /**
   * Apply morphological erosion.
   * @param kernelSize Size of the structuring element
   * @param iterations Number of times erosion is applied (default 1)
   */
  erode(kernelSize: number, iterations?: number): IImage;

  /**
   * Apply morphological opening (erosion followed by dilation).
   * Removes small white noise.
   * @param kernelSize Size of the structuring element
   * @param iterations Number of times to apply (default 1)
   */
  morphOpen(kernelSize: number, iterations?: number): IImage;

  /**
   * Apply morphological closing (dilation followed by erosion).
   * Closes small black holes.
   * @param kernelSize Size of the structuring element
   * @param iterations Number of times to apply (default 1)
   */
  morphClose(kernelSize: number, iterations?: number): IImage;

  /**
   * Apply morphological gradient (dilation - erosion).
   * Extracts object boundaries.
   * @param kernelSize Size of the structuring element
   */
  morphGradient(kernelSize: number): IImage;

  /**
   * Detect edges using Canny edge detector.
   * @param threshold1 First threshold for hysteresis
   * @param threshold2 Second threshold for hysteresis
   */
  canny(threshold1: number, threshold2: number): IImage;

  /**
   * Apply Sobel operator for edge detection.
   * @param dx Order of derivative in x direction
   * @param dy Order of derivative in y direction
   * @param ksize Size of extended Sobel kernel (1, 3, 5, or 7)
   */
  sobel(dx: number, dy: number, ksize?: number): IImage;

  /**
   * Apply Laplacian operator for edge detection.
   * @param ksize Aperture size (must be odd and positive)
   */
  laplacian(ksize?: number): IImage;

  /**
   * Pad image with border.
   * @param top Top padding
   * @param right Right padding
   * @param bottom Bottom padding
   * @param left Left padding
   * @param borderType Border type (default 'constant')
   * @param value Border value for constant border (default 0)
   */
  pad(
    top: number,
    right: number,
    bottom: number,
    left: number,
    borderType?: BorderType,
    value?: number,
  ): IImage;

  /**
   * Convert to ImageData for display in browser.
   * Always returns RGBA format (4 channels).
   *
   * @returns Promise resolving to ImageData object
   * @throws Error if the image cannot be converted to ImageData
   */
  toImageData(): Promise<ImageData>;

  /**
   * Convert to ITensor for model inference.
   *
   * @param layout Tensor layout (default 'NCHW')
   * @param dtype Target data type (default 'float32')
   * @param normalize Whether to normalize to [0, 1] range (default true)
   * @returns Tensor with shape [1, C, H, W] (NCHW) or [1, H, W, C] (NHWC)
   */
  toTensor(layout?: TensorLayout, dtype?: DType, normalize?: boolean): ITensor;

  /**
   * Clone the image (create a copy).
   */
  clone(): IImage;

  /**
   * Clean up resources (GPU buffers, memory).
   */
  dispose(): IImage;
}
