export type MermaidAliasValidationIssue = {
  code: 'missing-node-alias';
  alias: string;
  line: string;
};

function collectDefinedAliases(lines: string[]): Set<string> {
  const aliases = new Set<string>();

  for (const line of lines) {
    const match = /^class\s+(\S+)\[/.exec(line.trim());
    if (match?.[1]) {
      aliases.add(match[1]);
    }
  }

  return aliases;
}

function collectReferencedAliases(line: string): string[] {
  const trimmed = line.trim();

  if (trimmed.startsWith('click ')) {
    const match = /^click\s+(\S+)\s+href\b/.exec(trimmed);
    return match?.[1] ? [match[1]] : [];
  }

  if (
    trimmed.includes('-->') ||
    trimmed.includes('<|--') ||
    trimmed.includes('<|..') ||
    trimmed.includes('*--')
  ) {
    const match = /^(\S+)\s+(?:<\|--|<\|\.\.|-->|(?:\*--))(?:\s+"[^"]+")?\s+(\S+)(?:\s+:.*)?$/.exec(
      trimmed,
    );

    if (!match) {
      return [];
    }

    return [match[1], match[2]].filter(
      (value): value is string => value !== undefined,
    );
  }

  return [];
}

export function validateMermaidAliases(
  source: string,
): MermaidAliasValidationIssue[] {
  const lines = source.split('\n');
  const aliases = collectDefinedAliases(lines);
  const issues: MermaidAliasValidationIssue[] = [];

  for (const line of lines) {
    for (const alias of collectReferencedAliases(line)) {
      if (aliases.has(alias)) {
        continue;
      }

      issues.push({
        code: 'missing-node-alias',
        alias,
        line,
      });
    }
  }

  return issues;
}
