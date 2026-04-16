import { ErrorableBase } from '@ocrjs/infra-contract';
import type {
  IModel,
  IModelLoader,
  ITensor,
} from '@ocrjs/infra-contract/interfaces/primitives';
import type { ModelLoadOptions } from '@ocrjs/infra-contract/types/CommonTypes';
// import { InferenceSession } from 'onnxruntime-node';
// Note: onnxruntime-node types differ slightly from web, usually 'inference-session' alias.
// We will need to implement specific wrapping logic.

export class OnnxNodeModelLoader extends ErrorableBase implements IModelLoader {
  async load(source: string, _options?: ModelLoadOptions): Promise<IModel> {
    console.log('Loading ONNX model from Node:', source);
    // const session = await InferenceSession.create(source, ...);
    // return new OnnxNodeModel(session);
    throw new Error('Not implemented');
  }
}

export class OnnxNodeModel extends ErrorableBase implements IModel {
  readonly inputNames: string[] = [];
  readonly outputNames: string[] = [];

  constructor(session: unknown) {
    super();
    void session;
  }

  async forward(
    _inputs: Record<string, ITensor>,
  ): Promise<Record<string, ITensor>> {
    throw new Error('Not implemented');
  }

  dispose(): IModel {
    return this;
  }
}
