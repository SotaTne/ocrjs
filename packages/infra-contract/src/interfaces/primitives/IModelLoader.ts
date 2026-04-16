import type { ModelLoadOptions } from '../../types/CommonTypes';
import type { IErrorable } from '../traits/IErrorable';
import type { IModel } from './IModel';

/**
 * Model loader interface for loading models from various sources.
 */
export interface IModelLoader extends IErrorable<IModelLoader> {
  /**
   * Load a model from a file or URL.
   * @param source Model file path or URL
   * @param options Optional loading configuration
   * @returns Loaded model ready for inference
   */
  load(source: string, options?: ModelLoadOptions): Promise<IModel>;
}
