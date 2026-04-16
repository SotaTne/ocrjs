// export class OnnxWebModel extends ErrorableBase implements IModel {
//   readonly inputNames: string[] = [];
//   readonly outputNames: string[] = [];

//   #session: unknown;

//   constructor(session: unknown) {
//     super();
//     this.#session = session;
//   }

//   isError(): boolean {
//     return this.isErrorBase();
//   }

//   getError(): Error | null {
//     return this.getErrorBase();
//   }

//   orElse(fallback: this): this {
//     return this.orElseBase(this, fallback);
//   }

//   unwrap(): this {
//     return this.unwrapBase();
//   }

//   async forward(
//     inputs: Record<string, ITensor>,
//   ): Promise<Record<string, ITensor>> {
//     return this.guard(() => {
//       console.log('Forwarding ONNX model from Web:', inputs);
//       // const session = await InferenceSession.create(source, ...);
//       // return new OnnxWebModel(session);
//       throw new Error('Not implemented');
//     });
//   }

//   dispose(): IModel {
//     return this.unwrapBase();
//   }
// }
