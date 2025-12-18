import type { ColorSpace } from '../types/CommonTypes';
import type { Errorable } from '../types/Errorable';
import type { IImage } from './IImage';

/**
 * Factory interface for creating IImage instances.
 * Implementations provide concrete image creation logic.
 */
export interface IImageFactory extends Errorable<IImageFactory> {
  /**
   * Creates a zero-filled image (black image).
   * @param width Image width in pixels
   * @param height Image height in pixels
   * @param channels Number of channels (1=grayscale, 3=RGB, 4=RGBA)
   * @param colorSpace Color space of the image
   */
  zero(
    width: number,
    height: number,
    channels: number,
    colorSpace: ColorSpace,
  ): IImage;

  /**
   * Creates an image filled with a specific value.
   * @param width Image width in pixels
   * @param height Image height in pixels
   * @param channels Number of channels
   * @param colorSpace Color space of the image
   * @param value Fill value (single number for all channels, or array for per-channel)
   */
  fill(
    width: number,
    height: number,
    channels: number,
    colorSpace: ColorSpace,
    value: number | readonly number[],
  ): IImage;

  /**
   * Creates an image from raw pixel data.
   * @param data Raw pixel data (row-major order)
   * @param width Image width in pixels
   * @param height Image height in pixels
   * @param colorSpace Color space of the data
   */
  fromRawPixels(
    data: Uint8Array | Uint8ClampedArray,
    width: number,
    height: number,
    colorSpace: ColorSpace,
  ): IImage;

  /**
   * Creates an image from ImageData (Browser environment).
   * @param imageData Browser ImageData object
   */
  fromImageData(imageData: ImageData): IImage;
}
