import type { Point, Rectangle, RotatedRectangle } from '../types/CommonTypes';
import type { Errorable } from '../types/Errorable';
import type { IGeometryPolygon } from './IGeometryPolygon';

/**
 * Factory interface for creating IGeometryPolygon instances.
 * Implementations provide concrete polygon creation logic.
 */
export interface IGeometryPolygonFactory
  extends Errorable<IGeometryPolygonFactory> {
  /**
   * Creates a polygon from an array of points.
   * @param points Array of points defining the polygon vertices
   */
  fromPoints(points: readonly Point[]): IGeometryPolygon;

  /**
   * Creates a rectangular polygon from a Rectangle.
   * @param rect Rectangle definition
   */
  fromRectangle(rect: Rectangle): IGeometryPolygon;

  /**
   * Creates a polygon from a RotatedRectangle.
   * @param rect Rotated rectangle definition
   */
  fromRotatedRectangle(rect: RotatedRectangle): IGeometryPolygon;
}
