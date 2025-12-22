import type {
  Type,
  SomeType,
  ReferenceType,
  ArrayType,
  UnionType,
  IntersectionType,
  ReflectionType,
  Context,
} from 'typedoc';
import { DeclarationReflection, ReflectionKind } from 'typedoc';
import type { UMLPluginOptions } from './types';

/**
 * Determines if a type should be excluded from the UML diagram
 * @param typeName - Name of the type to check
 * @param options - Plugin options containing exclusion lists
 * @returns true if type should be excluded
 */
export function shouldExcludeType(
  typeName: string,
  options: Partial<UMLPluginOptions> = {}
): boolean {
  // Primitives
  const primitives = [
    'string',
    'number',
    'boolean',
    'bigint',
    'symbol',
    'void',
    'null',
    'undefined',
    'any',
    'unknown',
    'never',
    'object',
  ];

  if (!options.includePrimitives && primitives.includes(typeName.toLowerCase())) {
    return true;
  }

  // Built-in types (wrappers that don't provide meaningful UML info)
  const builtIns = [
    'Promise',
    'Array',
    'ReadonlyArray',
    'Map',
    'Set',
    'WeakMap',
    'WeakSet',
    'Date',
    'RegExp',
    'Error',
    'Readonly',
    'Record',
    'Partial',
    'Pick',
    'Omit',
    'Required',
    'NonNullable',
  ];

  if (builtIns.includes(typeName)) {
    return true;
  }

  // User-specified exclusions
  if (options.excludeTypes?.includes(typeName)) {
    return true;
  }

  return false;
}

/**
 * Extracts the primary type name from a TypeScript type
 * Handles complex types like "Promise<ITensor>", "readonly ITensor[]", etc.
 * @param type - TypeScript type to extract name from
 * @returns Extracted type name or empty string
 */
export function extractTypeName(type: SomeType | Type | string): string {
  if (typeof type === 'string') {
    return type;
  }

  if (!type || typeof type !== 'object') {
    return '';
  }

  switch (type.type) {
    case 'reference': {
      const refType = type as ReferenceType;
      return refType.name || '';
    }

    case 'array': {
      const arrayType = type as ArrayType;
      return arrayType.elementType ? extractTypeName(arrayType.elementType) : '';
    }

    case 'union': {
      const unionType = type as UnionType;
      // Extract first non-undefined type
      const nonUndefined = unionType.types.find(
        (t) => !(t.type === 'intrinsic' && (t as any).name === 'undefined')
      );
      return nonUndefined ? extractTypeName(nonUndefined) : '';
    }

    case 'intersection': {
      const intersectionType = type as IntersectionType;
      // Return first type in intersection
      const firstType = intersectionType.types[0];
      return firstType ? extractTypeName(firstType) : '';
    }

    case 'reflection': {
      const reflectionType = type as ReflectionType;
      return reflectionType.declaration?.name || '';
    }

    case 'intrinsic': {
      return (type as any).name || '';
    }

    default:
      return '';
  }
}

/**
 * Extracts all related type names from a TypeScript type
 * This includes unwrapping generics, unions, intersections, etc.
 * @param type - Type to extract names from
 * @returns Array of type names
 */
export function extractAllTypeNames(type: SomeType): string[] {
  const names: string[] = [];

  if (!type) return names;

  switch (type.type) {
    case 'reference': {
      const refType = type as ReferenceType;
      names.push(refType.name);

      // Also extract type arguments (generics)
      if (refType.typeArguments) {
        refType.typeArguments.forEach((arg) => {
          names.push(...extractAllTypeNames(arg));
        });
      }
      break;
    }

    case 'array': {
      const arrayType = type as ArrayType;
      names.push(...extractAllTypeNames(arrayType.elementType));
      break;
    }

    case 'union': {
      const unionType = type as UnionType;
      unionType.types.forEach((t) => {
        names.push(...extractAllTypeNames(t));
      });
      break;
    }

    case 'intersection': {
      const intersectionType = type as IntersectionType;
      intersectionType.types.forEach((t) => {
        names.push(...extractAllTypeNames(t));
      });
      break;
    }

    case 'reflection': {
      const reflectionType = type as ReflectionType;
      if (reflectionType.declaration?.name) {
        names.push(reflectionType.declaration.name);
      }
      break;
    }

    case 'tuple': {
      const tupleType = type as any;
      if (tupleType.elements) {
        tupleType.elements.forEach((elem: SomeType) => {
          names.push(...extractAllTypeNames(elem));
        });
      }
      break;
    }
  }

  // Filter out primitives and empty strings
  return names.filter((name) => name && !isPrimitiveName(name));
}

/**
 * Checks if a name is a primitive type
 * @param name - Type name to check
 * @returns true if name is a primitive
 */
export function isPrimitiveName(name: string): boolean {
  const primitives = [
    'string',
    'number',
    'boolean',
    'bigint',
    'symbol',
    'void',
    'null',
    'undefined',
    'any',
    'unknown',
    'never',
    'object',
  ];
  return primitives.includes(name.toLowerCase());
}

/**
 * Resolves a type name to its DeclarationReflection
 * @param typeName - Name of type to resolve
 * @param context - TypeDoc context for project access
 * @returns DeclarationReflection if found, null otherwise
 */
