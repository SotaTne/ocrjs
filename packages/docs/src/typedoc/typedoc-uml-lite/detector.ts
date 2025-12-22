import type {
  DeclarationReflection,
  SomeType,
  SignatureReflection,
} from 'typedoc';
import { ReflectionKind } from 'typedoc';
import type {
  Stereotype,
  Multiplicity,
  Visibility,
  UMLProperty,
  UMLMethod,
  UMLParameter,
} from './types';
import {
  isArrayType,
  hasUndefinedInUnion,
  simplifyTypeString,
  extractTypeName,
} from './utils';

/**
 * Detects the UML stereotype of a TypeDoc reflection
 * Leverages TypeDoc metadata to accurately classify types
 * @param reflection - TypeDoc reflection to analyze
 * @returns Detected stereotype
 */
export function detectStereotype(
  reflection: DeclarationReflection
): Stereotype {
  // Enum check
  if (reflection.kind === ReflectionKind.Enum) {
    return 'enumeration';
  }

  // Interface check
  if (reflection.kind === ReflectionKind.Interface) {
    // Factory pattern: name ends with "Factory" AND has creation methods
    if (reflection.name.endsWith('Factory')) {
      if (hasCreationMethods(reflection)) {
        return 'factory';
      }
    }
    return 'interface';
  }

  // Class check
  if (reflection.kind === ReflectionKind.Class) {
    // Check for abstract modifier
    if (hasAbstractModifier(reflection)) {
      return 'abstract';
    }
    return 'class';
  }

  // TypeAlias falls back to class representation
  if (reflection.kind === ReflectionKind.TypeAlias) {
    return 'class';
  }

  return 'class'; // Default fallback
}

/**
 * Checks if a reflection has creation methods indicating factory pattern
 * @param reflection - Reflection to check
 * @returns true if has creation methods
 */
function hasCreationMethods(reflection: DeclarationReflection): boolean {
  const creationMethodNames = [
    'create',
    'zeros',
    'ones',
    'fromarray',
    'from',
    'of',
    'make',
    'build',
    'new',
  ];

  if (!reflection.children) {
    return false;
  }

  const methods = reflection.children.filter(
    (child) => child.kind === ReflectionKind.Method
  );

  return methods.some((method) =>
    creationMethodNames.some((name) =>
      method.name.toLowerCase().includes(name)
    )
  );
}

/**
 * Checks if a class has abstract modifier
 * @param reflection - Reflection to check
 * @returns true if abstract
 */
function hasAbstractModifier(reflection: DeclarationReflection): boolean {
  return reflection.flags?.isAbstract === true;
}

/**
 * Detects multiplicity/cardinality from TypeScript type
 * Uses TypeDoc's rich type system to determine cardinality
 * @param type - Type to analyze
 * @returns Multiplicity (1, 0..1, 0..*, 1..*)
 */
export function detectMultiplicity(type: SomeType | undefined): Multiplicity {
  if (!type) {
    return '1';
  }

  // Array types → 0..* (typically optional arrays)
  if (isArrayType(type)) {
    // Could refine to 1..* if we know array is non-empty, but default to optional
    return '0..*';
  }

  // Union with undefined → 0..1 (optional)
  if (hasUndefinedInUnion(type)) {
    return '0..1';
  }

  // Default → 1 (required single value)
  return '1';
}

/**
 * Detects visibility modifier from reflection flags
 * Uses TypeDoc's flag system
 * @param reflection - Reflection to check
 * @returns Visibility modifier
 */
export function detectVisibility(
  reflection: DeclarationReflection
): Visibility {
  if (reflection.flags?.isPrivate) {
    return 'private';
  }
  if (reflection.flags?.isProtected) {
    return 'protected';
  }
  return 'public';
}

/**
 * Maps visibility to UML symbol
 * @param visibility - Visibility modifier
 * @returns UML symbol (+, -, #)
 */
export function visibilityToSymbol(visibility: Visibility): string {
  switch (visibility) {
    case 'public':
      return '+';
    case 'private':
      return '-';
    case 'protected':
      return '#';
  }
}

/**
 * Generates relative path to documentation page for a reflection
 * Uses TypeDoc's reflection kind to determine folder structure
 * @param reflection - Reflection to generate path for
 * @returns Relative path (e.g., "interfaces/ITensor.html")
 */
export function getRelativePath(reflection: DeclarationReflection): string {
  const name = reflection.name;
  const kind = reflection.kind;

  // Map ReflectionKind to folder name
  if (kind === ReflectionKind.Interface) {
    return `interfaces/${name}.html`;
  }

  if (kind === ReflectionKind.Class) {
    return `classes/${name}.html`;
  }

  if (kind === ReflectionKind.Enum) {
    return `enums/${name}.html`;
  }

  if (kind === ReflectionKind.TypeAlias) {
    return `types/${name}.html`;
  }

  // Fallback to anchor link
  return `#${name}`;
}

