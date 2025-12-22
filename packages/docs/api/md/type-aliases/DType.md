[**@ocrjs/infra-contract**](../README.md)

***

[@ocrjs/infra-contract](../README.md) / DType

# Type Alias: DType

> **DType** = `"float32"` \| `"float16"` \| `"bfloat16"` \| `"int32"` \| `"int8"` \| `"uint8"` \| `"bool"`

Defined in: [types/CommonTypes.ts:8](https://github.com/SotaTne/ocrjs/blob/0b7f8fd574ea61267d8c3b63c1f0e7b7bba13fe0/packages/infra-contract/src/types/CommonTypes.ts#L8)

Supported data types for Tensor operations.
Includes quantization types (int8, float16) for optimization.

Note: bfloat16 is accepted but computed as float32 internally,
as most runtimes don't support native bfloat16 operations yet.
