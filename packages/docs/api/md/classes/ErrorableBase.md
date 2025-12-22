[**@ocrjs/infra-contract**](../README.md)

***

[@ocrjs/infra-contract](../README.md) / ErrorableBase

# Abstract Class: ErrorableBase

Defined in: [base/ErrorableBase.ts:1](https://github.com/SotaTne/ocrjs/blob/ce71785e55e3b44fa470587d87b426410977d29d/packages/infra-contract/src/base/ErrorableBase.ts#L1)

## Constructors

### Constructor

> **new ErrorableBase**(): `ErrorableBase`

#### Returns

`ErrorableBase`

## Methods

### getErrorBase()

> `protected` **getErrorBase**(): `Error` \| `null`

Defined in: [base/ErrorableBase.ts:16](https://github.com/SotaTne/ocrjs/blob/ce71785e55e3b44fa470587d87b426410977d29d/packages/infra-contract/src/base/ErrorableBase.ts#L16)

#### Returns

`Error` \| `null`

***

### guard()

> `protected` **guard**\<`T`\>(`fn`): `T`

Defined in: [base/ErrorableBase.ts:35](https://github.com/SotaTne/ocrjs/blob/ce71785e55e3b44fa470587d87b426410977d29d/packages/infra-contract/src/base/ErrorableBase.ts#L35)

安全な short-circuit + error capture

- すでに error 状態なら何もしない
- 例外が出たら「正規インスタンス」に error を注入

#### Type Parameters

##### T

`T` *extends* `ErrorableBase`

#### Parameters

##### fn

() => `T`

#### Returns

`T`

***

### isErrorBase()

> `protected` **isErrorBase**(): `boolean`

Defined in: [base/ErrorableBase.ts:12](https://github.com/SotaTne/ocrjs/blob/ce71785e55e3b44fa470587d87b426410977d29d/packages/infra-contract/src/base/ErrorableBase.ts#L12)

#### Returns

`boolean`

***

### orElseBase()

> `protected` **orElseBase**\<`T`\>(`this`, `fallback`): `T`

Defined in: [base/ErrorableBase.ts:25](https://github.com/SotaTne/ocrjs/blob/ce71785e55e3b44fa470587d87b426410977d29d/packages/infra-contract/src/base/ErrorableBase.ts#L25)

#### Type Parameters

##### T

`T` *extends* `ErrorableBase`

#### Parameters

##### this

`T`

##### fallback

`T`

#### Returns

`T`

***

### setError()

> `protected` **setError**(`error`): `void`

Defined in: [base/ErrorableBase.ts:8](https://github.com/SotaTne/ocrjs/blob/ce71785e55e3b44fa470587d87b426410977d29d/packages/infra-contract/src/base/ErrorableBase.ts#L8)

エラーを設定（protected）
※ constructor / guard 内でのみ使うこと

#### Parameters

##### error

`Error` | `null`

#### Returns

`void`

***

### unwrapBase()

> `protected` **unwrapBase**(): `this`

Defined in: [base/ErrorableBase.ts:20](https://github.com/SotaTne/ocrjs/blob/ce71785e55e3b44fa470587d87b426410977d29d/packages/infra-contract/src/base/ErrorableBase.ts#L20)

#### Returns

`this`
