[**@ocrjs/infra-contract**](../README.md)

***

[@ocrjs/infra-contract](../README.md) / ITensorFactory

# Interface: ITensorFactory

Defined in: [interfaces/ITensorFactory.ts:9](https://github.com/SotaTne/ocrjs/blob/0b7f8fd574ea61267d8c3b63c1f0e7b7bba13fe0/packages/infra-contract/src/interfaces/ITensorFactory.ts#L9)

Factory interface for creating ITensor instances.
Implementations provide concrete tensor creation logic.

## UML Class Diagram

```mermaid
classDiagram
class ITensorFactory {
  <<factory>>
  +fromArray(data:Float32Array~ArrayBufferLike~, shape:number[], dtype:DType) ITensor
  +getError() Error
  +isError() boolean
  +ones(shape:number[], dtype:DType) ITensor
  +orElse(fallback:ITensorFactory) ITensorFactory
  +unwrap() ITensorFactory
  +zeros(shape:number[], dtype:DType) ITensor
}
class Errorable {
  +getError() Error
  +isError() boolean
  +orElse(fallback:any) any
  +unwrap() any
}
class DType
class ITensor {
  <<interface>>
  +dtype : DType
  +shape : number[]
  +add(other:ITensor) ITensor
  +argmax(axis:number, keepDims:boolean) ITensor
  +broadcastTo(shape:number[]) ITensor
  +cast(dtype:DType) ITensor
  +clip(min:number, max:number) ITensor
  +concat(others:ITensor[], axis:number) ITensor
  +dispose() ITensor
  +div(other:ITensor) ITensor
  +getError() Error
  +isError() boolean
}
class TensorLayout
class IImage {
  <<interface>>
  +channels : number
  +colorSpace : ColorSpace
  +height : number
  +width : number
  +adaptiveThreshold(maxValue:number, method:AdaptiveThresholdMethod, blockSize:number, C:number) IImage
  +bilateralFilter(d:number, sigmaColor:number, sigmaSpace:number) IImage
  +blur(kernelSize:number) IImage
  +canny(threshold1:number, threshold2:number) IImage
  +clone() IImage
  +connectedComponents() any
  +convertTo(target:ColorSpace) IImage
  +crop(rect:Rectangle) IImage
  +cropPolygon(polygon:Point[]) IImage
  +dilate(kernelSize:number, iterations:number) IImage
}

ITensorFactory <|-- Errorable
ITensorFactory ..> ITensor : <<creates>>
ITensor <|-- Errorable
ITensor *-- "1" DType
IImage <|-- Errorable

click ITensorFactory href "interfaces/ITensorFactory.html" "View ITensorFactory documentation"
click Errorable href "types/Errorable.html" "View Errorable documentation"
click DType href "types/DType.html" "View DType documentation"
click ITensor href "interfaces/ITensor.html" "View ITensor documentation"
click TensorLayout href "types/TensorLayout.html" "View TensorLayout documentation"
click IImage href "interfaces/IImage.html" "View IImage documentation"
```

## theme_extends

- [`Errorable`](../type-aliases/Errorable.md)\<`ITensorFactory`\>

## Methods

### fromArray()

> **fromArray**(`data`, `shape`, `dtype`): [`ITensor`](ITensor.md)

Defined in: [interfaces/ITensorFactory.ts:30](https://github.com/SotaTne/ocrjs/blob/0b7f8fd574ea61267d8c3b63c1f0e7b7bba13fe0/packages/infra-contract/src/interfaces/ITensorFactory.ts#L30)

Creates a tensor from an array of data.

#### Parameters

##### data

Source data array

`Float32Array`\<`ArrayBufferLike`\> | `Int32Array`\<`ArrayBufferLike`\> | `Float16Array`\<`ArrayBufferLike`\> | `Int8Array`\<`ArrayBufferLike`\> | `Uint8Array`\<`ArrayBufferLike`\> | `Uint8ClampedArray`\<`ArrayBufferLike`\> | `number`[]

##### shape

readonly `number`[]

Tensor shape (must match data length)

##### dtype

[`DType`](../type-aliases/DType.md)

Data type

#### Returns

[`ITensor`](ITensor.md)

***

### getError()

> **getError**(): `Error` \| `null`

Defined in: [types/Errorable.ts:8](https://github.com/SotaTne/ocrjs/blob/0b7f8fd574ea61267d8c3b63c1f0e7b7bba13fe0/packages/infra-contract/src/types/Errorable.ts#L8)

#### Returns

`Error` \| `null`

#### Inherited from

[`Errorable`](../type-aliases/Errorable.md).[`getError`](../type-aliases/Errorable.md#geterror)

***

### isError()

> **isError**(): `boolean`

Defined in: [types/Errorable.ts:7](https://github.com/SotaTne/ocrjs/blob/0b7f8fd574ea61267d8c3b63c1f0e7b7bba13fe0/packages/infra-contract/src/types/Errorable.ts#L7)

#### Returns

`boolean`

#### Inherited from

[`Errorable`](../type-aliases/Errorable.md).[`isError`](../type-aliases/Errorable.md#iserror)

***

### ones()

> **ones**(`shape`, `dtype`): [`ITensor`](ITensor.md)

Defined in: [interfaces/ITensorFactory.ts:22](https://github.com/SotaTne/ocrjs/blob/0b7f8fd574ea61267d8c3b63c1f0e7b7bba13fe0/packages/infra-contract/src/interfaces/ITensorFactory.ts#L22)

Creates a tensor filled with ones.

#### Parameters

##### shape

readonly `number`[]

Tensor shape

##### dtype

[`DType`](../type-aliases/DType.md)

Data type

#### Returns

[`ITensor`](ITensor.md)

***

### orElse()

> **orElse**(`fallback`): `ITensorFactory`

Defined in: [types/Errorable.ts:9](https://github.com/SotaTne/ocrjs/blob/0b7f8fd574ea61267d8c3b63c1f0e7b7bba13fe0/packages/infra-contract/src/types/Errorable.ts#L9)

#### Parameters

##### fallback

`ITensorFactory`

#### Returns

`ITensorFactory`

#### Inherited from

[`Errorable`](../type-aliases/Errorable.md).[`orElse`](../type-aliases/Errorable.md#orelse)

***

### unwrap()

> **unwrap**(): `ITensorFactory`

Defined in: [types/Errorable.ts:10](https://github.com/SotaTne/ocrjs/blob/0b7f8fd574ea61267d8c3b63c1f0e7b7bba13fe0/packages/infra-contract/src/types/Errorable.ts#L10)

#### Returns

`ITensorFactory`

#### Inherited from

[`Errorable`](../type-aliases/Errorable.md).[`unwrap`](../type-aliases/Errorable.md#unwrap)

***

### zeros()

> **zeros**(`shape`, `dtype`): [`ITensor`](ITensor.md)

Defined in: [interfaces/ITensorFactory.ts:15](https://github.com/SotaTne/ocrjs/blob/0b7f8fd574ea61267d8c3b63c1f0e7b7bba13fe0/packages/infra-contract/src/interfaces/ITensorFactory.ts#L15)

Creates a tensor filled with zeros.

#### Parameters

##### shape

readonly `number`[]

Tensor shape

##### dtype

[`DType`](../type-aliases/DType.md)

Data type

#### Returns

[`ITensor`](ITensor.md)
