import type { IErrorable } from '../traits/IErrorable';
import type { ITensor } from './ITensor';

/**
 * Model interface for framework-agnostic inference.
 * Can be implemented using ONNX Runtime, TensorFlow.js, or other frameworks.
 *
 * This interface provides a unified API regardless of the underlying
 * inference framework, allowing engines to work with any model format.
 */
export interface IModel<
  I extends Record<string, ITensor> = Record<string, ITensor>,
  O extends Record<string, ITensor> = Record<string, ITensor>,
> extends IErrorable<IModel<I, O>> {
  /**
   * Run inference with the model.
   * @param inputs Input tensors mapped by name
   * @returns Output tensors mapped by name
   */
  forward(inputs: I): Promise<O>;

  /**
   * Get input names expected by the model.
   */
  readonly inputNames: readonly (keyof I)[];

  /**
   * Get output names provided by the model.
   */
  readonly outputNames: readonly (keyof O)[];

  /**
   * Clean up resources (model weights, session).
   */
  dispose(): IModel;
}