/**
 * Extracts properties from a reflection for UML display
 * Filters to public properties and enriches with metadata
 * @param reflection - Reflection to extract properties from
 * @param maxProperties - Maximum number of properties to extract
 * @returns Array of UML properties
 */
export function extractProperties(
  reflection: DeclarationReflection,
  maxProperties: number = 10
): UMLProperty[] {
  if (!reflection.children) {
    return [];
  }

  const properties = reflection.children
    .filter((child) => child.kind === ReflectionKind.Property)
    .filter((prop) => {
      // Only include public properties for UML
      const visibility = detectVisibility(prop);
      return visibility === 'public';
    })
    .slice(0, maxProperties) // Limit to avoid cluttering diagram
    .map((prop): UMLProperty => {
      // NOTE: Keep [] for arrays in properties (standard notation: Point[])
      // DON'T pass isProperty=true - we want to preserve [] for array types
      // The UML multiplicity [0..*] is different and belongs in relationships only
      const typeString = prop.type
        ? simplifyTypeString(prop.type.toString(), false)
        : 'any';

      return {
        name: prop.name,
        type: typeString,
        multiplicity: detectMultiplicity(prop.type),
        visibility: detectVisibility(prop),
        isReadonly: prop.flags?.isReadonly === true,
      };
    });

  return properties;
}

/**
 * Extracts methods from a reflection for UML display
 * Filters to public methods and includes signatures
 * @param reflection - Reflection to extract methods from
 * @param maxMethods - Maximum number of methods to extract
 * @returns Array of UML methods
 */
export function extractMethods(
  reflection: DeclarationReflection,
  maxMethods: number = 10
): UMLMethod[] {
  if (!reflection.children) {
    return [];
  }

  const methods = reflection.children
    .filter((child) => child.kind === ReflectionKind.Method)
    .filter((method) => {
      // Only include public methods for UML
      const visibility = detectVisibility(method);
      return visibility === 'public';
    })
    .slice(0, maxMethods) // Limit to avoid cluttering diagram
    .map((method): UMLMethod | null => {
      // Get first signature (methods can be overloaded)
      const signatures = (method as any).signatures as
        | SignatureReflection[]
        | undefined;

      if (!signatures || signatures.length === 0) {
        return null;
      }

      const signature = signatures[0];
      if (!signature) {
        return null;
      }

      // Extract parameters
      const parameters: UMLParameter[] = (signature.parameters || []).map(
        (param) => ({
          name: param.name,
          type: param.type
            ? simplifyTypeString(param.type.toString())
            : 'any',
          isOptional: param.flags?.isOptional === true,
        })
      );

      // Extract return type
      const returnType = signature.type
        ? simplifyTypeString(signature.type.toString())
        : 'void';

      return {
        name: method.name,
        parameters,
        returnType,
        visibility: detectVisibility(method),
      };
    })
    .filter((method): method is UMLMethod => method !== null);

  return methods;
}

/**
 * Extracts all related types from a reflection
 * This includes types from:
 * - Inheritance (extends/implements)
 * - Properties
 * - Method parameters and return types
 * - Type parameters/generics
 * @param reflection - Reflection to extract types from
 * @returns Array of type names
 */
export function extractRelatedTypeNames(
  reflection: DeclarationReflection
): string[] {
  const types = new Set<string>();

  // 1. Inheritance - extends
  if (reflection.extendedTypes) {
    reflection.extendedTypes.forEach((type) => {
      const name = extractTypeName(type);
      if (name) types.add(name);
    });
  }

  // 2. Inheritance - implements
  if ((reflection as any).implementedTypes) {
    const implementedTypes = (reflection as any).implementedTypes as SomeType[];
    implementedTypes.forEach((type) => {
      const name = extractTypeName(type);
      if (name) types.add(name);
    });
  }

  // 3. Properties
  if (reflection.children) {
    reflection.children.forEach((child) => {
      if (child.kind === ReflectionKind.Property && child.type) {
        const name = extractTypeName(child.type);
        if (name) types.add(name);
      }
    });
  }

  // 4. Methods - parameters and return types
  if (reflection.children) {
    reflection.children.forEach((child) => {
      if (child.kind === ReflectionKind.Method) {
        const signatures = (child as any).signatures as
          | SignatureReflection[]
          | undefined;

        signatures?.forEach((sig) => {
          // Parameters
          sig.parameters?.forEach((param) => {
            if (param.type) {
              const name = extractTypeName(param.type);
              if (name) types.add(name);
            }
          });

          // Return type
          if (sig.type) {
            const name = extractTypeName(sig.type);
            if (name) types.add(name);
          }
        });
      }
    });
  }

  return Array.from(types);
}
