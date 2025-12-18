import type { Point, Rectangle, RotatedRectangle } from '../types/CommonTypes';
import type { Errorable } from '../types/Errorable';

/**
 * Contour representation for shape analysis.
 * Represents a continuous curve detected in an image.
 */
export interface IContour extends Errorable<IContour> {
  /**
   * Points that make up the contour.
   */
  readonly points: readonly Point[];

  /**
   * Get axis-aligned bounding rectangle.
   */
  boundingRect(): Rectangle;

  /**
   * Get minimum area rotated rectangle.
   * Useful for oriented text detection.
   */
  minAreaRect(): RotatedRectangle;

  /**
   * Calculate contour area.
   */
  area(): number;

  /**
   * Calculate contour perimeter (arc length).
   */
  perimeter(): number;

  /**
   * Approximate contour with fewer points.
   * @param epsilon Approximation accuracy (smaller = more accurate)
   * @param closed Whether the contour is closed
   */
  approxPolyDP(epsilon: number, closed?: boolean): IContour;

  /**
   * Compute convex hull of the contour.
   * Returns the smallest convex polygon that contains all points.
   */
  convexHull(): IContour;
}
