[**@ocrjs/infra-contract**](../README.md)

***

[@ocrjs/infra-contract](../README.md) / TensorLayout

# Type Alias: TensorLayout

> **TensorLayout** = `"NCHW"` \| `"NHWC"`

Defined in: [types/CommonTypes.ts:22](https://github.com/SotaTne/ocrjs/blob/ce71785e55e3b44fa470587d87b426410977d29d/packages/infra-contract/src/types/CommonTypes.ts#L22)

Tensor data layout format.
- NCHW: Batch, Channel, Height, Width (common in PyTorch, ONNX)
- NHWC: Batch, Height, Width, Channel (common in TensorFlow)
