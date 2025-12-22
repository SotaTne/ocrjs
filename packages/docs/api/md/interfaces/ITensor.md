[**@ocrjs/infra-contract**](../README.md)

***

[@ocrjs/infra-contract](../README.md) / ITensor

# Interface: ITensor

Defined in: [interfaces/ITensor.ts:15](https://github.com/SotaTne/ocrjs/blob/ce71785e55e3b44fa470587d87b426410977d29d/packages/infra-contract/src/interfaces/ITensor.ts#L15)

Represents a handle to a Tensor computation.

This interface follows the "Recursive Computer" philosophy.
An ITensor instance is not the data itself, but a handle to a computation unit
that resides in some backend (CPU, WebGPU, Wasm, etc).

All mathematical operations return a new ITensor handle synchronously (building the graph/queue),
while raw data access is asynchronous.

## theme_extends

- [`Errorable`](../type-aliases/Errorable.md)\<`ITensor`\>

## Properties

### dtype

> `readonly` **dtype**: [`DType`](../type-aliases/DType.md)

Defined in: [interfaces/ITensor.ts:26](https://github.com/SotaTne/ocrjs/blob/ce71785e55e3b44fa470587d87b426410977d29d/packages/infra-contract/src/interfaces/ITensor.ts#L26)

Data type of the tensor.
Note: bfloat16 tensors are computed as float32 internally.

***

### shape

> `readonly` **shape**: readonly `number`[]

Defined in: [interfaces/ITensor.ts:20](https://github.com/SotaTne/ocrjs/blob/ce71785e55e3b44fa470587d87b426410977d29d/packages/infra-contract/src/interfaces/ITensor.ts#L20)

shape of the tensor.
e.g., [1, 3, 224, 224]

## Methods

### add()

> **add**(`other`): `ITensor`

Defined in: [interfaces/ITensor.ts:38](https://github.com/SotaTne/ocrjs/blob/ce71785e55e3b44fa470587d87b426410977d29d/packages/infra-contract/src/interfaces/ITensor.ts#L38)

Element-wise addition.

#### Parameters

##### other

`ITensor`

Tensor to add

#### Returns

`ITensor`

***

### argmax()

> **argmax**(`axis`, `keepDims?`): `ITensor`

Defined in: [interfaces/ITensor.ts:146](https://github.com/SotaTne/ocrjs/blob/ce71785e55e3b44fa470587d87b426410977d29d/packages/infra-contract/src/interfaces/ITensor.ts#L146)

Returns the indices of the maximum values along an axis.

#### Parameters

##### axis

`number`

Axis to reduce

##### keepDims?

`boolean`

Whether to keep the reduced dimension (default false)

#### Returns

`ITensor`

***

### broadcastTo()

> **broadcastTo**(`shape`): `ITensor`

Defined in: [interfaces/ITensor.ts:92](https://github.com/SotaTne/ocrjs/blob/ce71785e55e3b44fa470587d87b426410977d29d/packages/infra-contract/src/interfaces/ITensor.ts#L92)

Broadcasts the tensor to a new shape.

#### Parameters

##### shape

readonly `number`[]

Target shape

#### Returns

`ITensor`

***

### cast()

> **cast**(`dtype`): `ITensor`

Defined in: [interfaces/ITensor.ts:32](https://github.com/SotaTne/ocrjs/blob/ce71785e55e3b44fa470587d87b426410977d29d/packages/infra-contract/src/interfaces/ITensor.ts#L32)

Casts the tensor to a different data type.

#### Parameters

##### dtype

[`DType`](../type-aliases/DType.md)

Target data type

#### Returns

`ITensor`

***

### clip()

> **clip**(`min`, `max`): `ITensor`

Defined in: [interfaces/ITensor.ts:130](https://github.com/SotaTne/ocrjs/blob/ce71785e55e3b44fa470587d87b426410977d29d/packages/infra-contract/src/interfaces/ITensor.ts#L130)

Clips the values of the tensor to a specified range.

#### Parameters

##### min

`number`

Minimum value

##### max

`number`

Maximum value

#### Returns

`ITensor`

***

### concat()

> **concat**(`others`, `axis`): `ITensor`

Defined in: [interfaces/ITensor.ts:123](https://github.com/SotaTne/ocrjs/blob/ce71785e55e3b44fa470587d87b426410977d29d/packages/infra-contract/src/interfaces/ITensor.ts#L123)

Concatenates tensors along a specified axis.
Note: This is usually a static method in frameworks, but here defined as instance method for chaining/OOP.
`this` is the first tensor, `others` are appended.

#### Parameters

##### others

`ITensor`[]

Tensors to concatenate with this one

##### axis

`number`

Axis to concatenate along

#### Returns

`ITensor`

***

### dispose()

> **dispose**(): `ITensor`

Defined in: [interfaces/ITensor.ts:201](https://github.com/SotaTne/ocrjs/blob/ce71785e55e3b44fa470587d87b426410977d29d/packages/infra-contract/src/interfaces/ITensor.ts#L201)

Clean up resources (GPU buffers, Wasm memory) associated with this handle.

#### Returns

`ITensor`

***

### div()

> **div**(`other`): `ITensor`

Defined in: [interfaces/ITensor.ts:56](https://github.com/SotaTne/ocrjs/blob/ce71785e55e3b44fa470587d87b426410977d29d/packages/infra-contract/src/interfaces/ITensor.ts#L56)

Element-wise division.

#### Parameters

##### other

`ITensor`

Tensor to divide

#### Returns

`ITensor`

***

### getError()

> **getError**(): `Error` \| `null`

Defined in: [types/Errorable.ts:8](https://github.com/SotaTne/ocrjs/blob/ce71785e55e3b44fa470587d87b426410977d29d/packages/infra-contract/src/types/Errorable.ts#L8)

#### Returns

`Error` \| `null`

#### Inherited from

[`Errorable`](../type-aliases/Errorable.md).[`getError`](../type-aliases/Errorable.md#geterror)

***

### isError()

> **isError**(): `boolean`

Defined in: [types/Errorable.ts:7](https://github.com/SotaTne/ocrjs/blob/ce71785e55e3b44fa470587d87b426410977d29d/packages/infra-contract/src/types/Errorable.ts#L7)

#### Returns

`boolean`

#### Inherited from

[`Errorable`](../type-aliases/Errorable.md).[`isError`](../type-aliases/Errorable.md#iserror)

***

### matmul()

> **matmul**(`other`): `ITensor`

Defined in: [interfaces/ITensor.ts:62](https://github.com/SotaTne/ocrjs/blob/ce71785e55e3b44fa470587d87b426410977d29d/packages/infra-contract/src/interfaces/ITensor.ts#L62)

Matrix multiplication (Dot product).

#### Parameters

##### other

`ITensor`

Tensor to multiply

#### Returns

`ITensor`

***

### mean()

> **mean**(`axis?`, `keepDims?`): `ITensor`

Defined in: [interfaces/ITensor.ts:160](https://github.com/SotaTne/ocrjs/blob/ce71785e55e3b44fa470587d87b426410977d29d/packages/infra-contract/src/interfaces/ITensor.ts#L160)

Computes the mean value along an axis.

#### Parameters

##### axis?

`number`

Axis to reduce (optional, default all)

##### keepDims?

`boolean`

Whether to keep the reduced dimension (default false)

#### Returns

`ITensor`

***

### mul()

> **mul**(`other`): `ITensor`

Defined in: [interfaces/ITensor.ts:50](https://github.com/SotaTne/ocrjs/blob/ce71785e55e3b44fa470587d87b426410977d29d/packages/infra-contract/src/interfaces/ITensor.ts#L50)

Element-wise multiplication.

#### Parameters

##### other

`ITensor`

Tensor to multiply

#### Returns

`ITensor`

***

### orElse()

> **orElse**(`fallback`): `ITensor`

Defined in: [types/Errorable.ts:9](https://github.com/SotaTne/ocrjs/blob/ce71785e55e3b44fa470587d87b426410977d29d/packages/infra-contract/src/types/Errorable.ts#L9)

#### Parameters

##### fallback

`ITensor`

#### Returns

`ITensor`

#### Inherited from

[`Errorable`](../type-aliases/Errorable.md).[`orElse`](../type-aliases/Errorable.md#orelse)

***

### permute()

> **permute**(`axes`): `ITensor`

Defined in: [interfaces/ITensor.ts:68](https://github.com/SotaTne/ocrjs/blob/ce71785e55e3b44fa470587d87b426410977d29d/packages/infra-contract/src/interfaces/ITensor.ts#L68)

Permutes the dimensions of the tensor.

#### Parameters

##### axes

readonly `number`[]

New order of dimensions

#### Returns

`ITensor`

***

### reduceMax()

> **reduceMax**(`axis`, `keepDims?`): `ITensor`

Defined in: [interfaces/ITensor.ts:153](https://github.com/SotaTne/ocrjs/blob/ce71785e55e3b44fa470587d87b426410977d29d/packages/infra-contract/src/interfaces/ITensor.ts#L153)

Computes the maximum value along an axis.

#### Parameters

##### axis

`number`

Axis to reduce

##### keepDims?

`boolean`

Whether to keep the reduced dimension (default false)

#### Returns

`ITensor`

***

### reshape()

> **reshape**(`dims`): `ITensor`

Defined in: [interfaces/ITensor.ts:74](https://github.com/SotaTne/ocrjs/blob/ce71785e55e3b44fa470587d87b426410977d29d/packages/infra-contract/src/interfaces/ITensor.ts#L74)

Reshapes the tensor.

#### Parameters

##### dims

readonly `number`[]

New dimensions

#### Returns

`ITensor`

***

### scatter()

> **scatter**(`indices`, `value`, `axis?`): `ITensor`

Defined in: [interfaces/ITensor.ts:139](https://github.com/SotaTne/ocrjs/blob/ce71785e55e3b44fa470587d87b426410977d29d/packages/infra-contract/src/interfaces/ITensor.ts#L139)

Scatter update (pickAndSet).
Creates a NEW tensor with values updated at specified indices.

#### Parameters

##### indices

readonly `number`[]

Indices to update

##### value

`ITensor`

Values to put at indices

##### axis?

`number`

Axis along which to scatter

#### Returns

`ITensor`

***

### slice()

> **slice**(`starts`, `ends`, `axes?`, `steps?`): `ITensor`

Defined in: [interfaces/ITensor.ts:102](https://github.com/SotaTne/ocrjs/blob/ce71785e55e3b44fa470587d87b426410977d29d/packages/infra-contract/src/interfaces/ITensor.ts#L102)

Extracts a slice of the tensor.
Python equivalent: tensor[starts[0]:ends[0]:steps[0], ...]

#### Parameters

##### starts

readonly `number`[]

Starting indices for each dimension

##### ends

readonly `number`[]

Ending indices for each dimension

##### axes?

readonly `number`[]

Axes to slice (optional, default all)

##### steps?

readonly `number`[]

Steps for each dimension (optional, default 1)

#### Returns

`ITensor`

***

### squeeze()

> **squeeze**(`dim?`): `ITensor`

Defined in: [interfaces/ITensor.ts:80](https://github.com/SotaTne/ocrjs/blob/ce71785e55e3b44fa470587d87b426410977d29d/packages/infra-contract/src/interfaces/ITensor.ts#L80)

Remove single-dimensional entries from the shape.

#### Parameters

##### dim?

`number`

Dimension to squeeze (optional)

#### Returns

`ITensor`

***

### std()

> **std**(`axis?`, `keepDims?`): `ITensor`

Defined in: [interfaces/ITensor.ts:167](https://github.com/SotaTne/ocrjs/blob/ce71785e55e3b44fa470587d87b426410977d29d/packages/infra-contract/src/interfaces/ITensor.ts#L167)

Computes the standard deviation along an axis.

#### Parameters

##### axis?

`number`

Axis to reduce (optional, default all)

##### keepDims?

`boolean`

Whether to keep the reduced dimension (default false)

#### Returns

`ITensor`

***

### sub()

> **sub**(`other`): `ITensor`

Defined in: [interfaces/ITensor.ts:44](https://github.com/SotaTne/ocrjs/blob/ce71785e55e3b44fa470587d87b426410977d29d/packages/infra-contract/src/interfaces/ITensor.ts#L44)

Element-wise subtraction.

#### Parameters

##### other

`ITensor`

Tensor to subtract

#### Returns

`ITensor`

***

### toData()

> **toData**(): `Promise`\<`Float32Array`\<`ArrayBufferLike`\> \| `Int32Array`\<`ArrayBufferLike`\> \| `Float16Array`\<`ArrayBufferLike`\> \| `Int8Array`\<`ArrayBufferLike`\> \| `Uint8Array`\<`ArrayBufferLike`\> \| `Uint8ClampedArray`\<`ArrayBufferLike`\>\>

Defined in: [interfaces/ITensor.ts:189](https://github.com/SotaTne/ocrjs/blob/ce71785e55e3b44fa470587d87b426410977d29d/packages/infra-contract/src/interfaces/ITensor.ts#L189)

Transfers the data from the backend to the host (CPU).
This is the only way to inspect the actual values.

Note: For bfloat16 tensors, returns Float32Array as they are
computed as float32 internally.

this method include unwrap internally and will throw error if the tensor is in error state.

#### Returns

`Promise`\<`Float32Array`\<`ArrayBufferLike`\> \| `Int32Array`\<`ArrayBufferLike`\> \| `Float16Array`\<`ArrayBufferLike`\> \| `Int8Array`\<`ArrayBufferLike`\> \| `Uint8Array`\<`ArrayBufferLike`\> \| `Uint8ClampedArray`\<`ArrayBufferLike`\>\>

Promise resolving to typed array of the tensor data

#### Throws

Error if the tensor is in error state (propagated from the computation graph)

***

### toImage()

> **toImage**(`layout?`): [`IImage`](IImage.md)

Defined in: [interfaces/ITensor.ts:175](https://github.com/SotaTne/ocrjs/blob/ce71785e55e3b44fa470587d87b426410977d29d/packages/infra-contract/src/interfaces/ITensor.ts#L175)

Convert tensor to IImage.
Assumes tensor is in image format (3D or 4D with batch dimension).

#### Parameters

##### layout?

[`TensorLayout`](../type-aliases/TensorLayout.md)

Input tensor layout (default 'NCHW')

#### Returns

[`IImage`](IImage.md)

IImage with values normalized to [0, 255] range

***

### transpose()

> **transpose**(`dim0`, `dim1`): `ITensor`

Defined in: [interfaces/ITensor.ts:114](https://github.com/SotaTne/ocrjs/blob/ce71785e55e3b44fa470587d87b426410977d29d/packages/infra-contract/src/interfaces/ITensor.ts#L114)

Transposes two dimensions of the tensor.

#### Parameters

##### dim0

`number`

First dimension

##### dim1

`number`

Second dimension

#### Returns

`ITensor`

***

### unsqueeze()

> **unsqueeze**(`dim`): `ITensor`

Defined in: [interfaces/ITensor.ts:86](https://github.com/SotaTne/ocrjs/blob/ce71785e55e3b44fa470587d87b426410977d29d/packages/infra-contract/src/interfaces/ITensor.ts#L86)

Add a single-dimensional entry to the shape.

#### Parameters

##### dim

`number`

Dimension to insert

#### Returns

`ITensor`

***

### unwrap()

> **unwrap**(): `ITensor`

Defined in: [types/Errorable.ts:10](https://github.com/SotaTne/ocrjs/blob/ce71785e55e3b44fa470587d87b426410977d29d/packages/infra-contract/src/types/Errorable.ts#L10)

#### Returns

`ITensor`

#### Inherited from

[`Errorable`](../type-aliases/Errorable.md).[`unwrap`](../type-aliases/Errorable.md#unwrap)
