import { type DeclarationOption, type Options, ParameterType } from 'typedoc';

export const OPTIONS_KEYS = {
  umlMaxDepth: 'umlMaxDepth',
  umlExcludeTypes: 'umlExcludeTypes',
  umlShowMembers: 'umlShowMembers',
  umlMaxMembersPerClass: 'umlMaxMembersPerClass',
} as const;

export const OPTIONS = {
  umlMaxDepth: {
    name: OPTIONS_KEYS.umlMaxDepth,
    type: ParameterType.Number,
    defaultValue: 2,
    help: 'Maximum depth of relationships to show',
  } satisfies DeclarationOption,
  umlExcludeTypes: {
    name: OPTIONS_KEYS.umlExcludeTypes,
    type: ParameterType.Array,
    defaultValue: [],
    help: 'List of types to exclude',
  } satisfies DeclarationOption,
  umlShowMembers: {
    name: OPTIONS_KEYS.umlShowMembers,
    type: ParameterType.Boolean,
    defaultValue: true,
    help: 'Show members in the diagram',
  } satisfies DeclarationOption,
  umlMaxMembersPerClass: {
    name: OPTIONS_KEYS.umlMaxMembersPerClass,
    type: ParameterType.Number,
    defaultValue: 10,
    help: 'Maximum number of members to show per class',
  } satisfies DeclarationOption,
} satisfies Record<keyof typeof OPTIONS_KEYS, DeclarationOption>;

export type PluginOptions = {
  maxDepth: number;
  excludeTypes: string[];
  showMembers: boolean;
  maxMembersPerClass: number;
};

export function getPluginOptions(options: Options): PluginOptions {
  const maxDepth = options.getValue(OPTIONS_KEYS.umlMaxDepth);
  const excludeTypes = options.getValue(OPTIONS_KEYS.umlExcludeTypes);
  const showMembers = options.getValue(OPTIONS_KEYS.umlShowMembers);
  const maxMembersPerClass = options.getValue(
    OPTIONS_KEYS.umlMaxMembersPerClass,
  );

  return {
    maxDepth: maxDepth as number,
    excludeTypes: excludeTypes as string[],
    showMembers: showMembers as boolean,
    maxMembersPerClass: maxMembersPerClass as number,
  };
}
