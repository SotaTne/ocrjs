[**@ocrjs/infra-contract**](../README.md)

***

[@ocrjs/infra-contract](../README.md) / TensorLayout

# Type Alias: TensorLayout

> **TensorLayout** = `"NCHW"` \| `"NHWC"`

Defined in: [types/CommonTypes.ts:22](https://github.com/SotaTne/ocrjs/blob/0b7f8fd574ea61267d8c3b63c1f0e7b7bba13fe0/packages/infra-contract/src/types/CommonTypes.ts#L22)

Tensor data layout format.
- NCHW: Batch, Channel, Height, Width (common in PyTorch, ONNX)
- NHWC: Batch, Height, Width, Channel (common in TensorFlow)
