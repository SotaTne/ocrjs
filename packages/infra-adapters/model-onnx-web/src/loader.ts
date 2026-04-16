import { ErrorableBase } from '@ocrjs/infra-contract';
import type {
  IModel,
  IModelLoader,
} from '@ocrjs/infra-contract/interfaces/primitives';
import type { ModelLoadOptions } from '@ocrjs/infra-contract/types/CommonTypes';
import { InferenceSession } from 'onnxruntime-web';

export class OnnxWebModelLoader extends ErrorableBase implements IModelLoader {
  async load(source: string, _options?: ModelLoadOptions): Promise<IModel> {
    return this.guard(async () => {
      console.log('Loading ONNX model from Web:', source);

      const _session = await InferenceSession.create(source);
      // return new OnnxWebModel(session);
      throw new Error('Not implemented');
    });
  }

  isError(): boolean {
    return this.isErrorBase();
  }

  getError(): Error | null {
    return this.getErrorBase();
  }

  unwrap(): this {
    return this.unwrapBase();
  }

  orElse(fallback: IModelLoader): IModelLoader {
    return this.orElseBase(fallback, fallback);
  }
}
