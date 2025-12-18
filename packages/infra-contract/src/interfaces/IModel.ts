import type { Errorable } from '../types/Errorable';
import type { ITensor } from './ITensor';

/**
 * Options for loading a model.
 */
export type ModelLoadOptions = {
  /** Execution provider preference (e.g., 'cpu', 'webgpu', 'wasm') */
  executionProvider?: string;
  /** Additional framework-specific options */
  [key: string]: unknown;
};

/**
 * Model interface for framework-agnostic inference.
 * Can be implemented using ONNX Runtime, TensorFlow.js, or other frameworks.
 *
 * This interface provides a unified API regardless of the underlying
 * inference framework, allowing engines to work with any model format.
 */
export interface IModel extends Errorable<IModel> {
  /**
   * Run inference with the model.
   * @param inputs Input tensors mapped by name
   * @returns Output tensors mapped by name
   */
  forward(inputs: Record<string, ITensor>): Promise<Record<string, ITensor>>;

  /**
   * Get input names expected by the model.
   */
  readonly inputNames: readonly string[];

  /**
   * Get output names provided by the model.
   */
  readonly outputNames: readonly string[];

  /**
   * Clean up resources (model weights, session).
   */
  dispose(): IModel;
}

/**
 * Model loader interface for loading models from various sources.
 */
export interface IModelLoader extends Errorable<IModelLoader> {
  /**
   * Load a model from a file or URL.
   * @param source Model file path or URL
   * @param options Optional loading configuration
   * @returns Loaded model ready for inference
   */
  load(source: string, options?: ModelLoadOptions): Promise<IModel>;
}
