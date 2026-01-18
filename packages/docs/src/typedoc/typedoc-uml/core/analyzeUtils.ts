import { type Reflection, ReflectionKind, type SomeType } from 'typedoc';

type CallableInfo = {
  signatureIndex: number; // overload対応
  params: SomeType[];
  returns?: SomeType | undefined;
};

function isObj(x: unknown): x is Record<string, any> {
  return !!x && typeof x === 'object';
}

function getCallableInfosFromReflection(ref: Reflection): CallableInfo[] {
  const out: CallableInfo[] = [];

  // 1) Function / Method / Constructor などは大抵 signatures を持つ
  const anyRef = ref as any;
  const sigs: any[] = Array.isArray(anyRef.signatures) ? anyRef.signatures : [];

  // 2) CallSignature 自体が渡ってくるケース（稀）にも対応
  if (ref.kindOf?.(ReflectionKind.CallSignature)) {
    sigs.unshift(anyRef);
  }

  for (let i = 0; i < sigs.length; i++) {
    const s = sigs[i];
    const params = (
      Array.isArray(s?.types)
        ? s.types.map((s: any) => (isObj(s) ? s : undefined)).filter(Boolean)
        : []
    ) as SomeType[];

    const returns: CallableInfo['returns'] = isObj(s?.type)
      ? (s.type as SomeType)
      : undefined;

    out.push({
      signatureIndex: i,
      params,
      returns,
    });
  }

  return out;
}
