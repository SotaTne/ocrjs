function basename(pathname: string): string {
  const parts = pathname.split('/');
  return parts.at(-1) ?? pathname;
}

function dirname(pathname: string): string {
  const parts = pathname.split('/');
  if (parts.length <= 1) {
    return '.';
  }

  return parts.slice(0, -1).join('/') || '.';
}

function relative(fromDir: string, toPath: string): string {
  const fromParts = fromDir === '.' ? [] : fromDir.split('/').filter(Boolean);
  const toParts = toPath.split('/').filter(Boolean);

  let sharedIndex = 0;
  while (
    sharedIndex < fromParts.length &&
    sharedIndex < toParts.length &&
    fromParts[sharedIndex] === toParts[sharedIndex]
  ) {
    sharedIndex += 1;
  }

  const upSegments = new Array(fromParts.length - sharedIndex).fill('..');
  const downSegments = toParts.slice(sharedIndex);
  return [...upSegments, ...downSegments].join('/');
}

export function resolveRelativeLink(
  currentAbsoluteLink: string,
  targetAbsoluteLink: string,
): string {
  const current = splitLink(currentAbsoluteLink);
  const target = splitLink(targetAbsoluteLink);

  if (current.page === target.page) {
    return target.anchor ?? basename(target.page);
  }

  const fromDir = dirname(current.page);
  const relativePath = relative(fromDir, target.page);
  const normalizedPath =
    relativePath === '' ? basename(target.page) : relativePath;

  return target.anchor ? `${normalizedPath}${target.anchor}` : normalizedPath;
}

function splitLink(link: string): { page: string; anchor?: string } {
  const parts = link.split('#', 2);
  const page = parts[0] ?? '';
  const anchor = parts[1];

  if (anchor === undefined) {
    return { page };
  }

  return {
    page,
    anchor: `#${anchor}`,
  };
}
