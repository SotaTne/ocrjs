import type { Point } from '../types/CommonTypes';
import type { Errorable } from '../types/Errorable';

/**
 * Polygon geometry interface
 * Extends Errorable for error handling
 * Methods like offset and iou may require complex geometry libraries
 */

export interface IGeometryPolygon extends Errorable<IGeometryPolygon> {
  readonly points: readonly Point[];

  /**
   * Offset operation (requires Clipper)
   * Polygon offsetting is geometrically complex
   */
  offset(distance: number): IGeometryPolygon;

  /**
   * IoU calculation (requires Clipper)
   * Needs polygon intersection/union which is complex
   * @returns Intersection over Union value
   * @throws Error if calculation fails
   */
  iou(other: IGeometryPolygon): number;
}