export function resolveReflection(
  typeName: string,
  context: Context
): DeclarationReflection | null {
  if (!typeName || !context?.project) {
    return null;
  }

  try {
    // Search for reflection by name in common kinds
    const kinds =
      ReflectionKind.Interface |
      ReflectionKind.Class |
      ReflectionKind.TypeAlias |
      ReflectionKind.Enum;

    const reflections = context.project.getReflectionsByKind(kinds);

    for (const reflection of reflections) {
      if (
        reflection instanceof DeclarationReflection &&
        reflection.name === typeName
      ) {
        return reflection;
      }
    }

    return null;
  } catch (error) {
    console.warn(`Failed to resolve reflection for type: ${typeName}`, error);
    return null;
  }
}

/**
 * Converts TypeScript generic syntax <T> to Mermaid tilde syntax ~T~
 * Handles nested generics and removes commas (not supported by Mermaid)
 * @param typeString - Type string with TypeScript generics
 * @returns Type string with Mermaid generics
 */
function convertGenericsToMermaidFormat(typeString: string): string {
  if (!typeString.includes('<')) {
    return typeString;
  }

  let result = '';
  let depth = 0;

  for (let i = 0; i < typeString.length; i++) {
    const char = typeString[i];

    if (char === '<') {
      result += '~';
      depth++;
    } else if (char === '>') {
      result += '~';
      depth--;
    } else if (char === ',' && depth > 0) {
      // Skip commas inside generics (Mermaid doesn't support them well)
      // This converts "Map<K, V>" to "Map~K V~" which Mermaid can handle better
      result += ' ';
    } else {
      result += char;
    }
  }

  return result;
}

/**
 * Simplifies a type string for display in UML diagrams
 * Removes unnecessary noise while keeping important information
 * @param typeString - Raw type string from TypeDoc
 * @param isProperty - Whether this is a property type (removes [] for multiplicity)
 * @returns Simplified type string
 */
export function simplifyTypeString(
  typeString: string,
  isProperty: boolean = false
): string {
  if (!typeString) return 'any';

  // Step 1: Remove "readonly " prefix (shown as modifier in UML)
  let simplified = typeString.replace(/^readonly\s+/, '');

  // Step 2: Simplify object literal types (Mermaid doesn't support { key: type })
  // e.g., "{ count: number; labels: IImage }" → "any" (object is unstable in Mermaid v10)
  if (simplified.includes('{') && simplified.includes('}')) {
    simplified = 'any';
  }

  // Step 3: Replace standalone generic type parameters with 'any'
  // e.g., "T" → "any", "K" → "any", "V" → "any"
  // CRITICAL: Mermaid doesn't understand type parameters
  if (/^[A-Z]$/.test(simplified)) {
    simplified = 'any';
  }

  // Step 4: Convert generics from <T> to ~T~ (Mermaid format)
  // Mermaid supports generics with tilde notation
  // e.g., "Array<T>" → "Array~T~"
  // e.g., "List<int>" → "List~int~"
  // Note: Nested generics like "List<List<int>>" become "List~List~int~~"
  // Note: Generics with commas like "Map<K, V>" are not fully supported, simplify to "Map~K~"
  simplified = convertGenericsToMermaidFormat(simplified);

  // Step 5: Simplify union types (take first type only for UML clarity)
  // e.g., "string | number | boolean" → "string"
  // e.g., "Uint8Array | Uint8ClampedArray" → "Uint8Array"
  if (simplified.includes('|')) {
    const types = simplified.split('|').map((t) => t.trim());
    simplified = types[0] || 'any';
  }

  // Step 6: Remove array brackets ONLY for properties (multiplicity shown separately)
  // e.g., "Point[]" → "Point" for properties, but stays "Point[]" for methods
  if (isProperty) {
    simplified = simplified.replace(/\[\]$/g, '');
  }

  // Step 7: Replace 'object' with 'any' (object is unstable in Mermaid v10)
  if (simplified === 'object') {
    simplified = 'any';
  }

  return simplified;
}

/**
 * Checks if a type is an array type
 * @param type - Type to check
 * @returns true if type is an array
 */
export function isArrayType(type: SomeType): boolean {
  if (type.type === 'array') {
    return true;
  }

  if (type.type === 'reference') {
    const refType = type as ReferenceType;
    return refType.name === 'Array' || refType.name === 'ReadonlyArray';
  }

  // Fallback: check string representation for array brackets
  // This handles cases like "readonly T[]" that might not be caught above
  const typeString = type.toString();
  if (typeString?.includes('[]')) {
    return true;
  }

  return false;
}

/**
 * Checks if a union type includes undefined (making it optional)
 * @param type - Type to check
 * @returns true if union includes undefined
 */
export function hasUndefinedInUnion(type: SomeType): boolean {
  if (type.type !== 'union') {
    return false;
  }

  const unionType = type as UnionType;
  return unionType.types.some(
    (t) => t.type === 'intrinsic' && (t as any).name === 'undefined'
  );
}

/**
 * Gets default plugin options with sensible defaults
 * @param overrides - Partial options to override defaults
 * @returns Complete options object
 */
export function getDefaultOptions(
  overrides: Partial<UMLPluginOptions> = {}
): UMLPluginOptions {
  return {
    maxDepth: 2,
    excludeTypes: [],
    includePrimitives: false,
    outputFormat: 'auto',
    showMembers: true,
    maxMembersPerClass: 10,
    ...overrides,
  };
}
