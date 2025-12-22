[**@ocrjs/infra-contract**](../README.md)

***

[@ocrjs/infra-contract](../README.md) / IModelLoader

# Interface: IModelLoader

Defined in: [interfaces/IModel.ts:48](https://github.com/SotaTne/ocrjs/blob/0b7f8fd574ea61267d8c3b63c1f0e7b7bba13fe0/packages/infra-contract/src/interfaces/IModel.ts#L48)

Model loader interface for loading models from various sources.

## UML Class Diagram

```mermaid
classDiagram
class IModelLoader {
  <<interface>>
  +getError() Error
  +isError() boolean
  +load(source:string, options:ModelLoadOptions) Promise~IModel~
  +orElse(fallback:IModelLoader) IModelLoader
  +unwrap() IModelLoader
}
class Errorable {
  +getError() Error
  +isError() boolean
  +orElse(fallback:any) any
  +unwrap() any
}
class ModelLoadOptions {
  +executionProvider : string
}

IModelLoader <|-- Errorable

click IModelLoader href "interfaces/IModelLoader.html" "View IModelLoader documentation"
click Errorable href "types/Errorable.html" "View Errorable documentation"
click ModelLoadOptions href "types/ModelLoadOptions.html" "View ModelLoadOptions documentation"
```

## theme_extends

- [`Errorable`](../type-aliases/Errorable.md)\<`IModelLoader`\>

## Methods

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

### load()

> **load**(`source`, `options?`): `Promise`\<[`IModel`](IModel.md)\>

Defined in: [interfaces/IModel.ts:55](https://github.com/SotaTne/ocrjs/blob/0b7f8fd574ea61267d8c3b63c1f0e7b7bba13fe0/packages/infra-contract/src/interfaces/IModel.ts#L55)

Load a model from a file or URL.

#### Parameters

##### source

`string`

Model file path or URL

##### options?

[`ModelLoadOptions`](../type-aliases/ModelLoadOptions.md)

Optional loading configuration

#### Returns

`Promise`\<[`IModel`](IModel.md)\>

Loaded model ready for inference

***

### orElse()

> **orElse**(`fallback`): `IModelLoader`

Defined in: [types/Errorable.ts:9](https://github.com/SotaTne/ocrjs/blob/0b7f8fd574ea61267d8c3b63c1f0e7b7bba13fe0/packages/infra-contract/src/types/Errorable.ts#L9)

#### Parameters

##### fallback

`IModelLoader`

#### Returns

`IModelLoader`

#### Inherited from

[`Errorable`](../type-aliases/Errorable.md).[`orElse`](../type-aliases/Errorable.md#orelse)

***

### unwrap()

> **unwrap**(): `IModelLoader`

Defined in: [types/Errorable.ts:10](https://github.com/SotaTne/ocrjs/blob/0b7f8fd574ea61267d8c3b63c1f0e7b7bba13fe0/packages/infra-contract/src/types/Errorable.ts#L10)

#### Returns

`IModelLoader`

#### Inherited from

[`Errorable`](../type-aliases/Errorable.md).[`unwrap`](../type-aliases/Errorable.md#unwrap)
